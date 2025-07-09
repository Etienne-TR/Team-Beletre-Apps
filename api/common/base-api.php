<?php
/**
 * Classe de base pour toutes les APIs
 * 
 * Fournit les fonctionnalités communes : authentification,
 * gestion des réponses JSON, et accès aux services.
 */
abstract class BaseAPI {
    protected $pdo;
    protected $currentUser;
    
    public function __construct() {
        error_log('[DEBUG] BaseAPI::__construct appelé');
        $this->checkAuth();
        error_log('[DEBUG] BaseAPI::checkAuth terminé');
        $this->setupDatabase();
        error_log('[DEBUG] BaseAPI::setupDatabase terminé');
        $this->initializeServices();
        error_log('[DEBUG] BaseAPI::initializeServices terminé');
        $this->handleRequest();
        error_log('[DEBUG] BaseAPI::handleRequest terminé');
    }
    
    /**
     * Vérification de l'authentification
     */
    protected function checkAuth() {
        error_log('[DEBUG] BaseAPI::checkAuth début');
        $sessionId = $_COOKIE['team_session'] ?? '';
        error_log('[DEBUG] BaseAPI::sessionId=' . $sessionId);
        
        if (empty($sessionId)) {
            error_log('[DEBUG] BaseAPI::sessionId vide, envoi erreur 401');
            $this->sendError('Non authentifié', 401);
        }
        
        // Inclure config.php seulement si $pdo n'est pas déjà disponible
        if (!isset($GLOBALS['pdo'])) {
            error_log('[DEBUG] BaseAPI::inclusion config.php');
            require_once __DIR__ . '/config.php';
        }
        $pdo = $GLOBALS['pdo'];
        
        $stmt = $pdo->prepare("
            SELECT u.id, u.display_name, u.email, u.initials
            FROM user_sessions s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.session_id = ? AND s.expires_at > NOW()
        ");
        $stmt->execute([$sessionId]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$session) {
            error_log('[DEBUG] BaseAPI::session invalide, envoi erreur 401');
            $this->sendError('Session expirée', 401);
        }
        
        error_log('[DEBUG] BaseAPI::session valide pour user_id=' . $session['id']);
        $this->currentUser = $session;
        $this->pdo = $pdo; // Assigner la connexion PDO à la propriété de classe
    }
    
    /**
     * Configuration de la base de données
     */
    protected function setupDatabase() {
        error_log('[DEBUG] BaseAPI::setupDatabase appelé');
        // Déjà fait dans checkAuth()
    }
    

    
    /**
     * Initialisation des services (à surcharger dans les contrôleurs enfants)
     */
    protected function initializeServices() {
        error_log('[DEBUG] BaseAPI::initializeServices appelé (méthode vide par défaut)');
        // Méthode vide par défaut, à surcharger si nécessaire
    }
    
    /**
     * Méthode abstraite à implémenter dans chaque API
     */
    abstract protected function handleRequest();
    
    /**
     * Envoyer une réponse JSON de succès
     */
    protected function sendSuccess($data = null, $message = null) {
        error_log('[DEBUG] BaseAPI::sendSuccess appelé');
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => true,
            'data' => $data,
            'message' => $message
        ]);
        exit;
    }
    
    /**
     * Envoyer une réponse JSON d'erreur
     */
    protected function sendError($message, $code = 400, $data = null) {
        error_log('[DEBUG] BaseAPI::sendError appelé: ' . $message . ' (code: ' . $code . ')');
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'error' => $message,
            'data' => $data
        ]);
        exit;
    }
    
    /**
     * Récupérer les données JSON de la requête
     */
    protected function getJsonInput() {
        error_log('[DEBUG] BaseAPI::getJsonInput appelé');
        $input = file_get_contents('php://input');
        $data = json_decode($input, true) ?? [];
        error_log('[DEBUG] BaseAPI::getJsonInput données: ' . json_encode($data));
        return $data;
    }
    
    /**
     * Vérifier la méthode HTTP
     */
    protected function requireMethod($method) {
        error_log('[DEBUG] BaseAPI::requireMethod appelé pour méthode: ' . $method . ' (actuelle: ' . $_SERVER['REQUEST_METHOD'] . ')');
        if ($_SERVER['REQUEST_METHOD'] !== $method) {
            $this->sendError("Méthode {$method} requise", 405);
        }
    }
}