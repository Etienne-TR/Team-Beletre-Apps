<?php
// Test simple de l'API updateVersion
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Configuration de base de données locale pour le test
try {
    $pdo = new PDO("mysql:host=localhost;dbname=team-apps;charset=utf8mb4", "etienne", "123456");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $GLOBALS['pdo'] = $pdo;
    
    echo "Connexion à la base de données réussie\n";
    
    // Simuler une session pour le test
    $_COOKIE['team_session'] = 'test_session';
    
    // Créer une session de test dans la base de données
    $stmt = $pdo->prepare("
        INSERT INTO user_sessions (session_id, user_id, expires_at) 
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))
        ON DUPLICATE KEY UPDATE expires_at = DATE_ADD(NOW(), INTERVAL 1 HOUR)
    ");
    $stmt->execute(['test_session', 1]);
    
    echo "Session de test créée\n";
    
    // Tester l'API
    $_GET['action'] = 'updateVersion';
    $_GET['version'] = '1';
    $_SERVER['REQUEST_METHOD'] = 'POST';
    
    // Simuler les données JSON
    $testData = [
        'activity' => 1,
        'user_id' => 1,
        'start_date' => '2024-01-01',
        'end_date' => '2024-12-31'
    ];
    
    // Simuler le contenu JSON
    file_put_contents('php://temp', json_encode($testData));
    
    echo "Test de l'API updateVersion...\n";
    
    // Inclure le contrôleur
    require_once __DIR__ . '/api/controllers/responsibilities/responsible-for-controller.php';
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
?> 