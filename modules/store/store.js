// modules/store/store.js
export class AppStore {
    constructor() {
        this.state = {
            // État global partagé
            user: null,
            currentApp: 'responsibilities',
            
            // État responsibilities (application)
            responsibilities: {
                // État partagé au niveau de l'app
                date: new Date().toISOString().split('T')[0], // Date par défaut : aujourd'hui
                
                // État individual-view
                individual: {
                    selectedWorker: null,
                    responsibilityFilter: 'all', // 'all', 'responsible', 'other'
                    expandedCards: [] // IDs des cartes dépliées
                },
                
                // État global-view
                global: {
                    selectedActivityType: null,
                    expandedCards: [] // IDs des cartes dépliées
                }
            }
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
}

// Instance globale partagée
export const appStore = new AppStore(); 