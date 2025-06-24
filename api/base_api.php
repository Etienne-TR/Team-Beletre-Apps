<?php
/**
 * Classe de base pour toutes les APIs
 * 
 * Fournit les fonctionnalités communes : authentification,
 * validation, logging, et gestion des réponses JSON.
 */
abstract class BaseAPI {
    protected $pdo;
    protected $currentUser;
    
    public function __construct() {
        $this->checkAuth();
        $this->setupDatabase();
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
        
        require_once __DIR__ . '/config.php';
        // La variable $pdo est maintenant disponible depuis config.php
        
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
     * Méthode abstraite à implémenter dans chaque API
     */
    abstract protected function handleRequest();
    
    /**
     * Validation des données d'entrée
     */
    protected function validateInput($data, $rules) {
        $errors = [];
        
        foreach ($rules as $field => $rule) {
            $value = $data[$field] ?? null;
            
            // Champ requis
            if (isset($rule['required']) && $rule['required'] && empty($value)) {
                $errors[$field] = "Le champ {$field} est requis";
                continue;
            }
            
            // Type
            if (!empty($value) && isset($rule['type'])) {
                switch ($rule['type']) {
                    case 'int':
                        if (!filter_var($value, FILTER_VALIDATE_INT)) {
                            $errors[$field] = "Le champ {$field} doit être un entier";
                        }
                        break;
                    case 'email':
                        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                            $errors[$field] = "Le champ {$field} doit être un email valide";
                        }
                        break;
                    case 'date':
                        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
                            $errors[$field] = "Le champ {$field} doit être une date (YYYY-MM-DD)";
                        }
                        break;
                }
            }
            
            // Longueur max
            if (!empty($value) && isset($rule['max_length'])) {
                if (strlen($value) > $rule['max_length']) {
                    $errors[$field] = "Le champ {$field} ne peut dépasser {$rule['max_length']} caractères";
                }
            }
        }
        
        return $errors;
    }
    
    /**
     * Logging des actions pour audit
     */
    protected function logAudit($table, $recordId, $action, $oldData = null, $newData = null) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO audit_log (table_name, record_entry, action, old_values, new_values, user, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $stmt->execute([
                $table,
                $recordId,
                $action,
                $oldData ? json_encode($oldData) : null,
                $newData ? json_encode($newData) : null,
                $this->currentUser['id']
            ]);
        } catch (Exception $e) {
            // Log d'audit ne doit pas faire échouer l'opération principale
            error_log("Erreur audit log: " . $e->getMessage());
        }
    }
    
    /**
     * Récupérer la version actuelle d'un enregistrement
     */
    protected function getCurrentVersion($table, $entry) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM {$table} 
            WHERE entry = ? AND status = 'current'
            ORDER BY version DESC 
            LIMIT 1
        ");
        $stmt->execute([$entry]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Marquer l'ancienne version comme deprecated
     */
    protected function deprecateOldVersion($table, $entry) {
        $stmt = $this->pdo->prepare("
            UPDATE {$table} 
            SET status = 'deprecated' 
            WHERE entry = ? AND status = 'current'
        ");
        $stmt->execute([$entry]);
    }
    
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
    
    /**
     * Sécuriser une chaîne pour éviter les injections
     */
    protected function sanitize($string) {
        return htmlspecialchars(trim($string), ENT_QUOTES, 'UTF-8');
    }
}