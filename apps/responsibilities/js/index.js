// Script pour la page d'accueil des responsabilités

// Import des modules ES6
import { checkAuthAndLoadData, showMessage, initializeCommonElements } from './shared.js';

// Initialisation de la page d'accueil
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Page d\'accueil - début de l\'initialisation...');
    
    try {
        // Initialiser les éléments communs (boutons retour, etc.)
        initializeCommonElements();
        
        // Vérifier l'authentification et charger les données
        const authSuccess = await checkAuthAndLoadData();
        
        if (authSuccess) {
            // Afficher la page d'accueil
            document.getElementById('homePage').style.display = 'block';
            document.getElementById('loadingSection').style.display = 'none';
            console.log('Page d\'accueil affichée avec succès');
        } else {
            console.log('Authentification échouée, page d\'erreur affichée');
        }
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        document.getElementById('loadingSection').style.display = 'none';
        showMessage('Erreur lors de l\'initialisation de la page', 'error');
    }
}); 