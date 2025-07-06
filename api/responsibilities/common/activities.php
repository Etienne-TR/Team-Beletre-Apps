<?php
/**
 * API pour récupérer les types d'activités
 */

// Inclure les fichiers nécessaires
require_once __DIR__ . '/../../common/base-api.php';
require_once __DIR__ . '/helpers.php';

class ActivityTypesAPI extends BaseAPI {
    
    protected function handleRequest() {
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'get_activity_types':
                $this->getActivityTypes();
                break;
            default:
                $this->sendError('Action non reconnue', 400);
        }
    }
    
    /**
     * Récupère les types d'activités depuis la table activity_types
     * avec le filtre status='current'
     */
    private function getActivityTypes() {
        try {
            // Requête SQL pour récupérer les types d'activités
            $stmt = $this->pdo->prepare('
                SELECT entry, name, description 
                FROM activity_types 
                WHERE status = :status
                ORDER BY name
            ');
            $stmt->execute(['status' => 'current']);
            $types = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $this->sendSuccess(['activity_types' => $types]);
            
        } catch (Exception $e) {
            $this->sendError('Erreur lors de la récupération des types d\'activités: ' . $e->getMessage(), 500);
            // Log l'erreur
            error_log('Erreur API activities.php (getActivityTypes): ' . $e->getMessage());
        }
    }
}

// Instancier l'API (le constructeur exécute automatiquement handleRequest)
new ActivityTypesAPI(); 