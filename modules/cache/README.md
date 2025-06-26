# 🗂️ Cache Global

Ce module implémente la stratégie de cache définie dans `docs/cache-strategy.md`.

## Structure

```javascript
const globalCache = {
    api: {
        workers: {},      // Données des travailleurs par date
        activities: {},   // Données des activités individuelles
        global: {}        // Données de la vue globale
    },
    computed: {
        stats: {},        // Statistiques calculées
        filters: {}       // Filtres appliqués
    },
    ui: {
        preferences: {},  // Préférences utilisateur
        navigation: {}    // État de navigation
    }
}
```

## Utilisation

### Import du cache

```javascript
import { cache } from '../../../modules/cache/cache.js';
```

### Cache API

```javascript
// Travailleurs
cache.api.workers.set('2025-01-15', workersData);
const workers = cache.api.workers.get('2025-01-15');
const hasWorkers = cache.api.workers.has('2025-01-15');

// Activités individuelles
cache.api.activities.set('123-2025-01-15-responsibilities', activitiesData);
const activities = cache.api.activities.get('123-2025-01-15-responsibilities');

// Données globales
cache.api.global.set('2025-01-15', globalData);
const globalData = cache.api.global.get('2025-01-15');
```

### Cache UI

```javascript
// Préférences utilisateur
cache.ui.set('selected-worker', '123');
const selectedWorker = cache.ui.get('selected-worker');

// État de navigation
cache.ui.set('expanded-cards', ['card1', 'card2']);
const expandedCards = cache.ui.get('expanded-cards');
```

### Cache Computed

```javascript
// Statistiques
cache.computed.set('stats-2025', statsData);
const stats = cache.computed.get('stats-2025');

// Filtres
cache.computed.set('filtered-activities-2025-tech', filteredData);
const filtered = cache.computed.get('filtered-activities-2025-tech');
```

## Gestionnaire de cache avancé

Pour des utilisations plus avancées, vous pouvez utiliser le gestionnaire directement :

```javascript
import { cacheManager, onChange } from '../../../modules/cache/cache.js';

// Écouter les changements
onChange('api', 'workers', (newValue, key, namespace) => {
    console.log('Workers mis à jour:', newValue);
});

// Méthodes utilitaires
cacheManager.clear('api'); // Vider le cache API
cacheManager.clearAll();   // Vider tout le cache
```

## Migration depuis l'ancien système

### Avant (erreur)
```javascript
// ❌ individualDataCache n'est pas défini
if (individualDataCache[cacheKey]) {
    return individualDataCache[cacheKey];
}
```

### Après (correct)
```javascript
// ✅ Utilisation du cache global
if (cache.api.activities.has(cacheKey)) {
    return cache.api.activities.get(cacheKey);
}
```

## Avantages

1. **Centralisé** : Toutes les données en cache sont dans un seul endroit
2. **Namespaces** : Organisation claire par type de données
3. **Persistant** : Les données survivent au rechargement de page
4. **Réactif** : Possibilité d'écouter les changements
5. **Optimisé** : Évite les appels API redondants

## Intégration avec le Store

Le cache et le store travaillent ensemble selon la stratégie définie :

- **Store** : États réactifs qui déclenchent des actions
- **Cache** : Données persistantes et optimisations API
- **Synchronisation** : Automatique via les listeners du store 