# Structure de l'API PHP ractorisée

## Arborescence

```
/api
├── /controllers
│   └── /responsibilities
│       ├── activity-controller.php   # CRUD activités + tâches
│       ├── worker-controller.php     # Vue des travailleurs
│       └── global-controller.php     # Vue synthèse + export
│
├── /services
│   └── /responsibilities
│       ├── activity-service.php      # Logique activités/tâches
│       ├── worker-service.php        # Logique travailleurs
│       └── export-service.php        # Logique export CSV
│
├── /repositories
│   ├── /common                       # ⭐ REPOSITORIES partagés
│   │   ├── base-repository.php       # CRUD + versioning réutilisable
│   │   └── audit-repository.php      # Logs d'audit réutilisables
│   └── /responsibilities
│       ├── activity-repository.php   # Requêtes activités
│       ├── user-repository.php       # Requêtes utilisateurs
│       └── task-repository.php       # Requêtes tâches
│
├── /utils
│   └── /responsibilities
│       ├── helpers.php               # Fonctions utilitaires existantes
│       └── validator.php             # Validation simple
│
├── /common                           # ⭐ INFRASTRUCTURE générale
│   ├── base-api.php                  # Classe de base API existante
│   └── auth.php                      # ⭐ Auth transversale + Connexion PDO ?
│
└── .env                              # Configuration
```

## Migration en 2 étapes CORRIGÉE

### **ÉTAPE 1 : Renommage pour éviter les conflits**
```
responsibilities/
├── editor/
│   ├── activities.php → activities-crud.php     # CRUD complet
│   └── editor.php → editor.php                  # (garde le nom)
├── common/
│   ├── activities.php → activity-types.php      # Types seulement
│   └── helpers.php → helpers.php                # (garde le nom)
├── worker-view/
│   └── worker-view.php → worker-view.php        # (garde le nom)
└── global-view/
    └── global-view.php → global-view.php        # (garde le nom)
```

### **ÉTAPE 2 : Structure refactorisée (hiérarchie inversée)**  
```
/api/
├── /controllers
│   └── /responsibilities
│       ├── activity-controller.php   # Fusion activities-crud.php + editor.php
│       ├── worker-controller.php     # Migration worker-view.php
│       └── global-controller.php     # Migration global-view.php + activity-types.php
├── /services
│   └── /responsibilities
│       ├── activity-service.php           
│       ├── worker-service.php             
│       └── export-service.php             
├── /repositories
│   ├── /common
│   │   ├── base-repository.php       # ⭐ Migration EntityManager.php
│   │   └── audit-repository.php      # ⭐ Logs d'audit séparés
│   └── /responsibilities
│       ├── activity-repository.php   # Requêtes spécialisées activités
│       ├── user-repository.php       # Requêtes spécialisées utilisateurs
│       └── task-repository.php       # Requêtes spécialisées tâches
├── /utils
│   └── /responsibilities
│       ├── helpers.php               # Migration depuis common/helpers.php
│       └── validator.php                 
└── /common                           # ⭐ INFRASTRUCTURE générale
    ├── base-api.php                  # Existant
    └── auth.php                      # ⭐ Migration auth.php actuel
```

## Correspondance avec vos fichiers actuels CORRIGÉE

## Correspondance avec vos fichiers actuels CORRIGÉE

### **Mapping exact de vos 6 fichiers vers 3 contrôleurs**

#### **📁 Fichier d'authentification à migrer :**
- `auth.php` → **common/auth.php**
  - *Contient : Authentification transversale (login/logout/session) pour toutes les applications*

#### **📁 Fichiers à fusionner dans activity-controller.php :**
- `editor/activities.php` → `activities-crud.php` → **activity-controller.php**
  - *Contient : CRUD activités complet (create, update, delete, get, history)*
- `editor/editor.php` → `editor.php` → **activity-controller.php**  
  - *Contient : Liste activités + filtres (getActivities, getResponsibleFor, etc.)*

#### **📁 Fichiers à fusionner dans global-controller.php :**
- `global-view/global-view.php` → `global-view.php` → **global-controller.php**
  - *Contient : Vue synthèse + export CSV (getActivities, exportCSV)*
- `common/activities.php` → `activity-types.php` → **global-controller.php**
  - *Contient : Types d'activités seulement (getActivityTypes)*

#### **📁 Fichier à migrer dans worker-controller.php :**
- `worker-view/worker-view.php` → `worker-view.php` → **worker-controller.php**
  - *Contient : Vue des travailleurs (getWorkers, getWorkerActivities, getWorkerTasks)*

#### **📁 Utilitaires à déplacer :**
- `common/helpers.php` → `helpers.php` → **utils/helpers.php**
  - *Contient : Fonctions utilitaires communes*

#### **📁 Logique de données à refactoriser :**
- `EntityManager.php` → **repositories/common/base-repository.php** + **repositories/common/audit-repository.php**
  - *Contient : CRUD + versioning réutilisable entre applications + audit séparé*

### **🔍 Détail des fusions**

**common/auth.php** va contenir :
- Votre fichier auth.php actuel (déplacé tel quel)
- Endpoints d'authentification (POST login, GET session, DELETE logout)
- Logique Nextcloud et gestion des sessions
- Infrastructure d'authentification pour toutes les applications

**controllers/responsibilities/activity-controller.php** va contenir :
- Toutes les méthodes CRUD de `activities-crud.php` (create, update, delete, get, history)
- Les méthodes de listing de `editor.php` (getActivities, getResponsibleFor, etc.)

**controllers/responsibilities/global-controller.php** va contenir :
- Les méthodes de synthèse de `global-view.php` (getActivities, exportCSV) 
- La méthode utilitaire de `activity-types.php` (getActivityTypes)

**controllers/responsibilities/worker-controller.php** va contenir :
- Toutes les méthodes de `worker-view.php` (getWorkers, getWorkerActivities, getWorkerTasks)

**repositories/common/base-repository.php** va contenir :
- Toute la logique de `EntityManager.php` (getCurrentVersion, deprecateOldVersions, createNewVersion)
- CRUD générique réutilisable par toutes les applications
- Logique de versioning commune

## Vue globale avec un shéma

┌─────────────────┐                                     
│   CONTROLLERS   │  ◄─── HTTP Request                  
│ • Reçoit HTTP   │                                     
│ • Valide params │                     
│ • Retourne JSON │                                     
└─────────┬───────┘                                     
          │                                             
          ▼                                             
┌─────────────────┐       ┌─────────────────┐          
│    SERVICES     │  ◄────│     UTILS       │          
│ • Logique       │       │ • Validation    │          
│   métier        │       │ • Formatage     │          
│ • Orchestration │       │ • Helpers       │          
│ • Transactions  │       │ • Constantes    │          
│ • Transforme    │       │ • Calculs       │          
└─────────┬───────┘       └─────────────────┘          
          │                                             
          ▼                                             
┌─────────────────┐       ┌─────────────────┐          
│  REPOSITORIES   │  ◄────│ COMMON REPOS    │          
│ • Requêtes SQL  │       │ • BaseRepo(CRUD)│          
│   spécialisées  │       │ • AuditRepo     │          
│ • Hérit BaseRepo│       │ • Versioning    │            
│ • Accès données │       │ • Infrastructure│
└─────────┬───────┘       └─────────────────┘          
          │                                             
          ▼                                             
┌─────────────────┐                                     
│    DATABASE     │                                     
│ • MySQL         │                                     
│ • Tables        │                                     
│ • Versioning    │                                     
│ • Audit         │                                     
└─────────────────┘