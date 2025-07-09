<?php
/**
 * Service pour la gestion des responsabilités d'activités
 * 
 * Contient toute la logique métier pour les responsabilités
 */
require_once __DIR__ . '/../../repositories/common/versioning-repository.php';
require_once __DIR__ . '/../../repositories/responsibilities/responsible-for-repository.php';
require_once __DIR__ . '/../../utils/common/validator.php';

class ResponsibleForService {
    
    private $pdo;
    private $versioningRepository;
    private $repository;
    private $currentUser;
    
    public function __construct($pdo, $currentUser) {
        $this->pdo = $pdo;
        $this->currentUser = $currentUser;
        $this->versioningRepository = new VersioningRepository($pdo, $currentUser);
        $this->repository = new ResponsibleForRepository($pdo, $currentUser);
    }
    
    /**
     * Créer une nouvelle responsabilité d'activité
     * @param int $created_by - ID de l'utilisateur qui crée la responsabilité
     * @param int $user - ID de l'utilisateur responsable
     * @param int $activity - ID de l'activité
     * @param string $start_date - Date de début (YYYY-MM-DD)
     * @param string $end_date - Date de fin (YYYY-MM-DD) ou null
     * @return array - Données de la responsabilité créée
     */
    public function createResponsibleFor($created_by, $user, $activity, $start_date, $end_date = null) {
        error_log("RESPONSIBLE FOR SERVICE: Début création - created_by: $created_by, user: $user, activity: $activity, start_date: $start_date, end_date: " . ($end_date ?? 'null'));
        
        // Validation des données
        $data = [
            'created_by' => $created_by,
            'user' => $user,
            'activity' => $activity,
            'start_date' => $start_date,
            'end_date' => $end_date
        ];
        
        $rules = [
            'created_by' => ['required' => true, 'type' => 'integer'],
            'user' => ['required' => true, 'type' => 'integer'],
            'activity' => ['required' => true, 'type' => 'integer'],
            'start_date' => ['required' => true, 'type' => 'date'],
            'end_date' => ['type' => 'date', 'nullable' => true]
        ];
        
        $errors = Validator::validateInput($data, $rules);
        if (!empty($errors)) {
            error_log("RESPONSIBLE FOR SERVICE: Erreur validation - " . implode(', ', $errors));
            throw new Exception('Données invalides: ' . implode(', ', $errors), 400);
        }
        
        error_log("RESPONSIBLE FOR SERVICE: Validation réussie");
        
        // Validation métier
        $this->validateResponsibleForData($data);
        error_log("RESPONSIBLE FOR SERVICE: Validation métier réussie");
        
        try {
            error_log("RESPONSIBLE FOR SERVICE: Début transaction");
            $this->pdo->beginTransaction();
            
            // Créer la responsabilité via le repository spécialisé
            $entry = $this->repository->createResponsibleFor($created_by, $user, $activity, $start_date, $end_date);
            error_log("RESPONSIBLE FOR SERVICE: Repository appelé, entry retourné: $entry");
            
            $this->pdo->commit();
            error_log("RESPONSIBLE FOR SERVICE: Transaction validée");
            
            $result = [
                'entry' => $entry,
                'created_by' => $created_by,
                'user' => $user,
                'activity' => $activity,
                'start_date' => $start_date,
                'end_date' => $end_date
            ];
            
            error_log("RESPONSIBLE FOR SERVICE: Retourne résultat: " . json_encode($result));
            return $result;
            
        } catch (Exception $e) {
            error_log("RESPONSIBLE FOR SERVICE: Exception - " . $e->getMessage());
            $this->pdo->rollback();
            throw $e;
        }
    }
    
    /**
     * Validation métier des données de responsabilité
     * @param array $data - Données à valider
     */
    private function validateResponsibleForData($data) {
        // Vérifier que l'utilisateur existe
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->execute([$data['user']]);
        if (!$stmt->fetch()) {
            throw new Exception('Utilisateur non trouvé', 404);
        }
        
        // Vérifier que l'activité existe
        $stmt = $this->pdo->prepare("SELECT entry FROM activities WHERE entry = ? AND status = 'current'");
        $stmt->execute([$data['activity']]);
        if (!$stmt->fetch()) {
            throw new Exception('Activité non trouvée', 404);
        }
        
        // Vérifier que la date de fin est après la date de début
        if ($data['end_date'] && $data['end_date'] <= $data['start_date']) {
            throw new Exception('La date de fin doit être après la date de début', 400);
        }
    }
    
    /**
     * Mettre à jour une responsabilité d'activité
     * @param int $version - Version de l'enregistrement à mettre à jour
     * @param array $data - Nouvelles données
     * @param int $userId - ID de l'utilisateur qui effectue la mise à jour
     * @return array - Données de la responsabilité mise à jour
     */
    public function updateResponsibleFor($version, $data, $userId) {
        // Validation
        $rules = [
            'activity' => ['required' => true, 'type' => 'integer'],
            'user_id' => ['required' => true, 'type' => 'integer'],
            'start_date' => ['required' => true, 'type' => 'date'],
            'end_date' => ['type' => 'date', 'nullable' => true]
        ];
        
        $errors = Validator::validateInput($data, $rules);
        if (!empty($errors)) {
            throw new Exception('Données invalides: ' . implode(', ', $errors), 400);
        }
        
        // Récupérer l'enregistrement par version
        $stmt = $this->pdo->prepare("SELECT * FROM responsible_for WHERE version = ?");
        $stmt->execute([$version]);
        $currentRecord = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$currentRecord) {
            throw new Exception('Responsabilité non trouvée', 404);
        }
        
        // Validation métier
        $this->validateResponsibleForData([
            'user' => $data['user_id'],
            'activity' => $data['activity'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'] ?? null
        ]);
        
        try {
            $this->pdo->beginTransaction();
            
            // Mettre à jour l'enregistrement par version
            $this->repository->updateResponsibleFor($version, $data);
            

            
            $this->pdo->commit();
            
            return ['entry' => $currentRecord['entry'], 'version' => $version];
            
        } catch (Exception $e) {
            $this->pdo->rollback();
            throw $e;
        }
    }
    
    /**
     * Récupérer les responsables d'une activité à partir d'une date
     * @param int $activity - ID de l'activité
     * @param string $date - Date de référence (YYYY-MM-DD)
     * @return array - Données des responsables
     */
    public function getResponsiblesFromDate($activity, $date) {
        $responsibles = $this->repository->getResponsiblesFromDate($activity, $date);
        
        return [
            'responsibles' => $responsibles,
            'filter_date' => $date,
            'total_count' => count($responsibles)
        ];
    }
    
    /**
     * Supprimer une version spécifique d'une responsabilité d'activité
     * @param int $version - Version de l'enregistrement à supprimer
     * @param int $userId - ID de l'utilisateur qui effectue la suppression
     */
    public function deleteVersionResponsibleFor($version, $userId) {
        try {
            $this->pdo->beginTransaction();
            
            // Récupérer l'enregistrement par version pour l'audit
            $stmt = $this->pdo->prepare("SELECT * FROM responsible_for WHERE version = ?");
            $stmt->execute([$version]);
            $currentRecord = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$currentRecord) {
                throw new Exception('Responsabilité non trouvée', 404);
            }
            
            // Supprimer la version spécifique
            $this->repository->deleteVersionResponsibleFor($version);
            

            
            $this->pdo->commit();
            
        } catch (Exception $e) {
            $this->pdo->rollback();
            throw $e;
        }
    }
    
    /**
     * Supprimer toutes les versions d'une entrée de responsabilité d'activité
     * @param int $entry - ID de l'entrée à supprimer
     * @param int $userId - ID de l'utilisateur qui effectue la suppression
     */
    public function deleteEntryResponsibleFor($entry, $userId) {
        try {
            $this->pdo->beginTransaction();
            
            // Récupérer toutes les versions de l'entrée pour l'audit
            $stmt = $this->pdo->prepare("SELECT * FROM responsible_for WHERE entry = ?");
            $stmt->execute([$entry]);
            $allVersions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($allVersions)) {
                throw new Exception('Responsabilité non trouvée', 404);
            }
            
            // Supprimer toutes les versions de l'entrée
            $this->repository->deleteEntryResponsibleFor($entry);
            

            
            $this->pdo->commit();
            
        } catch (Exception $e) {
            $this->pdo->rollback();
            throw $e;
        }
    }
} 