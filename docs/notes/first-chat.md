# Team Apps - Architecture & Spécifications Techniques

## 📊 Objectif du Projet

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