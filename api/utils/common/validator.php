<?php
/**
 * Utilitaire de validation commun
 * 
 * Fournit des fonctions de validation réutilisables
 * pour tous les services de l'API
 */

class Validator {
    
    /**
     * Validation des données d'entrée
     * @param array $data - Données à valider
     * @param array $rules - Règles de validation
     * @return array - Erreurs de validation
     */
    public static function validateInput($data, $rules) {
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
                    case 'boolean':
                        if (!is_bool($value) && !in_array($value, ['true', 'false', '1', '0', ''], true)) {
                            $errors[$field] = "Le champ {$field} doit être un booléen";
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
            
            // Longueur min
            if (!empty($value) && isset($rule['min_length'])) {
                if (strlen($value) < $rule['min_length']) {
                    $errors[$field] = "Le champ {$field} doit contenir au moins {$rule['min_length']} caractères";
                }
            }
            
            // Regex pattern
            if (!empty($value) && isset($rule['pattern'])) {
                if (!preg_match($rule['pattern'], $value)) {
                    $errors[$field] = "Le champ {$field} ne respecte pas le format attendu";
                }
            }
        }
        
        return $errors;
    }
    
    /**
     * Valider un format de date
     * @param string $date - Date à valider
     * @param string $format - Format attendu (par défaut Y-m-d)
     * @return bool - True si valide
     */
    public static function isValidDate($date, $format = 'Y-m-d') {
        $d = DateTime::createFromFormat($format, $date);
        return $d && $d->format($format) === $date;
    }
    
    /**
     * Valider un format de période (YYYY-MM)
     * @param string $period - Période à valider
     * @return bool - True si valide
     */
    public static function isValidPeriod($period) {
        return preg_match('/^\d{4}-\d{2}$/', $period);
    }
    
    /**
     * Valider un ID numérique
     * @param mixed $id - ID à valider
     * @return bool - True si valide
     */
    public static function isValidId($id) {
        return is_numeric($id) && $id > 0;
    }
} 