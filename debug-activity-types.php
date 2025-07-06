<?php
/**
 * Script de debug pour getActivityTypes
 */

// Activer l'affichage des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Simuler une session valide
$_COOKIE['team_session'] = 'test-session-123';

// Simuler les paramètres de requête
$_GET['action'] = 'get_activity_types';

echo "=== Début du debug ===\n";

try {
    echo "1. Test de la connexion à la base de données...\n";
    
    // Inclure config.php directement
    require_once __DIR__ . '/api/common/config.php';
    echo "✓ Connexion à la base de données établie\n";
    
    echo "2. Test de la requête getActivityTypes...\n";
    
    // Test direct de la requête SQL
    $stmt = $GLOBALS['pdo']->prepare("
        SELECT entry, name, description 
        FROM activity_types 
        WHERE status = 'current'
        ORDER BY name
    ");
    $stmt->execute();
    $types = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "✓ Requête SQL réussie, " . count($types) . " types trouvés\n";
    
    echo "3. Test de l'inclusion des fichiers...\n";
    
    // Inclure les fichiers nécessaires
    require_once __DIR__ . '/api/repositories/common/base-repository.php';
    echo "✓ base-repository.php inclus\n";
    
    require_once __DIR__ . '/api/repositories/responsibilities/activity-repository.php';
    echo "✓ activity-repository.php inclus\n";
    
    require_once __DIR__ . '/api/utils/common/helpers.php';
    echo "✓ helpers.php inclus\n";
    
    require_once __DIR__ . '/api/services/responsibilities/activity-service.php';
    echo "✓ activity-service.php inclus\n";
    
    echo "4. Test de l'instanciation des classes...\n";
    
    // Créer un utilisateur de test
    $testUser = [
        'id' => 1,
        'display_name' => 'Test User',
        'email' => 'test@example.com',
        'initials' => 'TU'
    ];
    
    // Instancier ActivityRepository
    $repository = new ActivityRepository($GLOBALS['pdo'], $testUser);
    echo "✓ ActivityRepository instancié\n";
    
    // Instancier ActivityService
    $service = new ActivityService($GLOBALS['pdo'], $testUser);
    echo "✓ ActivityService instancié\n";
    
    echo "5. Test de la méthode getActivityTypes...\n";
    
    // Appeler la méthode
    $result = $service->getActivityTypes();
    echo "✓ getActivityTypes() réussie\n";
    echo "Résultat: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";
    
} catch (Exception $e) {
    echo "✗ ERREUR: " . $e->getMessage() . "\n";
    echo "Fichier: " . $e->getFile() . "\n";
    echo "Ligne: " . $e->getLine() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
} catch (Error $e) {
    echo "✗ ERREUR FATALE: " . $e->getMessage() . "\n";
    echo "Fichier: " . $e->getFile() . "\n";
    echo "Ligne: " . $e->getLine() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}

echo "=== Fin du debug ===\n";
?> 