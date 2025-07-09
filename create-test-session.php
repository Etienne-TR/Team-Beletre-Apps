<?php
/**
 * Script pour créer une session de test
 */

// Configuration de base de données (utiliser la même que config.php)
$dbHost = 'mysql-db'; // Nom du conteneur MySQL dans le réseau Docker
$dbName = 'team-apps';
$dbUser = 'etienne';
$dbPass = '123456';

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Connexion à la base de données réussie\n";
} catch (PDOException $e) {
    echo "❌ Erreur de connexion à la base de données: " . $e->getMessage() . "\n";
    exit(1);
}

// Vérifier si l'utilisateur 1 existe
$stmt = $pdo->prepare("SELECT id, display_name, email FROM users WHERE id = 1");
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo "❌ Utilisateur avec ID 1 non trouvé\n";
    exit(1);
}

echo "✅ Utilisateur trouvé: " . $user['display_name'] . " (" . $user['email'] . ")\n";

// Créer une session de test
$sessionId = 'test_session_' . time();
$expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

$stmt = $pdo->prepare("
    INSERT INTO user_sessions (session_id, user_id, nextcloud_username, nextcloud_data, created_at, expires_at) 
    VALUES (?, ?, ?, ?, NOW(), ?)
    ON DUPLICATE KEY UPDATE expires_at = ?
");

$nextcloudData = json_encode([
    'id' => 'test_user',
    'email' => $user['email'],
    'displayname' => $user['display_name']
]);

$stmt->execute([$sessionId, $user['id'], 'test_user', $nextcloudData, $expiresAt, $expiresAt]);

echo "✅ Session de test créée:\n";
echo "   Session ID: $sessionId\n";
echo "   User ID: " . $user['id'] . "\n";
echo "   Expires: $expiresAt\n\n";

echo "Pour tester l'API, utilisez cette commande:\n";
echo "curl -X POST \"http://localhost/api/controllers/responsibilities/responsible-for-controller.php?action=createEntry\" \\\n";
echo "  -H \"Content-Type: application/json\" \\\n";
echo "  -H \"Cookie: team_session=$sessionId\" \\\n";
echo "  -d '{\"activity\": 11, \"created_by\": 1, \"end_date\": null, \"start_date\": \"2025-07-09\", \"user\": 1}'\n";
?> 