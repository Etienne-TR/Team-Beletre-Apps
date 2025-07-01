<?php
/**
 * API de l'éditeur d'activités
 * 
 * Fournit les endpoints pour récupérer la liste des activités
 * avec filtres par date et type d'activité.
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once __DIR__ . '/../../common/base-api.php';
require_once __DIR__ . '/../common/helpers.php';

class ActivityEditorAPI extends BaseAPI {
    
    protected function handleRequest() {
        $action = $_GET['action'] ?? 'get_activities';
        
        switch ($action) {
            case 'get_activities':
                $this->getActivities();
                break;
            case 'get_responsible_for':
                $this->responsibleFor();
                break;
            case 'get_activity_tasks':
                $this->getActivityTasks();
                break;
            case 'get_assigned_to':
                $this->getAssignedTo();
                break;
            default:
                $this->sendError('Action non supportée');
        }
    }
    
    /**
     * Récupérer la liste des activités avec filtres
     */
    private function getActivities() {
        $date = $_GET['date'] ?? date('Y-m-d');
        $type = $_GET['type'] ?? null;
        
        // Le format YYYY-MM-DD est garanti par le client JS
        
        try {
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
            
            $params = [
                'date' => $date
            ];
            
            // Ajouter le filtre par type si spécifié
            if ($type) {
                $query .= " AND at.name = :type";
                $params['type'] = $type;
            }
            
            $query .= " ORDER BY at.name, a.name";
            
            $stmt = $this->pdo->prepare($query);
            $stmt->execute($params);
            
            $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Formater les données pour la réponse
            $formattedActivities = [];
            foreach ($activities as $activity) {
                $formattedActivities[] = [
                    'id' => $activity['activity_id'],
                    'emoji' => $activity['activity_icon'] ?: '📋',
                    'name' => $activity['activity_name'],
                    'description' => $activity['activity_description'],
                    'start_date' => $activity['start_date'],
                    'end_date' => $activity['end_date'],
                    'type' => $activity['activity_type_name']
                ];
            }
            
            $this->sendSuccess([
                'activities' => $formattedActivities,
                'total_count' => count($formattedActivities),
                'filters' => [
                    'date' => $date,
                    'type' => $type
                ]
            ]);
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la récupération des activités: ' . $e->getMessage());
        }
    }
    
    /**
     * Lister les responsables d'une activité avec filtres de date
     * @param string $date - Date de référence (format YYYY-MM-DD)
     * @param int $activity - Entrée de l'activité (pas l'ID)
     */
    private function responsibleFor() {
        $date = $_GET['date'] ?? '';
        $activity = $_GET['activity'] ?? '';
        
        if (empty($date) || empty($activity)) {
            $this->sendError('Date et activité requises');
        }
        
        // Le format YYYY-MM-DD est garanti par le client JS
        
        try {
            // Récupérer les responsables avec les filtres demandés
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
            
            $stmt->execute([$activity, $date]);
            $responsibles = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $this->sendSuccess([
                'responsibles' => $responsibles,
                'filter_date' => $date,
                'total_count' => count($responsibles)
            ]);
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la récupération des responsables: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Récupérer les tâches d'une activité avec filtres de date
     * @param string $date - Date de référence (format YYYY-MM-DD)
     * @param int $activity - Entrée de l'activité
     */
    private function getActivityTasks() {
        $date = $_GET['date'] ?? '';
        $activity = $_GET['activity'] ?? '';
        
        if (empty($date) || empty($activity)) {
            $this->sendError('Date et activité requises');
        }
        
        // Le format YYYY-MM-DD est garanti par le client JS
        
        try {
            // Récupérer les tâches avec les filtres demandés
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
            
            $stmt->execute([$activity, $date]);
            $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $this->sendSuccess([
                'tasks' => $tasks,
                'filter_date' => $date,
                'total_count' => count($tasks)
            ]);
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la récupération des tâches: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Récupérer les personnes assignées à une tâche avec filtres de date
     * @param string $date - Date de référence (format YYYY-MM-DD)
     * @param int $task - Entrée de la tâche
     */
    private function getAssignedTo() {
        $date = $_GET['date'] ?? '';
        $task = $_GET['task'] ?? '';
        
        if (empty($date) || empty($task)) {
            $this->sendError('Date et tâche requises');
        }
        
        // Le format YYYY-MM-DD est garanti par le client JS
        
        try {
            // Récupérer les personnes assignées avec les filtres demandés
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
            
            $stmt->execute([$task, $date]);
            $assigned = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $this->sendSuccess([
                'assigned' => $assigned,
                'filter_date' => $date,
                'total_count' => count($assigned)
            ]);
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la récupération des personnes assignées: ' . $e->getMessage(), 500);
        }
    }
}

// Instancier et exécuter l'API
try {
    new ActivityEditorAPI();
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?> 