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
            case 'createEntry':
                $this->createEntryActivity();
                break;
            case 'updateVersionActivity':
                $this->updateVersionActivity();
                break;
            case 'deleteEntry':
                $this->deleteEntryActivity();
                break;
            case 'history':
                $this->getHistory();
                break;
            
            // === ÉDITEUR D'ACTIVITÉS ===
            case 'get_activities':
                $this->getActivities();
                break;
            case 'get_activity_tasks':
                $this->getActivityTasks();
                break;
            case 'create_entry_task':
                $this->createEntryTask();
                break;

            case 'update_assigned_to':
                $this->updateAssignedTo();
                break;

            case 'updateVersionTask':
                $this->updateVersionTask();
                break;
                
            case 'deleteEntryTask':
                $this->deleteEntryTask();
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
    private function createEntryActivity() {
        try {
            $this->requireMethod('POST');
            
            $data = $this->getJsonInput();
            $result = $this->activityService->createEntryActivity($data, $this->currentUser['id']);
            
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
     * Mettre à jour une version d'activité
     */
    private function updateVersionActivity() {
        try {
            $this->requireMethod('POST');
            
            $version = $_GET['version'] ?? '';
            if (empty($version)) {
                $this->sendError('Version requise');
            }
            
            $data = $this->getJsonInput();
            $result = $this->activityService->updateVersionActivity($version, $data);
            
            $this->sendSuccess($result, 'Version d\'activité mise à jour avec succès');
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la mise à jour de la version: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Supprimer une activité (toutes les versions de l'entry)
     */
    private function deleteEntryActivity() {
        try {
            $this->requireMethod('DELETE');
            
            $entry = $_GET['entry'] ?? '';
            if (empty($entry)) {
                $this->sendError('Entry requis');
            }
            
            $this->activityService->deleteEntryActivity($entry);
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
     * Créer une nouvelle tâche pour une activité
     */
    private function createEntryTask() {
        try {
            $this->requireMethod('POST');
            
            $data = $this->getJsonInput();
            
            // Debug: logger les données reçues
            error_log('createEntryTask - Données reçues: ' . json_encode($data));
            
            $name = $data['name'] ?? '';
            $description = $data['description'] ?? '';
            $activity = $data['activity'] ?? '';
            
            // Debug: logger les valeurs extraites
            error_log('createEntryTask - name: ' . $name);
            error_log('createEntryTask - description: ' . $description);
            error_log('createEntryTask - activity: ' . $activity);
            error_log('createEntryTask - currentUser: ' . json_encode($this->currentUser));
            
            if (empty($name) || empty($activity)) {
                $this->sendError('Nom et activité requis');
            }
            
            $result = $this->activityService->createEntryTask($name, $description, $activity, $this->currentUser['id']);
            $this->sendSuccess($result, 'Tâche créée avec succès');
            
        } catch (Exception $e) {
            error_log('createEntryTask - Exception: ' . $e->getMessage());
            error_log('createEntryTask - Stack trace: ' . $e->getTraceAsString());
            $this->sendError('Erreur lors de la création de la tâche: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
    

    
    /**
     * Mettre à jour une assignation de tâche
     */
    private function updateAssignedTo() {
        try {
            $this->requireMethod('POST');
            
            $entry = $_GET['entry'] ?? '';
            if (empty($entry)) {
                $this->sendError('Entry requis');
            }
            
            $data = $this->getJsonInput();
            $result = $this->activityService->updateAssignedTo($entry, $data, $this->currentUser['id']);
            
            $this->sendSuccess($result, 'Assignation mise à jour avec succès');
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la mise à jour: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Mettre à jour une version de tâche
     */
    private function updateVersionTask() {
        try {
            $this->requireMethod('POST');
            
            $version = $_GET['version'] ?? '';
            if (empty($version)) {
                $this->sendError('Version requise');
            }
            
            $data = $this->getJsonInput();
            $result = $this->activityService->updateVersionTask($version, $data);
            
            $this->sendSuccess($result, 'Version de tâche mise à jour avec succès');
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la mise à jour de la version de tâche: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Supprimer une tâche (toutes les versions de l'entry)
     */
    private function deleteEntryTask() {
        try {
            $this->requireMethod('DELETE');
            
            $entry = $_GET['entry'] ?? '';
            if (empty($entry)) {
                $this->sendError('Entry requis');
            }
            
            $this->activityService->deleteEntryTask($entry);
            $this->sendSuccess(null, 'Tâche supprimée avec succès');
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la suppression de la tâche: ' . $e->getMessage(), $e->getCode() ?: 500);
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