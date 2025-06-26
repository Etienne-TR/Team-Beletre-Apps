## 📊 Gestion des Données avec Versioning Temporel

### Principe CRRU (pas CRUD)
- **C**reate : Créer nouvelles entrées
- **R**ead Current : Lire l'état actuel
- **R**ead Past : Time-travel (machine à remonter le temps)
- **U**pdate : Nouvelle version (ancienne → deprecated)

**Pas de Delete physique** : marquage `status = 'deleted'`

### Structure Type pour Tables Métier
```sql
CREATE TABLE example_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    original_id INT NOT NULL,                    -- ID logique stable
    title VARCHAR(200),
    description TEXT,
    status ENUM('current', 'deprecated', 'deleted') DEFAULT 'current',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),                     -- Qui a créé cet enregistrement
    edited_by VARCHAR(100),                      -- Qui a modifié cet enregistrement
    version INT DEFAULT 1,
    INDEX(original_id, created_at),
    INDEX(status)
);
```

### Logique des Status
- **`current`** : Version active actuellement
- **`deprecated`** : Ancienne version (modification)
- **`deleted`** : Élément supprimé (pas de version current)

### Suivi des Révisions
- **`created_by`** : Utilisateur qui a créé l'enregistrement initial
- **`edited_by`** : Utilisateur qui a effectué la dernière modification
- **`created_at`** : Horodatage de création de cette version
- **`version`** : Numéro de version incrémental

### Requêtes Time Travel

#### État Current (rapide)
```sql
SELECT * FROM example_table WHERE status = 'current';
```

#### État à une Date Passée (Wayback Machine)
```sql
-- Méthode optimisée pour time travel
SELECT * FROM (
    SELECT *, 
           ROW_NUMBER() OVER (
               PARTITION BY original_id 
               ORDER BY created_at DESC
           ) as rn
    FROM example_table 
    WHERE created_at <= '2025-01-15 23:59:59'
    AND status != 'deleted'
) ranked 
WHERE rn = 1;
```

#### Historique d'un Élément Spécifique
```sql
SELECT * FROM example_table 
WHERE original_id = 1 
ORDER BY created_at DESC;
```

#### Éléments Supprimés (pas de version current)
```sql
SELECT DISTINCT original_id FROM example_table t1
WHERE NOT EXISTS (
    SELECT 1 FROM example_table t2 
    WHERE t2.original_id = t1.original_id 
    AND t2.status = 'current'
);
```

#### Audit Trail - Qui a modifié quoi
```sql
-- Voir toutes les modifications d'un utilisateur
SELECT original_id, title, status, created_at, edited_by, version
FROM example_table 
WHERE edited_by = 'EF'
ORDER BY created_at DESC;

-- Voir l'historique complet avec auteurs
SELECT original_id, title, status, created_at, 
       created_by, edited_by, version
FROM example_table 
WHERE original_id = 1
ORDER BY version DESC;