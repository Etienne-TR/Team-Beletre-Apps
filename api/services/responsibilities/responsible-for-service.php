<?php
/**
 * Service pour la gestion des responsabilités d'activités
 * 
 * Contient toute la logique métier pour les responsabilités
 */
require_once __DIR__ . '/../../repositories/common/versioning-repository.php';
require_once __DIR__ . '/../../utils/common/validator.php';

class ResponsibleForService {
    
    private $pdo;
    private $versioningRepository;
    private $currentUser;
    
    public function __construct($pdo, $currentUser) {
        $this->pdo = $pdo;
        $this->currentUser = $currentUser;
        $this->versioningRepository = new VersioningRepository($pdo, $currentUser);
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
            throw new Exception('Données invalides: ' . implode(', ', $errors), 400);
        }
        
        // Validation métier
        $this->validateResponsibleForData($data);
        
        try {
            $this->pdo->beginTransaction();
            
            // Créer la responsabilité via le repository de versioning
            $entry = $this->versioningRepository->createEntity('responsible_for', $data);
            
            $this->pdo->commit();
            
            return [
                'entry' => $entry,
                'created_by' => $created_by,
                'user' => $user,
                'activity' => $activity,
                'start_date' => $start_date,
                'end_date' => $end_date
            ];
            
        } catch (Exception $e) {
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
        
        // Vérifier que la date de début n'est pas dans le passé
        if ($data['start_date'] < date('Y-m-d')) {
            throw new Exception('La date de début ne peut pas être dans le passé', 400);
        }
        
        // Vérifier que la date de fin est après la date de début
        if ($data['end_date'] && $data['end_date'] <= $data['start_date']) {
            throw new Exception('La date de fin doit être après la date de début', 400);
        }
        
        // Vérifier qu'il n'y a pas de chevauchement de responsabilités
        $this->checkOverlappingResponsibilities($data);
    }
    
    /**
     * Vérifier les chevauchements de responsabilités
     * @param array $data - Données de la responsabilité
     */
    private function checkOverlappingResponsibilities($data) {
        $sql = "
            SELECT COUNT(*) as count
            FROM responsible_for 
            WHERE user = ? 
            AND activity = ? 
            AND status = 'current'
            AND (
                (start_date <= ? AND (end_date IS NULL OR end_date >= ?))
                OR (start_date <= ? AND (end_date IS NULL OR end_date >= ?))
                OR (start_date >= ? AND (end_date IS NULL OR end_date <= ?))
            )
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $data['user'],
            $data['activity'],
            $data['start_date'],
            $data['start_date'],
            $data['end_date'] ?? '9999-12-31',
            $data['end_date'] ?? '9999-12-31',
            $data['start_date'],
            $data['end_date'] ?? '9999-12-31'
        ]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result['count'] > 0) {
            throw new Exception('Il existe déjà une responsabilité pour cet utilisateur et cette activité sur cette période', 409);
        }
    }
}
?> 