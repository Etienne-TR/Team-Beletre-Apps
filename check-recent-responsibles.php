<?php
// Configuration de base de données
$dbHost = 'mysql-db';
$dbName = 'team-apps';
$dbUser = 'etienne';
$dbPass = '123456';

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Connexion à la base de données réussie\n\n";
} catch (PDOException $e) {
    echo "❌ Erreur de connexion à la base de données: " . $e->getMessage() . "\n";
    exit(1);
}

// Vérifier les entrées récentes de responsible_for
echo "=== Entrées récentes de responsible_for ===\n";
$stmt = $pdo->prepare("
    SELECT * FROM responsible_for 
    ORDER BY created_at DESC 
    LIMIT 10
");

$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($rows)) {
    echo "Aucune entrée trouvée.\n";
} else {
    foreach ($rows as $row) {
        echo json_encode($row, JSON_PRETTY_PRINT) . "\n";
    }
}

// Vérifier le fuseau horaire du serveur MySQL
echo "\n=== Fuseau horaire MySQL ===\n";
$stmt = $pdo->prepare("SELECT @@global.time_zone, @@session.time_zone, NOW() as current_time_mysql");
$stmt->execute();
$timezone = $stmt->fetch(PDO::FETCH_ASSOC);
echo json_encode($timezone, JSON_PRETTY_PRINT) . "\n";

// Vérifier le fuseau horaire PHP
echo "\n=== Fuseau horaire PHP ===\n";
echo "date_default_timezone_get(): " . date_default_timezone_get() . "\n";
echo "date('Y-m-d H:i:s'): " . date('Y-m-d H:i:s') . "\n";
echo "gmdate('Y-m-d H:i:s'): " . gmdate('Y-m-d H:i:s') . "\n";
?> 