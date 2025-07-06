<?php
/**
 * API de vue globale des responsabilités - Contrôleur
 * 
 * Point d'entrée HTTP pour récupérer et exporter les données
 * de responsabilités par période avec une vue synthétique.
 * Responsabilités : Validation des paramètres, orchestration, réponse HTTP
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once __DIR__ . '/../../common/base-api.php';
require_once __DIR__ . '/../../services/responsibilities/global-service.php';

class GlobalController extends BaseAPI {
    
    private $globalService;
    
    protected function initializeServices() {
        $this->globalService = new GlobalService($this->pdo, $this->currentUser);
    }
    
    protected function handleRequest() {
        $action = $_GET['action'] ?? 'get_responsibilities';
        
        switch ($action) {
            case 'get_responsibilities':
                $this->getResponsibilities();
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
            $result = $this->globalService->getActivityTypes();
            $this->sendSuccess($result);
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la récupération des types: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Récupérer le tableau de synthèse des responsabilités
     */
    private function getResponsibilities() {
        try {
            $dateFilter = $_GET['date'] ?? '2024-06-01';
            $typeFilter = $_GET['type'] ?? null;
            
            $result = $this->globalService->getResponsibilities($dateFilter, $typeFilter);
            $this->sendSuccess($result);
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la récupération des responsabilités: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Export CSV des responsabilités
     */
    private function exportCSV() {
        try {
            $period = $_GET['period'] ?? '2024-06';
            $specificDate = $_GET['date'] ?? null;
            $typeFilter = $_GET['type'] ?? null;
            
            $result = $this->globalService->exportCSV($period, $specificDate, $typeFilter);
            
            // Envoyer les headers pour le téléchargement
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $result['filename'] . '"');
            header('Cache-Control: no-cache, must-revalidate');
            
            // Afficher le contenu CSV
            echo $result['content'];
            exit;
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de l\'export CSV: ' . $e->getMessage(), $e->getCode() ?: 500);
        }
    }
}

// Instancier et exécuter l'API
try {
    new GlobalController();
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?>