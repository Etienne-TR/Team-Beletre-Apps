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
let dataCache = {}; // Cache pour les données par année
let allYearsData = {}; // Données consolidées pour toutes les années
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
                <div class="type-buttons">
                    <!-- Les boutons de type seront générés dynamiquement -->
                </div>
                <div class="filters-spacer"></div>
                <div class="period-buttons">
                    <button class="btn selection-btn selection-btn--year" data-date="2024-06-01" data-label="1er juin 2024">2024</button>
                    <button class="btn selection-btn selection-btn--year active" data-date="2025-06-01" data-label="1er juin 2025">2025</button>
                    <button class="btn selection-btn selection-btn--year" data-date="2026-06-01" data-label="1er juin 2026">2026</button>
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
            
            // Précharger toutes les années et afficher les données actuelles
            await preloadAllYears();
            displayDataForCurrentSelection();
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        document.getElementById('loadingSection').style.display = 'none';
        showMessage('Erreur lors de l\'initialisation de la page', 'error');
    }
});

function setupEventListeners() {
    // Gestion des boutons de période
    document.querySelectorAll('.selection-btn--year').forEach(btn => {
        btn.addEventListener('click', function() {
            const date = this.dataset.date;
            const label = this.dataset.label;
            selectDate(date, label, this);
        });
    });
    
    // Les boutons de type sont maintenant générés dynamiquement dans generateTypeButtons()
}

async function selectDate(date, label, buttonElement = null) {
    console.log(`Sélection de la date: ${date} (${label})`);
    // Mettre à jour la date globale depuis le module shared
    window.currentDate = date;
    
    // Mettre à jour l'état visuel des boutons
    document.querySelectorAll('.selection-btn--year').forEach(btn => btn.classList.remove('active'));
    if (buttonElement) buttonElement.classList.add('active');
    
    // Afficher les données pour la nouvelle sélection
    displayDataForCurrentSelection();
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

async function preloadAllYears() {
    const years = ['2024', '2025', '2026'];
    const promises = years.map(year => loadYearData(year));
    
    try {
        await Promise.all(promises);
        console.log('Toutes les années ont été préchargées');
    } catch (error) {
        console.error('Erreur lors du préchargement des années:', error);
        throw error;
    }
}

async function loadYearData(year) {
    if (dataCache[year]) {
        console.log(`Données pour ${year} déjà en cache`);
        return dataCache[year];
    }
    
    try {
        const date = `${year}-06-01`;
        const periodForAPI = `${year}-06`;
        const url = `../../api/responsibilities/global-view.php?action=get_responsibilities&period=${periodForAPI}&date=${date}`;
        
        console.log(`Chargement des données pour ${year}...`);
        
        const data = await apiRequest(url);
        const yearData = data.data.activities || [];
        
        dataCache[year] = yearData;
        allYearsData[year] = yearData;
        
        console.log(`Données pour ${year} chargées: ${yearData.length} activités`);
        return yearData;
        
    } catch (error) {
        console.error(`Erreur lors du chargement de ${year}:`, error);
        // En cas d'erreur, on met un tableau vide pour éviter de recharger
        dataCache[year] = [];
        allYearsData[year] = [];
        throw error;
    }
}

function displayDataForCurrentSelection() {
    const year = window.currentDate.substring(0, 4);
    const yearData = allYearsData[year] || [];
    
    // Filtrer par type sélectionné
    const filteredData = yearData.filter(activity => activity.type === selectedType);
    
    // Appel direct à displayData qui gère maintenant l'état vide
    displayData(filteredData);
    
    console.log(`Affichage pour ${year}, type ${selectedType}: ${filteredData.length} activités`);
}

function showEmptyState() {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('activitiesContainer').style.display = 'none';
}

function hideEmptyState() {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('activitiesContainer').style.display = 'grid';
}

/**
 * Charger les types d'activités disponibles depuis l'API
 */
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