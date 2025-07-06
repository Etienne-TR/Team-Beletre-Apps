<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

/**
 * API de gestion des activités - Contrôleur
 * 
 * Point d'entrée HTTP pour la gestion des activités.
 * Responsabilités : Validation des paramètres, orchestration, réponse HTTP
 */

require_once __DIR__ . '/../../common/base-api.php';
require_once __DIR__ . '/../../services/responsibilities/activity-service.php';

class ActivityController extends BaseAPI {
    
    private $activityService;
    
    protected function initializeServices() {
        $this->activityService = new ActivityService($this->pdo, $this->currentUser);
    }
    

    
    protected function handleRequest() {
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            // === CRUD ACTIVITÉS ===
            case 'list':
                $this->listActivities();
                break;
            case 'get':
                $this->getActivity();
                break;
            case 'create':
                $this->createActivity();
                break;
            case 'update':
                $this->updateActivity();
                break;
            case 'delete':
                $this->deleteActivity();
                break;
            case 'history':
                $this->getHistory();
                break;
            
            // === ÉDITEUR D'ACTIVITÉS ===
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
            
            // === TYPES D'ACTIVITÉS ===
            case 'get_activity_types':
                $this->getActivityTypes();
                break;
            
            default:
                $this->sendError('Action non supportée');
        }
    }
    
    // ========================================
    // MÉTHODES CRUD ACTIVITÉS
    // ========================================
    
    /**
     * Lister toutes les activités actuelles
     */
    private function listActivities() {
        try {
            $typeFilter = $_GET['type'] ?? '';
            $search = $_GET['search'] ?? '';
            $date = $_GET['date'] ?? date('Y-m-d');
            
            $activities = $this->activityService->listActivities($date, $typeFilter, $search);
            $this->sendSuccess($activities);
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la récupération des activités: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Récupérer une activité spécifique
     */
    private function getActivity() {
        try {
            $entry = $_GET['entry'] ?? '';
            $date = $_GET['date'] ?? date('Y-m-d');
            
            if (empty($entry)) {
                $this->sendError('Entry requis');
            }
            
            $activityData = $this->activityService->getActivity($entry, $date);
            $this->sendSuccess($activityData);
            
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Créer une nouvelle activité
     */
    private function createActivity() {
        try {
            $this->requireMethod('POST');
            
            $data = $this->getJsonInput();
            $result = $this->activityService->createActivity($data, $this->currentUser['id']);
            
            $this->sendSuccess($result, 'Activité créée avec succès');
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la création: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Mettre à jour une activité
     */
    private function updateActivity() {
        try {
            $this->requireMethod('POST');
            
            $entry = $_GET['entry'] ?? '';
            if (empty($entry)) {
                $this->sendError('Entry requis');
            }
            
            $data = $this->getJsonInput();
            $result = $this->activityService->updateActivity($entry, $data, $this->currentUser['id']);
            
            $this->sendSuccess($result, 'Activité mise à jour avec succès');
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la mise à jour: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Supprimer une activité
     */
    private function deleteActivity() {
        try {
            $this->requireMethod('DELETE');
            
            $entry = $_GET['entry'] ?? '';
            if (empty($entry)) {
                $this->sendError('Entry requis');
            }
            
            $this->activityService->deleteActivity($entry, $this->currentUser['id']);
            $this->sendSuccess(null, 'Activité supprimée avec succès');
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la suppression: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Récupérer l'historique d'une activité
     */
    private function getHistory() {
        try {
            $entry = $_GET['entry'] ?? '';
            
            if (empty($entry)) {
                $this->sendError('Entry requis');
            }
            
            $history = $this->activityService->getActivityHistory($entry);
            $this->sendSuccess($history);
            
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    // ========================================
    // MÉTHODES ÉDITEUR D'ACTIVITÉS
    // ========================================
    
    /**
     * Récupérer la liste des activités avec filtres
     */
    private function getActivities() {
        try {
            $date = $_GET['date'] ?? date('Y-m-d');
            $type = $_GET['type'] ?? null;
            
            $result = $this->activityService->getActivitiesForEditor($date, $type);
            $this->sendSuccess($result);
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la récupération des activités: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Lister les responsables d'une activité
     */
    private function responsibleFor() {
        try {
            $date = $_GET['date'] ?? '';
            $activity = $_GET['activity'] ?? '';
            
            if (empty($date) || empty($activity)) {
                $this->sendError('Date et activité requises');
            }
            
            $result = $this->activityService->getResponsiblesForActivity($activity, $date);
            $this->sendSuccess($result);
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la récupération des responsables: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Récupérer les tâches d'une activité
     */
    private function getActivityTasks() {
        try {
            $date = $_GET['date'] ?? '';
            $activity = $_GET['activity'] ?? '';
            
            if (empty($date) || empty($activity)) {
                $this->sendError('Date et activité requises');
            }
            
            $result = $this->activityService->getActivityTasks($activity, $date);
            $this->sendSuccess($result);
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la récupération des tâches: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Récupérer les personnes assignées à une tâche
     */
    private function getAssignedTo() {
        try {
            $date = $_GET['date'] ?? '';
            $task = $_GET['task'] ?? '';
            
            if (empty($date) || empty($task)) {
                $this->sendError('Date et tâche requises');
            }
            
            $result = $this->activityService->getAssignedToTask($task, $date);
            $this->sendSuccess($result);
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la récupération des personnes assignées: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    // ========================================
    // MÉTHODES TYPES D'ACTIVITÉS
    // ========================================
    
    /**
     * Récupère les types d'activités
     */
    private function getActivityTypes() {
        try {
            $result = $this->activityService->getActivityTypes();
            $this->sendSuccess($result);
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la récupération des types d\'activités: ' . $e->getMessage(), $e->getCode() ?: 500);
            error_log('Erreur API activity-controller.php (getActivityTypes): ' . $e->getMessage());
        }
    }
}

// Instancier et exécuter l'API
try {
    new ActivityController();
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?> 