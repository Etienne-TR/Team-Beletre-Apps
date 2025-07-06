// modules/cache/example-usage.js
// Exemples d'utilisation du cache global

import { cache, cacheManager, onChange } from '/modules/cache/cache.js';

// ===== EXEMPLE 1 : Cache API =====

// Stocker des données de travailleurs
const workersData = [
    { id: 1, display_name: 'Joëlle Martin', initials: 'JM' },
    { id: 2, display_name: 'Pierre Dubois', initials: 'PD' }
];

cache.api.workers.set('2025-01-15', workersData);

// Récupérer les données
const workers = cache.api.workers.get('2025-01-15');
console.log('Travailleurs récupérés:', workers);

// Vérifier si les données existent
if (cache.api.workers.has('2025-01-15')) {
    console.log('Données en cache pour 2025-01-15');
}

// ===== EXEMPLE 2 : Cache UI =====

// Sauvegarder les préférences utilisateur
cache.ui.set('selected-worker', '123');
cache.ui.set('expanded-cards', ['card1', 'card2', 'card3']);

// Récupérer les préférences
const selectedWorker = cache.ui.get('selected-worker');
const expandedCards = cache.ui.get('expanded-cards');

console.log('Worker sélectionné:', selectedWorker);
console.log('Cartes dépliées:', expandedCards);

// ===== EXEMPLE 3 : Cache Computed =====

// Stocker des statistiques calculées
const statsData = {
    totalActivities: 25,
    activeWorkers: 8,
    completionRate: 0.85
};

cache.computed.set('stats-2025', statsData);

// Récupérer les statistiques
const stats = cache.computed.get('stats-2025');
console.log('Statistiques 2025:', stats);

// ===== EXEMPLE 4 : Listeners =====

// Écouter les changements dans le cache API
onChange('api', 'workers', (newValue, key, namespace) => {
    console.log(`Workers mis à jour pour ${key}:`, newValue);
    // Mettre à jour l'interface utilisateur
    updateWorkersUI(newValue);
});

// Écouter les changements dans le cache UI
onChange('ui', 'selected-worker', (newValue, key, namespace) => {
    console.log('Worker sélectionné changé:', newValue);
    // Déclencher le rechargement des données
    loadWorkerData(newValue);
});

// ===== EXEMPLE 5 : Gestion avancée =====

// Vider un namespace spécifique
cacheManager.clear('api');

// Vider tout le cache
// cacheManager.clearAll();

// Récupérer tout le contenu d'un namespace
const allWorkers = cacheManager.getNamespace('api');
console.log('Tout le cache API:', allWorkers);

// ===== EXEMPLE 6 : Intégration avec le Store =====

// Synchronisation automatique entre store et cache
function syncStoreWithCache(store) {
    // Écouter les changements du store
    store.subscribe('responsibilities.individual', (state) => {
        // Sauvegarder automatiquement dans le cache UI
        if (state.selectedWorker) {
            cache.ui.set('selected-worker', state.selectedWorker);
        }
        if (state.selectedYear) {
            cache.ui.set('selected-year', state.selectedYear);
        }
    });
}

// Restauration depuis le cache au démarrage
function initializeFromCache(store) {
    const savedWorker = cache.ui.get('selected-worker');
    const savedYear = cache.ui.get('selected-year');
    
    if (savedWorker) {
        store.state.responsibilities.individual.selectedWorker = savedWorker;
    }
    if (savedYear) {
        store.state.responsibilities.individual.selectedYear = savedYear;
    }
}

// ===== EXEMPLE 7 : Gestion d'erreurs =====

// Vérifier l'existence avant utilisation
function safeGetFromCache(namespace, key, defaultValue = null) {
    if (cache[namespace] && cache[namespace].has(key)) {
        return cache[namespace].get(key);
    }
    return defaultValue;
}

// Utilisation sécurisée
const workerData = safeGetFromCache('api', 'workers-2025-01-15', []);
console.log('Données sécurisées:', workerData);

// ===== EXEMPLE 8 : Cache avec expiration =====

// Implémentation simple d'un cache avec expiration
function setWithExpiration(namespace, key, value, expirationMinutes = 30) {
    const expirationTime = Date.now() + (expirationMinutes * 60 * 1000);
    const dataWithExpiration = {
        value: value,
        expiresAt: expirationTime
    };
    
    cache[namespace].set(key, dataWithExpiration);
}

function getWithExpiration(namespace, key) {
    const data = cache[namespace].get(key);
    
    if (!data) return null;
    
    if (Date.now() > data.expiresAt) {
        // Données expirées, les supprimer
        cache[namespace].delete(key);
        return null;
    }
    
    return data.value;
}

// Utilisation du cache avec expiration
setWithExpiration('api', 'workers-2025-01-15', workersData, 60); // Expire dans 1 heure
const freshWorkers = getWithExpiration('api', 'workers-2025-01-15'); 