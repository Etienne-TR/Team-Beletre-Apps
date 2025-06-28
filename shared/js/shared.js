// Fonctions d'infrastructure communes à toutes les pages

/**
 * Effectue un appel API générique
 * @param {string} endpoint - Point de terminaison de l'API
 * @param {string} method - Méthode HTTP (GET, POST, etc.)
 * @param {Object} data - Données à envoyer (optionnel)
 * @returns {Promise<Object>} Réponse de l'API
 */
export async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`/api/${endpoint}`, options);
    return await response.json();
}

/**
 * Effectue un appel API avec gestion d'erreur
 * @param {string} endpoint - Point de terminaison de l'API
 * @param {Object} options - Options de la requête
 * @returns {Promise<Object>} Réponse de l'API
 */
export async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`/api/${endpoint}`, {
            credentials: 'include',
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Erreur serveur');
        }
        
        return data;
        
    } catch (error) {
        // console.error(`Erreur API pour ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Gère l'état de connexion de l'utilisateur sur l'ensemble des applications.
 */
export async function checkAuth() {
    try {
        // Utiliser un chemin absolu pour fonctionner depuis tous les contextes
        const response = await fetch('/api/auth.php', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error('Authentification échouée');
        }
        
        return result.user;
        
    } catch (error) {
        // console.error('Erreur lors de la vérification d\'authentification:', error);
        throw error;
    }
}

// Export pour les modules ES6
if (typeof module !== 'undefined' || typeof exports !== 'undefined') {
    // Environnement Node.js ou module ES6
    if (typeof exports !== 'undefined') {
        exports.apiCall = apiCall;
        exports.apiRequest = apiRequest;
        exports.checkAuth = checkAuth;
    }
} else if (typeof window !== 'undefined') {
    // Environnement navigateur - rendre disponible globalement
    window.apiCall = apiCall;
    window.apiRequest = apiRequest;
    window.checkAuth = checkAuth;
}