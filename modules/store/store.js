// modules/store/store.js
export class GlobalStore {
    constructor() {
        this.state = {
            // État global partagé uniquement
            user: null,
            currentApp: 'responsibilities'
            // Plus d'état responsibilities ici !
        };
        
        this.listeners = new Map();
    }
    
    // Méthodes de base
    getState(path = null) {
        return path ? this.getNestedValue(this.state, path) : this.state;
    }
    
    setState(path, newData) {
        const oldState = this.getState(path);
        this.setNestedValue(this.state, path, { ...oldState, ...newData });
        this.notifyListeners(path);
    }
    
    subscribe(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }
        this.listeners.get(path).add(callback);
        
        return () => {
            this.listeners.get(path)?.delete(callback);
        };
    }
    
    notifyListeners(path) {
        this.listeners.get(path)?.forEach(callback => callback(this.getState(path)));
    }
    
    // Méthodes utilitaires pour accéder aux valeurs imbriquées
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }
    
    // ===== MÉTHODES POUR L'ÉTAT GLOBAL =====
    
    /**
     * Récupère l'utilisateur actuel
     * @returns {Object|null} L'utilisateur actuel ou null
     */
    getUser() {
        return this.getState('user');
    }
    
    /**
     * Définit l'utilisateur actuel
     * @param {Object} user - L'objet utilisateur
     */
    setUser(user) {
        this.setState('user', user);
    }
    
    /**
     * Récupère l'application actuelle
     * @returns {string} Le nom de l'application actuelle
     */
    getCurrentApp() {
        return this.getState('currentApp');
    }
    
    /**
     * Définit l'application actuelle
     * @param {string} app - Le nom de l'application
     */
    setCurrentApp(app) {
        this.setState('currentApp', app);
    }
    
    /**
     * S'abonne aux changements de l'utilisateur
     * @param {Function} callback - Fonction appelée quand l'utilisateur change
     * @returns {Function} Fonction pour se désabonner
     */
    subscribeToUser(callback) {
        return this.subscribe('user', callback);
    }
    
    /**
     * S'abonne aux changements de l'application
     * @param {Function} callback - Fonction appelée quand l'application change
     * @returns {Function} Fonction pour se désabonner
     */
    subscribeToApp(callback) {
        return this.subscribe('currentApp', callback);
    }
}

// Instance globale partagée
export const globalStore = new GlobalStore(); 