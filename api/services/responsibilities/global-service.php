<?php
/**
 * Service pour la vue globale des responsabilités
 * 
 * Contient toute la logique métier pour la synthèse et l'export des responsabilités
 */
require_once __DIR__ . '/../../repositories/responsibilities/global-repository.php';
require_once __DIR__ . '/../../utils/common/validator.php';
require_once __DIR__ . '/../../utils/common/helpers.php';
require_once __DIR__ . '/../../utils/responsibilities/helpers.php';

class GlobalService {
    
    private $repository;
    private $pdo;
    private $currentUser;
    
    public function __construct($pdo, $currentUser) {
        $this->pdo = $pdo;
        $this->currentUser = $currentUser;
        $this->repository = new GlobalRepository($pdo, $currentUser);
    }
    
    /**
     * Récupérer les types d'activités disponibles
     */
    public function getActivityTypes() {
        $types = $this->repository->getActivityTypes();
        
        return [
            'activity_types' => $types,
            'total_count' => count($types)
        ];
    }
    
    /**
     * Récupérer le tableau de synthèse des responsabilités
     */
    public function getResponsibilities($dateFilter, $typeFilter = null) {
        // Valider le format de date (YYYY-MM-DD)
        if (!Validator::isValidDate($dateFilter)) {
            throw new Exception('Format de date invalide. Utilisez YYYY-MM-DD', 400);
        }
        
        $results = $this->repository->getResponsibilitiesData($dateFilter, $typeFilter);
        
        // Si un filtre de type est appliqué, s'assurer que toutes les activités de ce type sont incluses
        if ($typeFilter) {
            $allActivities = $this->repository->getActivitiesByType($dateFilter, $typeFilter);
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
        
        return [
            'activities' => $activities,
            'target_date' => $dateFilter,
            'type_filter' => $typeFilter,
            'total_activities' => count($activities),
            'query_info' => [
                'searched_date' => $dateFilter,
                'type_filter_applied' => $typeFilter ? true : false
            ]
        ];
    }
    
    /**
     * Générer l'export CSV des responsabilités
     */
    public function exportCSV($period, $specificDate = null, $typeFilter = null) {
        // Valider le format de période
        if (!Validator::isValidPeriod($period)) {
            throw new Exception('Format de période invalide', 400);
        }
        
        // Déterminer la date cible
        $targetDate = $specificDate && Validator::isValidDate($specificDate) ? $specificDate : $period . '-01';
        
        // Récupérer les données
        $results = $this->repository->getResponsibilitiesData($targetDate, $typeFilter);
        $activities = organizeActivityData($results);
        
        // Générer le contenu CSV
        $csvContent = $this->generateCSVContent($activities, $targetDate);
        
        // Générer le nom de fichier
        $filename = "responsabilites_" . $targetDate;
        if ($typeFilter) {
            $filename .= "_" . str_replace(' ', '_', $typeFilter);
        }
        $filename .= ".csv";
        
        return [
            'content' => $csvContent,
            'filename' => $filename,
            'target_date' => $targetDate,
            'type_filter' => $typeFilter,
            'total_activities' => count($activities)
        ];
    }
    
    /**
     * Générer le contenu CSV
     */
    private function generateCSVContent($activities, $targetDate) {
        $output = '';
        
        // BOM UTF-8 pour Excel
        $output .= "\xEF\xBB\xBF";
        
        // En-têtes CSV
        $headers = [
            'Date de référence',
            'Type',
            'Activité',
            'Description',
            'Responsables',
            'Tâche',
            'Description Tâche',
            'Assignées à'
        ];
        $output .= Helpers::arrayToCSV($headers);
        
        // Données
        foreach ($activities as $activity) {
            $responsables = implode(', ', array_column($activity['responsible'], 'display_name'));
            
            if (empty($activity['tasks'])) {
                // Activité sans tâches
                $row = [
                    $targetDate,
                    Helpers::formatTypeName($activity['type']),
                    $activity['name'],
                    $activity['description'],
                    $responsables ?: 'Aucun',
                    '',
                    '',
                    ''
                ];
                $output .= Helpers::arrayToCSV($row);
            } else {
                // Activité avec tâches
                foreach ($activity['tasks'] as $task) {
                    $assigned = implode(', ', array_column($task['assigned_to'], 'display_name'));
                    
                    $row = [
                        $targetDate,
                        Helpers::formatTypeName($activity['type']),
                        $activity['name'],
                        $activity['description'],
                        $responsables ?: 'Aucun',
                        $task['name'],
                        $task['description'],
                        $assigned ?: 'Non assignée'
                    ];
                    $output .= Helpers::arrayToCSV($row);
                }
            }
        }
        
        return $output;
    }
    

} 