/**
 * Application principale des responsabilités
 * Gère la navigation entre les vues via le composant navigation-tabs
 */

// Import des modules ES6
import { 
    checkAuthAndLoadData, 
    showMessage,
    initializeCommonElements
} from './services/shared.js';
import { globalStore } from '/modules/store/store.js';
import { getSelectedActivityType, getResponsibleForFilter } from '/modules/store/responsibilities.js';
import { createAppHeader } from '/modules/components/app-header.js';
import { updateUserInfo } from '/modules/components/user-info.js';
import { 
    createTabNavigation, 
    setupTabNavigation, 
    createAndSetupTabNavigation,
    restoreTabState 
} from '/modules/components/navigation-tabs.js';

// Import des vues
import { initializeGlobalView } from './views/global/global-view.js';
import { initializeWorkerView } from './views/individual/worker-view.js';
import { initializeEditorView } from './views/editor/editor.js';

// Variables globales
let currentView = 'global-view';
let navigationElement = null;
let viewContainers = {};
let filterContainers = {};

console.log('=== INITIALISATION APPLICATION RESPONSIBILITIES ===');

/**
 * Initialiser l'application principale
 */
async function initializeApp() {
    console.log('=== DÉBUT INITIALISATION APP ===');
    
    try {
        const authSuccess = await checkAuthAndLoadData();
        if (!authSuccess) {
            console.error('Échec de l\'authentification');
            return;
        }

        // Créer la structure de l'interface
        createAppStructure();
        
        // Créer la navigation par onglets
        createNavigation();
        
        // Initialiser les vues
        await initializeViews();
        
        // Afficher la vue par défaut
        showView('global-view');
        
        // Mettre à jour les informations utilisateur
        updateUserInfo(globalStore.getUser());
        
        console.log('=== FIN INITIALISATION APP ===');
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'app:', error);
        showMessage('Erreur lors de l\'initialisation de l\'application', 'error');
    }
}

/**
 * Créer la structure de base de l'interface
 */
function createAppStructure() {
    console.log('Création de la structure de l\'interface...');
    
    // Créer le header principal
    const headerContainer = document.getElementById('appHeader');
    const header = createAppHeader(
        '📋 Gestion des responsabilités',
        '../../index.html',
        'currentUserApp',
        'app-home'
    );
    headerContainer.appendChild(header);
    
    // Créer le conteneur de navigation
    const navigationContainer = document.createElement('div');
    navigationContainer.id = 'appNavigation';
    navigationContainer.className = 'app-navigation';
    document.body.appendChild(navigationContainer);
    
    // Créer le conteneur principal des vues
    const viewContent = document.createElement('div');
    viewContent.className = 'view-content';
    viewContent.id = 'viewContent';
    document.body.appendChild(viewContent);
    
    // Créer les conteneurs pour chaque vue
    createViewContainers();
}

/**
 * Créer les conteneurs pour chaque vue
 */
function createViewContainers() {
    const viewContent = document.getElementById('viewContent');
    
    // Vue globale
    const globalContainer = document.createElement('div');
    globalContainer.id = 'global-view-container';
    globalContainer.className = 'view-container';
    globalContainer.style.display = 'none';
    viewContent.appendChild(globalContainer);
    viewContainers['global-view'] = globalContainer;
    
    // Vue des travailleurs
    const workerContainer = document.createElement('div');
    workerContainer.id = 'worker-view-container';
    workerContainer.className = 'view-container';
    workerContainer.style.display = 'none';
    viewContent.appendChild(workerContainer);
    viewContainers['worker-view'] = workerContainer;
    
    // Vue éditeur
    const editorContainer = document.createElement('div');
    editorContainer.id = 'editor-container';
    editorContainer.className = 'view-container';
    editorContainer.style.display = 'none';
    viewContent.appendChild(editorContainer);
    viewContainers['editor'] = editorContainer;
}

/**
 * Créer la navigation par onglets
 */
function createNavigation() {
    console.log('Création de la navigation par onglets...');
    
    const views = [
        { 
            id: 'global-view', 
            label: 'Vue globale', 
            icon: '📋' 
        },
        { 
            id: 'editor', 
            label: 'Éditeur', 
            icon: '✏️' 
        },
        { 
            id: 'worker-view', 
            label: 'Fiches de poste', 
            icon: '👥' 
        }
    ];
    
    navigationElement = createAndSetupTabNavigation(views, {
        activeView: 'global-view',
        onViewChange: (viewName) => {
            console.log('Changement de vue vers:', viewName);
            // Mettre à jour seulement l'état de l'application
            currentView = viewName;
            // Synchroniser l'état des boutons de type
            syncTypeButtonsState();
        },
        updateURL: true
    });
    
    // Ajouter la navigation au conteneur
    const navigationContainer = document.getElementById('appNavigation');
    navigationContainer.appendChild(navigationElement);
}

/**
 * Synchroniser l'état des boutons de type entre les vues
 */
function syncTypeButtonsState() {
    const selectedType = getSelectedActivityType();
    if (!selectedType) return;
    
    console.log('Synchronisation de l\'état des boutons de type:', selectedType);
    
    // Synchroniser les boutons de la vue editor
    const editorButtonsContainer = document.getElementById('type-buttons-container');
    if (editorButtonsContainer) {
        editorButtonsContainer.querySelectorAll('.btn[data-type]').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === selectedType) {
                btn.classList.add('active');
            }
        });
    }
    
    // Synchroniser les boutons de la vue global
    const globalViewContainer = document.getElementById('global-view-container');
    if (globalViewContainer) {
        const globalButtonsContainer = globalViewContainer.querySelector('.type-buttons');
        if (globalButtonsContainer) {
            globalButtonsContainer.querySelectorAll('.btn[data-type]').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.type === selectedType) {
                    btn.classList.add('active');
                }
            });
        }
    }
    
    // Restaurer l'état des boutons de filtre de la vue worker
    const workerViewContainer = document.getElementById('worker-view-container');
    console.log('syncTypeButtonsState - workerViewContainer trouvé:', !!workerViewContainer);
    
    if (workerViewContainer) {
        const workerButtonsContainer = workerViewContainer.querySelector('.btn-group-container');
        console.log('syncTypeButtonsState - workerButtonsContainer trouvé:', !!workerButtonsContainer);
        
        if (workerButtonsContainer) {
            const buttons = workerButtonsContainer.querySelectorAll('.btn[data-content]');
            console.log('syncTypeButtonsState - nombre de boutons trouvés:', buttons.length);
            
            const currentFilter = getResponsibleForFilter();
            console.log('syncTypeButtonsState - filtre actuel dans le store:', currentFilter);
            
            // Ne restaurer que si un filtre est défini dans le store
            if (currentFilter) {
                buttons.forEach(btn => {
                    console.log('syncTypeButtonsState - bouton:', btn.dataset.content, 'actif:', btn.classList.contains('active'));
                    btn.classList.remove('active');
                    if (btn.dataset.content === currentFilter) {
                        btn.classList.add('active');
                        console.log('syncTypeButtonsState - bouton activé:', btn.dataset.content);
                    }
                });
            } else {
                console.log('syncTypeButtonsState - aucun filtre défini dans le store, pas de restauration');
            }
        } else {
            console.log('syncTypeButtonsState - workerButtonsContainer non trouvé');
        }
    } else {
        console.log('syncTypeButtonsState - workerViewContainer non trouvé');
    }
}

/**
 * Recharger les données dans la vue actuellement active
 */
function reloadActiveViewData() {
    const selectedType = getSelectedActivityType();
    if (!selectedType) return;
    
    console.log('Rechargement des données pour la vue active:', currentView);
    
    switch (currentView) {
        case 'global-view':
            // Déclencher le rechargement des données dans la vue globale
            if (window.globalViewReloadData) {
                window.globalViewReloadData();
            }
            break;
        case 'editor':
            // Déclencher le rechargement des données dans la vue éditeur
            if (window.editorViewReloadData) {
                window.editorViewReloadData();
            }
            break;
        case 'worker-view':
            // La vue worker ne dépend pas du type d'activité, pas besoin de recharger
            break;
    }
}

/**
 * Initialiser toutes les vues
 */
async function initializeViews() {
    console.log('Initialisation des vues...');
    
    try {
        // Initialiser la vue globale
        await initializeGlobalView(viewContainers['global-view']);
        
        // Initialiser la vue des travailleurs
        await initializeWorkerView(viewContainers['worker-view']);
        
        // Initialiser la vue éditeur
        await initializeEditorView(viewContainers['editor']);
        
        // Synchroniser l'état des boutons de type après l'initialisation
        syncTypeButtonsState();
        
        console.log('Toutes les vues initialisées avec succès');
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation des vues:', error);
        showMessage('Erreur lors de l\'initialisation des vues', 'error');
    }
}

/**
 * Afficher une vue spécifique
 * @param {string} viewName - Nom de la vue à afficher
 */
function showView(viewName) {
    console.log('=== AFFICHAGE VUE ===');
    console.log('Vue demandée:', viewName);
    console.log('Vue actuelle:', currentView);
    
    // Mettre à jour la variable d'état
    currentView = viewName;
    
    // Déléguer l'affichage au composant de navigation
    if (navigationElement && navigationElement.switchView) {
        navigationElement.switchView(viewName);
    } else {
        console.error('Navigation non initialisée');
    }
}

/**
 * Restaurer l'état de l'application depuis l'URL
 */
function restoreAppState() {
    const url = new URL(window.location);
    const viewFromURL = url.searchParams.get('view');
    
    if (viewFromURL && viewContainers[viewFromURL]) {
        console.log('Restauration de la vue depuis l\'URL:', viewFromURL);
        showView(viewFromURL);
    }
}

/**
 * Gestionnaire d'événements pour l'historique navigateur
 */
window.addEventListener('popstate', (e) => {
    console.log('Événement popstate:', e.state);
    if (e.state && e.state.view) {
        showView(e.state.view);
    }
});

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Application responsibilities - début de l\'initialisation...');
    
    // Masquer la section de chargement
    const loadingSection = document.getElementById('loadingSection');
    if (loadingSection) {
        loadingSection.style.display = 'none';
    }
    
    // Initialiser l'application
    await initializeApp();
    
    // Restaurer l'état depuis l'URL
    restoreAppState();
});

// Exposer les fonctions pour utilisation externe
window.responsibilitiesApp = {
    showView,
    getCurrentView: () => currentView,
    getNavigationElement: () => navigationElement,
    syncTypeButtonsState,
    reloadActiveViewData
}; 