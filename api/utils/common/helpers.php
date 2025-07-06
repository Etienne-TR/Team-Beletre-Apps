<?php
/**
 * Utilitaires communs
 * 
 * Fournit des fonctions d'aide réutilisables
 * pour tous les services de l'API
 */

class Helpers {
    
    /**
     * Nettoyer une chaîne de caractères
     * @param string $string - Chaîne à nettoyer
     * @return string - Chaîne nettoyée
     */
    public static function sanitize($string) {
        if (is_string($string)) {
            return htmlspecialchars(trim($string), ENT_QUOTES, 'UTF-8');
        }
        return $string;
    }
    
    /**
     * Vérifier si un utilisateur est déjà dans un tableau
     * @param array $array - Tableau d'utilisateurs
     * @param int $userId - ID de l'utilisateur
     * @return bool - True si l'utilisateur est présent
     */
    public static function userInArray($array, $userId) {
        foreach ($array as $user) {
            if ($user['id'] == $userId) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Formater un nom de type pour l'affichage
     * @param string $typeName - Nom du type
     * @return string - Nom formaté
     */
    public static function formatTypeName($typeName) {
        if (empty($typeName)) {
            return 'Non défini';
        }
        
        // Première lettre en majuscule
        return ucfirst(strtolower($typeName));
    }
    
    /**
     * Générer un nom de fichier sécurisé
     * @param string $baseName - Nom de base
     * @param string $extension - Extension du fichier
     * @return string - Nom de fichier sécurisé
     */
    public static function generateSafeFilename($baseName, $extension = '') {
        // Remplacer les caractères spéciaux par des underscores
        $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $baseName);
        
        // Supprimer les underscores multiples
        $safeName = preg_replace('/_+/', '_', $safeName);
        
        // Supprimer les underscores en début et fin
        $safeName = trim($safeName, '_');
        
        if (!empty($extension)) {
            $safeName .= '.' . $extension;
        }
        
        return $safeName;
    }
    
    /**
     * Convertir un tableau en ligne CSV
     * @param array $array - Tableau à convertir
     * @param string $delimiter - Délimiteur (par défaut ';')
     * @return string - Ligne CSV
     */
    public static function arrayToCSV($array, $delimiter = ';') {
        $csv = '';
        foreach ($array as $value) {
            // Échapper les guillemets et entourer de guillemets si nécessaire
            $value = str_replace('"', '""', $value);
            if (strpos($value, $delimiter) !== false || strpos($value, '"') !== false || strpos($value, "\n") !== false) {
                $value = '"' . $value . '"';
            }
            $csv .= $value . $delimiter;
        }
        return rtrim($csv, $delimiter) . "\n";
    }
    
    /**
     * Obtenir la date actuelle au format Y-m-d
     * @return string - Date actuelle
     */
    public static function getCurrentDate() {
        return date('Y-m-d');
    }
    
    /**
     * Obtenir la période actuelle au format Y-m
     * @return string - Période actuelle
     */
    public static function getCurrentPeriod() {
        return date('Y-m');
    }
    
    /**
     * Vérifier si une date est dans le passé
     * @param string $date - Date à vérifier (format Y-m-d)
     * @return bool - True si dans le passé
     */
    public static function isDateInPast($date) {
        return strtotime($date) < strtotime(self::getCurrentDate());
    }
    
    /**
     * Vérifier si une date est dans le futur
     * @param string $date - Date à vérifier (format Y-m-d)
     * @return bool - True si dans le futur
     */
    public static function isDateInFuture($date) {
        return strtotime($date) > strtotime(self::getCurrentDate());
    }
} 