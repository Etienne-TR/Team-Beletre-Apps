// Vue globale des responsabilités - JavaScript

// Import des modules ES6
import { 
    checkAuthAndLoadData, 
    showMessage, 
    apiRequest,
    formatDateLabel,
    createResponsibleBadge,
    createAssignmentBadge,
    getCurrentUser
} from './shared.js';
import { createAppHeader } from '../../../modules/ui/app-header.js';
import { updateUserInfo } from '../../../modules/ui/user-info.js';
import { formatActivityNameEscaped, formatTypeName } from '../../../modules/utils/activity-formatter.js';
import { formatActivityDescription } from '../../../modules/utils/activity-description.js';
import { 
    createActivityCard,
    createTaskCard
} from './activity-card.js';

// Variables spécifiques à la vue globale
let selectedType = null; // Type sélectionné (sera défini dynamiquement)
let availableTypes = []; // Types d'activités disponibles

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
            
            // Créer le header dynamiquement avec les filtres
            const headerContainer = document.getElementById('appHeader');
            const header = createAppHeader(
                '📋 Vue globale des tâches et responsabilités',
                'index.html',
                'currentUserGlobal',
                'app-view',
                filters
            );
            headerContainer.appendChild(header);
            
            // Mettre à jour les informations utilisateur après la création du header
            updateUserInfo(getCurrentUser());
            
            document.getElementById('globalViewPage').style.display = 'block';
            document.getElementById('loadingSection').style.display = 'none';
            
            setupEventListeners();
            
            // Charger les types d'activités disponibles
            await loadActivityTypes();
            
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
    
    // Mettre à jour l'état visuel des boutons
    document.querySelectorAll('.selection-btn--type').forEach(btn => btn.classList.remove('active'));
    if (buttonElement) buttonElement.classList.add('active');
    
    // Afficher les données pour la nouvelle sélection
    displayDataForCurrentSelection();
}

function displayData(data) {
    const container = document.getElementById('activitiesContainer');
    container.innerHTML = '';
    
    if (data.length === 0) {
        showEmptyState();
        return;
    }
    
    hideEmptyState();
    
    data.forEach(activity => {
        const card = createActivityCard(activity);
        container.appendChild(card);
    });
}

async function loadActivityTypes() {
    try {
        const url = '../../api/responsibilities/global-view.php?action=get_activity_types';
        const data = await apiRequest(url);
        const types = data.data.types || [];
        
        console.log('Types d\'activités chargés:', types);
        
        // Générer les boutons de sélection dynamiquement
        generateTypeButtons(types);
        
        // Sélectionner le premier type par défaut
        if (types.length > 0) {
            selectedType = types[0].type_name;
            console.log('Type sélectionné par défaut:', selectedType);
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement des types:', error);
        showMessage('Erreur lors du chargement des types d\'activités', 'error');
    }
}

/**
 * Générer les boutons de sélection de type dynamiquement
 */
function generateTypeButtons(types) {
    const typeButtonsContainer = document.querySelector('.type-buttons');
    if (!typeButtonsContainer) {
        console.error('Container des boutons de type non trouvé');
        return;
    }
    
    // Vider le container
    typeButtonsContainer.innerHTML = '';
    
    types.forEach((type, index) => {
        const button = document.createElement('button');
        button.className = 'btn selection-btn selection-btn--type';
        button.dataset.type = type.type_name;
        button.textContent = formatTypeName(type.type_name);
        
        // Marquer le premier comme actif par défaut
        if (index === 0) {
            button.classList.add('active');
        }
        
        // Ajouter l'événement click
        button.addEventListener('click', function() {
            selectType(type.type_name, this);
        });
        
        typeButtonsContainer.appendChild(button);
    });
    
    console.log(`${types.length} boutons de type générés`);
}

function displayActivityTypes(types) {
    const container = document.querySelector('.type-buttons');
    container.innerHTML = ''; // Nettoyer les anciens boutons
    
    types.forEach(type => {
        const button = document.createElement('button');
        button.className = 'btn selection-btn selection-btn--type';
        button.textContent = type.name;
        button.dataset.typeId = type.id;
        container.appendChild(button);
    });
    
    // Gestionnaire de clic unifié
    container.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            document.querySelectorAll('.selection-btn--type').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            selectedTypeId = event.target.dataset.typeId;
            displayDataForCurrentSelection();
        }
    });
    
    console.log(`${types.length} boutons de type générés`);
}

function createTypeButtons(types) {
    const typeButtonsContainer = document.querySelector('.type-buttons');
    if (!typeButtonsContainer) return;
    typeButtonsContainer.innerHTML = '';
    
    // Créer un bouton pour chaque type
    types.forEach((type, index) => {
        const button = document.createElement('button');
        button.className = 'btn selection-btn selection-btn--type';
        button.dataset.type = type.type_name;
        button.textContent = formatTypeName(type.type_name);
        
        // Activer le premier bouton par défaut
        if (index === 0) {
            button.classList.add('active');
            selectedActivityType = type.type_name;
        }
        
        typeButtonsContainer.appendChild(button);
    });
    
    console.log(`${types.length} boutons de type générés`);
}

function displayDataForCurrentSelection() {
    if (!selectedType) {
        console.log('Aucun type sélectionné');
        displayData([]);
        return;
    }
    
    // Charger directement les données pour le type sélectionné
    loadDataForType(selectedType);
}

async function loadDataForType(type) {
    try {
        const currentDate = window.currentDate;
        const url = `../../api/responsibilities/global-view.php?action=get_responsibilities&date=${currentDate}`;
        
        console.log(`Chargement des données pour le type ${type} à la date ${currentDate}...`);
        
        const data = await apiRequest(url);
        const activities = data.data.activities || [];
        
        // Filtrer par type sélectionné
        const filteredData = activities.filter(activity => activity.type === type);
        
        // Afficher les données
        displayData(filteredData);
        
        console.log(`Affichage pour ${currentDate}, type ${type}: ${filteredData.length} activités`);
        
    } catch (error) {
        console.error(`Erreur lors du chargement des données pour le type ${type}:`, error);
        displayData([]); // Afficher un état vide en cas d'erreur
    }
}

function showEmptyState() {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('activitiesContainer').style.display = 'none';
}

function hideEmptyState() {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('activitiesContainer').style.display = 'grid';
} 