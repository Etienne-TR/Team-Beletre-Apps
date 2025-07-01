<?php
/**
 * API de vue des travailleurs des responsabilités
 * 
 * Fournit les endpoints pour consulter les responsabilités
 * et tâches d'un travailleur spécifique à une date donnée.
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once __DIR__ . '/../../common/base-api.php';
require_once __DIR__ . '/../common/helpers.php';

class WorkerResponsibilitiesAPI extends BaseAPI {
    
    protected function handleRequest() {
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'get_workers':
                $this->getWorkers();
                break;
            case 'get_worker_activities':
                $this->getWorkerActivities();
                break;
            case 'get_worker_tasks':
                $this->getWorkerTasks();
                break;
            default:
                $this->sendError('Action non reconnue', 400);
        }
    }
    
    private function getWorkers() {
        $date = $_GET['date'] ?? date('Y-m-d');
        
        // Log pour débogage
        error_log("=== DÉBUT getWorkers ===");
        error_log("Recherche des travailleurs pour la date: " . $date);
        
        $sql = "
            SELECT DISTINCT 
                u.id,
                u.display_name,
                u.initials,
                u.email,
                wc.type as contract_type,
                wc.start_date,
                wc.end_date
            FROM users u
            INNER JOIN work_contracts wc ON u.id = wc.user
            WHERE wc.start_date <= ?
            AND (wc.end_date IS NULL OR wc.end_date >= ?)
            ORDER BY u.display_name
        ";
        
        error_log("SQL: " . $sql);
        error_log("Paramètres: date = " . $date);
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$date, $date]);
        $workers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Log pour débogage
        error_log("Nombre de travailleurs trouvés: " . count($workers));
        if (count($workers) > 0) {
            error_log("Premier travailleur: " . json_encode($workers[0]));
        } else {
            error_log("AUCUN TRAVAILLEUR TROUVÉ - Vérification des données:");
            
            // Test sans conditions pour voir s'il y a des données
            $testSql = "SELECT COUNT(*) as total FROM work_contracts";
            $testStmt = $this->pdo->prepare($testSql);
            $testStmt->execute();
            $totalContracts = $testStmt->fetch(PDO::FETCH_ASSOC)['total'];
            error_log("Total des contrats de travail: " . $totalContracts);
            
            $testSql2 = "SELECT COUNT(*) as total FROM users";
            $testStmt2 = $this->pdo->prepare($testSql2);
            $testStmt2->execute();
            $totalUsers = $testStmt2->fetch(PDO::FETCH_ASSOC)['total'];
            error_log("Total des utilisateurs: " . $totalUsers);
            
            // Test avec juste la condition de date de début
            $testSql3 = "SELECT COUNT(*) as total FROM work_contracts WHERE start_date <= ?";
            $testStmt3 = $this->pdo->prepare($testSql3);
            $testStmt3->execute([$date]);
            $totalStartDate = $testStmt3->fetch(PDO::FETCH_ASSOC)['total'];
            error_log("Contrats avec start_date <= " . $date . ": " . $totalStartDate);
        }
        
        error_log("=== FIN getWorkers ===");
        
        $this->sendSuccess(['workers' => $workers]);
    }
    
    private function getWorkerActivities() {
        $userId = $_GET['user_id'] ?? null;
        $date = $_GET['date'] ?? date('Y-m-d');
        $isResponsible = isset($_GET['is_responsible']) ? filter_var($_GET['is_responsible'], FILTER_VALIDATE_BOOLEAN) : true;
        
        if (!$userId) {
            $this->sendError('ID utilisateur requis', 400);
            return;
        }
        
        if ($isResponsible) {
            // Get activities where the worker is directly responsible
            $sql = "
                SELECT a.entry as activity_id, a.name as activity_name, a.icon as activity_icon,
                       a.description as activity_description, at.name as activity_type
                FROM activities a
                INNER JOIN activity_types at ON a.activity_type = at.entry
                INNER JOIN responsible_for rf ON a.entry = rf.activity
                WHERE rf.user = ? AND a.status = 'current' AND at.status = 'current'
                  AND rf.status = 'current'
                  AND rf.start_date <= ? AND (rf.end_date IS NULL OR rf.end_date >= ?)
                  AND a.start_date <= ? AND (a.end_date IS NULL OR a.end_date >= ?)
                ORDER BY at.name, a.name
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId, $date, $date, $date, $date]);
        } else {
            // Get activities where the worker is NOT responsible but has tasks assigned
            $sql = "
                SELECT DISTINCT
                    a.entry as activity_id, 
                    a.name as activity_name, 
                    a.icon as activity_icon,
                    a.description as activity_description, 
                    at.name as activity_type
                FROM activities a
                INNER JOIN activity_types at ON a.activity_type = at.entry
                INNER JOIN activity_tasks t ON a.entry = t.activity
                INNER JOIN assigned_to ast ON t.entry = ast.task
                WHERE ast.user = ? 
                    AND t.status = 'current' 
                    AND a.status = 'current' 
                    AND at.status = 'current'
                    AND ast.status = 'current'
                    AND ast.start_date <= ? 
                    AND (ast.end_date IS NULL OR ast.end_date >= ?)
                    AND a.start_date <= ? 
                    AND (a.end_date IS NULL OR a.end_date >= ?)
                    AND a.entry NOT IN (
                        SELECT rf.activity 
                        FROM responsible_for rf 
                        WHERE rf.user = ? 
                            AND rf.status = 'current'
                            AND rf.start_date <= ? 
                            AND (rf.end_date IS NULL OR rf.end_date >= ?)
                    )
                ORDER BY at.name, a.name
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId, $date, $date, $date, $date, $userId, $date, $date]);
        }
        
        $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $result = [];
        foreach ($activities as $activity) {
            $activityId = $activity['activity_id'];

            // Get all responsibles for this activity
            $sql_responsibles = "
                SELECT u.id, u.display_name, u.initials FROM responsible_for rf
                INNER JOIN users u ON rf.user = u.id
                WHERE rf.activity = ? AND rf.start_date <= ? AND (rf.end_date IS NULL OR rf.end_date >= ?)
                  AND rf.status = 'current' AND u.status = 'active'
                ORDER BY u.display_name
            ";
            $stmt_resp = $this->pdo->prepare($sql_responsibles);
            $stmt_resp->execute([$activityId, $date, $date]);
            $responsibles = $stmt_resp->fetchAll(PDO::FETCH_ASSOC);
            
            // Get tasks assigned to the worker for this activity
            $sql_tasks = "
                SELECT 
                    t.entry as task_id,
                    t.name as task_name,
                    t.description as task_description
                FROM activity_tasks t
                INNER JOIN assigned_to ast ON t.entry = ast.task
                WHERE ast.user = ? 
                    AND t.activity = ?
                    AND t.status = 'current'
                    AND ast.status = 'current'
                    AND ast.start_date <= ? 
                    AND (ast.end_date IS NULL OR ast.end_date >= ?)
                ORDER BY t.name
            ";
            $stmt_tasks = $this->pdo->prepare($sql_tasks);
            $stmt_tasks->execute([$userId, $activityId, $date, $date]);
            $tasks = $stmt_tasks->fetchAll(PDO::FETCH_ASSOC);
            
            // Get all assignments for each task
            $tasksWithAssignments = [];
            foreach ($tasks as $task) {
                $taskId = $task['task_id'];
                
                // Get all people assigned to this task
                $sql_assignments = "
                    SELECT u.id, u.display_name, u.initials 
                    FROM assigned_to ast
                    INNER JOIN users u ON ast.user = u.id
                    WHERE ast.task = ? 
                        AND ast.start_date <= ? 
                        AND (ast.end_date IS NULL OR ast.end_date >= ?)
                        AND ast.status = 'current' 
                        AND u.status = 'active'
                    ORDER BY u.display_name
                ";
                $stmt_assign = $this->pdo->prepare($sql_assignments);
                $stmt_assign->execute([$taskId, $date, $date]);
                $assignments = $stmt_assign->fetchAll(PDO::FETCH_ASSOC);
                
                $tasksWithAssignments[] = [
                    'id' => $task['task_id'],
                    'name' => $task['task_name'],
                    'description' => $task['task_description'],
                    'assigned_to' => $assignments
                ];
            }
            
            $result[] = [
                'activity' => [
                    'id' => $activity['activity_id'],
                    'name' => $activity['activity_name'],
                    'icon' => $activity['activity_icon'],
                    'description' => $activity['activity_description'],
                    'type' => $activity['activity_type']
                ],
                'responsibles' => $responsibles,
                'tasks' => $tasksWithAssignments
            ];
        }
        
        $this->sendSuccess([
            'activities' => $result,
            'is_responsible' => $isResponsible,
            'worker_id' => $userId,
            'date' => $date
        ]);
    }
    
    private function getWorkerTasks() {
        $userId = $_GET['user_id'] ?? null;
        $date = $_GET['date'] ?? date('Y-m-d');
        
        if (!$userId) {
            $this->sendError('ID utilisateur requis', 400);
            return;
        }
        
        // Get tasks assigned to the worker
        $sql = "
            SELECT 
                t.entry as task_id,
                t.name as task_name,
                t.description as task_description,
                a.entry as activity_id,
                a.name as activity_name,
                a.icon as activity_icon,
                at.name as activity_type
            FROM activity_tasks t
            INNER JOIN activities a ON t.activity = a.entry
            INNER JOIN activity_types at ON a.activity_type = at.entry
            INNER JOIN assigned_to ast ON t.entry = ast.task
            WHERE ast.user = ? 
                AND t.status = 'current' 
                AND a.status = 'current' 
                AND at.status = 'current'
                AND ast.status = 'current'
                AND ast.start_date <= ? 
                AND (ast.end_date IS NULL OR ast.end_date >= ?)
                AND a.start_date <= ? 
                AND (a.end_date IS NULL OR a.end_date >= ?)
            ORDER BY at.name, a.name, t.name
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId, $date, $date, $date, $date]);
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $result = [];
        foreach ($tasks as $task) {
            $taskId = $task['task_id'];

            // Get all people assigned to this task
            $sql_assignments = "
                SELECT u.id, u.display_name, u.initials 
                FROM assigned_to ast
                INNER JOIN users u ON ast.user = u.id
                WHERE ast.task = ? 
                    AND ast.start_date <= ? 
                    AND (ast.end_date IS NULL OR ast.end_date >= ?)
                    AND ast.status = 'current' 
                    AND u.status = 'active'
                ORDER BY u.display_name
            ";
            $stmt_assign = $this->pdo->prepare($sql_assignments);
            $stmt_assign->execute([$taskId, $date, $date]);
            $assignments = $stmt_assign->fetchAll(PDO::FETCH_ASSOC);
            
            $result[] = [
                'id' => $task['task_id'],
                'name' => $task['task_name'],
                'description' => $task['task_description'],
                'assigned_to' => $assignments
            ];
        }
        
        $this->sendSuccess(['tasks' => $result]);
    }
}

new WorkerResponsibilitiesAPI(); 