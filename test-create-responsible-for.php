<?php
/**
 * Test de l'API de création de responsable
 */

// Configuration de base
$baseUrl = 'http://localhost'; // Ajuster selon votre configuration
$apiUrl = $baseUrl . '/api/controllers/responsibilities/responsible-for-controller.php?action=createEntry';

// Données de test
$testData = [
    'created_by' => 1,
    'user' => 2, // ID de l'utilisateur responsable
    'activity' => 1, // ID de l'activité
    'start_date' => '2024-01-15',
    'end_date' => '2024-12-31'
];

echo "=== Test de création de responsable ===\n";
echo "URL: $apiUrl\n";
echo "Données: " . json_encode($testData, JSON_PRETTY_PRINT) . "\n\n";

// Configuration de la requête cURL
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $apiUrl,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($testData),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: application/json'
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 30
]);

// Exécuter la requête
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$headers = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

// Vérifier les erreurs cURL
if (curl_errno($ch)) {
    echo "Erreur cURL: " . curl_error($ch) . "\n";
    exit(1);
}

curl_close($ch);

// Afficher les résultats
echo "Code HTTP: $httpCode\n";
echo "Headers:\n$headers\n";
echo "Body:\n$body\n";

// Essayer de parser le JSON
if ($body) {
    $jsonData = json_decode($body, true);
    if ($jsonData) {
        echo "\nDonnées JSON parsées:\n";
        echo json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    } else {
        echo "\nErreur de parsing JSON\n";
    }
}

echo "\n=== Fin du test ===\n";
?> 