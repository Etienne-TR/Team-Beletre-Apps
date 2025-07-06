<?php
/**
 * Repository pour le versioning et l'audit
 * 
 * Contient toutes les requêtes SQL pour la gestion des versions
 * et l'audit trail des entités
 */
require_once __DIR__ . '/base-repository.php';
require_once __DIR__ . '/../../utils/common/helpers.php';

class VersioningRepository extends BaseRepository {
    
    protected $currentUser;
    
    public function __construct($pdo, $currentUser) {
        parent::__construct($pdo, $currentUser);
    }
    
    /**
     * Créer une nouvelle entité avec versioning
     * @param string $table - Nom de la table
     * @param array $data - Données à insérer
     * @param array $options - Options supplémentaires
     * @return int - ID de l'entité créée
     */
    public function createEntity($table, $data, $options = []) {
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
        
        return $entry;
    }
    
    /**
     * Mettre à jour une entité (création d'une nouvelle version)
     * @param string $table - Nom de la table
     * @param int $entry - ID de l'entité
     * @param array $data - Données à mettre à jour
     * @param array $options - Options supplémentaires
     * @return int - Nouvelle version
     */
    public function updateEntity($table, $entry, $data, $options = []) {
        // Récupérer la version actuelle
        $oldVersion = $this->getCurrentVersion($table, $entry);
        if (!$oldVersion) {
            throw new Exception('Entité non trouvée');
        }
        
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
        
        return $newVersion;
    }
    
    /**
     * Supprimer une entité (marquer comme deleted)
     * @param string $table - Nom de la table
     * @param int $entry - ID de l'entité
     */
    public function deleteEntity($table, $entry) {
        // Récupérer la version actuelle
        $currentVersion = $this->getCurrentVersion($table, $entry);
        if (!$currentVersion) {
            throw new Exception('Entité non trouvée');
        }
        
        // Marquer comme deleted (plus de version current)
        $stmt = $this->pdo->prepare("
            UPDATE {$table} 
            SET status = 'deleted' 
            WHERE entry = ? AND status = 'current'
        ");
        $stmt->execute([$entry]);
        
        // Log d'audit
        $this->logAudit($table, $entry, 'delete', $currentVersion, null);
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
     * Récupérer l'historique d'une entité
     * @param string $table - Nom de la table
     * @param int $entry - ID de l'entité
     * @return array - Historique des versions
     */
    public function getEntityHistory($table, $entry) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM {$table} 
            WHERE entry = ? 
            ORDER BY version DESC
        ");
        $stmt->execute([$entry]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
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
                $insertData[$key] = Helpers::sanitize($value);
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
                    $insertData[$key] = Helpers::sanitize($value);
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
} 