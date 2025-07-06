<?php
// test-activity-types-web.php
// Teste les méthodes getActivityTypes du repository et du service côté web

ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: text/html; charset=utf-8');

echo "<h2>Test direct des méthodes getActivityTypes</h2>";

try {
    echo "<b>1. Inclusion config.php...</b><br>";
    require_once __DIR__ . '/api/common/config.php';
    echo "✓ config.php inclus<br>";

    echo "<b>2. Inclusion base-repository.php...</b><br>";
    require_once __DIR__ . '/api/repositories/common/base-repository.php';
    echo "✓ base-repository.php inclus<br>";

    echo "<b>3. Inclusion activity-repository.php...</b><br>";
    require_once __DIR__ . '/api/repositories/responsibilities/activity-repository.php';
    echo "✓ activity-repository.php inclus<br>";

    echo "<b>4. Inclusion helpers.php...</b><br>";
    require_once __DIR__ . '/api/utils/common/helpers.php';
    echo "✓ helpers.php inclus<br>";

    echo "<b>5. Inclusion activity-service.php...</b><br>";
    require_once __DIR__ . '/api/services/responsibilities/activity-service.php';
    echo "✓ activity-service.php inclus<br>";

    // Créer un utilisateur de test (doit exister dans la base)
    $testUser = [
        'id' => 1,
        'display_name' => 'Test User',
        'email' => 'test@example.com',
        'initials' => 'TU'
    ];

    echo "<b>6. Instanciation ActivityRepository...</b><br>";
    $repository = new ActivityRepository($GLOBALS['pdo'], $testUser);
    echo "✓ ActivityRepository instancié<br>";

    echo "<b>7. Appel direct à getActivityTypes() du repository...</b><br>";
    $typesRepo = $repository->getActivityTypes();
    echo "<pre>Résultat repository : ".htmlspecialchars(json_encode($typesRepo, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))."</pre>";

    echo "<b>8. Instanciation ActivityService...</b><br>";
    $service = new ActivityService($GLOBALS['pdo'], $testUser);
    echo "✓ ActivityService instancié<br>";

    echo "<b>9. Appel à getActivityTypes() du service...</b><br>";
    $typesService = $service->getActivityTypes();
    echo "<pre>Résultat service : ".htmlspecialchars(json_encode($typesService, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))."</pre>";

    echo "<b>Test terminé.</b>";

} catch (Throwable $e) {
    echo "<b>Erreur :</b> ".$e->getMessage()."<br>";
    echo "<b>Fichier :</b> ".$e->getFile()."<br>";
    echo "<b>Ligne :</b> ".$e->getLine()."<br>";
    echo "<pre>".$e->getTraceAsString()."</pre>";
} 