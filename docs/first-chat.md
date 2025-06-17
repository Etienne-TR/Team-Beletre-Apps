# Team Apps - Architecture & Spécifications Techniques

## 🎯 Objectif du Projet

Application web de gestion organisationnelle avec deux modules principaux :
- **Responsibilities** : Gestion des rôles, tâches et responsabilités
- **Decisions** : Gestion des décisions (à venir)

## 🏗️ Architecture Technique

### Stack Technologique
- **Frontend** : HTML/CSS/JavaScript (vanilla)
- **Backend** : PHP + MySQL
- **Authentification** : Nextcloud (App Password + vérification utilisateurs autorisés)
- **Hébergement** : Ouvaton.coop

### Structure des Fichiers
```
team-apps/
├── index.html                    # Dashboard principal
├── shared/
│   ├── style.css                 # CSS commun
│   └── common.js                 # JS commun
├── api/
│   ├── auth.php                  # Authentification
│   ├── config.php                # Configuration DB + Nextcloud
│   └── responsibilities/         # Endpoints CRRU
│       ├── activities.php
│       ├── responsible_for.php
│       ├── tasks.php
│       └── assigned_to.php
├── responsibilities/
│   ├── index.html                # Interface module
│   ├── style.css
│   └── script.js
└── decisions/
    ├── index.html
    ├── style.css
    └── script.js
```

## 🔐 Sécurité & Authentification

### Processus d'Authentification
1. **Nextcloud** : Validation App Password via API OCS
2. **Table Users** : Vérification email autorisé dans `users`
3. **Session** : Stockage en base MySQL avec cookies sécurisés

### Tables de Sécurité
```sql
-- Table des utilisateurs autorisés
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    initials VARCHAR(50) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active'
);

-- Table des sessions
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) UNIQUE,
    user_id INT NOT NULL,
    nextcloud_username VARCHAR(100),
    nextcloud_data JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

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
```

## 🔧 État Actuel du Projet

### ✅ Fonctionnel
- Authentification Nextcloud complète
- Dashboard avec informations utilisateur
- Structure base de données sécurisée
- Protection fichiers (htaccess)
- Gestion sessions en base

### 🚧 À Développer
- Tables métier (activities, tasks, roles...)
- API CRRU pour le module responsibilities
- Interface de gestion CRUD
- Module decisions
- Système d'audit automatique

## 🎨 Choix UX/UI
- Interface web responsive
- Pas de framework JS (vanilla JavaScript)
- Focus sur simplicité et performance
- Authentification transparente (si déjà connecté Nextcloud)

## 📝 Fonctionnalités Module Responsibilities

### Entités Prévues
- **Activities** : Pôles, ateliers, mandats, projets
- **Tasks** : Tâches assignées par activité
- **Assignments** : Affectations (qui fait quoi)
- **Roles** : Rôles organisationnels

### Fonctionnalités Interface
- Liste/grille des éléments avec filtres
- Formulaires création/modification
- Recherche avancée
- Historique par élément (versioning)
- Time-travel : voir organisation à une date passée
- Exports et rapports
- Audit trail automatique avec attribution

## 🗄️ Configuration Base de Données
- **Hébergeur** : MySQL distant (2,10€/an)
- **Sessions** : Stockage en base (pas fichiers serveur)
- **Index** : Sur clés étrangères et colonnes de recherche fréquente
- **Encoding** : UTF-8 partout
- **Foreign Keys** : Avec CASCADE pour intégrité référentielle

## 📋 Prochaines Étapes
1. Définir structure tables métier
2. Créer API CRRU pour responsibilities
3. Développer interface de gestion
4. Implémenter système d'audit
5. Tests et optimisations
6. Module decisions

---
**Version** : Authentification fonctionnelle - Prêt pour développement modules métier 🚀