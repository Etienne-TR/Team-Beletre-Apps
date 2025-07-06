<?php
/**
 * Repository pour la vue globale des responsabilités
 * 
 * Contient toutes les requêtes SQL pour la synthèse et l'export des responsabilités
 */
require_once __DIR__ . '/../common/base-repository.php';

class GlobalRepository extends BaseRepository {
    
    /**
     * Récupérer les types d'activités disponibles
     */
    public function getActivityTypes() {
        $sql = "
            SELECT DISTINCT at.entry, at.name, at.description
            FROM activity_types at
            INNER JOIN activities a ON at.entry = a.activity_type
            WHERE at.status = 'current' AND a.status = 'current'
            ORDER BY at.name
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Récupérer les données de responsabilités pour une date donnée
     */
    public function getResponsibilitiesData($targetDate, $typeFilter = null) {
        $query = "
            SELECT 
                a.entry as activity_id,
                a.name as activity_name,
                a.icon as activity_icon,
                a.description as activity_description,
                at.name as activity_type_name,
                at.description as activity_type_description,
                u_resp.id as responsible_user_id,
                u_resp.display_name as responsible_display_name,
                u_resp.initials as responsible_initials,
                task.entry as task_id,
                task.name as task_name,
                task.description as task_description,
                u_assigned.id as assigned_user_id,
                u_assigned.display_name as assigned_display_name,
                u_assigned.initials as assigned_initials
            FROM activities a
            LEFT JOIN activity_types at ON a.activity_type = at.entry AND at.status = 'current'
            LEFT JOIN responsible_for rf ON a.entry = rf.activity 
                AND rf.status = 'current'
                AND rf.start_date <= :target_date 
                AND (rf.end_date IS NULL OR rf.end_date >= :target_date)
            LEFT JOIN users u_resp ON rf.user = u_resp.id AND u_resp.status = 'active'
            LEFT JOIN activity_tasks task ON a.entry = task.activity AND task.status = 'current'
            LEFT JOIN assigned_to ast ON task.entry = ast.task 
                AND ast.status = 'current'
                AND ast.start_date <= :target_date2 
                AND (ast.end_date IS NULL OR ast.end_date >= :target_date2)
            LEFT JOIN users u_assigned ON ast.user = u_assigned.id AND u_assigned.status = 'active'
            WHERE a.status = 'current'
                AND a.start_date <= :target_date3 
                AND (a.end_date IS NULL OR a.end_date >= :target_date3)
        ";
        
        // Ajouter le filtre par type si spécifié
        $params = [
            'target_date' => $targetDate,
            'target_date2' => $targetDate,
            'target_date3' => $targetDate
        ];
        
        if ($typeFilter) {
            $query .= " AND at.name = :type_filter";
            $params['type_filter'] = $typeFilter;
        }
        
        $query .= " ORDER BY at.name, a.name, task.entry, u_assigned.display_name";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->execute($params);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Récupérer toutes les activités d'un type spécifique pour une date donnée
     */
    public function getActivitiesByType($targetDate, $typeFilter) {
        $sql = "
            SELECT 
                a.entry as activity_id,
                a.name as activity_name,
                a.icon as activity_icon,
                a.description as activity_description,
                at.name as activity_type_name,
                at.description as activity_type_description
            FROM activities a
            LEFT JOIN activity_types at ON a.activity_type = at.entry AND at.status = 'current'
            WHERE a.status = 'current'
                AND a.start_date <= :target_date 
                AND (a.end_date IS NULL OR a.end_date >= :target_date)
                AND at.name = :type_filter
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'target_date' => $targetDate,
            'type_filter' => $typeFilter
        ]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
} 