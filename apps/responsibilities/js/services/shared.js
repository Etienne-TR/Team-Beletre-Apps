// Fonctions utilitaires partagées pour l'application Responsabilités

// Import des modules ES6
import { showMessage } from '/modules/components/message.js';
import { createResponsibleBadge, createAssignmentBadge } from '/modules/components/badges.js';
import { initializeBackButtons } from '/modules/components/app-header.js';
import { updateUserInfo, loadAndUpdateUserInfo } from '/modules/components/user-info.js';
import { apiRequest, checkAuth } from '/shared/api-client.js';
import { globalStore } from '/modules/store/store.js';

/**
 * Afficher l'erreur d'authentification
 */
function showAuthError() {
    document.getElementById('authError').style.display = 'block';
    document.getElementById('loadingSection').style.display = 'none';
}

/**
 * Vérifier l'authentification et charger les données utilisateur
 */
async function checkAuthAndLoadData() {
    console.log('Vérification de l\'authentification...');
    try {
        // Utiliser la fonction checkAuth du fichier shared global
        const user = await checkAuth();
        
        // Stocker l'utilisateur dans le store centralisé
        globalStore.setUser(user);
        
        // Utiliser le module partagé pour mettre à jour les informations utilisateur
        updateUserInfo(user);
        
        console.log('Authentification réussie');
        return true;
        
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        showAuthError();
        showMessage('Impossible de vérifier l\'authentification. Veuillez vous reconnecter.', 'error');
        return false;
    }
}

/**
 * Gérer les erreurs de requête API
 */
function handleApiError(error, context = '') {
    console.error(`Erreur API ${context}:`, error);
    let message = 'Une erreur est survenue lors de la communication avec le serveur.';
    
    if (error.message) {
        message = error.message;
    }
    
    showMessage(message, 'error');
}

/**
 * Initialiser les éléments communs de l'interface
 */
function initializeCommonElements() {
    // Initialiser les boutons retour avec le contexte 'app-home' pour la page d'accueil
    initializeBackButtons('app-home');
}

/**
 * Formater une période pour l'affichage
 */
function formatPeriod(dateString) {
    const date = new Date(dateString);
    return date.getFullYear().toString();
}

/**
 * Créer un élément HTML avec des attributs
 */
function createElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'textContent') {
            element.textContent = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    
    if (textContent) {
        element.textContent = textContent;
    }
    
    return element;
}

// Export des fonctions pour utilisation dans les autres modules
export {
    showAuthError,
    checkAuthAndLoadData,
    handleApiError,
    apiRequest,
    initializeCommonElements,
    formatPeriod,
    createElement,
    showMessage,
    createResponsibleBadge,
    createAssignmentBadge
}; 