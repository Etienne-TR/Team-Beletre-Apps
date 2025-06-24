// Fonctions utilitaires partagées pour l'application Responsabilités

// Import des modules ES6
import { showMessage } from '../../../modules/utils/message.js';
import { formatDate, formatDateLabel } from '../../../modules/utils/date.js';
import { createResponsibleBadge, createAssignmentBadge } from '../../../modules/ui/badges.js';
import { initializeBackButtons } from '../../../modules/ui/app-header.js';
import { updateUserInfo, loadAndUpdateUserInfo } from '../../../modules/ui/user-info.js';

// Variables globales partagées
export let currentUser = null;
export let currentDate = '2025-06-01'; // Date par défaut

// Rendre currentDate accessible globalement
window.currentDate = currentDate;

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
        const authResponse = await fetch('../../api/auth.php', {
            credentials: 'include'
        });
        
        if (!authResponse.ok) {
            throw new Error(`HTTP ${authResponse.status}: ${authResponse.statusText}`);
        }
        
        const authResult = await authResponse.json();
        
        if (!authResult.success) {
            console.log('Authentification échouée');
            showAuthError();
            return false;
        }
        
        currentUser = authResult.user;
        
        // Utiliser le module partagé pour mettre à jour les informations utilisateur
        updateUserInfo(currentUser);
        
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
 * Effectuer une requête API avec gestion d'erreur
 */
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
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
        handleApiError(error, `pour ${url}`);
        throw error;
    }
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

/**
 * Obtenir l'utilisateur actuel
 * @returns {Object|null} L'utilisateur actuel ou null
 */
export function getCurrentUser() {
    return currentUser;
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
    formatDate,
    formatDateLabel,
    createResponsibleBadge,
    createAssignmentBadge
}; 