<?php
/**
 * Gestionnaire d'entités générique avec versioning
 * 
 * Fournit les opérations CRUD communes pour toutes les entités
 * avec support du versioning temporel et de l'audit trail.
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);

class EntityManager {
    protected $pdo;
    protected $currentUser;
    
    public function __construct($pdo, $currentUser) {
        $this->pdo = $pdo;
        $this->currentUser = $currentUser;
    }
    
    /**
     * Créer une nouvelle entité
     * @param string $table - Nom de la table
     * @param array $data - Données à insérer
     * @param array $rules - Règles de validation
     * @param array $options - Options supplémentaires
     * @return array - Résultat avec l'ID créé
     */
    public function create($table, $data, $rules = [], $options = []) {
        // Validation des données
        $errors = $this->validateInput($data, $rules);
        if (!empty($errors)) {
            throw new Exception('Données invalides: ' . json_encode($errors));
        }
        
        try {
            $this->pdo->beginTransaction();
            
            // Préparer les données pour l'insertion
            $insertData = $this->prepareInsertData($table, $data, $options);
            
            // Construire la requête INSERT
            $columns = array_keys($insertData);
            $placeholders = array_fill(0, count($columns), '?');
            
            $sql = "INSERT INTO {$table} (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(array_values($insertData));
            
            $entry = $this->pdo->lastInsertId();
            
            // Log d'audit
            $this->logAudit($table, $entry, 'create', null, $data);
            
            $this->pdo->commit();
            
            return [
                'success' => true,
                'entry' => $entry,
                'message' => 'Entité créée avec succès'
            ];
            
        } catch (Exception $e) {
            $this->pdo->rollback();
            throw new Exception('Erreur lors de la création: ' . $e->getMessage());
        }
    }
    
    /**
     * Mettre à jour une entité (création d'une nouvelle version)
     * @param string $table - Nom de la table
     * @param int $entry - ID de l'entité
     * @param array $data - Données à mettre à jour
     * @param array $rules - Règles de validation
     * @param array $options - Options supplémentaires
     * @return array - Résultat avec la nouvelle version
     */
    public function update($table, $entry, $data, $rules = [], $options = []) {
        // Validation des données
        $errors = $this->validateInput($data, $rules);
        if (!empty($errors)) {
            throw new Exception('Données invalides: ' . json_encode($errors));
        }
        
        // Récupérer la version actuelle
        $oldVersion = $this->getCurrentVersion($table, $entry);
        if (!$oldVersion) {
            throw new Exception('Entité non trouvée');
        }
        
        try {
            $this->pdo->beginTransaction();
            
            // Marquer l'ancienne version comme deprecated
            $this->deprecateOldVersion($table, $entry);
            
            // Préparer les données pour l'insertion
            $insertData = $this->prepareUpdateData($table, $entry, $data, $oldVersion, $options);
            
            // Construire la requête INSERT pour la nouvelle version
            $columns = array_keys($insertData);
            $placeholders = array_fill(0, count($columns), '?');
            
            $sql = "INSERT INTO {$table} (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(array_values($insertData));
            
            $newVersion = $oldVersion['version'] + 1;
            
            // Log d'audit
            $this->logAudit($table, $entry, 'update', $oldVersion, $data);
            
            $this->pdo->commit();
            
            return [
                'success' => true,
                'version' => $newVersion,
                'message' => 'Entité mise à jour avec succès'
            ];
            
        } catch (Exception $e) {
            $this->pdo->rollback();
            throw new Exception('Erreur lors de la mise à jour: ' . $e->getMessage());
        }
    }
    
    /**
     * Supprimer une entité (marquer comme deleted)
     * @param string $table - Nom de la table
     * @param int $entry - ID de l'entité
     * @return array - Résultat de la suppression
     */
    public function delete($table, $entry) {
        // Récupérer la version actuelle
        $currentVersion = $this->getCurrentVersion($table, $entry);
        if (!$currentVersion) {
            throw new Exception('Entité non trouvée');
        }
        
        try {
            $this->pdo->beginTransaction();
            
            // Marquer comme deleted (plus de version current)
            $stmt = $this->pdo->prepare("
                UPDATE {$table} 
                SET status = 'deleted' 
                WHERE entry = ? AND status = 'current'
            ");
            $stmt->execute([$entry]);
            
            // Log d'audit
            $this->logAudit($table, $entry, 'delete', $currentVersion, null);
            
            $this->pdo->commit();
            
            return [
                'success' => true,
                'message' => 'Entité supprimée avec succès'
            ];
            
        } catch (Exception $e) {
            $this->pdo->rollback();
            throw new Exception('Erreur lors de la suppression: ' . $e->getMessage());
        }
    }
    
    /**
     * Récupérer la version actuelle d'une entité
     * @param string $table - Nom de la table
     * @param int $entry - ID de l'entité
     * @return array|null - Données de l'entité ou null
     */
    public function getCurrent($table, $entry) {
        return $this->getCurrentVersion($table, $entry);
    }
    
    /**
     * Récupérer l'historique d'une entité
     * @param string $table - Nom de la table
     * @param int $entry - ID de l'entité
     * @return array - Historique des versions
     */
    public function getHistory($table, $entry) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM {$table} 
            WHERE entry = ? 
            ORDER BY version DESC
        ");
        $stmt->execute([$entry]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Récupérer la version actuelle d'un enregistrement
     * @param string $table - Nom de la table
     * @param int $entry - ID de l'entité
     * @return array|null - Version actuelle ou null
     */
    public function getCurrentVersion($table, $entry) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM {$table} 
            WHERE entry = ? AND status = 'current'
            ORDER BY version DESC 
            LIMIT 1
        ");
        $stmt->execute([$entry]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Marquer l'ancienne version comme deprecated
     * @param string $table - Nom de la table
     * @param int $entry - ID de l'entité
     */
    public function deprecateOldVersion($table, $entry) {
        $stmt = $this->pdo->prepare("
            UPDATE {$table} 
            SET status = 'deprecated' 
            WHERE entry = ? AND status = 'current'
        ");
        $stmt->execute([$entry]);
    }
    
    /**
     * Préparer les données pour l'insertion
     * @param string $table - Nom de la table
     * @param array $data - Données brutes
     * @param array $options - Options supplémentaires
     * @return array - Données préparées
     */
    protected function prepareInsertData($table, $data, $options = []) {
        $insertData = [
            'version' => 1,
            'created_by' => $this->currentUser['id'],
            'status' => 'current'
        ];
        
        // Ajouter les données personnalisées
        foreach ($data as $key => $value) {
            if ($value !== null) {
                $insertData[$key] = $this->sanitize($value);
            }
        }
        
        // Ajouter les options personnalisées
        if (isset($options['additional_fields'])) {
            foreach ($options['additional_fields'] as $key => $value) {
                $insertData[$key] = $value;
            }
        }
        
        return $insertData;
    }
    
    /**
     * Préparer les données pour la mise à jour
     * @param string $table - Nom de la table
     * @param int $entry - ID de l'entité
     * @param array $data - Données brutes
     * @param array $oldVersion - Ancienne version
     * @param array $options - Options supplémentaires
     * @return array - Données préparées
     */
    protected function prepareUpdateData($table, $entry, $data, $oldVersion, $options = []) {
        $insertData = [
            'entry' => $entry,
            'version' => $oldVersion['version'] + 1,
            'created_by' => $this->currentUser['id'],
            'status' => 'current'
        ];
        
        // Fusionner les anciennes données avec les nouvelles
        $mergedData = array_merge($oldVersion, $data);
        
        // Ajouter les données fusionnées
        foreach ($mergedData as $key => $value) {
            // Ignorer les champs système
            if (!in_array($key, ['entry', 'version', 'created_by', 'status', 'created_at'])) {
                if ($value !== null) {
                    $insertData[$key] = $this->sanitize($value);
                }
            }
        }
        
        // Ajouter les options personnalisées
        if (isset($options['additional_fields'])) {
            foreach ($options['additional_fields'] as $key => $value) {
                $insertData[$key] = $value;
            }
        }
        
        return $insertData;
    }
    
    /**
     * Validation des données d'entrée
     * @param array $data - Données à valider
     * @param array $rules - Règles de validation
     * @return array - Erreurs de validation
     */
    public function validateInput($data, $rules) {
        $errors = [];
        
        foreach ($rules as $field => $rule) {
            $value = $data[$field] ?? null;
            
            // Champ requis
            if (isset($rule['required']) && $rule['required'] && empty($value)) {
                $errors[$field] = "Le champ {$field} est requis";
                continue;
            }
            
            // Type
            if (!empty($value) && isset($rule['type'])) {
                switch ($rule['type']) {
                    case 'int':
                        if (!filter_var($value, FILTER_VALIDATE_INT)) {
                            $errors[$field] = "Le champ {$field} doit être un entier";
                        }
                        break;
                    case 'email':
                        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                            $errors[$field] = "Le champ {$field} doit être un email valide";
                        }
                        break;
                    case 'date':
                        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
                            $errors[$field] = "Le champ {$field} doit être une date (YYYY-MM-DD)";
                        }
                        break;
                }
            }
            
            // Longueur max
            if (!empty($value) && isset($rule['max_length'])) {
                if (strlen($value) > $rule['max_length']) {
                    $errors[$field] = "Le champ {$field} ne peut dépasser {$rule['max_length']} caractères";
                }
            }
        }
        
        return $errors;
    }
    
    /**
     * Logging des actions pour audit
     * @param string $table - Nom de la table
     * @param int $recordId - ID de l'enregistrement
     * @param string $action - Action effectuée
     * @param array|null $oldData - Anciennes données
     * @param array|null $newData - Nouvelles données
     */
    public function logAudit($table, $recordId, $action, $oldData = null, $newData = null) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO audit_log (table_name, record_entry, action, old_values, new_values, user, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $stmt->execute([
                $table,
                $recordId,
                $action,
                $oldData ? json_encode($oldData) : null,
                $newData ? json_encode($newData) : null,
                $this->currentUser['id']
            ]);
        } catch (Exception $e) {
            // Log d'audit ne doit pas faire échouer l'opération principale
            error_log("Erreur audit log: " . $e->getMessage());
        }
    }
    
    /**
     * Nettoyer une chaîne de caractères
     * @param string $string - Chaîne à nettoyer
     * @return string - Chaîne nettoyée
     */
    public function sanitize($string) {
        if (is_string($string)) {
            return htmlspecialchars(trim($string), ENT_QUOTES, 'UTF-8');
        }
        return $string;
    }
    
    /**
     * Vérifier si un utilisateur est déjà dans un tableau
     * @param array $array - Tableau d'utilisateurs
     * @param int $userId - ID de l'utilisateur
     * @return bool - True si l'utilisateur est présent
     */
    public function userInArray($array, $userId) {
        foreach ($array as $user) {
            if ($user['id'] == $userId) {
                return true;
            }
        }
        return false;
    }
}
?>
