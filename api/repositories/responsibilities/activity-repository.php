<?php
/**
 * Repository pour la gestion des activités
 * 
 * Contient toutes les requêtes SQL spécialisées pour les activités
 */
require_once __DIR__ . '/../common/base-repository.php';
require_once __DIR__ . '/../../utils/common/helpers.php';

class ActivityRepository extends BaseRepository {
    
    /**
     * Lister toutes les activités actuelles avec filtres
     */
    public function listActivities($date, $typeFilter = '', $search = '') {
        $query = "
            SELECT 
                a.entry, 
                a.name, 
                a.icon, 
                a.description, 
                a.created_at,
                at.name as type_name, 
                at.description as type_description,
                u_resp.id as responsible_user_id,
                u_resp.display_name as responsible_display_name,
                u_resp.initials as responsible_initials
            FROM activities a
            LEFT JOIN activity_types at ON a.activity_type = at.entry AND at.status = 'current'
            LEFT JOIN responsible_for rf ON a.entry = rf.activity 
                AND rf.status = 'current'
                AND rf.start_date <= :target_date 
                AND (rf.end_date IS NULL OR rf.end_date >= :target_date)
            LEFT JOIN users u_resp ON rf.user = u_resp.id AND u_resp.status = 'active'
            WHERE a.status = 'current'
                AND a.start_date <= :target_date2 
                AND (a.end_date IS NULL OR a.end_date >= :target_date2)
        ";
        
        $params = [
            'target_date' => $date,
            'target_date2' => $date
        ];
        
        if ($typeFilter) {
            $query .= " AND at.name = :type_filter";
            $params['type_filter'] = $typeFilter;
        }
        
        if ($search) {
            $query .= " AND (a.name LIKE :search OR a.description LIKE :search2)";
            $params['search'] = "%{$search}%";
            $params['search2'] = "%{$search}%";
        }
        
        $query .= " ORDER BY at.entry, a.name, u_resp.display_name";
        
        $stmt = $this->pdo->prepare($query);
        return $this->fetchAll($stmt, $params);
    }
    
    /**
     * Récupérer toutes les activités d'un type spécifique
     */
    public function getActivitiesByType($date, $typeFilter) {
        $query = "
            SELECT 
                a.entry, 
                a.name, 
                a.icon, 
                a.description, 
                a.created_at,
                at.name as type_name, 
                at.description as type_description
            FROM activities a
            LEFT JOIN activity_types at ON a.activity_type = at.entry AND at.status = 'current'
            WHERE a.status = 'current'
                AND a.start_date <= :target_date 
                AND (a.end_date IS NULL OR a.end_date >= :target_date)
                AND at.name = :type_filter
        ";
        
        $stmt = $this->pdo->prepare($query);
        return $this->fetchAll($stmt, [
            'target_date' => $date,
            'type_filter' => $typeFilter
        ]);
    }
    
    /**
     * Récupérer une activité avec ses détails
     */
    public function getActivityWithDetails($entry, $date) {
        // Récupérer l'activité
        $stmt = $this->pdo->prepare("
            SELECT * FROM activities 
            WHERE entry = ? AND status = 'current'
            ORDER BY version DESC 
            LIMIT 1
        ");
        $activity = $this->fetchOne($stmt, [$entry]);
        
        if (!$activity) {
            return null;
        }
        
        // Récupérer le type d'activité
        $stmt = $this->pdo->prepare("
            SELECT name, description 
            FROM activity_types 
            WHERE entry = ? AND status = 'current'
        ");
        $type = $this->fetchOne($stmt, [$activity['activity_type']]);
        
        // Récupérer les responsables
        $stmt = $this->pdo->prepare("
            SELECT 
                u.id as responsible_user_id,
                u.display_name as responsible_display_name,
                u.initials as responsible_initials
            FROM responsible_for rf
            LEFT JOIN users u ON rf.user = u.id AND u.status = 'active'
            WHERE rf.activity = ? 
                AND rf.status = 'current'
                AND rf.start_date <= ? 
                AND (rf.end_date IS NULL OR rf.end_date >= ?)
            ORDER BY u.display_name
        ");
        $responsibles = $this->fetchAll($stmt, [$entry, $date, $date]);
        
        return [
            'activity' => $activity,
            'type' => $type,
            'responsible' => $responsibles
        ];
    }
    
    /**
     * Récupérer l'ID du type d'activité par nom
     */
    public function getActivityTypeIdByName($typeName) {
        $stmt = $this->pdo->prepare("
            SELECT entry FROM activity_types 
            WHERE name = ? AND status = 'current'
        ");
        $result = $this->fetchOne($stmt, [$typeName]);
        return $result ? $result['entry'] : null;
    }
    
    /**
     * Créer une nouvelle activité
     */
    public function createActivity($data, $activityTypeId, $userId) {
        $stmt = $this->pdo->prepare("
            INSERT INTO activities (version, created_by, name, icon, description, activity_type, start_date, end_date)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $this->executeQuery($stmt, [
            $userId,
            Helpers::sanitize($data['name']),
            Helpers::sanitize($data['icon'] ?? ''),
            Helpers::sanitize($data['description'] ?? ''),
            $activityTypeId,
            $data['start_date'] ?: null,
            $data['end_date'] ?: null
        ]);
        
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Mettre à jour une activité (création d'une nouvelle version)
     */
    public function updateActivity($entry, $data, $activityTypeId, $userId, $newVersion) {
        $stmt = $this->pdo->prepare("
            INSERT INTO activities (entry, version, created_by, name, icon, description, activity_type, start_date, end_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $this->executeQuery($stmt, [
            $entry,
            $newVersion,
            $userId,
            Helpers::sanitize($data['name']),
            Helpers::sanitize($data['icon'] ?? ''),
            Helpers::sanitize($data['description'] ?? ''),
            $activityTypeId,
            $data['start_date'] ?: null,
            $data['end_date'] ?: null
        ]);
        
        return $newVersion;
    }
    
    /**
     * Supprimer une activité (marquer comme deleted)
     */
    public function deleteActivity($entry) {
        $stmt = $this->pdo->prepare("
            UPDATE activities 
            SET status = 'deleted' 
            WHERE entry = ? AND status = 'current'
        ");
        return $this->executeQuery($stmt, [$entry]);
    }
    
    /**
     * Récupérer l'historique d'une activité
     */
    public function getActivityHistory($entry) {
        $stmt = $this->pdo->prepare("
            SELECT a.*, at.name as type_name
            FROM activities a
            LEFT JOIN activity_types at ON a.activity_type = at.entry
            WHERE a.entry = ?
            ORDER BY a.version DESC
        ");
        return $this->fetchAll($stmt, [$entry]);
    }
    
    /**
     * Récupérer les activités pour l'éditeur
     */
    public function getActivitiesForEditor($date, $type = null) {
        $query = "
            SELECT 
                a.entry as activity_id,
                a.name as activity_name,
                a.icon as activity_icon,
                a.description as activity_description,
                a.start_date,
                a.end_date,
                at.name as activity_type_name
            FROM activities a
            LEFT JOIN activity_types at ON a.activity_type = at.entry AND at.status = 'current'
            WHERE a.status = 'current'
                AND a.start_date <= :date
                AND (a.end_date IS NULL OR a.end_date >= :date)
        ";
        
        $params = ['date' => $date];
        
        if ($type) {
            $query .= " AND at.name = :type";
            $params['type'] = $type;
        }
        
        $query .= " ORDER BY at.name, a.name";
        
        $stmt = $this->pdo->prepare($query);
        return $this->fetchAll($stmt, $params);
    }
    
    /**
     * Récupérer les responsables d'une activité
     */
    public function getResponsiblesForActivity($activity, $date) {
        $stmt = $this->pdo->prepare("
            SELECT 
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
     * Récupérer les tâches d'une activité
     */
    public function getActivityTasks($activity, $date) {
        $stmt = $this->pdo->prepare("
            SELECT 
                at.entry as task_id,
                at.name as task_name,
                at.description as task_description,
                at.start_date,
                at.end_date,
                at.created_at,
                at.created_by
            FROM activity_tasks at
            WHERE at.activity = ? 
            AND at.status = 'current'
            AND (at.end_date IS NULL OR at.end_date >= ?)
            ORDER BY at.start_date ASC, 
                     CASE WHEN at.end_date IS NULL THEN 1 ELSE 0 END, 
                     at.end_date ASC
        ");
        
        return $this->fetchAll($stmt, [$activity, $date]);
    }
    
    /**
     * Récupérer les personnes assignées à une tâche
     */
    public function getAssignedToTask($task, $date) {
        $stmt = $this->pdo->prepare("
            SELECT 
                at.user as assigned_user_id,
                u.display_name as assigned_display_name,
                u.initials as assigned_initials,
                u.email as assigned_email,
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
    
    /**
     * Récupérer tous les types d'activités
     */
    public function getActivityTypes() {
        $stmt = $this->pdo->prepare('
            SELECT entry, name, description 
            FROM activity_types 
            WHERE status = :status
            ORDER BY name
        ');
        return $this->fetchAll($stmt, ['status' => 'current']);
    }
} 