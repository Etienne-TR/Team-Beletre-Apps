// modules/cache/cache.js
// Cache global avec namespaces selon la stratégie définie

/**
 * Cache global avec namespaces
 * Structure selon cache-strategy.md
 */
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
};

/**
 * Gestionnaire de cache avec méthodes utilitaires
 */
class CacheManager {
    constructor() {
        this.cache = globalCache;
        this.listeners = new Map();
    }

    /**
     * Récupère une valeur du cache
     * @param {string} namespace - Le namespace (api, computed, ui)
     * @param {string} key - La clé
     * @returns {*} La valeur en cache ou undefined
     */
    get(namespace, key) {
        if (!this.cache[namespace]) {
            console.warn(`Namespace '${namespace}' n'existe pas dans le cache`);
            return undefined;
        }
        return this.cache[namespace][key];
    }

    /**
     * Définit une valeur dans le cache
     * @param {string} namespace - Le namespace
     * @param {string} key - La clé
     * @param {*} value - La valeur à stocker
     */
    set(namespace, key, value) {
        if (!this.cache[namespace]) {
            console.warn(`Namespace '${namespace}' n'existe pas dans le cache`);
            return;
        }
        this.cache[namespace][key] = value;
        
        // Déclencher les listeners si ils existent
        this.triggerListeners(namespace, key, value);
    }

    /**
     * Vérifie si une clé existe dans le cache
     * @param {string} namespace - Le namespace
     * @param {string} key - La clé
     * @returns {boolean} True si la clé existe
     */
    has(namespace, key) {
        return this.cache[namespace] && this.cache[namespace].hasOwnProperty(key);
    }

    /**
     * Supprime une clé du cache
     * @param {string} namespace - Le namespace
     * @param {string} key - La clé
     */
    delete(namespace, key) {
        if (this.cache[namespace]) {
            delete this.cache[namespace][key];
        }
    }

    /**
     * Vide un namespace entier
     * @param {string} namespace - Le namespace à vider
     */
    clear(namespace) {
        if (this.cache[namespace]) {
            this.cache[namespace] = {};
        }
    }

    /**
     * Vide tout le cache
     */
    clearAll() {
        Object.keys(this.cache).forEach(namespace => {
            this.cache[namespace] = {};
        });
    }

    /**
     * Ajoute un listener pour les changements
     * @param {string} namespace - Le namespace à surveiller
     * @param {string} key - La clé à surveiller (optionnel)
     * @param {Function} callback - La fonction à appeler
     */
    onChange(namespace, key, callback) {
        const listenerKey = key ? `${namespace}.${key}` : namespace;
        if (!this.listeners.has(listenerKey)) {
            this.listeners.set(listenerKey, []);
        }
        this.listeners.get(listenerKey).push(callback);
    }

    /**
     * Déclenche les listeners pour un changement
     * @param {string} namespace - Le namespace
     * @param {string} key - La clé
     * @param {*} value - La nouvelle valeur
     */
    triggerListeners(namespace, key, value) {
        const specificKey = `${namespace}.${key}`;
        const namespaceKey = namespace;

        // Déclencher les listeners spécifiques à la clé
        if (this.listeners.has(specificKey)) {
            this.listeners.get(specificKey).forEach(callback => {
                try {
                    callback(value, key, namespace);
                } catch (error) {
                    console.error('Erreur dans le listener du cache:', error);
                }
            });
        }

        // Déclencher les listeners du namespace
        if (this.listeners.has(namespaceKey)) {
            this.listeners.get(namespaceKey).forEach(callback => {
                try {
                    callback(value, key, namespace);
                } catch (error) {
                    console.error('Erreur dans le listener du cache:', error);
                }
            });
        }
    }

    /**
     * Récupère tout le contenu d'un namespace
     * @param {string} namespace - Le namespace
     * @returns {Object} Le contenu du namespace
     */
    getNamespace(namespace) {
        return this.cache[namespace] || {};
    }

    /**
     * Récupère tout le cache
     * @returns {Object} Le cache complet
     */
    getAll() {
        return this.cache;
    }
}

// Instance singleton du gestionnaire de cache
const cacheManager = new CacheManager();

// Export des fonctions utilitaires pour la compatibilité
export const cache = {
    // API cache
    api: {
        workers: {
            get: (key) => cacheManager.get('api', `workers-${key}`),
            set: (key, value) => cacheManager.set('api', `workers-${key}`, value),
            has: (key) => cacheManager.has('api', `workers-${key}`),
            delete: (key) => cacheManager.delete('api', `workers-${key}`)
        },
        activities: {
            get: (key) => cacheManager.get('api', `activities-${key}`),
            set: (key, value) => cacheManager.set('api', `activities-${key}`, value),
            has: (key) => cacheManager.has('api', `activities-${key}`),
            delete: (key) => cacheManager.delete('api', `activities-${key}`)
        },
        global: {
            get: (key) => cacheManager.get('api', `global-${key}`),
            set: (key, value) => cacheManager.set('api', `global-${key}`, value),
            has: (key) => cacheManager.has('api', `global-${key}`),
            delete: (key) => cacheManager.delete('api', `global-${key}`)
        }
    },
    
    // UI cache
    ui: {
        get: (key) => cacheManager.get('ui', key),
        set: (key, value) => cacheManager.set('ui', key, value),
        has: (key) => cacheManager.has('ui', key),
        delete: (key) => cacheManager.delete('ui', key)
    },
    
    // Computed cache
    computed: {
        get: (key) => cacheManager.get('computed', key),
        set: (key, value) => cacheManager.set('computed', key, value),
        has: (key) => cacheManager.has('computed', key),
        delete: (key) => cacheManager.delete('computed', key)
    }
};

// Export du gestionnaire pour les utilisations avancées
export { cacheManager };

// Export des méthodes utilitaires
export const {
    get,
    set,
    has,
    delete: deleteCache,
    clear,
    clearAll,
    onChange,
    getNamespace,
    getAll
} = cacheManager; 