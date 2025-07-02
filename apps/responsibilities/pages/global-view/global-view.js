// Vue globale des responsabilités - JavaScript

// Import des modules ES6
import { 
    checkAuthAndLoadData, 
    showMessage, 
    apiRequest,
    createResponsibleBadge,
    createAssignmentBadge
} from '../../services/shared.js';
import { getSelectedDate, setSelectedDate } from '/modules/store/responsibilities.js';
import { globalStore } from '/modules/store/store.js';
import { createAppHeader } from '/modules/components/app-header.js';
import { updateUserInfo } from '/modules/components/user-info.js';
import { formatActivityNameEscaped, formatTypeName } from '/modules/utils/activity-formatter.js';
import { formatActivityDescription } from '/modules/utils/activity-description.js';
import { formatDateForAPI } from '/modules/utils/date-utils.js';
import { 
    createActivityCard,
    createTaskCard,
    createActivityWithTasksCard
} from '/apps/responsibilities/components/activity-card.js';
import { cache } from '/modules/cache/cache.js';
import { DateSelector } from '/modules/components/date-selector.js';

// Variables spécifiques à la vue globale
let selectedType = null; // Type sélectionné (sera défini dynamiquement)
let availableTypes = []; // Types d'activités disponibles
let dateSelector = null; // Instance du sélecteur de date

console.log('=== INITIALISATION GLOBAL-VIEW ===');
console.log('selectedType initial:', selectedType);

// Initialisation
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Vue globale - début de l\'initialisation...');
    try {
        const authSuccess = await checkAuthAndLoadData();
        if (authSuccess) {
            // Créer les filtres
            const filters = document.createElement('div');
            filters.className = 'filters';
            filters.innerHTML = `
                <div class="type-buttons btn-group-container">
                    <!-- Les boutons de type seront générés dynamiquement -->
                </div>
            `;
            // Ajout dynamique du conteneur du sélecteur de date à la fin des filtres
            const dateSelectorContainer = document.createElement('div');
            dateSelectorContainer.id = 'dateSelectorContainer';
            filters.appendChild(dateSelectorContainer);
            
            // Créer le header dynamiquement avec les filtres
            const headerContainer = document.getElementById('appHeader');
            const header = createAppHeader(
                '📋 Vue globale des tâches et responsabilités',
                '../../index.html',
                'currentUserGlobal',
                'app-view',
                filters
            );
            headerContainer.appendChild(header);
            
            // Initialiser le sélecteur de date avec la date du store
            const currentDateFromStore = getSelectedDate() || formatDateForAPI(new Date());
            dateSelector = new DateSelector(dateSelectorContainer, {
                initialDate: new Date(currentDateFromStore),
                onDateChange: (dateStr) => {
                    if (!selectedType) return; // Ne rien faire si pas de type sélectionné
                    // Le DateSelector passe déjà une chaîne formatée YYYY-MM-DD
                    setSelectedDate(dateStr);
                    displayDataForCurrentSelection();
                }
            });
            
            // Désactiver les boutons du sélecteur tant que les types ne sont pas chargés
            Array.from(dateSelectorContainer.querySelectorAll('button')).forEach(btn => btn.disabled = true);
            
            // Mettre à jour les informations utilisateur après la création du header
            updateUserInfo(globalStore.getUser());
            
            document.getElementById('globalViewPage').style.display = 'block';
            document.getElementById('loadingSection').style.display = 'none';
            
            setupEventListeners();
            
            // Charger les types d'activités disponibles
            await loadActivityTypes();
            
            // Réactiver les boutons après chargement des types
            Array.from(dateSelectorContainer.querySelectorAll('button')).forEach(btn => btn.disabled = false);
            
            // Afficher les données pour la sélection actuelle
            displayDataForCurrentSelection();
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        document.getElementById('loadingSection').style.display = 'none';
        showMessage('Erreur lors de l\'initialisation de la page', 'error');
    }
});

function setupEventListeners() {
    // Les boutons de type sont maintenant générés dynamiquement dans generateTypeButtons()
}

function selectType(type, buttonElement = null) {
    console.log(`Sélection du type: ${type}`);
    selectedType = type;
    
    // Mettre à jour la sélection visuelle
    document.querySelectorAll('.selection-btn--type').forEach(btn => btn.classList.remove('active'));
    if (buttonElement) buttonElement.classList.add('active');
    
    // Afficher les données pour ce type
    displayDataForCurrentSelection();
}

/**
 * Charger les types d'activités disponibles
 */
async function loadActivityTypes() {
    try {
        const url = 'responsibilities/global-view/global-view.php?action=get_activity_types';
        const data = await apiRequest(url);
        availableTypes = data.data.types || [];
        console.log('Types d\'activités chargés:', availableTypes);
        
        // Générer les boutons de type après chargement
        generateTypeButtons();
        
        // Sélectionner le premier type par défaut
        if (availableTypes.length > 0 && !selectedType) {
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
        button.className = 'btn selection-btn selection-btn--type';
        button.textContent = formatTypeName(type.type_name);
        button.dataset.type = type.type_name;
        
        if (index === 0 && !selectedType) {
            button.classList.add('active');
            selectedType = type.type_name;
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
    
    if (!activities || activities.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    emptyState.style.display = 'none';
    container.innerHTML = '';
    
    activities.forEach(activity => {
        const card = createActivityWithTasksCard(activity);
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