<?php
/**
 * Service pour la gestion des travailleurs et leurs responsabilités
 * 
 * Contient toute la logique métier pour les travailleurs
 */
require_once __DIR__ . '/../../repositories/responsibilities/worker-repository.php';
require_once __DIR__ . '/../../utils/common/validator.php';
require_once __DIR__ . '/../../utils/common/helpers.php';
require_once __DIR__ . '/../../utils/responsibilities/helpers.php';

class WorkerService {
    
    private $repository;
    private $pdo;
    private $currentUser;
    
    public function __construct($pdo, $currentUser) {
        $this->pdo = $pdo;
        $this->currentUser = $currentUser;
        $this->repository = new WorkerRepository($pdo, $currentUser);
    }
    
    /**
     * Récupérer la liste des travailleurs actifs à une date donnée
     */
    public function getWorkers($date) {
        $workers = $this->repository->getWorkers($date);
        
        return [
            'workers' => $workers,
            'filter_date' => $date,
            'total_count' => count($workers)
        ];
    }
    
    /**
     * Récupérer les activités d'un travailleur (responsable ou non)
     */
    public function getWorkerActivities($userId, $date, $isResponsible = true) {
        if (!Validator::isValidId($userId)) {
            throw new Exception('ID utilisateur requis', 400);
        }
        
        $activities = $this->repository->getWorkerActivities($userId, $date, $isResponsible);
        
        // Enrichir chaque activité avec les détails des responsables et tâches
        $result = [];
        foreach ($activities as $activity) {
            $activityId = $activity['activity_id'];
            
            // Récupérer les responsables de cette activité
            $responsibles = $this->repository->getActivityResponsibles($activityId, $date);
            
            // Récupérer les tâches assignées au travailleur pour cette activité
            $tasks = $this->repository->getWorkerTasksForActivity($userId, $activityId, $date);
            
            // Enrichir chaque tâche avec les personnes assignées
            $tasksWithAssignments = [];
            foreach ($tasks as $task) {
                $taskId = $task['task_id'];
                $assignments = $this->repository->getTaskAssignments($taskId, $date);
                
                $tasksWithAssignments[] = [
                    'id' => $task['task_id'],
                    'name' => $task['task_name'],
                    'description' => $task['task_description'],
                    'assigned_to' => $assignments
                ];
            }
            
            $result[] = [
                'activity' => [
                    'id' => $activity['activity_id'],
                    'name' => $activity['activity_name'],
                    'icon' => $activity['activity_icon'],
                    'description' => $activity['activity_description'],
                    'type' => $activity['activity_type']
                ],
                'responsibles' => $responsibles,
                'tasks' => $tasksWithAssignments
            ];
        }
        
        return [
            'activities' => $result,
            'is_responsible' => $isResponsible,
            'worker_id' => $userId,
            'date' => $date,
            'total_count' => count($result)
        ];
    }
    
    /**
     * Récupérer toutes les tâches assignées à un travailleur
     */
    public function getWorkerTasks($userId, $date) {
        if (!Validator::isValidId($userId)) {
            throw new Exception('ID utilisateur requis', 400);
        }
        
        $tasks = $this->repository->getWorkerTasks($userId, $date);
        
        // Enrichir chaque tâche avec les personnes assignées
        $result = [];
        foreach ($tasks as $task) {
            $taskId = $task['task_id'];
            $assignments = $this->repository->getTaskAssignments($taskId, $date);
            
            $result[] = [
                'id' => $task['task_id'],
                'name' => $task['task_name'],
                'description' => $task['task_description'],
                'assigned_to' => $assignments
            ];
        }
        
        return [
            'tasks' => $result,
            'worker_id' => $userId,
            'date' => $date,
            'total_count' => count($result)
        ];
    }
} 