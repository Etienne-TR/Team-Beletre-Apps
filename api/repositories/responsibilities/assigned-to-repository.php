<?php
/**
 * Repository de gestion des assignations de tâches
 * 
 * Accès aux données pour les assignations de tâches.
 * Responsabilités : Requêtes SQL, accès à la base de données
 */

require_once __DIR__ . '/../common/base-repository.php';
require_once __DIR__ . '/../common/versioning-repository.php';

class AssignedToRepository extends VersioningRepository {
    
    protected $tableName = 'assigned_to';
    protected $primaryKey = 'version';
    
    /**
     * Créer une nouvelle assignation de tâche
     */
    public function createEntryAssignedTo($created_at, $created_by, $data = []) {
        $version = parent::createEntry($this->tableName, $created_at, $created_by, $data);
        return $this->read($version);
    }
    
    /**
     * Mettre à jour une assignation de tâche
     */
    public function updateVersionAssignedTo($version, $data) {
        // Utiliser la méthode parente pour mettre à jour la version
        $updateData = [
            'task' => $data['task'],
            'user' => $data['user'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date']
        ];
        
        $success = parent::updateVersion($this->tableName, $version, $updateData);
        
        if ($success) {
            // Retourner l'enregistrement mis à jour
            return $this->read($version);
        }
        
        return false;
    }
    
    /**
     * Supprimer une assignation de tâche
     */
    public function deleteEntryAssignedTo($entry) {
        // Utiliser la méthode parente pour supprimer l'entrée
        return parent::deleteEntry($this->tableName, $entry);
    }
    
    /**
     * Lire une assignation de tâche par sa version
     */
    public function read($version) {
        $sql = "SELECT * FROM assigned_to WHERE version = :version";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['version' => $version]);
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Récupérer les personnes assignées à une tâche
     */
    public function listFromDate($task, $date) {
        $stmt = $this->pdo->prepare("
            SELECT 
                at.version,
                at.entry,
                at.status,
                at.task,
                at.user,
                at.user as assigned_user_id,
                u.display_name,
                u.display_name as assigned_display_name,
                u.initials,
                u.email,
                at.start_date,
                at.end_date,
                at.created_at,
                at.created_by
            FROM assigned_to at
            LEFT JOIN users u ON at.user = u.id AND u.status = 'active'
            WHERE at.task = ? 
            AND at.status = 'current'
            AND (at.end_date IS NULL OR at.end_date >= ?)
            ORDER BY at.start_date ASC, 
                     CASE WHEN at.end_date IS NULL THEN 1 ELSE 0 END, 
                     at.end_date ASC
        ");
        
        return $this->fetchAll($stmt, [$task, $date]);
    }
}
?> 