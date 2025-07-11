<?php
/**
 * Repository pour la gestion des travailleurs et leurs responsabilités
 * 
 * Contient toutes les requêtes SQL pour les travailleurs
 */
require_once __DIR__ . '/../common/base-repository.php';

class WorkerRepository extends BaseRepository {
    
    /**
     * Récupérer la liste des travailleurs actifs à une date donnée
     */
    public function getWorkers($date) {
        $sql = "
            SELECT DISTINCT 
                u.id,
                u.display_name,
                u.first_name,
                u.last_name,
                u.initials,
                u.email,
                wc.type as contract_type,
                wc.start_date,
                wc.end_date
            FROM users u
            INNER JOIN work_contracts wc ON u.id = wc.user
            WHERE wc.start_date <= ?
            AND (wc.end_date IS NULL OR wc.end_date >= ?)
            ORDER BY u.display_name
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$date, $date]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Récupérer les activités d'un travailleur (responsable ou non)
     */
    public function getWorkerActivities($userId, $date, $isResponsible = true) {
        if ($isResponsible) {
            // Get activities where the worker is directly responsible
            $sql = "
                SELECT a.entry as activity_id, a.name as activity_name, a.icon as activity_icon,
                       a.description as activity_description, at.name as activity_type
                FROM activities a
                INNER JOIN activity_types at ON a.activity_type = at.entry
                INNER JOIN responsible_for rf ON a.entry = rf.activity
                WHERE rf.user = ? AND a.status = 'current' AND at.status = 'current'
                  AND rf.status = 'current'
                  AND rf.start_date <= ? AND (rf.end_date IS NULL OR rf.end_date >= ?)
                  AND a.start_date <= ? AND (a.end_date IS NULL OR a.end_date >= ?)
                ORDER BY at.name, a.name
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId, $date, $date, $date, $date]);
        } else {
            // Get activities where the worker is NOT responsible but has tasks assigned
            $sql = "
                SELECT DISTINCT
                    a.entry as activity_id, 
                    a.name as activity_name, 
                    a.icon as activity_icon,
                    a.description as activity_description, 
                    at.name as activity_type
                FROM activities a
                INNER JOIN activity_types at ON a.activity_type = at.entry
                INNER JOIN activity_tasks t ON a.entry = t.activity
                INNER JOIN assigned_to ast ON t.entry = ast.task
                WHERE ast.user = ? 
                    AND t.status = 'current' 
                    AND a.status = 'current' 
                    AND at.status = 'current'
                    AND ast.status = 'current'
                    AND ast.start_date <= ? 
                    AND (ast.end_date IS NULL OR ast.end_date >= ?)
                    AND a.start_date <= ? 
                    AND (a.end_date IS NULL OR a.end_date >= ?)
                    AND a.entry NOT IN (
                        SELECT rf.activity 
                        FROM responsible_for rf 
                        WHERE rf.user = ? 
                            AND rf.status = 'current'
                            AND rf.start_date <= ? 
                            AND (rf.end_date IS NULL OR rf.end_date >= ?)
                    )
                ORDER BY at.name, a.name
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId, $date, $date, $date, $date, $userId, $date, $date]);
        }
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Récupérer les responsables d'une activité
     */
    public function getActivityResponsibles($activityId, $date) {
        $sql = "
            SELECT u.id, u.display_name, u.initials FROM responsible_for rf
            INNER JOIN users u ON rf.user = u.id
            WHERE rf.activity = ? AND rf.start_date <= ? AND (rf.end_date IS NULL OR rf.end_date >= ?)
              AND rf.status = 'current' AND u.status = 'active'
            ORDER BY u.display_name
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$activityId, $date, $date]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Récupérer les tâches assignées à un travailleur pour une activité spécifique
     */
    public function getWorkerTasksForActivity($userId, $activityId, $date) {
        $sql = "
            SELECT 
                t.entry as task_id,
                t.name as task_name,
                t.description as task_description
            FROM activity_tasks t
            INNER JOIN assigned_to ast ON t.entry = ast.task
            WHERE ast.user = ? 
                AND t.activity = ?
                AND t.status = 'current'
                AND ast.status = 'current'
                AND ast.start_date <= ? 
                AND (ast.end_date IS NULL OR ast.end_date >= ?)
            ORDER BY t.name
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId, $activityId, $date, $date]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Récupérer toutes les tâches assignées à un travailleur
     */
    public function getWorkerTasks($userId, $date) {
        $sql = "
            SELECT 
                t.entry as task_id,
                t.name as task_name,
                t.description as task_description,
                a.entry as activity_id,
                a.name as activity_name,
                a.icon as activity_icon,
                at.name as activity_type
            FROM activity_tasks t
            INNER JOIN activities a ON t.activity = a.entry
            INNER JOIN activity_types at ON a.activity_type = at.entry
            INNER JOIN assigned_to ast ON t.entry = ast.task
            WHERE ast.user = ? 
                AND t.status = 'current' 
                AND a.status = 'current' 
                AND at.status = 'current'
                AND ast.status = 'current'
                AND ast.start_date <= ? 
                AND (ast.end_date IS NULL OR ast.end_date >= ?)
                AND a.start_date <= ? 
                AND (a.end_date IS NULL OR a.end_date >= ?)
            ORDER BY at.name, a.name, t.name
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId, $date, $date, $date, $date]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Récupérer les personnes assignées à une tâche
     */
    public function getTaskAssignments($taskId, $date) {
        $sql = "
            SELECT u.id, u.display_name, u.initials 
            FROM assigned_to ast
            INNER JOIN users u ON ast.user = u.id
            WHERE ast.task = ? 
                AND ast.start_date <= ? 
                AND (ast.end_date IS NULL OR ast.end_date >= ?)
                AND ast.status = 'current' 
                AND u.status = 'active'
            ORDER BY u.display_name
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$taskId, $date, $date]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
} 