<?php
/**
 * Repository de base
 * 
 * Classe de base pour tous les repositories spécialisés
 */
// require_once __DIR__ . '/../../common/config.php';

class BaseRepository {
    
    protected $pdo;
    protected $currentUser;
    
    public function __construct($pdo, $currentUser) {
        $this->pdo = $pdo;
        $this->currentUser = $currentUser;
    }
    
    /**
     * Exécuter une requête avec gestion d'erreur
     */
    protected function executeQuery($stmt, $params = []) {
        try {
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            throw new Exception('Erreur de base de données: ' . $e->getMessage());
        }
    }
    
    /**
     * Récupérer une seule ligne
     */
    protected function fetchOne($stmt, $params = []) {
        $this->executeQuery($stmt, $params);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Récupérer plusieurs lignes
     */
    protected function fetchAll($stmt, $params = []) {
        $this->executeQuery($stmt, $params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Compter les lignes
     */
    protected function countRows($stmt, $params = []) {
        $this->executeQuery($stmt, $params);
        return $stmt->rowCount();
    }
} 