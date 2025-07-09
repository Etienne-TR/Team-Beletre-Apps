<?php
/**
 * Debug du processus de création d'un responsable
 */

// Configuration locale pour le test
$dbHost = 'localhost'; // Essayer localhost
$dbName = 'team-apps';
$dbUser = 'root'; // Essayer root
$dbPass = ''; // Pas de mot de passe

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Connexion à la base de données réussie\n\n";
} catch (PDOException $e) {
    echo "❌ Erreur de connexion à la base de données: " . $e->getMessage() . "\n";
    exit(1);
}

echo "=== DEBUG CRÉATION RESPONSABLE ===\n\n";

// 1. Vérifier la structure de la table responsible_for
echo "1. Structure de la table responsible_for:\n";
try {
    $stmt = $pdo->query("DESCRIBE responsible_for");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $column) {
        echo "  - {$column['Field']}: {$column['Type']} " . 
             ($column['Null'] === 'NO' ? 'NOT NULL' : 'NULL') . 
             ($column['Key'] ? " ({$column['Key']})" : "") . "\n";
    }
} catch (Exception $e) {
    echo "  ❌ Erreur: " . $e->getMessage() . "\n";
}
echo "\n";

// 2. Vérifier le contenu actuel de la table
echo "2. Contenu actuel de la table responsible_for:\n";
try {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM responsible_for");
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "  - Nombre d'enregistrements: {$count['count']}\n";
    
    if ($count['count'] > 0) {
        $stmt = $pdo->query("SELECT * FROM responsible_for ORDER BY version DESC LIMIT 3");
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($records as $record) {
            echo "  - Version {$record['version']}: entry={$record['entry']}, user={$record['user']}, activity={$record['activity']}, status={$record['status']}\n";
        }
    }
} catch (Exception $e) {
    echo "  ❌ Erreur: " . $e->getMessage() . "\n";
}
echo "\n";

// 3. Vérifier les données de test
echo "3. Vérification des données de test:\n";
$testData = [
    'created_by' => 1,
    'user' => 2,
    'activity' => 1,
    'start_date' => '2024-01-15',
    'end_date' => '2024-12-31'
];

// Vérifier que l'utilisateur existe
try {
    $stmt = $pdo->prepare("SELECT id, display_name FROM users WHERE id = ?");
    $stmt->execute([$testData['user']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        echo "  ✅ Utilisateur {$testData['user']}: {$user['display_name']}\n";
    } else {
        echo "  ❌ Utilisateur {$testData['user']} non trouvé\n";
    }
} catch (Exception $e) {
    echo "  ❌ Erreur vérification utilisateur: " . $e->getMessage() . "\n";
}

// Vérifier que l'activité existe
try {
    $stmt = $pdo->prepare("SELECT entry, name FROM activities WHERE entry = ? AND status = 'current'");
    $stmt->execute([$testData['activity']]);
    $activity = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($activity) {
        echo "  ✅ Activité {$testData['activity']}: {$activity['name']}\n";
    } else {
        echo "  ❌ Activité {$testData['activity']} non trouvée\n";
    }
} catch (Exception $e) {
    echo "  ❌ Erreur vérification activité: " . $e->getMessage() . "\n";
}
echo "\n";

// 4. Test de création manuelle
echo "4. Test de création manuelle:\n";
try {
    $pdo->beginTransaction();
    
    // Étape 1: Créer l'entrée de base (comme createEntry)
    $createdAt = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("INSERT INTO responsible_for (created_at, created_by, status) VALUES (?, ?, 'current')");
    $stmt->execute([$createdAt, $testData['created_by']]);
    
    $version = $pdo->lastInsertId();
    echo "  ✅ Étape 1: Entrée créée avec version = {$version}\n";
    
    // Étape 2: Mettre à jour avec les données spécifiques (comme updateVersion)
    $stmt = $pdo->prepare("UPDATE responsible_for SET user = ?, activity = ?, start_date = ?, end_date = ? WHERE version = ?");
    $stmt->execute([
        $testData['user'],
        $testData['activity'],
        $testData['start_date'],
        $testData['end_date'],
        $version
    ]);
    
    echo "  ✅ Étape 2: Données spécifiques mises à jour\n";
    
    // Étape 3: Mettre à jour entry = version
    $stmt = $pdo->prepare("UPDATE responsible_for SET entry = ? WHERE version = ?");
    $stmt->execute([$version, $version]);
    
    echo "  ✅ Étape 3: Entry mis à jour\n";
    
    $pdo->commit();
    echo "  ✅ Transaction validée\n";
    
    // Vérifier le résultat
    $stmt = $pdo->prepare("SELECT * FROM responsible_for WHERE version = ?");
    $stmt->execute([$version]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        echo "  ✅ Enregistrement créé avec succès:\n";
        echo "     - Version: {$result['version']}\n";
        echo "     - Entry: {$result['entry']}\n";
        echo "     - User: {$result['user']}\n";
        echo "     - Activity: {$result['activity']}\n";
        echo "     - Start date: {$result['start_date']}\n";
        echo "     - Status: {$result['status']}\n";
    } else {
        echo "  ❌ Enregistrement non trouvé après création\n";
    }
    
} catch (Exception $e) {
    $pdo->rollback();
    echo "  ❌ Erreur lors de la création: " . $e->getMessage() . "\n";
}
echo "\n";

// 5. Vérifier le contenu final
echo "5. Contenu final de la table responsible_for:\n";
try {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM responsible_for");
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "  - Nombre d'enregistrements: {$count['count']}\n";
    
    $stmt = $pdo->query("SELECT * FROM responsible_for ORDER BY version DESC LIMIT 3");
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($records as $record) {
        echo "  - Version {$record['version']}: entry={$record['entry']}, user={$record['user']}, activity={$record['activity']}, status={$record['status']}\n";
    }
} catch (Exception $e) {
    echo "  ❌ Erreur: " . $e->getMessage() . "\n";
}

echo "\n=== FIN DU DEBUG ===\n";
?> 