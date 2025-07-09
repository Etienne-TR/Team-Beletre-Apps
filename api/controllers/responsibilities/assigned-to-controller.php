<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

/**
 * API de gestion des assignations de tâches - Contrôleur
 * 
 * Point d'entrée HTTP pour la gestion des assignations de tâches.
 * Responsabilités : Validation des paramètres, orchestration, réponse HTTP
 */

require_once __DIR__ . '/../../common/base-api.php';
require_once __DIR__ . '/../../services/responsibilities/assigned-to-service.php';

class AssignedToController extends BaseAPI {
    
    private $assignedToService;
    
    public function __construct() {
        parent::__construct();
    }
    
    protected function initializeServices() {
        $this->assignedToService = new AssignedToService($this->pdo, $this->currentUser);
    }
    
    protected function handleRequest() {
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            // === CRUD ASSIGNATIONS ===
            case 'createEntry':
                $this->createEntry();
                break;
            case 'updateAssignedTo':
                $this->updateAssignedTo();
                break;
            case 'deleteEntry':
                $this->deleteEntry();
                break;
            case 'listFromDate':
                $this->listFromDate();
                break;
            
            default:
                $this->sendError('Action non supportée');
        }
    }
    
    // ========================================
    // MÉTHODES CRUD ASSIGNATIONS
    // ========================================
    
    /**
     * Créer une nouvelle assignation de tâche
     */
    private function createEntry() {
        try {
            $this->requireMethod('POST');
            
            $data = $this->getJsonInput();
            $result = $this->assignedToService->createEntry($data, $this->currentUser['id']);
            
            $this->sendSuccess($result, 'Assignation créée avec succès');
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la création: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Mettre à jour une assignation de tâche
     */
    private function updateAssignedTo() {
        try {
            $this->requireMethod('POST');
            
            $version = $_GET['version'] ?? '';
            if (empty($version)) {
                $this->sendError('Version requise');
            }
            
            $data = $this->getJsonInput();
            
            // Validation des champs requis
            if (empty($data['task'])) {
                $this->sendError('Champ "task" requis dans les données');
            }
            
            if (empty($data['user'])) {
                $this->sendError('Champ "user" requis dans les données');
            }
            
            if (empty($data['start_date'])) {
                $this->sendError('Champ "start_date" requis dans les données');
            }
            
            $result = $this->assignedToService->updateAssignedTo($version, $data, $this->currentUser['id']);
            
            $this->sendSuccess($result, 'Assignation mise à jour avec succès');
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la mise à jour: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Supprimer une assignation de tâche
     */
    private function deleteEntry() {
        try {
            // Accepter DELETE ou POST avec _method=DELETE
            $method = $_SERVER['REQUEST_METHOD'];
            $jsonInput = $this->getJsonInput();
            
            if ($method === 'DELETE' || ($method === 'POST' && isset($jsonInput['_method']) && $jsonInput['_method'] === 'DELETE')) {
                $entry = $_GET['entry'] ?? '';
                
                if (empty($entry)) {
                    $this->sendError('Entry requis');
                }
                
                $result = $this->assignedToService->deleteEntry($entry, $this->currentUser['id']);
                
                if ($result) {
                    $this->sendSuccess(null, 'Assignation supprimée avec succès');
                } else {
                    $this->sendError('Assignation non trouvée ou déjà supprimée');
                }
            } else {
                $this->sendError('Méthode non autorisée');
            }
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la suppression: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Récupérer les personnes assignées à une tâche
     */
    private function listFromDate() {
        try {
            $date = $_GET['date'] ?? '';
            $task = $_GET['task'] ?? '';
            
            if (empty($date) || empty($task)) {
                $this->sendError('Date et tâche requises');
            }
            
            $result = $this->assignedToService->listFromDate($task, $date);
            $this->sendSuccess($result);
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la récupération des personnes assignées: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
}

// Instancier et exécuter l'API
try {
    new AssignedToController();
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?> 