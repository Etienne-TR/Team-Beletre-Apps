<?php
// Test simple de l'API responsible-for avec authentification
$url = 'http://localhost/api/controllers/responsibilities/responsible-for-controller.php?action=createEntry';

$data = [
    'created_by' => 1,
    'user' => 1,
    'activity' => 11,
    'start_date' => '2025-07-09',
    'end_date' => null
];

// Récupérer une session valide depuis la base de données
try {
$pdo = new PDO('mysql:host=localhost;dbname=team_apps', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->prepare("
        SELECT session_id 
        FROM user_sessions 
        WHERE expires_at > NOW() 
        LIMIT 1
    ");
    $stmt->execute();
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        echo "Aucune session valide trouvée dans la base de données\n";
        exit;
        }
        
    $sessionId = $session['session_id'];
    echo "Session trouvée: $sessionId\n";
    
} catch (Exception $e) {
    echo "Erreur base de données: " . $e->getMessage() . "\n";
    exit;
}

$options = [
    'http' => [
        'header' => "Content-type: application/json\r\nCookie: team_session=$sessionId\r\n",
        'method' => 'POST',
        'content' => json_encode($data)
    ]
];

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);

echo "URL: $url\n";
echo "Data: " . json_encode($data) . "\n";
echo "Response: $result\n";

if ($result === false) {
    echo "Erreur: Impossible de contacter l'API\n";
} else {
    $response = json_decode($result, true);
    if ($response) {
        echo "Response JSON: " . json_encode($response, JSON_PRETTY_PRINT) . "\n";
    } else {
        echo "Response non-JSON: $result\n";
    }
}
?> 