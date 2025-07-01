<?php
/**
 * API d'export générique pour CSV, Excel, HTML et Markdown
 * 
 * Fournit les fonctionnalités d'export communes pour toutes les entités
 * avec support de différents formats et personnalisation.
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once __DIR__ . '/base-api.php';

class ExportAPI extends BaseAPI {
    
    protected function handleRequest() {
        $action = $_GET['action'] ?? 'export_csv';
        
        switch ($action) {
            case 'export_csv':
                $this->exportCSV();
                break;
            case 'export_html':
                $this->exportHTML();
                break;
            case 'export_markdown':
                $this->exportMarkdown();
                break;
            case 'export_excel':
                $this->exportExcel();
                break;
            default:
                $this->sendError('Format d\'export non supporté');
        }
    }
    
    /**
     * Export CSV générique
     */
    private function exportCSV() {
        $data = $this->getExportData();
        $filename = $this->getFilename('csv');
        
        // Headers pour le téléchargement
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: no-cache, must-revalidate');
        
        $output = fopen('php://output', 'w');
        
        // BOM UTF-8 pour Excel
        fputs($output, "\xEF\xBB\xBF");
        
        // En-têtes CSV
        if (!empty($data['headers'])) {
            fputcsv($output, $data['headers'], ';');
        }
        
        // Données
        foreach ($data['rows'] as $row) {
            fputcsv($output, $row, ';');
        }
        
        fclose($output);
        exit;
    }
    
    /**
     * Export HTML générique
     */
    private function exportHTML() {
        $data = $this->getExportData();
        $filename = $this->getFilename('html');
        
        // Headers pour le téléchargement
        header('Content-Type: text/html; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: no-cache, must-revalidate');
        
        // Générer le HTML
        $html = $this->generateHTML($data);
        
        echo $html;
        exit;
    }
    
    /**
     * Export Markdown générique
     */
    private function exportMarkdown() {
        $data = $this->getExportData();
        $filename = $this->getFilename('md');
        
        // Headers pour le téléchargement
        header('Content-Type: text/markdown; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: no-cache, must-revalidate');
        
        // Générer le Markdown
        $markdown = $this->generateMarkdown($data);
        
        echo $markdown;
        exit;
    }
    
    /**
     * Export Excel (format CSV avec extension .xls pour compatibilité)
     */
    private function exportExcel() {
        $data = $this->getExportData();
        $filename = $this->getFilename('xls');
        
        // Headers pour le téléchargement
        header('Content-Type: application/vnd.ms-excel; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: no-cache, must-revalidate');
        
        $output = fopen('php://output', 'w');
        
        // BOM UTF-8 pour Excel
        fputs($output, "\xEF\xBB\xBF");
        
        // En-têtes
        if (!empty($data['headers'])) {
            fputcsv($output, $data['headers'], "\t");
        }
        
        // Données
        foreach ($data['rows'] as $row) {
            fputcsv($output, $row, "\t");
        }
        
        fclose($output);
        exit;
    }
    
    /**
     * Récupérer les données d'export depuis la requête
     * @return array - Données formatées pour l'export
     */
    private function getExportData() {
        $entity = $_GET['entity'] ?? '';
        $date = $_GET['date'] ?? date('Y-m-d');
        $type = $_GET['type'] ?? null;
        $format = $_GET['format'] ?? 'csv';
        
        // Validation des paramètres
        if (empty($entity)) {
            $this->sendError('Entité requise pour l\'export');
        }
        
        // Récupérer les données selon l'entité
        switch ($entity) {
            case 'activities':
                return $this->getActivitiesExportData($date, $type);
            case 'tasks':
                return $this->getTasksExportData($date, $type);
            case 'users':
                return $this->getUsersExportData($date);
            default:
                $this->sendError('Entité non supportée pour l\'export');
        }
    }
    
    /**
     * Récupérer les données d'export pour les activités
     * @param string $date - Date de référence
     * @param string|null $type - Filtre par type
     * @return array - Données formatées
     */
    private function getActivitiesExportData($date, $type = null) {
        $query = "
            SELECT 
                a.entry as activity_id,
                a.name as activity_name,
                a.icon as activity_icon,
                a.description as activity_description,
                at.name as activity_type_name,
                at.description as activity_type_description,
                u_resp.id as responsible_user_id,
                u_resp.display_name as responsible_display_name,
                u_resp.initials as responsible_initials,
                task.entry as task_id,
                task.name as task_name,
                task.description as task_description,
                u_assigned.id as assigned_user_id,
                u_assigned.display_name as assigned_display_name,
                u_assigned.initials as assigned_initials
            FROM activities a
            LEFT JOIN activity_types at ON a.activity_type = at.entry AND at.status = 'current'
            LEFT JOIN responsible_for rf ON a.entry = rf.activity 
                AND rf.status = 'current'
                AND rf.start_date <= :target_date 
                AND (rf.end_date IS NULL OR rf.end_date >= :target_date)
            LEFT JOIN users u_resp ON rf.user = u_resp.id AND u_resp.status = 'active'
            LEFT JOIN activity_tasks task ON a.entry = task.activity AND task.status = 'current'
            LEFT JOIN assigned_to ast ON task.entry = ast.task 
                AND ast.status = 'current'
                AND ast.start_date <= :target_date2 
                AND (ast.end_date IS NULL OR ast.end_date >= :target_date2)
            LEFT JOIN users u_assigned ON ast.user = u_assigned.id AND u_assigned.status = 'active'
            WHERE a.status = 'current'
                AND a.start_date <= :target_date3 
                AND (a.end_date IS NULL OR a.end_date >= :target_date3)
        ";
        
        $params = [
            'target_date' => $date,
            'target_date2' => $date,
            'target_date3' => $date
        ];
        
        if ($type) {
            $query .= " AND at.name = :type_filter";
            $params['type_filter'] = $type;
        }
        
        $query .= " ORDER BY at.name, a.name, task.entry, u_assigned.display_name";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Organiser les données
        $activities = $this->organizeActivitiesData($results);
        
        // Préparer les données d'export
        $headers = [
            'Date de référence',
            'Type',
            'Activité',
            'Description',
            'Responsables',
            'Tâche',
            'Description Tâche',
            'Assignées à'
        ];
        
        $rows = [];
        foreach ($activities as $activity) {
            $responsables = implode(', ', array_column($activity['responsible'], 'display_name'));
            
            if (empty($activity['tasks'])) {
                // Activité sans tâches
                $rows[] = [
                    $date,
                    $this->formatTypeName($activity['type']),
                    $activity['name'],
                    $activity['description'],
                    $responsables ?: 'Aucun',
                    '',
                    '',
                    ''
                ];
            } else {
                // Activité avec tâches
                foreach ($activity['tasks'] as $task) {
                    $assigned = implode(', ', array_column($task['assigned_to'], 'display_name'));
                    
                    $rows[] = [
                        $date,
                        $this->formatTypeName($activity['type']),
                        $activity['name'],
                        $activity['description'],
                        $responsables ?: 'Aucun',
                        $task['name'],
                        $task['description'],
                        $assigned ?: 'Non assignée'
                    ];
                }
            }
        }
        
        return [
            'headers' => $headers,
            'rows' => $rows,
            'title' => 'Responsabilités - ' . $date,
            'entity' => 'activities'
        ];
    }
    
    /**
     * Récupérer les données d'export pour les tâches
     * @param string $date - Date de référence
     * @param string|null $type - Filtre par type
     * @return array - Données formatées
     */
    private function getTasksExportData($date, $type = null) {
        // Implémentation similaire pour les tâches
        // À adapter selon vos besoins
        return [
            'headers' => ['ID', 'Tâche', 'Activité', 'Assignée à', 'Date'],
            'rows' => [],
            'title' => 'Tâches - ' . $date,
            'entity' => 'tasks'
        ];
    }
    
    /**
     * Récupérer les données d'export pour les utilisateurs
     * @param string $date - Date de référence
     * @return array - Données formatées
     */
    private function getUsersExportData($date) {
        // Implémentation pour les utilisateurs
        return [
            'headers' => ['ID', 'Nom', 'Email', 'Initiales', 'Statut'],
            'rows' => [],
            'title' => 'Utilisateurs - ' . $date,
            'entity' => 'users'
        ];
    }
    
    /**
     * Organiser les données d'activités en structure hiérarchique
     * @param array $results - Résultats de la requête
     * @return array - Données organisées
     */
    private function organizeActivitiesData($results) {
        $activities = [];
        
        foreach ($results as $row) {
            $activityId = $row['activity_id'];
            
            // Initialiser l'activité si elle n'existe pas
            if (!isset($activities[$activityId])) {
                $activities[$activityId] = [
                    'id' => $activityId,
                    'name' => $row['activity_name'],
                    'icon' => $row['activity_icon'],
                    'description' => $row['activity_description'],
                    'type' => $row['activity_type_name'],
                    'type_description' => $row['activity_type_description'],
                    'responsible' => [],
                    'tasks' => []
                ];
            }
            
            // Ajouter responsable (éviter les doublons)
            if ($row['responsible_user_id'] && !$this->userInArray($activities[$activityId]['responsible'], $row['responsible_user_id'])) {
                $activities[$activityId]['responsible'][] = [
                    'id' => $row['responsible_user_id'],
                    'display_name' => $row['responsible_display_name'],
                    'initials' => $row['responsible_initials']
                ];
            }
            
            // Ajouter tâche si elle existe
            if ($row['task_id']) {
                $taskId = $row['task_id'];
                
                // Initialiser la tâche si elle n'existe pas
                if (!isset($activities[$activityId]['tasks'][$taskId])) {
                    $activities[$activityId]['tasks'][$taskId] = [
                        'id' => $taskId,
                        'name' => $row['task_name'],
                        'description' => $row['task_description'],
                        'assigned_to' => []
                    ];
                }
                
                // Ajouter personne assignée (éviter les doublons)
                if ($row['assigned_user_id'] && !$this->userInArray($activities[$activityId]['tasks'][$taskId]['assigned_to'], $row['assigned_user_id'])) {
                    $activities[$activityId]['tasks'][$taskId]['assigned_to'][] = [
                        'id' => $row['assigned_user_id'],
                        'display_name' => $row['assigned_display_name'],
                        'initials' => $row['assigned_initials']
                    ];
                }
            }
        }
        
        // Convertir les tâches en tableau indexé
        foreach ($activities as &$activity) {
            $activity['tasks'] = array_values($activity['tasks']);
        }
        
        return array_values($activities);
    }
    
    /**
     * Générer le HTML pour l'export
     * @param array $data - Données d'export
     * @return string - HTML généré
     */
    private function generateHTML($data) {
        $html = '<!DOCTYPE html>';
        $html .= '<html lang="fr">';
        $html .= '<head>';
        $html .= '<meta charset="UTF-8">';
        $html .= '<title>' . htmlspecialchars($data['title']) . '</title>';
        $html .= '<style>';
        $html .= 'body { font-family: Arial, sans-serif; margin: 20px; }';
        $html .= 'table { border-collapse: collapse; width: 100%; margin-top: 20px; }';
        $html .= 'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }';
        $html .= 'th { background-color: #f2f2f2; font-weight: bold; }';
        $html .= 'h1 { color: #333; }';
        $html .= '</style>';
        $html .= '</head>';
        $html .= '<body>';
        
        $html .= '<h1>' . htmlspecialchars($data['title']) . '</h1>';
        $html .= '<p>Export généré le ' . date('d/m/Y à H:i') . '</p>';
        
        if (!empty($data['rows'])) {
            $html .= '<table>';
            
            // En-têtes
            if (!empty($data['headers'])) {
                $html .= '<thead><tr>';
                foreach ($data['headers'] as $header) {
                    $html .= '<th>' . htmlspecialchars($header) . '</th>';
                }
                $html .= '</tr></thead>';
            }
            
            // Données
            $html .= '<tbody>';
            foreach ($data['rows'] as $row) {
                $html .= '<tr>';
                foreach ($row as $cell) {
                    $html .= '<td>' . htmlspecialchars($cell) . '</td>';
                }
                $html .= '</tr>';
            }
            $html .= '</tbody>';
            $html .= '</table>';
        } else {
            $html .= '<p>Aucune donnée à exporter.</p>';
        }
        
        $html .= '</body>';
        $html .= '</html>';
        
        return $html;
    }
    
    /**
     * Générer le Markdown pour l'export
     * @param array $data - Données d'export
     * @return string - Markdown généré
     */
    private function generateMarkdown($data) {
        $markdown = '# ' . $data['title'] . "\n\n";
        $markdown .= 'Export généré le ' . date('d/m/Y à H:i') . "\n\n";
        
        if (!empty($data['rows'])) {
            // En-têtes
            if (!empty($data['headers'])) {
                $markdown .= '| ' . implode(' | ', $data['headers']) . " |\n";
                $markdown .= '| ' . implode(' | ', array_fill(0, count($data['headers']), '---')) . " |\n";
            }
            
            // Données
            foreach ($data['rows'] as $row) {
                $markdown .= '| ' . implode(' | ', $row) . " |\n";
            }
        } else {
            $markdown .= 'Aucune donnée à exporter.';
        }
        
        return $markdown;
    }
    
    /**
     * Générer le nom de fichier pour l'export
     * @param string $extension - Extension du fichier
     * @return string - Nom de fichier
     */
    private function getFilename($extension) {
        $entity = $_GET['entity'] ?? 'export';
        $date = $_GET['date'] ?? date('Y-m-d');
        $type = $_GET['type'] ?? '';
        
        $filename = $entity . '_' . $date;
        if ($type) {
            $filename .= '_' . str_replace(' ', '_', $type);
        }
        $filename .= '.' . $extension;
        
        return $filename;
    }
    
    /**
     * Formater le nom d'affichage d'un type d'activité
     * @param string $rawType - Le nom du type tel qu'il est dans la base de données
     * @return string - Le nom formaté pour l'affichage
     */
    private function formatTypeName($rawType) {
        if (!$rawType) return 'Activité';
        return ucfirst($rawType);
    }
    
    /**
     * Vérifier si un utilisateur est déjà dans un tableau
     * @param array $array - Tableau d'utilisateurs
     * @param int $userId - ID de l'utilisateur
     * @return bool - True si l'utilisateur est présent
     */
    private function userInArray($array, $userId) {
        foreach ($array as $user) {
            if ($user['id'] == $userId) {
                return true;
            }
        }
        return false;
    }
}

// Instancier et exécuter l'API
try {
    new ExportAPI();
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?>
