# Corrections du nommage `start_date` dans l'API ResponsibleFor

## Problème identifié

Il y avait une incohérence dans le nommage du champ `start_date` entre les différentes couches de l'API :

- **Repository** : Utilisait `$data['date']` mais la requête SQL référençait `start_date`
- **Service** : Validait `date` mais utilisait `start_date` dans la validation métier
- **Frontend** : Envoyait `date` au lieu de `start_date`

## Corrections apportées

### 1. Repository (`api/repositories/responsibilities/responsible-for-repository.php`)

**Avant :**
```php
return $this->executeQuery($stmt, [
    $data['activity'],
    $data['user_id'],
    $data['date'],           // ❌ Incohérent
    $data['end_date'] ?? null,
    $userId,
    $version
]);
```

**Après :**
```php
return $this->executeQuery($stmt, [
    $data['activity'],
    $data['user_id'],
    $data['start_date'],     // ✅ Cohérent
    $data['end_date'] ?? null,
    $userId,
    $version
]);
```

### 2. Service (`api/services/responsibilities/responsible-for-service.php`)

**Avant :**
```php
$rules = [
    'activity' => ['required' => true, 'type' => 'integer'],
    'user_id' => ['required' => true, 'type' => 'integer'],
    'date' => ['required' => true, 'type' => 'date'],        // ❌ Incohérent
    'end_date' => ['type' => 'date', 'nullable' => true]
];

// Validation métier
$this->validateResponsibleForData([
    'user' => $data['user_id'],
    'activity' => $data['activity'],
    'start_date' => $data['date'],                           // ❌ Incohérent
    'end_date' => $data['end_date'] ?? null
]);
```

**Après :**
```php
$rules = [
    'activity' => ['required' => true, 'type' => 'integer'],
    'user_id' => ['required' => true, 'type' => 'integer'],
    'start_date' => ['required' => true, 'type' => 'date'],  // ✅ Cohérent
    'end_date' => ['type' => 'date', 'nullable' => true]
];

// Validation métier
$this->validateResponsibleForData([
    'user' => $data['user_id'],
    'activity' => $data['activity'],
    'start_date' => $data['start_date'],                     // ✅ Cohérent
    'end_date' => $data['end_date'] ?? null
]);
```

### 3. Frontend (`apps/responsibilities/js/views/editor/revise-responsible-for.js`)

**Avant :**
```javascript
const apiData = {
    activity: assignment.activity,
    user_id: assignment.responsible_user_id,
    date: formData.start_date,        // ❌ Incohérent
    end_date: formData.end_date || null
};
```

**Après :**
```javascript
const apiData = {
    activity: assignment.activity,
    user_id: assignment.responsible_user_id,
    start_date: formData.start_date,  // ✅ Cohérent
    end_date: formData.end_date || null
};
```

## Résultat

Maintenant, le nommage est cohérent dans toute l'API :

1. **Base de données** : `start_date` (inchangé)
2. **Repository** : `$data['start_date']` ✅
3. **Service** : `$data['start_date']` ✅
4. **Controller** : Pas de changement nécessaire ✅
5. **Frontend** : `start_date` ✅

## Test de validation

Un script de test `test-responsible-for-api.php` a été créé pour vérifier que toutes les corrections fonctionnent correctement.

## Impact

- ✅ Cohérence du nommage dans toute l'API
- ✅ Élimination des bugs potentiels liés aux incohérences de nommage
- ✅ Code plus maintenable et lisible
- ✅ Validation correcte des données 