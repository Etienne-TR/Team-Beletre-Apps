// Script principal pour l'application admin

// Éléments DOM
const loadingSection = document.getElementById('loadingSection');
const authError = document.getElementById('authError');
const homePage = document.getElementById('homePage');
const currentUserElement = document.getElementById('currentUser');

// Variables globales
let currentUser = null;

/**
 * Afficher l'erreur d'authentification
 */
function showAuthError() {
    loadingSection.style.display = 'none';
    authError.style.display = 'block';
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
        
        // Afficher les informations utilisateur
        if (currentUserElement && currentUser) {
            currentUserElement.textContent = currentUser.name || currentUser.email || 'Utilisateur';
        }
        
        console.log('Authentification réussie');
        return true;
        
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        showAuthError();
        return false;
    }
}

/**
 * Obtenir l'utilisateur actuel
 * @returns {Object|null} L'utilisateur actuel ou null
 */
function getCurrentUser() {
    return currentUser;
}

// Initialisation de l'application
async function initApp() {
    console.log('Administration - début de l\'initialisation...');
    
    try {
        // Vérifier l'authentification et charger les données
        const authSuccess = await checkAuthAndLoadData();
        
        if (authSuccess) {
            // Afficher la page principale
            loadingSection.style.display = 'none';
            homePage.style.display = 'block';
            console.log('Page d\'administration affichée avec succès');
        } else {
            console.log('Authentification échouée, page d\'erreur affichée');
        }
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        loadingSection.style.display = 'none';
        authError.style.display = 'block';
    }
}

// Démarrage de l'application
document.addEventListener('DOMContentLoaded', initApp); 