// Vue individuelle des responsabilités - JavaScript

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
import { formatActivityNameEscaped } from '../../../modules/utils/activity-formatter.js';
import { formatActivityDescription } from '../../../modules/utils/activity-description.js';
import { 
    createActivityWithTasksCard,
    createSimpleTaskCard
} from './activity-card.js';

// Variables spécifiques à la vue individuelle
let selectedPersonId = null;
let selectedContent = 'responsibilities'; // 'responsibilities' ou 'tasks'
let workersData = {}; // Cache des travailleurs par année
let individualDataCache = {}; // Cache des données individuelles

// Initialisation
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Vue individuelle - début de l\'initialisation...');
    
    try {
        const authSuccess = await checkAuthAndLoadData();
        if (authSuccess) {
            // Créer les filtres
            const filters = document.createElement('div');
            filters.className = 'filters';
            filters.innerHTML = `
                <div class="person-selector">
                    <select id="personSelect" class="select-style">
                        <option value="">Choisir une personne...</option>
                    </select>
                </div>
                <div class="content-buttons">
                    <button class="btn selection-btn selection-btn--content active" data-content="responsibilities">En responsabilité</button>
                    <button class="btn selection-btn selection-btn--content" data-content="tasks">Autres</button>
                </div>
                <div class="period-buttons">
                    <button class="btn selection-btn selection-btn--year" data-date="2024-06-01" data-label="1er juin 2024">2024</button>
                    <button class="btn selection-btn selection-btn--year active" data-date="2025-06-01" data-label="1er juin 2025">2025</button>
                    <button class="btn selection-btn selection-btn--year" data-date="2026-06-01" data-label="1er juin 2026">2026</button>
                </div>
            `;
            
            // Créer le header dynamiquement avec les filtres
            const headerContainer = document.getElementById('appHeader');
            const header = createAppHeader(
                '📋 Fiches de poste',
                'index.html',
                'currentUserIndividual',
                'app-view',
                filters
            );
            headerContainer.appendChild(header);
            
            // Mettre à jour les informations utilisateur après la création du header
            updateUserInfo(getCurrentUser());
            
            document.getElementById('individualPage').style.display = 'block';
            document.getElementById('loadingSection').style.display = 'none';
            
            setupEventListeners();
            
            // Charger les travailleurs pour la date actuelle
            await loadWorkersForDate(window.currentDate);
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
            selectIndividualDate(date, label, this);
        });
    });
    
    // Gestion des boutons de contenu
    document.querySelectorAll('.selection-btn--content').forEach(btn => {
        btn.addEventListener('click', function() {
            const content = this.dataset.content;
            selectContent(content, this);
        });
    });
    
    // Gestion du sélecteur de personne
    const personSelect = document.getElementById('personSelect');
    if (personSelect) {
        personSelect.addEventListener('change', function() {
            const userId = this.value;
            if (userId) {
                selectedPersonId = userId;
                loadPersonData(userId, window.currentDate);
            } else {
                selectedPersonId = null;
                clearIndividualActivities();
            }
            
            // Ajuster la largeur du select après le changement
            adjustSelectWidth(this);
        });
    }
}

async function selectIndividualDate(date, label, buttonElement = null) {
    console.log(`Sélection de la date individuelle: ${date} (${label})`);
    window.currentDate = date;
    
    // Mettre à jour l'état visuel des boutons
    document.querySelectorAll('.selection-btn--year').forEach(btn => btn.classList.remove('active'));
    if (buttonElement) buttonElement.classList.add('active');
    
    // Charger les travailleurs pour la nouvelle date
    await loadWorkersForDate(date);
    
    // Si une personne est sélectionnée, recharger ses données
    if (selectedPersonId) {
        await loadPersonData(selectedPersonId, date);
    }
}

function selectContent(content, buttonElement = null) {
    console.log(`Sélection du contenu: ${content}`);
    selectedContent = content;
    
    // Mettre à jour l'état visuel des boutons
    document.querySelectorAll('.selection-btn--content').forEach(btn => btn.classList.remove('active'));
    if (buttonElement) buttonElement.classList.add('active');
    
    // Si une personne est sélectionnée, recharger ses données
    if (selectedPersonId) {
        loadPersonData(selectedPersonId, window.currentDate);
    }
}

async function loadWorkersForDate(date) {
    console.log('Chargement des travailleurs pour la date:', date);
    
    try {
        const url = `../../api/responsibilities/individual-view.php?action=get_workers&date=${date}`;
        const data = await apiRequest(url);
        const workers = data.data.workers;
        
        workersData[date] = workers;
        console.log('Travailleurs chargés:', workers);
        
        populatePersonSelect(workers);
        
    } catch (error) {
        console.error('Erreur lors du chargement des travailleurs:', error);
        showMessage('Erreur lors du chargement des travailleurs: ' + error.message, 'error');
    }
}

function populatePersonSelect(workers) {
    console.log('Population du sélecteur de personnes avec:', workers);
    const select = document.getElementById('personSelect');
    
    if (!select) {
        console.error('Élément personSelect non trouvé');
        return;
    }
    
    // Sauvegarder la sélection actuelle
    const currentSelection = select.value;
    
    select.innerHTML = '<option value="">Choisir une personne...</option>';
    
    if (!workers || workers.length === 0) {
        console.warn('Aucun travailleur reçu');
        return;
    }
    
    workers.forEach(worker => {
        const option = document.createElement('option');
        option.value = worker.id;
        option.textContent = worker.display_name;
        select.appendChild(option);
    });
    
    // Restaurer la sélection si la personne existe toujours dans la nouvelle liste
    const workerExists = workers.some(worker => String(worker.id) === String(currentSelection));
    
    if (currentSelection && workerExists) {
        select.value = currentSelection;
        selectedPersonId = currentSelection;
        console.log('✅ Sélection restaurée avec succès:', selectedPersonId);
    } else {
        // Si la personne n'existe plus, réinitialiser la sélection et effacer les activités
        selectedPersonId = null;
        clearIndividualActivities();
        console.log('❌ Sélection réinitialisée car la personne n\'existe plus');
    }
    
    // Ajuster la largeur du select en fonction du contenu
    adjustSelectWidth(select);
}

/**
 * Ajuste la largeur d'un élément select en fonction de l'option la plus longue
 * @param {HTMLSelectElement} select - L'élément select à ajuster
 */
function adjustSelectWidth(select) {
    // Créer un élément temporaire pour mesurer le texte
    const tempElement = document.createElement('span');
    tempElement.style.visibility = 'hidden';
    tempElement.style.position = 'absolute';
    tempElement.style.whiteSpace = 'nowrap';
    tempElement.style.font = window.getComputedStyle(select).font;
    tempElement.style.padding = window.getComputedStyle(select).padding;
    tempElement.style.border = window.getComputedStyle(select).border;
    tempElement.style.boxSizing = 'border-box';
    
    document.body.appendChild(tempElement);
    
    let maxWidth = 0;
    
    // Mesurer chaque option
    for (let option of select.options) {
        tempElement.textContent = option.textContent;
        const optionWidth = tempElement.offsetWidth;
        maxWidth = Math.max(maxWidth, optionWidth);
    }
    
    // Nettoyer l'élément temporaire
    document.body.removeChild(tempElement);
    
    // Appliquer la largeur calculée avec des limites
    const minWidth = 200; // Largeur minimale
    const maxAllowedWidth = 400; // Largeur maximale
    const calculatedWidth = Math.max(minWidth, Math.min(maxWidth + 50, maxAllowedWidth)); // +50 pour l'icône et le padding
    
    select.style.width = `${calculatedWidth}px`;
    console.log(`Largeur du select ajustée à ${calculatedWidth}px`);
}

async function loadPersonData(userId, date) {
    console.log(`Chargement des données pour l'utilisateur ${userId} à la date ${date}`);
    
    try {
        // Charger les données selon le contenu sélectionné
        let activitiesData = [];
        
        if (selectedContent === 'responsibilities') {
            // Charger les activités dont la personne est responsable
            activitiesData = await loadPersonActivities(userId, date);
        } else if (selectedContent === 'tasks') {
            // Charger les activités dont la personne n'est pas responsable mais participe à ses tâches
            activitiesData = await loadPersonOtherActivities(userId, date);
        }
        
        // Afficher le contenu selon la sélection
        displaySelectedContent();
        
    } catch (error) {
        console.error('Erreur lors du chargement des données individuelles:', error);
        showMessage('Erreur lors du chargement des données: ' + error.message, 'error');
    }
}

async function loadPersonActivities(userId, date) {
    const cacheKey = `${userId}-${date}-${selectedContent}`;
    
    if (individualDataCache[cacheKey]) {
        console.log('Données d\'activités en cache pour:', cacheKey);
        return individualDataCache[cacheKey];
    }
    
    try {
        const url = `../../api/responsibilities/individual-view.php?action=get_person_activities&user_id=${userId}&date=${date}`;
        const data = await apiRequest(url);
        const activities = data.data.activities || [];
        
        individualDataCache[cacheKey] = activities;
        console.log('Activités chargées pour l\'utilisateur:', activities);
        
        return activities;
        
    } catch (error) {
        console.error('Erreur lors du chargement des activités:', error);
        throw error;
    }
}

async function loadPersonOtherActivities(userId, date) {
    const cacheKey = `${userId}-${date}-${selectedContent}`;
    
    if (individualDataCache[cacheKey]) {
        console.log('Données d\'activités en cache pour:', cacheKey);
        return individualDataCache[cacheKey];
    }
    
    try {
        const url = `../../api/responsibilities/individual-view.php?action=get_person_other_activities&user_id=${userId}&date=${date}`;
        const data = await apiRequest(url);
        const activities = data.data.activities || [];
        
        individualDataCache[cacheKey] = activities;
        console.log('Activités chargées pour l\'utilisateur:', activities);
        
        return activities;
        
    } catch (error) {
        console.error('Erreur lors du chargement des activités:', error);
        throw error;
    }
}

function displaySelectedContent() {
    if (!selectedPersonId || !window.currentDate) {
        return;
    }
    
    const cacheKey = `${selectedPersonId}-${window.currentDate}-${selectedContent}`;
    const activitiesData = individualDataCache[cacheKey] || [];
    
    const container = document.getElementById('individualActivitiesContainer');
    container.innerHTML = '';
    
    // Trouver les informations de l'utilisateur
    const workers = workersData[window.currentDate] || [];
    const userInfo = workers.find(worker => worker.id == selectedPersonId);
    
    if (!userInfo) {
        showMessage('Informations utilisateur non trouvées', 'error');
        return;
    }
    
    let hasContent = false;
    
    // Afficher selon la sélection - même format pour les deux filtres
    if (activitiesData.length > 0) {
        activitiesData.forEach(item => {
            const card = createActivityWithTasksCard(
                item.activity, 
                item.responsibles, 
                item.tasks, 
                { selectedPersonId }
            );
            container.appendChild(card);
        });
        
        hasContent = true;
    }
    
    // Message si aucune donnée pour le contenu sélectionné
    if (!hasContent) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-state';
        
        const emptyContent = document.createElement('div');
        emptyContent.className = 'empty-content';
        
        const emptyIcon = document.createElement('span');
        emptyIcon.className = 'empty-icon';
        emptyIcon.textContent = '📭';
        
        const emptyTitle = document.createElement('h3');
        const contentType = selectedContent === 'responsibilities' ? 'activité dont vous êtes responsable' : 'activité où vous participez';
        emptyTitle.textContent = `Aucune ${contentType} trouvée pour cette personne à cette période.`;
        
        emptyContent.appendChild(emptyIcon);
        emptyContent.appendChild(emptyTitle);
        emptyMessage.appendChild(emptyContent);
        container.appendChild(emptyMessage);
    }
    
    // Masquer l'état vide
    document.getElementById('individualEmptyState').style.display = 'none';
}

function clearIndividualActivities() {
    const container = document.getElementById('individualActivitiesContainer');
    container.innerHTML = '';
    
    // Afficher l'état vide
    document.getElementById('individualEmptyState').style.display = 'block';
} 