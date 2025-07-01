<?php
/**
 * Utilitaires communs pour les APIs de responsabilités
 * 
 * Fonctions partagées entre les différents modules
 */

/**
 * Vérifier si un utilisateur est déjà dans un tableau
 */
function userInArray($array, $userId) {
    foreach ($array as $user) {
        if ($user['id'] == $userId) {
            return true;
        }
    }
    return false;
}

/**
 * Formate le nom d'affichage d'un type d'activité
 */
function formatTypeName($rawType) {
    if (!$rawType) return 'Activité';
    return ucfirst($rawType);
}

/**
 * Valider le format de date (YYYY-MM-DD)
 */
function validateDateFormat($date) {
    return preg_match('/^\d{4}-\d{2}-\d{2}$/', $date);
}

/**
 * Organiser les données d'activités en structure hiérarchique
 */
function organizeActivityData($results) {
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
        if ($row['responsible_user_id'] && !userInArray($activities[$activityId]['responsible'], $row['responsible_user_id'])) {
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
            if ($row['assigned_user_id'] && !userInArray($activities[$activityId]['tasks'][$taskId]['assigned_to'], $row['assigned_user_id'])) {
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
?> 