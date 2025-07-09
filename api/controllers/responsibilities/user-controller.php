<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

/**
 * API de gestion des utilisateurs - Contrôleur
 * 
 * Point d'entrée HTTP pour la gestion des utilisateurs.
 * Responsabilités : Validation des paramètres, orchestration, réponse HTTP
 */

require_once __DIR__ . '/../../common/base-api.php';
require_once __DIR__ . '/../../services/responsibilities/worker-service.php';

class UserController extends BaseAPI {
    
    private $workerService;
    
    protected function initializeServices() {
        $this->workerService = new WorkerService($this->pdo, $this->currentUser);
    }
    
    protected function handleRequest() {
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'list':
                $this->listUsers();
                break;
            
            default:
                $this->sendError('Action non supportée');
        }
    }
    
    /**
     * Récupérer la liste des utilisateurs disponibles
     */
    private function listUsers() {
        try {
            $this->requireMethod('GET');
            
            // Récupérer la date actuelle ou la date passée en paramètre
            $date = $_GET['date'] ?? date('Y-m-d');
            
            // Appel au service pour récupérer les travailleurs sous contrat
            $result = $this->workerService->getWorkers($date);
            $workers = $result['workers'] ?? [];
            
            // Formater les données pour l'API
            $formattedUsers = array_map(function($worker) {
                return [
                    'id' => (int) $worker['id'],
                    'display_name' => $worker['display_name'] ?? 'Utilisateur ' . $worker['id'],
                    'name' => $worker['display_name'] ?? '',
                    'email' => $worker['email'] ?? '',
                    'initials' => $worker['initials'] ?? '',
                    'contract_type' => $worker['contract_type'] ?? '',
                    'contract_start_date' => $worker['start_date'] ?? '',
                    'contract_end_date' => $worker['end_date'] ?? '',
                    'active' => true // Les travailleurs retournés sont actifs par définition
                ];
            }, $workers);
            
            $this->sendSuccess([
                'users' => $formattedUsers,
                'filter_date' => $date,
                'total_count' => count($formattedUsers)
            ], 'Liste des travailleurs sous contrat récupérée avec succès');
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la récupération des travailleurs: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
}

// Instancier et exécuter l'API
try {
    new UserController();
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?> 