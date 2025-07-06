<?php
/**
 * API de vue globale des responsabilités
 * 
 * Fournit les endpoints pour récupérer et exporter les données
 * de responsabilités par période avec une vue synthétique.
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once __DIR__ . '/../../common/base-api.php';
require_once __DIR__ . '/../common/helpers.php';

class SynthesisAPI extends BaseAPI {
    

    
    protected function handleRequest() {
        $action = $_GET['action'] ?? 'get_responsibilities';
        
        switch ($action) {
            case 'get_responsibilities':
                $this->getActivities();
                break;
            case 'get_activity_types':
                $this->getActivityTypes();
                break;
            case 'export_csv':
                $this->exportCSV();
                break;
            default:
                $this->sendError('Action non supportée');
        }
    }
    
    /**
     * Récupérer les types d'activités disponibles
     */
    private function getActivityTypes() {
        try {
            $sql = "
                SELECT DISTINCT at.entry, at.name, at.description
                FROM activity_types at
                INNER JOIN activities a ON at.entry = a.activity_type
                WHERE at.status = 'current' AND a.status = 'current'
                ORDER BY at.name
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $types = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $this->sendSuccess(['activity_types' => $types]);
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la récupération des types: ' . $e->getMessage());
        }
    }
    
    /**
     * Récupérer le tableau de synthèse des responsabilités
     */
    private function getActivities() {
        $dateFilter = $_GET['date'] ?? '2024-06-01';
        $typeFilter = $_GET['type'] ?? null;
        
        // Valider le format de date (YYYY-MM-DD)
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFilter)) {
            $this->sendError('Format de date invalide. Utilisez YYYY-MM-DD');
        }
        
        $targetDate = $dateFilter;
        
        // Pour les affectations temporelles, on cherche ce qui était actif à cette date précise
        // Requête originale mais avec une logique pour inclure toutes les activités
        
        // D'abord, récupérer toutes les activités avec leurs responsables
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
        
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Si un filtre de type est appliqué, s'assurer que toutes les activités de ce type sont incluses
        if ($typeFilter) {
            // Récupérer toutes les activités du type demandé
            $allActivitiesQuery = "
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
            
            $stmtAll = $this->pdo->prepare($allActivitiesQuery);
            $stmtAll->execute([
                'target_date' => $targetDate,
                'type_filter' => $typeFilter
            ]);
            $allActivities = $stmtAll->fetchAll(PDO::FETCH_ASSOC);
            
            // Créer un index des activités déjà présentes dans les résultats
            $existingActivities = [];
            foreach ($results as $row) {
                $existingActivities[$row['activity_id']] = true;
            }
            
            // Ajouter les activités manquantes avec des valeurs NULL pour les responsables et tâches
            foreach ($allActivities as $activity) {
                if (!isset($existingActivities[$activity['activity_id']])) {
                    $results[] = array_merge($activity, [
                        'responsible_user_id' => null,
                        'responsible_display_name' => null,
                        'responsible_initials' => null,
                        'task_id' => null,
                        'task_name' => null,
                        'task_description' => null,
                        'assigned_user_id' => null,
                        'assigned_display_name' => null,
                        'assigned_initials' => null
                    ]);
                }
            }
        }
        
        // Organiser les données en structure hiérarchique
        $activities = organizeActivityData($results);
        
        $this->sendSuccess([
            'activities' => $activities,
            'target_date' => $targetDate,
            'type_filter' => $typeFilter,
            'total_activities' => count($activities),
            'query_info' => [
                'searched_date' => $targetDate,
                'type_filter_applied' => $typeFilter ? true : false
            ]
        ]);
    }
    
    /**
     * Export CSV des responsabilités
     */
    private function exportCSV() {
        $period = $_GET['period'] ?? '2024-06';
        $specificDate = $_GET['date'] ?? null;
        $typeFilter = $_GET['type'] ?? null;
        
        if (!preg_match('/^\d{4}-\d{2}$/', $period)) {
            $this->sendError('Format de période invalide');
        }
        
        // Réutiliser la logique de getActivities pour récupérer les données
        $targetDate = $specificDate && preg_match('/^\d{4}-\d{2}-\d{2}$/', $specificDate) ? $specificDate : $period . '-01';
        
        // Récupérer les données (logique similaire à getActivities)
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
        
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $activities = organizeActivityData($results);
        
        // Générer CSV
        header('Content-Type: text/csv; charset=utf-8');
        $filename = "responsabilites_" . $targetDate;
        if ($typeFilter) {
            $filename .= "_" . str_replace(' ', '_', $typeFilter);
        }
        $filename .= ".csv";
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: no-cache, must-revalidate');
        
        $output = fopen('php://output', 'w');
        
        // BOM UTF-8 pour Excel
        fputs($output, "\xEF\xBB\xBF");
        
        // En-têtes CSV
        fputcsv($output, [
            'Date de référence',
            'Type',
            'Activité',
            'Description',
            'Responsables',
            'Tâche',
            'Description Tâche',
            'Assignées à'
        ], ';');
        
        // Données
        foreach ($activities as $activity) {
            $responsables = implode(', ', array_column($activity['responsible'], 'display_name'));
            
            if (empty($activity['tasks'])) {
                // Activité sans tâches
                fputcsv($output, [
                    $targetDate,
                    formatTypeName($activity['type']),
                    $activity['name'],
                    $activity['description'],
                    $responsables ?: 'Aucun',
                    '',
                    '',
                    ''
                ], ';');
            } else {
                // Activité avec tâches
                foreach ($activity['tasks'] as $task) {
                    $assigned = implode(', ', array_column($task['assigned_to'], 'display_name'));
                    
                    fputcsv($output, [
                        $targetDate,
                        formatTypeName($activity['type']),
                        $activity['name'],
                        $activity['description'],
                        $responsables ?: 'Aucun',
                        $task['name'],
                        $task['description'],
                        $assigned ?: 'Non assignée'
                    ], ';');
                }
            }
        }
        
        fclose($output);
        exit;
    }
}

// Instancier et exécuter l'API
try {
    new SynthesisAPI();
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?>