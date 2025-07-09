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

// Vérifier la structure de la table responsible_for
echo "=== Structure de la table responsible_for ===\n";
$stmt = $pdo->prepare("DESCRIBE responsible_for");
$stmt->execute();
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($columns as $column) {
    echo sprintf("%-15s %-20s %-10s %-10s %-10s %-10s\n", 
        $column['Field'], 
        $column['Type'], 
        $column['Null'], 
        $column['Key'], 
        $column['Default'], 
        $column['Extra']
    );
}

echo "\n=== Contenu actuel de la table ===\n";
$stmt = $pdo->prepare("SELECT * FROM responsible_for LIMIT 5");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($rows)) {
    echo "Aucun enregistrement trouvé.\n";
} else {
    foreach ($rows as $row) {
        echo json_encode($row, JSON_PRETTY_PRINT) . "\n";
    }
}
?> 