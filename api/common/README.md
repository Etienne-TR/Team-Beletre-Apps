# 📁 Dossier `/api/common/`

## 📊 Rôle et objectif

Le dossier `api/common/` contient les **classes communes** utilisées par toutes les APIs de l'application. Ces classes fournissent des fonctionnalités génériques réutilisables pour éviter la duplication de code.

## 🔄 Refactorisation récente

**Problème résolu :** La duplication de code entre `BaseAPI` et `EntityManager` a été éliminée.

**Solution :** `BaseAPI` fournit l'authentification et les réponses JSON, `EntityManager` contient toutes les méthodes utilitaires.

### Avant (duplication)
```php
// BaseAPI avait ses propres méthodes
class BaseAPI {
    protected function validateInput($data, $rules) { /* ... */ }
    protected function logAudit($table, $recordId, $action, $oldData, $newData) { /* ... */ }
    protected function getCurrentVersion($table, $entry) { /* ... */ }
    // etc.
}

// EntityManager avait les mêmes méthodes
class EntityManager {
    protected function validateInput($data, $rules) { /* ... */ }
    protected function logAudit($table, $recordId, $action, $oldData, $newData) { /* ... */ }
    protected function getCurrentVersion($table, $entry) { /* ... */ }
    // etc.
}
```

### Après (séparation claire)
```php
// BaseAPI : authentification et réponses JSON uniquement
class BaseAPI {
    protected $entityManager;
    
    // Seulement les méthodes essentielles
    protected function sendSuccess($data, $message) { /* ... */ }
    protected function sendError($message, $code) { /* ... */ }
    protected function getJsonInput() { /* ... */ }
    protected function requireMethod($method) { /* ... */ }
}

// EntityManager : toutes les méthodes utilitaires
class EntityManager {
    public function validateInput($data, $rules) { /* ... */ }
    public function logAudit($table, $recordId, $action, $oldData, $newData) { /* ... */ }
    public function getCurrentVersion($table, $entry) { /* ... */ }
    public function create($table, $data, $rules) { /* ... */ }
    // etc.
}
```

## 📋 Classes disponibles

### `base_api.php`
**Classe de base pour toutes les APIs**

Fournit l'authentification, la gestion des réponses JSON et l'accès à EntityManager.

#### Fonctionnalités principales
- **Authentification** : Vérification des sessions utilisateur
- **Gestion des réponses** : `sendSuccess()`, `sendError()`
- **Utilitaires HTTP** : `getJsonInput()`, `requireMethod()`
- **Accès à EntityManager** : `$this->entityManager` disponible dans toutes les APIs

#### Utilisation
```php
class MyAPI extends BaseAPI {
    protected function handleRequest() {
        // Utiliser EntityManager directement
        $errors = $this->entityManager->validateInput($data, $rules);
        $cleanData = $this->entityManager->sanitize($dirtyData);
        
        // Utiliser les méthodes de BaseAPI
        $this->sendSuccess($result);
    }
}
```

### `entity-manager.php`
**Gestionnaire d'entités générique avec versioning**

Classe utilitaire pour gérer les opérations CRUD communes avec support du versioning temporel et de l'audit trail.

#### Utilisation
```php
class ActivitiesAPI extends BaseAPI {
    private function createActivity() {
        $this->requireMethod('POST');
        
        $data = $this->getJsonInput();
        $rules = [
            'name' => ['required' => true, 'max_length' => 200],
            'type' => ['required' => true, 'max_length' => 50],
            'description' => ['max_length' => 1000]
        ];
        
        try {
            // Utiliser EntityManager directement
            $result = $this->entityManager->create('activities', $data, $rules);
            $this->sendSuccess($result['data'], $result['message']);
        } catch (Exception $e) {
            $this->sendError($e->getMessage());
        }
    }
    
    private function updateActivity($entry) {
        $data = $this->getJsonInput();
        $rules = ['name' => ['required' => true]];
        
        // Validation via EntityManager
        $errors = $this->entityManager->validateInput($data, $rules);
        if (!empty($errors)) {
            $this->sendError('Données invalides', 400, $errors);
        }
        
        // Mise à jour via EntityManager
        $result = $this->entityManager->update('activities', $entry, $data, $rules);
        $this->sendSuccess($result);
    }
}
```

#### Méthodes principales
- `create($table, $data, $rules, $options)` : Créer une nouvelle entité
- `update($table, $entry, $data, $rules, $options)` : Mettre à jour une entité
- `delete($table, $entry)` : Supprimer une entité
- `getCurrent($table, $entry)` : Récupérer la version actuelle
- `getHistory($table, $entry)` : Récupérer l'historique des versions
- `userInArray($array, $userId)` : Vérifier si un utilisateur est dans un tableau

#### Méthodes utilitaires (publiques)
- `validateInput($data, $rules)` : Validation des données
- `logAudit($table, $recordId, $action, $oldData, $newData)` : Log d'audit
- `getCurrentVersion($table, $entry)` : Récupérer la version actuelle
- `deprecateOldVersion($table, $entry)` : Marquer comme deprecated
- `sanitize($string)` : Nettoyer une chaîne

### `export-api.php`
**API d'export générique pour CSV, Excel, HTML et Markdown**

API spécialisée pour l'export de données dans différents formats.

#### Utilisation
```php
// Export CSV des activités
/api/common/export-api.php?action=export_csv&entity=activities&date=2024-06-01&type=pôle

// Export HTML
/api/common/export-api.php?action=export_html&entity=activities&date=2024-06-01

// Export Markdown
/api/common/export-api.php?action=export_markdown&entity=activities&date=2024-06-01

// Export Excel
/api/common/export-api.php?action=export_excel&entity=activities&date=2024-06-01
```

#### Formats supportés
- **CSV** : Format standard avec séparateur point-virgule
- **HTML** : Tableau HTML avec styles CSS
- **Markdown** : Format Markdown pour documentation
- **Excel** : Format CSV avec extension .xls pour compatibilité

#### Entités supportées
- `activities` : Export des activités et responsabilités
- `tasks` : Export des tâches (à implémenter)
- `users` : Export des utilisateurs (à implémenter)

## 🔗 Intégration avec les APIs existantes

### Refactoring d'une API existante

**Avant (avec duplication de code) :**
```php
// Dans activities.php
private function createActivity() {
    // Logique de validation dupliquée
    // Logique de création dupliquée
    // Logique d'audit dupliquée
}
```

**Après (avec EntityManager direct) :**
```php
// Dans activities.php
private function createActivity() {
    $this->requireMethod('POST');
    $data = $this->getJsonInput();
    $rules = [
        'name' => ['required' => true, 'max_length' => 200],
        'type' => ['required' => true, 'max_length' => 50]
    ];
    
    try {
        // Utiliser EntityManager directement
        $result = $this->entityManager->create('activities', $data, $rules);
        $this->sendSuccess($result['data'], $result['message']);
    } catch (Exception $e) {
        $this->sendError($e->getMessage());
    }
}
```

## 🎨 Conventions

- **Nommage** : kebab-case pour les fichiers (`entity-manager.php`)
- **Classes** : PascalCase pour les noms de classes (`EntityManager`)
- **Méthodes** : camelCase pour les méthodes (`createActivity`)
- **Documentation** : PHPDoc complet avec types et descriptions
- **Utilisation** : Toujours utiliser `$this->entityManager->` pour les méthodes utilitaires

## 🔄 Migration progressive

### Étape 1 : Utiliser EntityManager directement
1. Remplacer `$this->validateInput()` par `$this->entityManager->validateInput()`
2. Remplacer `$this->sanitize()` par `$this->entityManager->sanitize()`
3. Remplacer `$this->logAudit()` par `$this->entityManager->logAudit()`
4. Remplacer `$this->getCurrentVersion()` par `$this->entityManager->getCurrentVersion()`

### Étape 2 : Utiliser ExportAPI
1. Remplacer les exports existants par les appels à ExportAPI
2. Standardiser les formats d'export
3. Ajouter de nouveaux formats si nécessaire

### Étape 3 : Créer de nouvelles classes communes
1. Identifier les patterns communs
2. Créer de nouvelles classes utilitaires
3. Documenter et tester

## 📱 Avantages

### ✅ **Séparation claire des responsabilités**
- BaseAPI : authentification et réponses JSON uniquement
- EntityManager : toutes les opérations sur les entités
- **Code plus lisible et maintenable**

### ✅ **Réduction de la duplication**
- Code CRUD centralisé
- Validation standardisée
- Audit trail uniforme
- **Élimination complète de la duplication**

### ✅ **Maintenabilité**
- Modifications centralisées
- Tests simplifiés
- Documentation unifiée
- **Une seule source de vérité pour les méthodes communes**

### ✅ **Cohérence**
- Même logique partout
- Mêmes formats d'export
- Même gestion d'erreurs
- **API unifiée pour toutes les opérations communes**

### ✅ **Évolutivité**
- Ajout facile de nouvelles fonctionnalités
- Support de nouveaux formats d'export
- Extension simple des validations
- **Architecture modulaire et extensible** 