<?php
/**
 * Service de gestion des assignations de tâches
 * 
 * Logique métier pour la gestion des assignations de tâches.
 * Responsabilités : Règles métier, transformations, orchestration
 */

require_once __DIR__ . '/../../repositories/responsibilities/assigned-to-repository.php';
require_once __DIR__ . '/../../utils/common/validator.php';

class AssignedToService {
    
    private $assignedToRepository;
    private $currentUser;
    
    public function __construct($pdo, $currentUser) {
        $this->assignedToRepository = new AssignedToRepository($pdo, $currentUser);
        $this->currentUser = $currentUser;
    }
    
    /**
     * Créer une nouvelle assignation de tâche
     */
    public function createEntry($data, $createdBy) {
        // Validation des données
        $this->validateAssignedToData($data);
        
        // Préparation des données métier (sans écraser 'user')
        $assignedToData = [
            'task' => $data['task'],
            'user' => $data['user'], // utilisateur assigné (venant du formulaire)
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'] ?? null
        ];
        
        // Création via le repository
        // $createdBy est passé séparément pour le champ created_by dans la table
        $result = $this->assignedToRepository->createEntryAssignedTo('NOW()', $createdBy, $assignedToData);
        
        return $result;
    }
    
    /**
     * Mettre à jour une assignation de tâche
     */
    public function updateAssignedTo($version, $data, $updatedBy) {
        // Validation des données
        $this->validateAssignedToData($data);
        
        // Préparation des données métier (sans écraser 'user')
        $assignedToData = [
            'task' => $data['task'],
            'user' => $data['user'], // utilisateur assigné (venant du formulaire)
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'] ?? null
        ];
        
        // Mise à jour via le repository
        $result = $this->assignedToRepository->updateVersionAssignedTo($version, $assignedToData);
        
        return $result;
    }
    
    /**
     * Supprimer une assignation de tâche
     */
    public function deleteEntry($entry, $deletedBy) {
        // Suppression via le repository
        $result = $this->assignedToRepository->deleteEntryAssignedTo($entry);
        
        return $result;
    }
    
    /**
     * Récupérer les personnes assignées à une tâche
     */
    public function listFromDate($task, $date) {
        $assigned = $this->assignedToRepository->listFromDate($task, $date);
        
        return [
            'assigned' => $assigned,
            'filter_date' => $date,
            'total_count' => count($assigned)
        ];
    }
    
    /**
     * Validation des données d'assignation
     */
    private function validateAssignedToData($data) {
        $errors = [];
        
        if (empty($data['task'])) {
            $errors[] = 'Tâche requise';
        }
        
        if (empty($data['user'])) {
            $errors[] = 'Utilisateur requis';
        }
        
        if (empty($data['start_date'])) {
            $errors[] = 'Date de début requise';
        }
        
        if (!empty($errors)) {
            throw new Exception('Données invalides: ' . implode(', ', $errors));
        }
    }
}
?> 