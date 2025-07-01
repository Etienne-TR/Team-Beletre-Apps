<?php
/**
 * API de gestion des activités
 * 
 * Fournit les endpoints CRUD pour la gestion des activités,
 * incluant la création, modification, suppression et consultation
 * des activités et leurs responsables.
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once __DIR__ . '/../../common/base-api.php';
require_once __DIR__ . '/../common/helpers.php';

class ActivitiesAPI extends BaseAPI {
    
    protected function handleRequest() {
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'list':
                $this->listActivities();
                break;
            case 'get':
                $this->getActivity();
                break;
            case 'create':
                $this->createActivity();
                break;
            case 'update':
                $this->updateActivity();
                break;
            case 'delete':
                $this->deleteActivity();
                break;
            case 'history':
                $this->getHistory();
                break;
            default:
                $this->sendError('Action non supportée');
        }
    }
    
    /**
     * Lister toutes les activités actuelles
     */
    private function listActivities() {
        $typeFilter = $_GET['type'] ?? '';
        $search = $_GET['search'] ?? '';
        $date = $_GET['date'] ?? date('Y-m-d'); // Date par défaut aujourd'hui
        
        // Utiliser 3 variables de date pour toutes les jointures
        $query = "
            SELECT 
                a.entry, 
                a.name, 
                a.icon, 
                a.description, 
                a.created_at,
                at.name as type_name, 
                at.description as type_description,
                u_resp.id as responsible_user_id,
                u_resp.display_name as responsible_display_name,
                u_resp.initials as responsible_initials
            FROM activities a
            LEFT JOIN activity_types at ON a.activity_type = at.entry AND at.status = 'current'
            LEFT JOIN responsible_for rf ON a.entry = rf.activity 
                AND rf.status = 'current'
                AND rf.start_date <= :target_date 
                AND (rf.end_date IS NULL OR rf.end_date >= :target_date)
            LEFT JOIN users u_resp ON rf.user = u_resp.id AND u_resp.status = 'active'
            WHERE a.status = 'current'
                AND a.start_date <= :target_date2 
                AND (a.end_date IS NULL OR a.end_date >= :target_date2)
        ";
        
        $params = [
            'target_date' => $date,
            'target_date2' => $date
        ];
        
        if ($typeFilter) {
            $query .= " AND at.name = :type_filter";
            $params['type_filter'] = $typeFilter;
        }
        
        if ($search) {
            $query .= " AND (a.name LIKE :search OR a.description LIKE :search2)";
            $params['search'] = "%{$search}%";
            $params['search2'] = "%{$search}%";
        }
        
        $query .= " ORDER BY at.entry, a.name, u_resp.display_name";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Si un filtre de type est appliqué, inclure toutes les activités du type même sans responsable
        if ($typeFilter) {
            $allActivitiesQuery = "
                SELECT 
                    a.entry, 
                    a.name, 
                    a.icon, 
                    a.description, 
                    a.created_at,
                    at.name as type_name, 
                    at.description as type_description
                FROM activities a
                LEFT JOIN activity_types at ON a.activity_type = at.entry AND at.status = 'current'
                WHERE a.status = 'current'
                    AND a.start_date <= :target_date 
                    AND (a.end_date IS NULL OR a.end_date >= :target_date)
                    AND at.name = :type_filter
            ";
            $stmtAll = $this->pdo->prepare($allActivitiesQuery);
            $stmtAll->execute([
                'target_date' => $date,
                'type_filter' => $typeFilter
            ]);
            $allActivities = $stmtAll->fetchAll(PDO::FETCH_ASSOC);
            $existingActivities = [];
            foreach ($results as $row) {
                $existingActivities[$row['entry']] = true;
            }
            foreach ($allActivities as $activity) {
                if (!isset($existingActivities[$activity['entry']])) {
                    $results[] = array_merge($activity, [
                        'responsible_user_id' => null,
                        'responsible_display_name' => null,
                        'responsible_initials' => null
                    ]);
                }
            }
        }
        
        // Organiser les données pour éviter les doublons d'activités
        $activities = [];
        foreach ($results as $row) {
            $activityId = $row['entry'];
            
            if (!isset($activities[$activityId])) {
                $activities[$activityId] = [
                    'entry' => $row['entry'],
                    'name' => $row['name'],
                    'icon' => $row['icon'],
                    'description' => $row['description'],
                    'created_at' => $row['created_at'],
                    'type_name' => $row['type_name'],
                    'type_description' => $row['type_description'],
                    'responsible' => []
                ];
            }
            
            // Ajouter responsable s'il existe et n'est pas déjà présent
            if ($row['responsible_user_id'] && !userInArray($activities[$activityId]['responsible'], $row['responsible_user_id'])) {
                $activities[$activityId]['responsible'][] = [
                    'id' => $row['responsible_user_id'],
                    'display_name' => $row['responsible_display_name'],
                    'initials' => $row['responsible_initials']
                ];
            }
        }
        
        $this->sendSuccess(array_values($activities));
    }
    

    
    /**
     * Récupérer une activité spécifique
     */
    private function getActivity() {
        $entry = $_GET['entry'] ?? '';
        $date = $_GET['date'] ?? date('Y-m-d'); // Date par défaut aujourd'hui
        
        if (empty($entry)) {
            $this->sendError('Entry requis');
        }
        
        $activity = $this->entityManager->getCurrentVersion('activities', $entry);
        
        if (!$activity) {
            $this->sendError('Activité non trouvée', 404);
        }
        
        // Vérifier que l'activité est active à la date demandée
        if (isset($activity['start_date']) && $activity['start_date'] > $date) {
            $this->sendError('Activité non active à cette date', 404);
        }
        
        if (isset($activity['end_date']) && $activity['end_date'] !== null && $activity['end_date'] < $date) {
            $this->sendError('Activité non active à cette date', 404);
        }
        
        // Récupérer le type d'activité
        $stmt = $this->pdo->prepare("
            SELECT name, description 
            FROM activity_types 
            WHERE entry = ? AND status = 'current'
        ");
        $stmt->execute([$activity['activity_type']]);
        $type = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Récupérer les responsables
        $stmt = $this->pdo->prepare("
            SELECT 
                u.id as responsible_user_id,
                u.display_name as responsible_display_name,
                u.initials as responsible_initials
            FROM responsible_for rf
            LEFT JOIN users u ON rf.user = u.id AND u.status = 'active'
            WHERE rf.activity = ? 
                AND rf.status = 'current'
                AND rf.start_date <= ? 
                AND (rf.end_date IS NULL OR rf.end_date >= ?)
            ORDER BY u.display_name
        ");
        $stmt->execute([$entry, $date, $date]);
        $responsibles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Ajouter le nom du type à l'activité
        $activity['type'] = $type;
        $activity['responsible'] = $responsibles;
        
        $this->sendSuccess($activity);
    }
    
    /**
     * Créer une nouvelle activité
     */
    private function createActivity() {
        $this->requireMethod('POST');
        
        $data = $this->getJsonInput();
        
        // Validation
        $rules = [
            'name' => ['required' => true, 'max_length' => 200],
            'type' => ['required' => true, 'max_length' => 50],
            'description' => ['max_length' => 1000],
            'icon' => ['max_length' => 10],
            'start_date' => ['type' => 'date'],
            'end_date' => ['type' => 'date']
        ];
        
        $errors = $this->entityManager->validateInput($data, $rules);
        if (!empty($errors)) {
            $this->sendError('Données invalides', 400, $errors);
        }
        
        // Récupérer l'ID du type d'activité à partir du nom
        $stmt = $this->pdo->prepare("
            SELECT entry FROM activity_types 
            WHERE name = ? AND status = 'current'
        ");
        $stmt->execute([$data['type']]);
        $typeResult = $stmt->fetch();
        if (!$typeResult) {
            $this->sendError('Type d\'activité invalide');
        }
        $activityTypeId = $typeResult['entry'];
        
        try {
            $this->pdo->beginTransaction();
            
            $stmt = $this->pdo->prepare("
                INSERT INTO activities (version, created_by, name, icon, description, activity_type, start_date, end_date)
                VALUES (1, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $this->currentUser['id'],
                $this->entityManager->sanitize($data['name']),
                $this->entityManager->sanitize($data['icon'] ?? ''),
                $this->entityManager->sanitize($data['description'] ?? ''),
                $activityTypeId,
                $data['start_date'] ?: null,
                $data['end_date'] ?: null
            ]);
            
            $entry = $this->pdo->lastInsertId();
            // Log d'audit
            $this->entityManager->logAudit('activities', $entry, 'create', null, $data);
            
            $this->pdo->commit();
            
            $this->sendSuccess(['entry' => $entry], 'Activité créée avec succès');
            
        } catch (Exception $e) {
            $this->pdo->rollback();
            $this->sendError('Erreur lors de la création: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Mettre à jour une activité (création d'une nouvelle version)
     */
    private function updateActivity() {
        $this->requireMethod('POST');
        
        $entry = $_GET['entry'] ?? '';
        if (empty($entry)) {
            $this->sendError('Entry requis');
        }
        
        $data = $this->getJsonInput();
        
        // Validation
        $rules = [
            'name' => ['required' => true, 'max_length' => 200],
            'type' => ['required' => true, 'max_length' => 50],
            'description' => ['max_length' => 1000],
            'icon' => ['max_length' => 10],
            'start_date' => ['type' => 'date'],
            'end_date' => ['type' => 'date']
        ];
        
        $errors = $this->entityManager->validateInput($data, $rules);
        if (!empty($errors)) {
            $this->sendError('Données invalides', 400, $errors);
        }
        
        // Récupérer l'ID du type d'activité à partir du nom
        $stmt = $this->pdo->prepare("
            SELECT entry FROM activity_types 
            WHERE name = ? AND status = 'current'
        ");
        $stmt->execute([$data['type']]);
        $typeResult = $stmt->fetch();
        if (!$typeResult) {
            $this->sendError('Type d\'activité invalide');
        }
        $activityTypeId = $typeResult['entry'];
        
        // Récupérer la version actuelle
        $oldVersion = $this->entityManager->getCurrentVersion('activities', $entry);
        if (!$oldVersion) {
            $this->sendError('Activité non trouvée', 404);
        }
        
        try {
            $this->pdo->beginTransaction();
            
            // Marquer l'ancienne version comme deprecated
            $this->entityManager->deprecateOldVersion('activities', $entry);
            
            // Créer la nouvelle version
            $newVersion = $oldVersion['version'] + 1;
            
            $stmt = $this->pdo->prepare("
                INSERT INTO activities (entry, version, created_by, name, icon, description, activity_type, start_date, end_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $entry,
                $newVersion,
                $this->currentUser['id'],
                $this->entityManager->sanitize($data['name']),
                $this->entityManager->sanitize($data['icon'] ?? ''),
                $this->entityManager->sanitize($data['description'] ?? ''),
                $activityTypeId,
                $data['start_date'] ?: null,
                $data['end_date'] ?: null
            ]);
            
            // Log d'audit
            $this->entityManager->logAudit('activities', $entry, 'update', $oldVersion, $data);
            
            $this->pdo->commit();
            
            $this->sendSuccess(['version' => $newVersion], 'Activité mise à jour avec succès');
            
        } catch (Exception $e) {
            $this->pdo->rollback();
            $this->sendError('Erreur lors de la mise à jour: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Supprimer une activité (marquer comme deleted)
     */
    private function deleteActivity() {
        $this->requireMethod('DELETE');
        
        $entry = $_GET['entry'] ?? '';
        if (empty($entry)) {
            $this->sendError('Entry requis');
        }
        
        // Récupérer la version actuelle
        $currentVersion = $this->entityManager->getCurrentVersion('activities', $entry);
        if (!$currentVersion) {
            $this->sendError('Activité non trouvée', 404);
        }
        
        try {
            $this->pdo->beginTransaction();
            
            // Marquer comme deleted (plus de version current)
            $stmt = $this->pdo->prepare("
                UPDATE activities 
                SET status = 'deleted' 
                WHERE entry = ? AND status = 'current'
            ");
            $stmt->execute([$entry]);
            
            // Log d'audit
            $this->entityManager->logAudit('activities', $entry, 'delete', $currentVersion, null);
            
            $this->pdo->commit();
            
            $this->sendSuccess(null, 'Activité supprimée avec succès');
            
        } catch (Exception $e) {
            $this->pdo->rollback();
            $this->sendError('Erreur lors de la suppression: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Récupérer l'historique d'une activité
     */
    private function getHistory() {
        $entry = $_GET['entry'] ?? '';
        
        if (empty($entry)) {
            $this->sendError('Entry requis');
        }
        
        $stmt = $this->pdo->prepare("
            SELECT a.*, at.name as type_name
            FROM activities a
            LEFT JOIN activity_types at ON a.activity_type = at.entry
            WHERE a.entry = ?
            ORDER BY a.version DESC
        ");
        $stmt->execute([$entry]);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($history)) {
            $this->sendError('Activité non trouvée', 404);
        }
        
        $this->sendSuccess($history);
    }
}

// Instancier et exécuter l'API
try {
    new ActivitiesAPI();
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?>