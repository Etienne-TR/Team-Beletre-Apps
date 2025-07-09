<?php
/**
 * Repository pour la gestion des responsabilités d'activités
 * 
 * Gère l'accès aux données de la table responsible_for
 */
require_once __DIR__ . '/../common/versioning-repository.php';
require_once __DIR__ . '/../../utils/common/helpers.php';

class ResponsibleForRepository extends VersioningRepository {
    
    protected $tableName = 'responsible_for';
    protected $primaryKey = 'version';
    
    /**
     * Créer une nouvelle responsabilité d'activité
     * @param int $created_by - ID de l'utilisateur créateur
     * @param int $user - ID de l'utilisateur responsable
     * @param int $activity - ID de l'activité
     * @param string $start_date - Date de début (YYYY-MM-DD)
     * @param string $end_date - Date de fin (YYYY-MM-DD) ou null
     * @return array - L'enregistrement créé
     */
    public function createResponsibleFor($created_by, $user, $activity, $start_date, $end_date = null) {
        error_log("RESPONSIBLE FOR REPO: Début création responsable - created_by: $created_by, user: $user, activity: $activity, start_date: $start_date, end_date: " . ($end_date ?? 'null'));
        
        // Insérer directement avec tous les champs requis, created_at = NOW()
        $sql = "INSERT INTO {$this->tableName} (created_at, created_by, status, user, activity, start_date, end_date) VALUES (NOW(), ?, 'current', ?, ?, ?, ?)";
        
        error_log("RESPONSIBLE FOR REPO: SQL: " . $sql);
        error_log("RESPONSIBLE FOR REPO: Params: " . json_encode([$created_by, $user, $activity, $start_date, $end_date]));
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$created_by, $user, $activity, $start_date, $end_date]);
        
        $version = $this->pdo->lastInsertId();
        error_log("RESPONSIBLE FOR REPO: Version créée: $version");
        
        // Mettre à jour entry = version
        $updateSql = "UPDATE {$this->tableName} SET entry = ? WHERE version = ?";
        $updateStmt = $this->pdo->prepare($updateSql);
        $updateStmt->execute([$version, $version]);
        
        error_log("RESPONSIBLE FOR REPO: Entry mis à jour, création terminée");
        
        return $version;
    }
    
    /**
     * Récupérer les responsables d'une activité à partir d'une date
     * @param int $activity - ID de l'activité
     * @param string $date - Date de référence (YYYY-MM-DD)
     * @return array - Liste des responsables
     */
    public function getResponsiblesFromDate($activity, $date) {
        $stmt = $this->pdo->prepare("
            SELECT 
                rf.entry,
                rf.version,
                rf.status,
                rf.user as responsible_user_id,
                u.display_name as responsible_display_name,
                u.initials as responsible_initials,
                u.email as responsible_email,
                rf.start_date,
                rf.end_date,
                rf.created_at,
                rf.created_by
            FROM responsible_for rf
            LEFT JOIN users u ON rf.user = u.id AND u.status = 'active'
            WHERE rf.activity = ? 
            AND rf.status = 'current'
            AND (rf.end_date IS NULL OR rf.end_date >= ?)
            ORDER BY rf.start_date ASC, 
                     CASE WHEN rf.end_date IS NULL THEN 1 ELSE 0 END, 
                     rf.end_date ASC
        ");
        
        return $this->fetchAll($stmt, [$activity, $date]);
    }
    
    /**
     * Mettre à jour une responsabilité d'activité (écrase la version actuelle)
     * @param int $version - Version de l'enregistrement à mettre à jour
     * @param array $data - Nouvelles données
     * @return bool - Succès de l'opération
     */
    public function updateResponsibleFor($version, $data) {
        $stmt = $this->pdo->prepare("
            UPDATE responsible_for 
            SET activity = ?, user = ?, start_date = ?, end_date = ?
            WHERE version = ?
        ");
        
        return $this->executeQuery($stmt, [
            $data['activity'],
            $data['user_id'],
            $data['start_date'],
            $data['end_date'] ?? null,
            $version
        ]);
    }
    
    /**
     * Supprimer une version spécifique d'une responsabilité d'activité
     * @param int $version - Version de l'enregistrement à supprimer
     * @return bool - Succès de l'opération
     */
    public function deleteVersionResponsibleFor($version) {
        $stmt = $this->pdo->prepare("
            DELETE FROM responsible_for 
            WHERE version = ?
        ");
        
        return $this->executeQuery($stmt, [$version]);
    }
    
    /**
     * Supprimer toutes les versions d'une entrée de responsabilité d'activité
     * @param int $entry - ID de l'entrée à supprimer
     * @return bool - Succès de l'opération
     */
    public function deleteEntryResponsibleFor($entry) {
        $stmt = $this->pdo->prepare("
            DELETE FROM responsible_for 
            WHERE entry = ?
        ");
        
        return $this->executeQuery($stmt, [$entry]);
    }
} 