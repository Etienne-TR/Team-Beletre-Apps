<?php
/**
 * Générateur automatique de triggers pour la propagation des timestamps
 * Usage: php generate_triggers.php
 */

// Inclusion de la configuration existante
require_once '../../../../api/common/config.php';

class TriggerGenerator {
    private $pdo;
    private $triggers = [];
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    /**
     * Analyse le schéma de la base et génère les triggers
     */
    public function generateTriggers() {
        $relations = $this->analyzeForeignKeys();
        $this->generateTriggerSQL($relations);
        $this->outputTriggers();
    }
    
    /**
     * Analyse les clés étrangères pour détecter les relations
     */
    private function analyzeForeignKeys() {
        $sql = "
            SELECT 
                TABLE_NAME as source_table,
                COLUMN_NAME as source_field,
                REFERENCED_TABLE_NAME as target_table,
                REFERENCED_COLUMN_NAME as target_field
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE REFERENCED_TABLE_NAME IS NOT NULL
            AND TABLE_SCHEMA = DATABASE()
            ORDER BY TABLE_NAME, COLUMN_NAME
        ";
        
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Génère le SQL des triggers
     */
    private function generateTriggerSQL($relations) {
        foreach ($relations as $relation) {
            $this->generateTriggerForRelation($relation);
        }
    }
    
    /**
     * Génère un trigger pour une relation spécifique
     */
    private function generateTriggerForRelation($relation) {
        $sourceTable = $relation['source_table'];
        $targetTable = $relation['target_table'];
        $sourceField = $relation['source_field'];
        $targetField = $relation['target_field'];
        
        $triggerName = "update_{$targetTable}_timestamp_from_{$sourceTable}";
        
        $sql = "
-- Trigger pour propager les changements de {$sourceTable} vers {$targetTable}
DROP TRIGGER IF EXISTS `{$triggerName}`;

DELIMITER $$

CREATE TRIGGER `{$triggerName}` 
AFTER INSERT OR UPDATE OR DELETE ON `{$sourceTable}`
FOR EACH ROW
BEGIN
    -- Met à jour le timestamp de la table cible
    UPDATE `{$targetTable}` 
    SET `last_modified` = NOW() 
    WHERE `{$targetField}` = COALESCE(NEW.{$sourceField}, OLD.{$sourceField});
END$$

DELIMITER ;
";
        
        $this->triggers[] = [
            'name' => $triggerName,
            'sql' => $sql,
            'relation' => $relation
        ];
    }
    
    /**
     * Affiche tous les triggers générés
     */
    private function outputTriggers() {
        echo "-- ========================================\n";
        echo "-- Triggers générés automatiquement\n";
        echo "-- Date: " . date('Y-m-d H:i:s') . "\n";
        echo "-- ========================================\n\n";
        
        foreach ($this->triggers as $trigger) {
            echo "-- Relation: {$trigger['relation']['source_table']}.{$trigger['relation']['source_field']} -> {$trigger['relation']['target_table']}.{$trigger['relation']['target_field']}\n";
            echo $trigger['sql'] . "\n";
        }
        
        echo "-- ========================================\n";
        echo "-- Total: " . count($this->triggers) . " triggers générés\n";
        echo "-- ========================================\n";
    }
}

// Utilisation de la configuration existante
// $pdo est déjà créé dans config.php
try {
    $generator = new TriggerGenerator($pdo);
    $generator->generateTriggers();
    
} catch (PDOException $e) {
    echo "Erreur de connexion: " . $e->getMessage() . "\n";
    exit(1);
}
?> 