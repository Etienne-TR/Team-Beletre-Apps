<?php
/**
 * API de vue des travailleurs des responsabilités - Contrôleur
 * 
 * Point d'entrée HTTP pour la consultation des responsabilités
 * et tâches d'un travailleur spécifique à une date donnée.
 * Responsabilités : Validation des paramètres, orchestration, réponse HTTP
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once __DIR__ . '/../../common/base-api.php';
require_once __DIR__ . '/../../services/responsibilities/worker-service.php';

class WorkerController extends BaseAPI {
    
    private $workerService;
    
    protected function initializeServices() {
        $this->workerService = new WorkerService($this->pdo, $this->currentUser);
    }
    
    protected function handleRequest() {
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'get_workers':
                $this->getWorkers();
                break;
            case 'get_worker_activities':
                $this->getWorkerActivities();
                break;
            case 'get_worker_tasks':
                $this->getWorkerTasks();
                break;
            default:
                $this->sendError('Action non reconnue', 400);
        }
    }
    
    /**
     * Récupérer la liste des travailleurs actifs
     */
    private function getWorkers() {
        try {
            $date = $_GET['date'] ?? date('Y-m-d');
            
            $result = $this->workerService->getWorkers($date);
            $this->sendSuccess($result);
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la récupération des travailleurs: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Récupérer les activités d'un travailleur (responsable ou non)
     */
    private function getWorkerActivities() {
        try {
            $userId = $_GET['user_id'] ?? null;
            $date = $_GET['date'] ?? date('Y-m-d');
            $isResponsible = isset($_GET['is_responsible']) ? filter_var($_GET['is_responsible'], FILTER_VALIDATE_BOOLEAN) : true;
            
            if (!$userId) {
                $this->sendError('ID utilisateur requis', 400);
                return;
            }
            
            $result = $this->workerService->getWorkerActivities($userId, $date, $isResponsible);
            $this->sendSuccess($result);
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la récupération des activités: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Récupérer toutes les tâches assignées à un travailleur
     */
    private function getWorkerTasks() {
        try {
            $userId = $_GET['user_id'] ?? null;
            $date = $_GET['date'] ?? date('Y-m-d');
            
            if (!$userId) {
                $this->sendError('ID utilisateur requis', 400);
                return;
            }
            
            $result = $this->workerService->getWorkerTasks($userId, $date);
            $this->sendSuccess($result);
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la récupération des tâches: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
}

// Instancier et exécuter l'API
try {
    new WorkerController();
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Erreur serveur: ' . $e->getMessage()
    ]);
} 