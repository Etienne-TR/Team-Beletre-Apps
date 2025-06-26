<?php
/**
 * Ajoute les colonnes last_modified à toutes les tables
 * Usage: php add_timestamp_columns.php
 */

// Inclusion de la configuration existante
require_once '../../../../api/config.php';

class TimestampColumnAdder {
    private $pdo;
    private $tables = [];
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    /**
     * Ajoute les colonnes timestamp à toutes les tables
     */
    public function addTimestampColumns() {
        $tables = $this->getAllTables();
        $this->generateAlterSQL($tables);
        $this->outputAlterStatements();
    }
    
    /**
     * Récupère toutes les tables de la base
     */
    private function getAllTables() {
        $sql = "
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        ";
        
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
    
    /**
     * Génère les instructions ALTER TABLE
     */
    private function generateAlterSQL($tables) {
        foreach ($tables as $table) {
            $this->generateAlterForTable($table);
        }
    }
    
    /**
     * Génère ALTER TABLE pour une table spécifique
     */
    private function generateAlterForTable($table) {
        // Vérifie si la colonne existe déjà
        $sql = "
            SELECT COUNT(*) as exists_count
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = '{$table}'
            AND COLUMN_NAME = 'last_modified'
        ";
        
        $stmt = $this->pdo->query($sql);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['exists_count'] == 0) {
            $alterSQL = "
-- Ajout de la colonne last_modified à la table {$table}
ALTER TABLE `{$table}` 
ADD COLUMN `last_modified` TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
ON UPDATE CURRENT_TIMESTAMP 
COMMENT 'Timestamp de dernière modification pour synchronisation';
";
        } else {
            $alterSQL = "
-- La colonne last_modified existe déjà dans la table {$table}
-- ALTER TABLE `{$table}` ADD COLUMN `last_modified` TIMESTAMP... (IGNORÉ)
";
        }
        
        $this->tables[] = [
            'name' => $table,
            'sql' => $alterSQL,
            'exists' => $result['exists_count'] > 0
        ];
    }
    
    /**
     * Affiche tous les triggers générés
     */
    private function outputAlterStatements() {
        echo "-- ========================================\n";
        echo "-- Ajout des colonnes last_modified\n";
        echo "-- Date: " . date('Y-m-d H:i:s') . "\n";
        echo "-- ========================================\n\n";
        
        $added = 0;
        $skipped = 0;
        
        foreach ($this->tables as $table) {
            echo $table['sql'] . "\n";
            
            if ($table['exists']) {
                $skipped++;
            } else {
                $added++;
            }
        }
        
        echo "-- ========================================\n";
        echo "-- Résumé:\n";
        echo "-- - Colonnes ajoutées: {$added}\n";
        echo "-- - Colonnes existantes (ignorées): {$skipped}\n";
        echo "-- - Total tables traitées: " . count($this->tables) . "\n";
        echo "-- ========================================\n";
    }
}

// Utilisation de la configuration existante
// $pdo est déjà créé dans config.php
try {
    $adder = new TimestampColumnAdder($pdo);
    $adder->addTimestampColumns();
    
} catch (PDOException $e) {
    echo "Erreur de connexion: " . $e->getMessage() . "\n";
    exit(1);
}
?> 