<?php
/**
 * Service pour la gestion des activités
 * 
 * Contient toute la logique métier pour les activités
 */
require_once __DIR__ . '/../../repositories/responsibilities/activity-repository.php';
require_once __DIR__ . '/../../repositories/common/versioning-repository.php';
require_once __DIR__ . '/../../utils/common/validator.php';
require_once __DIR__ . '/../../utils/common/helpers.php';
require_once __DIR__ . '/../../utils/responsibilities/helpers.php';

class ActivityService {
    
    private $repository;
    private $pdo;
    private $versioningRepository;
    private $currentUser;
    
    public function __construct($pdo, $currentUser) {
        $this->pdo = $pdo;
        $this->currentUser = $currentUser;
        $this->repository = new ActivityRepository($pdo, $currentUser);
        $this->versioningRepository = new VersioningRepository($pdo, $currentUser);
    }
    
    /**
     * Lister toutes les activités avec organisation des données
     */
    public function listActivities($date, $typeFilter = '', $search = '') {
        $results = $this->repository->listActivities($date, $typeFilter, $search);
        
        // Si un filtre de type est appliqué, inclure toutes les activités du type même sans responsable
        if ($typeFilter) {
            $allActivities = $this->repository->getActivitiesByType($date, $typeFilter);
            $existingActivities = [];
            foreach ($results as $row) {
                $existingActivities[$row['entry']] = true;
            }
            foreach ($allActivities as $activity) {
                if (!isset($existingActivities[$activity['entry']])) {
                    $results[] = array_merge($activity, [
                        'responsible_user_id' => null,
                        'responsible_display_name' => null,
                        'responsible_initials' => null
                    ]);
                }
            }
        }
        
        // Organiser les données pour éviter les doublons d'activités
        $activities = [];
        foreach ($results as $row) {
            $activityId = $row['entry'];
            
            if (!isset($activities[$activityId])) {
                $activities[$activityId] = [
                    'entry' => $row['entry'],
                    'name' => $row['name'],
                    'icon' => $row['icon'],
                    'description' => $row['description'],
                    'created_at' => $row['created_at'],
                    'type_name' => $row['type_name'],
                    'type_description' => $row['type_description'],
                    'responsible' => []
                ];
            }
            
            // Ajouter responsable s'il existe et n'est pas déjà présent
            if ($row['responsible_user_id'] && !Helpers::userInArray($activities[$activityId]['responsible'], $row['responsible_user_id'])) {
                $activities[$activityId]['responsible'][] = [
                    'id' => $row['responsible_user_id'],
                    'display_name' => $row['responsible_display_name'],
                    'initials' => $row['responsible_initials']
                ];
            }
        }
        
        return array_values($activities);
    }
    
    /**
     * Récupérer une activité avec validation de date
     */
    public function getActivity($entry, $date) {
        $activityData = $this->repository->getActivityWithDetails($entry, $date);
        
        if (!$activityData) {
            throw new Exception('Activité non trouvée', 404);
        }
        
        $activity = $activityData['activity'];
        
        // Vérifier que l'activité est active à la date demandée
        if (isset($activity['start_date']) && $activity['start_date'] > $date) {
            throw new Exception('Activité non active à cette date', 404);
        }
        
        if (isset($activity['end_date']) && $activity['end_date'] !== null && $activity['end_date'] < $date) {
            throw new Exception('Activité non active à cette date', 404);
        }
        
        return $activityData;
    }
    
    /**
     * Créer une nouvelle activité
     */
    public function createActivity($data, $userId) {
        // Validation
        $rules = [
            'name' => ['required' => true, 'max_length' => 200],
            'type' => ['required' => true, 'max_length' => 50],
            'description' => ['max_length' => 1000],
            'icon' => ['max_length' => 10],
            'start_date' => ['type' => 'date'],
            'end_date' => ['type' => 'date']
        ];
        
        $errors = Validator::validateInput($data, $rules);
        if (!empty($errors)) {
            throw new Exception('Données invalides', 400);
        }
        
        // Récupérer l'ID du type d'activité
        $activityTypeId = $this->repository->getActivityTypeIdByName($data['type']);
        if (!$activityTypeId) {
            throw new Exception('Type d\'activité invalide');
        }
        
        try {
            $this->pdo->beginTransaction();
            
            $entry = $this->repository->createActivity($data, $activityTypeId, $userId);
            
            // Log d'audit
            $this->versioningRepository->logAudit('activities', $entry, 'create', null, $data);
            
            $this->pdo->commit();
            
            return ['entry' => $entry];
            
        } catch (Exception $e) {
            $this->pdo->rollback();
            throw $e;
        }
    }
    
    /**
     * Mettre à jour une activité
     */
    public function updateActivity($entry, $data, $userId) {
        // Validation
        $rules = [
            'name' => ['required' => true, 'max_length' => 200],
            'type' => ['required' => true, 'max_length' => 50],
            'description' => ['max_length' => 1000],
            'icon' => ['max_length' => 10],
            'start_date' => ['type' => 'date'],
            'end_date' => ['type' => 'date']
        ];
        
        $errors = Validator::validateInput($data, $rules);
        if (!empty($errors)) {
            throw new Exception('Données invalides', 400);
        }
        
        // Récupérer l'ID du type d'activité
        $activityTypeId = $this->repository->getActivityTypeIdByName($data['type']);
        if (!$activityTypeId) {
            throw new Exception('Type d\'activité invalide');
        }
        
        // Récupérer la version actuelle
        $oldVersion = $this->versioningRepository->getCurrentVersion('activities', $entry);
        if (!$oldVersion) {
            throw new Exception('Activité non trouvée', 404);
        }
        
        try {
            $this->pdo->beginTransaction();
            
            // Marquer l'ancienne version comme deprecated
            $this->versioningRepository->deprecateOldVersion('activities', $entry);
            
            // Créer la nouvelle version
            $newVersion = $oldVersion['version'] + 1;
            $this->repository->updateActivity($entry, $data, $activityTypeId, $userId, $newVersion);
            
            // Log d'audit
            $this->versioningRepository->logAudit('activities', $entry, 'update', $oldVersion, $data);
            
            $this->pdo->commit();
            
            return ['version' => $newVersion];
            
        } catch (Exception $e) {
            $this->pdo->rollback();
            throw $e;
        }
    }
    
    /**
     * Supprimer une activité
     */
    public function deleteActivity($entry, $userId) {
        // Récupérer la version actuelle
        $currentVersion = $this->versioningRepository->getCurrentVersion('activities', $entry);
        if (!$currentVersion) {
            throw new Exception('Activité non trouvée', 404);
        }
        
        try {
            $this->pdo->beginTransaction();
            
            $this->repository->deleteActivity($entry);
            
            // Log d'audit
            $this->versioningRepository->logAudit('activities', $entry, 'delete', $currentVersion, null);
            
            $this->pdo->commit();
            
        } catch (Exception $e) {
            $this->pdo->rollback();
            throw $e;
        }
    }
    
    /**
     * Récupérer l'historique d'une activité
     */
    public function getActivityHistory($entry) {
        $history = $this->repository->getActivityHistory($entry);
        
        if (empty($history)) {
            throw new Exception('Activité non trouvée', 404);
        }
        
        return $history;
    }
    
    /**
     * Récupérer les activités pour l'éditeur
     */
    public function getActivitiesForEditor($date, $type = null) {
        $activities = $this->repository->getActivitiesForEditor($date, $type);
        
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
        
        return [
            'activities' => $formattedActivities,
            'total_count' => count($formattedActivities),
            'filters' => [
                'date' => $date,
                'type' => $type
            ]
        ];
    }
    
    /**
     * Récupérer les responsables d'une activité
     */
    public function getResponsiblesForActivity($activity, $date) {
        $responsibles = $this->repository->getResponsiblesForActivity($activity, $date);
        
        return [
            'responsibles' => $responsibles,
            'filter_date' => $date,
            'total_count' => count($responsibles)
        ];
    }
    
    /**
     * Récupérer les tâches d'une activité
     */
    public function getActivityTasks($activity, $date) {
        $tasks = $this->repository->getActivityTasks($activity, $date);
        
        return [
            'tasks' => $tasks,
            'filter_date' => $date,
            'total_count' => count($tasks)
        ];
    }
    
    /**
     * Récupérer les personnes assignées à une tâche
     */
    public function getAssignedToTask($task, $date) {
        $assigned = $this->repository->getAssignedToTask($task, $date);
        
        return [
            'assigned' => $assigned,
            'filter_date' => $date,
            'total_count' => count($assigned)
        ];
    }
    
    /**
     * Récupérer les types d'activités
     */
    public function getActivityTypes() {
        $types = $this->repository->getActivityTypes();
        
        return ['activity_types' => $types];
    }
} 