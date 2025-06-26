# 🗂️ Stratégie de Cache

🎯 Règle simple
Une seule source de vérité
Chaque donnée dans un seul endroit
Pas de duplication entre store et cache
Choix basé sur l'usage : réactif vs persistant
Question à se poser :
> "Cette donnée doit-elle survivre au rechargement de page ?"
Oui → Cache UI
Non → Store (si elle déclenche des actions)

## Cache global avec namespaces

```js
const globalCache = {
    api: {
        workers: {},      // workersData
        activities: {},   // individualDataCache
        global: {}        // dataCache
    },
    computed: {
        stats: {},
        filters: {}
    },
    ui: {
        preferences: {},
        navigation: {}
    }
}
```

## 🤔 SelectedWorker : Réactif vs Persistant

### **Problème identifié**
```javascript
// Store - Réactif mais perdu au rechargement
store.state.responsibilities.individual.selectedWorker = 'Joëlle';
// → Déclenche rechargement API ✅
// → Perdu au rechargement de page ❌

// Cache UI - Persistant mais pas réactif
cache.ui["selected-worker"] = 'Joëlle';
// → Survit au rechargement ✅
// → Ne déclenche pas de rechargement ❌
```

## 🎯 Solutions possibles

### **Solution 1 : Store + Cache UI (duplication intelligente)**
```javascript
// Store - Pour la réactivité
store.state.responsibilities.individual.selectedWorker = 'Joëlle';

// Cache UI - Pour la persistance
cache.ui["selected-worker"] = 'Joëlle';

// Synchronisation au chargement
function initializeFromCache() {
    const savedWorker = cache.ui["selected-worker"];
    if (savedWorker) {
        store.state.responsibilities.individual.selectedWorker = savedWorker;
        // Déclenche automatiquement le rechargement
    }
}

// Synchronisation à la sauvegarde
function saveToCache(workerId) {
    cache.ui["selected-worker"] = workerId;
}
```

### **Solution 2 : Cache UI uniquement avec réactivité**
```javascript
// Cache UI - Persistant + réactif
cache.ui["selected-worker"] = 'Joëlle';

// Système de listeners pour la réactivité
cacheManager.onChange('ui', 'selected-worker', (newWorker) => {
    // Déclenche le rechargement API
    loadPersonData(newWorker, currentDate);
});
```

### **Solution 3 : Store avec persistance automatique**
```javascript
// Store - Réactif + persistance automatique
store.state.responsibilities.individual.selectedWorker = 'Joëlle';

// Middleware de persistance
store.subscribe('responsibilities.individual', (state) => {
    if (state.selectedWorker) {
        cache.ui["selected-worker"] = state.selectedWorker;
    }
});

// Restauration au chargement
function initializeStore() {
    const savedWorker = cache.ui["selected-worker"];
    if (savedWorker) {
        store.state.responsibilities.individual.selectedWorker = savedWorker;
    }
}
```

## 🏗️ Recommandation : Solution 3

### **Store avec persistance automatique**
```javascript
// Store - Source de vérité réactive
store.state.responsibilities.individual = {
    selectedWorker: 'Joëlle',    // ✅ Réactif + persistant
    selectedYear: '2025',        // ✅ Réactif + persistant
    loading: false               // ✅ Réactif seulement
};

// Cache UI - Sauvegarde automatique
cache.ui = {
    "selected-worker": 'Joëlle',     // ✅ Sauvegarde automatique
    "selected-year": '2025',         // ✅ Sauvegarde automatique
    "expanded-cards": {...},         // ✅ État de travail
    "user-preferences": {...}        // ✅ Préférences
};
```

### **Implémentation**
```javascript
class AppStore {
    constructor() {
        this.state = { /* ... */ };
        this.listeners = new Map();
        this.setupPersistence();
    }
    
    setupPersistence() {
        // Sauvegarder automatiquement certains états
        this.subscribe('responsibilities.individual', (state) => {
            if (state.selectedWorker) {
                cache.ui["selected-worker"] = state.selectedWorker;
            }
            if (state.selectedYear) {
                cache.ui["selected-year"] = state.selectedYear;
            }
        });
    }
    
    initializeFromCache() {
        // Restaurer les états sauvegardés
        const savedWorker = cache.ui["selected-worker"];
        const savedYear = cache.ui["selected-year"];
        
        if (savedWorker) {
            this.state.responsibilities.individual.selectedWorker = savedWorker;
        }
        if (savedYear) {
            this.state.responsibilities.individual.selectedYear = savedYear;
        }
    }
}
```

## 🎯 Règle mise à jour

### **Store = États réactifs (avec persistance optionnelle)**
```javascript
// États qui déclenchent des actions
store.state.responsibilities.individual = {
    selectedWorker: 'Joëlle',    // ✅ Réactif + persistant
    selectedYear: '2025',        // ✅ Réactif + persistant
    loading: false               // ✅ Réactif seulement
};
```

### **Cache UI = États persistants uniquement**
```javascript
// États qui n'ont pas besoin d'être réactifs
cache.ui = {
    "expanded-cards": {...},     // ✅ Persistant seulement
    "user-preferences": {...},   // ✅ Persistant seulement
    "navigation-state": {...}    // ✅ Persistant seulement
};
```

## Conclusion

**SelectedWorker peut être à la fois réactif ET persistant !**

- **Store** : Pour la réactivité
- **Cache UI** : Pour la persistance (sauvegarde automatique)
- **Synchronisation** : Automatique via le store

Cette approche vous donne le meilleur des deux mondes ! 🎉

