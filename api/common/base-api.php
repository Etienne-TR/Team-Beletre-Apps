<?php
/**
 * Classe de base pour toutes les APIs
 * 
 * Fournit les fonctionnalités communes : authentification,
 * gestion des réponses JSON, et accès à EntityManager.
 */
abstract class BaseAPI {
    protected $pdo;
    protected $currentUser;
    protected $entityManager;
    
    public function __construct() {
        $this->checkAuth();
        $this->setupDatabase();
        $this->setupEntityManager();
        $this->handleRequest();
    }
    
    /**
     * Vérification de l'authentification
     */
    protected function checkAuth() {
        $sessionId = $_COOKIE['team_session'] ?? '';
        
        if (empty($sessionId)) {
            $this->sendError('Non authentifié', 401);
        }
        
        // Inclure config.php seulement si $pdo n'est pas déjà disponible
        if (!isset($GLOBALS['pdo'])) {
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
            $this->sendError('Session expirée', 401);
        }
        
        $this->currentUser = $session;
        $this->pdo = $pdo; // Assigner la connexion PDO à la propriété de classe
    }
    
    /**
     * Configuration de la base de données
     */
    protected function setupDatabase() {
        // Déjà fait dans checkAuth()
    }
    
    /**
     * Configuration d'EntityManager
     */
    protected function setupEntityManager() {
        require_once __DIR__ . '/entity-manager.php';
        $this->entityManager = new EntityManager($this->pdo, $this->currentUser);
    }
    
    /**
     * Méthode abstraite à implémenter dans chaque API
     */
    abstract protected function handleRequest();
    
    /**
     * Envoyer une réponse JSON de succès
     */
    protected function sendSuccess($data = null, $message = null) {
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
        $input = file_get_contents('php://input');
        return json_decode($input, true) ?? [];
    }
    
    /**
     * Vérifier la méthode HTTP
     */
    protected function requireMethod($method) {
        if ($_SERVER['REQUEST_METHOD'] !== $method) {
            $this->sendError("Méthode {$method} requise", 405);
        }
    }
}