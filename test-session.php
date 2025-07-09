<?php
/**
 * Test des sessions utilisateur
 */

// Configuration locale pour le test
$dbHost = 'localhost';
$dbName = 'team-apps';
$dbUser = 'etienne';
$dbPass = '123456';

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo "Erreur de connexion à la base de données: " . $e->getMessage() . "\n";
    exit(1);
}

echo "=== Test des sessions utilisateur ===\n\n";

// Vérifier les sessions actives
$stmt = $pdo->prepare("
    SELECT 
        s.session_id,
        s.user_id,
        s.nextcloud_username,
        s.created_at,
        s.expires_at,
        u.display_name,
        u.email
    FROM user_sessions s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.expires_at > NOW()
    ORDER BY s.created_at DESC
    LIMIT 5
");

$stmt->execute();
$sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Sessions actives trouvées: " . count($sessions) . "\n\n";

if (count($sessions) > 0) {
    echo "Première session valide:\n";
    $firstSession = $sessions[0];
    echo "Session ID: " . $firstSession['session_id'] . "\n";
    echo "User ID: " . $firstSession['user_id'] . "\n";
    echo "Display Name: " . $firstSession['display_name'] . "\n";
    echo "Email: " . $firstSession['email'] . "\n";
    echo "Expires: " . $firstSession['expires_at'] . "\n\n";
    
    // Tester l'authentification avec cette session
    echo "=== Test d'authentification avec cette session ===\n";
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => 'http://localhost/api/common/auth.php',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_COOKIE => 'team_session=' . $firstSession['session_id'],
        CURLOPT_TIMEOUT => 10
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers = substr($response, 0, $headerSize);
    $body = substr($response, $headerSize);
    
    curl_close($ch);
    
    echo "Code HTTP: $httpCode\n";
    echo "Réponse: $body\n\n";
    
    $jsonData = json_decode($body, true);
    if ($jsonData && $jsonData['success']) {
        echo "✅ Authentification réussie avec l'utilisateur: " . $jsonData['user']['displayname'] . "\n";
        
        // Maintenant tester la création de responsable avec cette session
        echo "\n=== Test de création de responsable avec authentification ===\n";
        
        $testData = [
            'created_by' => $jsonData['user']['id'],
            'user' => 2, // ID de l'utilisateur responsable
            'activity' => 1, // ID de l'activité
            'start_date' => '2024-01-15',
            'end_date' => '2024-12-31'
        ];
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => 'http://localhost/api/controllers/responsibilities/responsible-for-controller.php?action=createEntry',
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($testData),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json'
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER => true,
            CURLOPT_COOKIE => 'team_session=' . $firstSession['session_id'],
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $headers = substr($response, 0, $headerSize);
        $body = substr($response, $headerSize);
        
        curl_close($ch);
        
        echo "Code HTTP: $httpCode\n";
        echo "Réponse: $body\n\n";
        
        $jsonData = json_decode($body, true);
        if ($jsonData) {
            echo "Données JSON parsées:\n";
            echo json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
        }
        
    } else {
        echo "❌ Échec de l'authentification\n";
    }
    
} else {
    echo "Aucune session active trouvée.\n";
    echo "Il faut d'abord se connecter via l'interface web.\n";
}

echo "\n=== Fin du test ===\n";
?> 