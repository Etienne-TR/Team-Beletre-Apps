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
     * Créer une nouvelle entrée avec versioning (INSERT dynamique)
     * @param string $table - Nom de la table
     * @param string $created_at - Date de création
     * @param int $created_by - ID de l'utilisateur créateur
     * @param array $data - Champs métier supplémentaires
     * @return int - ID de l'entité créée
     */
    public function createEntry($table, $created_at, $created_by, $data = []) {
        // Champs de base
        $fields = ['created_at', 'created_by', 'status'];
        $placeholders = ['NOW()', '?', "'current'"];
        $values = [$created_by];

        // Ajouter les champs métier si présents
        foreach ($data as $key => $value) {
            $fields[] = $key;
            $placeholders[] = '?';
            $values[] = $value;
        }

        $sql = "INSERT INTO {$table} (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($values);

        $version = $this->pdo->lastInsertId();

        // UPDATE pour entry = version
        $updateSql = "UPDATE {$table} SET entry = ? WHERE version = ?";
        $updateStmt = $this->pdo->prepare($updateSql);
        $updateStmt->execute([$version, $version]);

        return $version;
    }
    
    /**
     * Lire une version spécifique d'une entité versionnée
     * @param string $table - Nom de la table
     * @param int $version - Numéro de version à lire
     * @return array|null - Données de la version ou null si non trouvée
     */
    public function readVersion($table, $version) {
        $sql = "SELECT version, created_at, created_by, user, status FROM {$table} WHERE version = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$version]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Mettre à jour une version spécifique
     * @param string $table - Nom de la table
     * @param int $version - Version à mettre à jour
     * @param array $data - Données à mettre à jour
     * @return bool - Succès de l'opération
     */
    public function updateVersion($table, $version, $data = []) {
        if (empty($data)) {
            error_log("SQL UPDATE VERSION: Aucune donnée à mettre à jour");
            return false;
        }
        
        // Construire dynamiquement la requête SQL
        $setClauses = [];
        $values = [];
        
        foreach ($data as $field => $value) {
            // Ignorer les champs système
            if (!in_array($field, ['entry', 'version', 'created_by', 'status', 'created_at'])) {
                $setClauses[] = "{$field} = ?";
                $values[] = $value;
            }
        }
        
        if (empty($setClauses)) {
            error_log("SQL UPDATE VERSION: Aucun champ à mettre à jour après filtrage");
            return false;
        }
        
        $sql = "UPDATE {$table} SET " . implode(', ', $setClauses) . " WHERE version = ?";
        $values[] = $version;
        
        error_log("SQL UPDATE VERSION: " . $sql . " avec params: [" . implode(', ', $values) . "]");
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($values);
        
        $rowCount = $stmt->rowCount();
        error_log("SQL UPDATE VERSION: " . $rowCount . " ligne(s) affectée(s)");
        
        return $rowCount > 0;
    }
    
    /**
     * Supprimer une entrée
     * @param string $table - Nom de la table
     * @param int $entry - ID de l'entité
     * @return bool - Succès de l'opération
     */
    public function deleteEntry($table, $entry) {
        $sql = "DELETE FROM {$table} WHERE entry = ?";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$entry]);
        
        return $stmt->rowCount() > 0;
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
    public function getEntityVersions($table, $entry) {
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
    public function deprecateVersion($table, $entry) {
        $stmt = $this->pdo->prepare("
            UPDATE {$table} 
            SET status = 'deprecated' 
            WHERE entry = ? AND status = 'current'
        ");
        $stmt->execute([$entry]);
    }
    

} 