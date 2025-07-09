<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', '/tmp/php_errors.log');

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
            case 'createEntry':
                $this->createResponsibleFor();
                break;
            
            case 'updateVersion':
                $this->updateResponsibleFor();
                break;
            
            case 'deleteVersion':
                $this->deleteVersionResponsibleFor();
                break;
            
            case 'deleteEntry':
                $this->deleteEntryResponsibleFor();
                break;
            
            case 'listFromDate':
                $this->getResponsiblesFromDate();
                break;
            
            default:
                $this->sendError('Action non supportée');
        }
    }
    
    /**
     * Créer une nouvelle responsabilité d'activité
     */
    private function createResponsibleFor() {
        error_log("=== DÉBUT createResponsibleFor ===");
        try {
            error_log("Vérification de la méthode HTTP");
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
            
            // Validation que la date de fin est après la date de début
            if ($end_date && $end_date <= $start_date) {
                $this->sendError('La date de fin doit être postérieure à la date de début', 400);
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
            $errorCode = $e->getCode();
            // S'assurer que le code d'erreur est un entier
            if (!is_numeric($errorCode) || $errorCode == 0) {
                $errorCode = 500;
            }
            $this->sendError('Erreur lors de la création: ' . $e->getMessage(), (int)$errorCode);
        }
    }
    
    /**
     * Mettre à jour une responsabilité d'activité
     */
    private function updateResponsibleFor() {
        try {
            error_log("DEBUG: updateResponsibleFor appelé");
            
            $this->requireMethod('POST');
            error_log("DEBUG: Méthode POST vérifiée");
            
            $version = $_GET['version'] ?? '';
            error_log("DEBUG: Version reçue: " . $version);
            if (empty($version)) {
                $this->sendError('Version requise');
            }
            
            $data = $this->getJsonInput();
            error_log("DEBUG: Données JSON reçues: " . json_encode($data));
            
            error_log("DEBUG: Appel du service avec version=$version, userId=" . $this->currentUser['id']);
            $result = $this->responsibleForService->updateResponsibleFor($version, $data, $this->currentUser['id']);
            error_log("DEBUG: Résultat du service: " . json_encode($result));
            
            $this->sendSuccess($result, 'Responsabilité mise à jour avec succès');
            
        } catch (Exception $e) {
            error_log("DEBUG: Exception dans updateResponsibleFor: " . $e->getMessage());
            $errorCode = $e->getCode();
            if (!is_numeric($errorCode) || $errorCode == 0) {
                $errorCode = 500;
            }
            $this->sendError('Erreur lors de la mise à jour: ' . $e->getMessage(), (int)$errorCode);
        }
    }
    

    
    /**
     * Supprimer une version spécifique d'une responsabilité d'activité
     */
    private function deleteVersionResponsibleFor() {
        try {
            // Accepter DELETE ou POST avec _method=DELETE
            $method = $_SERVER['REQUEST_METHOD'];
            $jsonInput = $this->getJsonInput();
            
            if ($method === 'DELETE' || ($method === 'POST' && isset($jsonInput['_method']) && $jsonInput['_method'] === 'DELETE')) {
                $version = $_GET['version'] ?? '';
                if (empty($version)) {
                    $this->sendError('Version requise');
                }
                
                $this->responsibleForService->deleteVersionResponsibleFor($version, $this->currentUser['id']);
                $this->sendSuccess(null, 'Version de responsabilité supprimée avec succès');
            } else {
                $this->sendError('Méthode non autorisée');
            }
            
        } catch (Exception $e) {
            $errorCode = $e->getCode();
            if (!is_numeric($errorCode) || $errorCode == 0) {
                $errorCode = 500;
            }
            $this->sendError('Erreur lors de la suppression de la version: ' . $e->getMessage(), (int)$errorCode);
        }
    }
    
    /**
     * Supprimer toutes les versions d'une entrée de responsabilité d'activité
     */
    private function deleteEntryResponsibleFor() {
        try {
            // Accepter DELETE ou POST avec _method=DELETE
            $method = $_SERVER['REQUEST_METHOD'];
            $jsonInput = $this->getJsonInput();
            
            if ($method === 'DELETE' || ($method === 'POST' && isset($jsonInput['_method']) && $jsonInput['_method'] === 'DELETE')) {
                $entry = $_GET['entry'] ?? '';
                if (empty($entry)) {
                    $this->sendError('Entry requise');
                }
                
                $this->responsibleForService->deleteEntryResponsibleFor($entry, $this->currentUser['id']);
                $this->sendSuccess(null, 'Toutes les versions de la responsabilité supprimées avec succès');
            } else {
                $this->sendError('Méthode non autorisée');
            }
            
        } catch (Exception $e) {
            $errorCode = $e->getCode();
            if (!is_numeric($errorCode) || $errorCode == 0) {
                $errorCode = 500;
            }
            $this->sendError('Erreur lors de la suppression de l\'entrée: ' . $e->getMessage(), (int)$errorCode);
        }
    }
    
    /**
     * Récupérer les responsables d'une activité à partir d'une date
     */
    private function getResponsiblesFromDate() {
        try {
            $date = $_GET['date'] ?? '';
            $activity = $_GET['activity'] ?? '';
            
            if (empty($date) || empty($activity)) {
                $this->sendError('Date et activité requises');
            }
            
            $result = $this->responsibleForService->getResponsiblesFromDate($activity, $date);
            $this->sendSuccess($result);
            
        } catch (Exception $e) {
            $errorCode = $e->getCode();
            if (!is_numeric($errorCode) || $errorCode == 0) {
                $errorCode = 500;
            }
            $this->sendError('Erreur lors de la récupération des responsables: ' . $e->getMessage(), (int)$errorCode);
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