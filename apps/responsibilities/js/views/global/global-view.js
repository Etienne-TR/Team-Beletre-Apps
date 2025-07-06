// Vue globale des responsabilités - JavaScript

// Import des modules ES6
import { 
    checkAuthAndLoadData, 
    showMessage, 
    apiRequest,
    createResponsibleBadge,
    createAssignmentBadge
} from '../../services/shared.js';
import { 
    getSelectedDate, 
    setSelectedDate, 
    getSelectedActivityType,
    setSelectedActivityType,
    getExpandedActivityCard,
    setExpandedActivityCard,
    clearExpandedActivityCard,
    addEventListener,
    removeEventListener
} from '/modules/store/responsibilities.js';
import { globalStore } from '/modules/store/store.js';

import { updateUserInfo } from '/modules/components/user-info.js';
import { formatActivityNameEscaped, formatTypeName } from '/modules/utils/activity-formatter.js';
import { formatActivityDescription } from '/modules/utils/activity-description.js';
import { formatDateForAPI } from '/modules/utils/date-utils.js';
import {
    createActivityCard,
    createTaskCard,
    createActivityWithTasksCard
} from '../../components/activity-card.js';
import { cache } from '/modules/cache/cache.js';
import { DateSelector } from '/modules/components/date-selector.js';

// Variables spécifiques à la vue globale
let availableTypes = []; // Types d'activités disponibles
let dateSelector = null; // Instance du sélecteur de date
let container = null; // Conteneur de la vue
let activityTypeChangeListener = null; // Écouteur de changement de type
let selectedDateChangeListener = null; // Écouteur de changement de date
let expandedActivityCardChangeListener = null; // Écouteur de changement de carte dépliée

console.log('=== INITIALISATION GLOBAL-VIEW ===');
console.log('selectedActivityType initial:', getSelectedActivityType());
console.log('selectedDate initial:', getSelectedDate());

/**
 * Initialiser la vue globale
 * @param {HTMLElement} viewContainer - Le conteneur de la vue
 */
export async function initializeGlobalView(viewContainer) {
    console.log('Vue globale - début de l\'initialisation...');
    container = viewContainer;
    
    try {
        // Créer les filtres
        const filters = document.createElement('div');
        filters.className = 'view-filters';
        filters.innerHTML = `
            <div class="type-buttons btn-group-container">
                <!-- Les boutons de type seront générés dynamiquement -->
            </div>
            <div class="spacer"></div>
        `;
        // Ajout dynamique du conteneur du sélecteur de date à la fin des filtres
        const dateSelectorContainer = document.createElement('div');
        filters.appendChild(dateSelectorContainer);
        
        // Ajouter les filtres directement au conteneur de la vue
        container.appendChild(filters);
        
        // Initialiser le sélecteur de date avec la date du store
        const currentDateFromStore = getSelectedDate() || formatDateForAPI(new Date());
        dateSelector = new DateSelector(dateSelectorContainer, {
            initialDate: new Date(currentDateFromStore),
            onDateChange: (dateStr) => {
                const selectedType = getSelectedActivityType();
                if (!selectedType) return; // Ne rien faire si pas de type sélectionné
                // Le DateSelector passe déjà une chaîne formatée YYYY-MM-DD
                setSelectedDate(dateStr);
                // Note: displayDataForCurrentSelection() sera appelé automatiquement par l'écouteur d'événement
            }
        });
        
        // Désactiver les boutons du sélecteur tant que les types ne sont pas chargés
        Array.from(dateSelectorContainer.querySelectorAll('button, .date-display-label, .date-nav-arrow')).forEach(btn => btn.disabled = true);
        
        // Créer le conteneur des activités
        const activitiesContainer = document.createElement('div');
        activitiesContainer.id = 'activitiesContainer';
        activitiesContainer.className = 'content-cards-container';
        container.appendChild(activitiesContainer);
        
        // Créer l'état vide
        const emptyState = document.createElement('div');
        emptyState.id = 'emptyState';
        emptyState.className = 'empty-state-message';
        emptyState.style.display = 'none';
        emptyState.innerHTML = `
            <h3>Aucune activité trouvée</h3>
            <p>Aucune activité n'est disponible pour cette période.</p>
        `;
        container.appendChild(emptyState);
        
        // Charger les types d'activités disponibles
        await loadActivityTypes();
        
        // Réactiver les boutons après chargement des types
        Array.from(dateSelectorContainer.querySelectorAll('button, .date-display-label, .date-nav-arrow')).forEach(btn => btn.disabled = false);
        
        // Afficher les données pour la sélection actuelle
        displayDataForCurrentSelection();
        
        // Ajouter les écouteurs de changement d'état
        setupActivityTypeChangeListener();
        setupSelectedDateChangeListener();
        setupExpandedActivityCardChangeListener();
        
        console.log('Vue globale initialisée avec succès');
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la vue globale:', error);
        showMessage('Erreur lors de l\'initialisation de la vue globale', 'error');
    }
}

/**
 * Configurer l'écouteur de changement de type d'activité
 */
function setupActivityTypeChangeListener() {
    // Supprimer l'ancien écouteur s'il existe
    if (activityTypeChangeListener) {
        removeEventListener('selectedActivityType', activityTypeChangeListener);
    }
    
    // Créer le nouvel écouteur
    activityTypeChangeListener = (newType) => {
        console.log('Vue globale - Changement de type détecté:', newType);
        if (newType) {
            // Mettre à jour les boutons
            const typeButtonsContainer = container.querySelector('.type-buttons');
            if (typeButtonsContainer) {
                typeButtonsContainer.querySelectorAll('.btn[data-type]').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.type === newType) {
                        btn.classList.add('active');
                    }
                });
            }
            // Recharger les données
            displayDataForCurrentSelection();
        }
    };
    
    // Ajouter l'écouteur
    addEventListener('selectedActivityType', activityTypeChangeListener);
}

/**
 * Configurer l'écouteur de changement de date
 */
function setupSelectedDateChangeListener() {
    // Supprimer l'ancien écouteur s'il existe
    if (selectedDateChangeListener) {
        removeEventListener('selectedDate', selectedDateChangeListener);
    }
    
    // Créer le nouvel écouteur
    selectedDateChangeListener = (newDate) => {
        console.log('Vue globale - Changement de date détecté:', newDate);
        if (newDate) {
            // Mettre à jour le sélecteur de date si nécessaire
            if (dateSelector && dateSelector.setDate) {
                dateSelector.setDate(new Date(newDate));
            }
            // Recharger les données
            displayDataForCurrentSelection();
        }
    };
    
    // Ajouter l'écouteur
    addEventListener('selectedDate', selectedDateChangeListener);
}

/**
 * Configurer l'écouteur de changement de carte dépliée
 */
function setupExpandedActivityCardChangeListener() {
    // Supprimer l'ancien écouteur s'il existe
    if (expandedActivityCardChangeListener) {
        removeEventListener('expandedActivityCard', expandedActivityCardChangeListener);
    }
    
    // Créer le nouvel écouteur
    expandedActivityCardChangeListener = (cardId) => {
        console.log('Vue globale - Changement de carte dépliée détecté:', cardId);
        
        // Fermer toutes les cartes d'abord
        const allCards = document.querySelectorAll('.activity-card');
        allCards.forEach(card => {
            const body = card.querySelector('.content-card-body');
            if (body) {
                body.classList.remove('content-card-body--expanded');
                body.classList.add('content-card-body--collapsed');
                card.classList.remove('expanded');
            }
        });
        
        // Déplier la carte spécifiée si elle existe
        if (cardId) {
            const targetCard = document.querySelector(`[data-card-id="activity-${cardId}"]`);
            if (targetCard) {
                const body = targetCard.querySelector('.content-card-body');
                if (body) {
                    body.classList.remove('content-card-body--collapsed');
                    body.classList.add('content-card-body--expanded');
                    targetCard.classList.add('expanded');
                }
            }
        }
    };
    
    // Ajouter l'écouteur
    addEventListener('expandedActivityCard', expandedActivityCardChangeListener);
}

function selectType(type, buttonElement = null) {
    console.log(`Sélection du type: ${type}`);
    
    // Mettre à jour l'état global (cela déclenchera automatiquement les écouteurs d'événements)
    setSelectedActivityType(type);
    
    // Mettre à jour la sélection visuelle DANS CETTE VUE SEULEMENT
    const typeButtonsContainer = container.querySelector('.type-buttons');
    if (typeButtonsContainer) {
        typeButtonsContainer.querySelectorAll('.btn[data-type]').forEach(btn => btn.classList.remove('active'));
    }
    if (buttonElement) buttonElement.classList.add('active');
    
    // Afficher les données pour ce type
    displayDataForCurrentSelection();
}

/**
 * Fonction de rechargement des données pour la vue globale
 * Exposée globalement pour être appelée depuis app.js
 */
async function reloadGlobalViewData() {
    console.log('Rechargement des données de la vue globale...');
    await displayDataForCurrentSelection();
}

// Exposer la fonction de rechargement globalement
window.globalViewReloadData = reloadGlobalViewData;

/**
 * Charger les types d'activités disponibles
 */
async function loadActivityTypes() {
    try {
        const url = 'responsibilities/global-view/global-view.php?action=get_activity_types';
        const data = await apiRequest(url);
        availableTypes = data.data.activity_types.map(type => ({
            type_name: type.name,
            type_description: type.description,
            type_emoji: '',
            entry: type.entry
        }));
        console.log('Types d\'activités chargés:', availableTypes);
        
        // Générer les boutons de type après chargement
        generateTypeButtons();
        
        // Sélectionner le premier type par défaut si aucun n'est sélectionné
        if (availableTypes.length > 0 && !getSelectedActivityType()) {
            selectType(availableTypes[0].type_name);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des types:', error);
        showMessage('Erreur lors du chargement des types d\'activités', 'error');
    }
}

/**
 * Générer les boutons de sélection de type
 */
function generateTypeButtons() {
    const container = document.querySelector('.type-buttons');
    if (!container) return;
    
    container.innerHTML = '';
    
    availableTypes.forEach((type, index) => {
        const button = document.createElement('button');
        button.className = 'btn';
        button.textContent = formatTypeName(type.type_name);
        button.dataset.type = type.type_name;
        
        // Vérifier si ce type est actuellement sélectionné dans le store
        const currentSelectedType = getSelectedActivityType();
        if (index === 0 && !currentSelectedType) {
            button.classList.add('active');
            setSelectedActivityType(type.type_name);
        } else if (currentSelectedType === type.type_name) {
            button.classList.add('active');
        }
        
        button.addEventListener('click', function() {
            selectType(type.type_name, this);
        });
        container.appendChild(button);
    });
}

/**
 * Afficher les données pour la sélection actuelle
 */
async function displayDataForCurrentSelection() {
    const selectedType = getSelectedActivityType();
    if (!selectedType) return;
    
    try {
        const dateStr = getSelectedDate() || formatDateForAPI(new Date());
        const url = `responsibilities/global-view/global-view.php?action=get_responsibilities&date=${dateStr}&type=${encodeURIComponent(selectedType)}`;
        
        console.log('Chargement des données pour:', selectedType, 'à la date:', dateStr);
        
        const data = await apiRequest(url);
        
        if (data.success && data.data && data.data.activities) {
            displayActivities(data.data.activities);
        } else {
            displayEmptyState();
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showMessage('Erreur lors du chargement des données', 'error');
        displayEmptyState();
    }
}

/**
 * Afficher les activités
 */
function displayActivities(activities) {
    const container = document.getElementById('activitiesContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (!container) {
        console.error('Conteneur activitiesGrid non trouvé');
        return;
    }
    
    container.innerHTML = '';
    
    activities.forEach(activity => {
        const card = createActivityWithTasksCard(activity, activity.responsible, activity.tasks, {});
        container.appendChild(card);
    });
}

/**
 * Afficher l'état vide
 */
function displayEmptyState() {
    const container = document.getElementById('activitiesContainer');
    const emptyState = document.getElementById('emptyState');
    
    container.style.display = 'none';
    emptyState.style.display = 'block';
}