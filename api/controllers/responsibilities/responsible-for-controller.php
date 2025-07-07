<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

/**
 * API de gestion des responsabilités d'activités - Contrôleur
 * 
 * Point d'entrée HTTP pour la gestion des responsabilités.
 * Responsabilités : Validation des paramètres, orchestration, réponse HTTP
 */

require_once __DIR__ . '/../../common/base-api.php';
require_once __DIR__ . '/../../services/responsibilities/responsible-for-service.php';

class ResponsibleForController extends BaseAPI {
    
    private $responsibleForService;
    
    protected function initializeServices() {
        $this->responsibleForService = new ResponsibleForService($this->pdo, $this->currentUser);
    }
    
    protected function handleRequest() {
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'create':
                $this->createResponsibleFor();
                break;
            
            default:
                $this->sendError('Action non supportée');
        }
    }
    
    /**
     * Créer une nouvelle responsabilité d'activité
     */
    private function createResponsibleFor() {
        try {
            $this->requireMethod('POST');
            
            $data = $this->getJsonInput();
            
            // Validation des paramètres requis
            $requiredParams = ['created_by', 'user', 'activity', 'start_date'];
            foreach ($requiredParams as $param) {
                if (!isset($data[$param]) || empty($data[$param])) {
                    $this->sendError("Paramètre requis manquant: {$param}", 400);
                }
            }
            
            // Extraction des paramètres
            $created_by = (int) $data['created_by'];
            $user = (int) $data['user'];
            $activity = (int) $data['activity'];
            $start_date = $data['start_date'];
            $end_date = $data['end_date'] ?? null;
            
            // Validation du format de date
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date)) {
                $this->sendError('Format de date invalide pour start_date. Utilisez YYYY-MM-DD', 400);
            }
            
            if ($end_date && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
                $this->sendError('Format de date invalide pour end_date. Utilisez YYYY-MM-DD', 400);
            }
            
            // Appel au service
            $result = $this->responsibleForService->createResponsibleFor(
                $created_by,
                $user,
                $activity,
                $start_date,
                $end_date
            );
            
            $this->sendSuccess($result, 'Responsabilité créée avec succès');
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la création: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
}

// Instancier et exécuter l'API
try {
    new ResponsibleForController();
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?> 