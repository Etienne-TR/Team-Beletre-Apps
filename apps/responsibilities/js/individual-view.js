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
import { formatActivityNameEscaped, formatTypeName } from '../../../modules/utils/activity-formatter.js';
import { formatActivityDescription } from '../../../modules/utils/activity-description.js';
import { 
    createActivityCard,
    createTaskCard,
    createActivityWithTasksCard
} from './activity-card.js';
import { cache } from '../../../modules/cache/cache.js';
import { DateSelector } from '../../../modules/ui/date-selector.js';

// Variables spécifiques à la vue individuelle
let selectedPersonId = null; // ID de la personne sélectionnée
let selectedContent = 'responsibilities'; // Type de contenu sélectionné
let workersData = {}; // Cache des données individuelles
let dateSelector = null; // Instance du sélecteur de date

/**
 * Formatage de date au format API (YYYY-MM-DD)
 */
function formatDateAPI(date) {
    if (!date) return '';
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date; // Déjà au bon format
    }
    const d = new Date(date);
    return d.toISOString().slice(0, 10);
}

// Initialisation
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Vue individuelle - début de l\'initialisation...');
    
    try {
        const authSuccess = await checkAuthAndLoadData();
        if (authSuccess) {
            // S'assurer que window.currentDate est défini correctement
            if (!window.currentDate || typeof window.currentDate !== 'string') {
                window.currentDate = formatDateAPI(new Date());
                console.log('window.currentDate initialisé à:', window.currentDate);
            }
            
            // Créer les filtres
            const filters = document.createElement('div');
            filters.className = 'filters';
            filters.innerHTML = `
                <div class="person-selector">
                    <select id="personSelect" class="select-style">
                        <option value="">Choisir une personne...</option>
                    </select>
                </div>
                <div class="content-buttons btn-group-container">
                    <button class="btn selection-btn selection-btn--content active" data-content="responsibilities">En responsabilité</button>
                    <button class="btn selection-btn selection-btn--content" data-content="tasks">Autres</button>
                </div>
            `;
            // Ajout dynamique du conteneur du sélecteur de date à la fin des filtres
            const dateSelectorContainer = document.createElement('div');
            dateSelectorContainer.id = 'dateSelectorContainer';
            filters.appendChild(dateSelectorContainer);
            
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
            
            // Initialiser le sélecteur de date
            dateSelector = new DateSelector(dateSelectorContainer, {
                initialDate: window.currentDate || new Date(),
                onDateChange: (newDate) => {
                    console.log('DateSelector.onDateChange - nouvelle date:', newDate);
                    window.currentDate = newDate;
                    loadWorkersForDate(newDate).then(() => {
                        if (selectedPersonId) {
                            loadPersonData(selectedPersonId, newDate);
                        }
                    });
                }
            });
            
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
    // Toujours envoyer la date au format YYYY-MM-DD
    const dateStr = formatDateAPI(date);
    console.log('Chargement des travailleurs pour la date:', dateStr);
    
    try {
        // Vérifier le cache d'abord
        if (cache.api.workers.has(dateStr)) {
            console.log('Travailleurs en cache pour la date:', dateStr);
            const workers = cache.api.workers.get(dateStr);
            workersData[dateStr] = workers; // Garder la compatibilité avec le code existant
            populatePersonSelect(workers);
            return;
        }
        
        // Construction de l'URL d'API
        console.log('Appel API get_workers avec date=', dateStr);
        const url = `../../api/responsibilities/individual-view.php?action=get_workers&date=${dateStr}`;
        
        // Appel API
        try {
            const data = await apiRequest(url);
            
            // Vérifier la structure de la réponse
            if (!data || !data.data || !Array.isArray(data.data.workers)) {
                console.error('Structure de réponse invalide:', data);
                workersData[dateStr] = []; // Initialiser comme tableau vide en cas d'erreur
                populatePersonSelect([]);
                return;
            }
            
            const workers = data.data.workers;
            
            // Stocker dans le cache global
            cache.api.workers.set(dateStr, workers);
            workersData[dateStr] = workers; // Garder la compatibilité avec le code existant
            console.log(`${workers.length} travailleurs chargés pour la date ${dateStr}:`, workers);
            
            // Vérifier si la personne sélectionnée existe toujours à cette date
            if (selectedPersonId) {
                const userExists = workers.some(worker => String(worker.id) === String(selectedPersonId));
                if (!userExists) {
                    console.log(`L'utilisateur ${selectedPersonId} n'existe pas à la date ${dateStr}`);
                    showMessage(`La personne sélectionnée n'a pas de contrat actif à cette date`, 'warning');
                    selectedPersonId = null; // Réinitialiser la sélection si l'utilisateur n'existe plus à cette date
                }
            }
            
            populatePersonSelect(workers);
            
        } catch (apiError) {
            console.error('Erreur API lors du chargement des travailleurs:', apiError);
            showMessage('Erreur lors de l\'appel API: ' + apiError.message, 'error');
            
            // Initialiser avec un tableau vide en cas d'erreur
            workersData[dateStr] = [];
            populatePersonSelect([]);
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement des travailleurs:', error);
        showMessage('Erreur lors du chargement des travailleurs: ' + error.message, 'error');
        
        // Initialiser avec un tableau vide en cas d'erreur
        workersData[dateStr] = [];
        populatePersonSelect([]);
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
    for (let option of select.options) {
        tempElement.textContent = option.textContent;
        const optionWidth = tempElement.offsetWidth;
        maxWidth = Math.max(maxWidth, optionWidth);
    }
    document.body.removeChild(tempElement);
    // Largeur min 150px, max = largeur du parent
    const minWidth = 150;
    const parent = select.parentElement;
    const parentWidth = parent ? parent.offsetWidth : 400;
    const calculatedWidth = Math.max(minWidth, Math.min(maxWidth + 50, parentWidth));
    select.style.width = calculatedWidth + 'px';
    select.style.maxWidth = '100%';
}

async function loadPersonData(userId, date) {
    const dateStr = date instanceof Date ? date.toISOString().slice(0, 10) : date;
    console.log(`Chargement des données pour l'utilisateur ${userId} à la date ${dateStr}`);
    
    try {
        // Vérifions d'abord que l'utilisateur existe encore à cette date
        const workers = workersData[dateStr] || [];
        const userExists = workers.some(worker => String(worker.id) === String(userId));
        
        if (!userExists) {
            console.warn(`L'utilisateur ${userId} n'existe pas dans la liste des travailleurs pour la date ${dateStr}`);
            clearIndividualActivities();
            return;
        }
        
        // Charger les données selon le contenu sélectionné
        let activitiesData = [];
        if (selectedContent === 'responsibilities') {
            activitiesData = await loadWorkerActivitiesResponsible(userId, dateStr);
        } else if (selectedContent === 'tasks') {
            activitiesData = await loadWorkerActivitiesNotResponsible(userId, dateStr);
        }
        
        // S'assurer que window.currentDate est correctement défini
        if (window.currentDate !== dateStr) {
            console.log(`Mise à jour de la date courante: ${dateStr} (était ${window.currentDate})`);
            window.currentDate = dateStr;
        }
        
        // Afficher les données chargées
        displaySelectedContent();
        
    } catch (error) {
        console.error('Erreur lors du chargement des données individuelles:', error);
        showMessage('Erreur lors du chargement des données: ' + error.message, 'error');
    }
}

async function loadWorkerActivitiesResponsible(userId, date) {
    const dateStr = date instanceof Date ? date.toISOString().slice(0, 10) : date;
    const cacheKey = `${userId}-${dateStr}-responsibilities`;
    if (cache.api.activities.has(cacheKey)) {
        console.log('Données d\'activités en cache pour:', cacheKey);
        return cache.api.activities.get(cacheKey);
    }
    try {
        const url = `../../api/responsibilities/individual-view.php?action=get_worker_activities&user_id=${userId}&date=${dateStr}&is_responsible=true`;
        const data = await apiRequest(url);
        const activities = data.data.activities || [];
        cache.api.activities.set(cacheKey, activities);
        console.log('Activités (responsable) chargées pour l\'utilisateur:', activities);
        return activities;
    } catch (error) {
        console.error('Erreur lors du chargement des activités (responsable):', error);
        throw error;
    }
}

async function loadWorkerActivitiesNotResponsible(userId, date) {
    const dateStr = date instanceof Date ? date.toISOString().slice(0, 10) : date;
    const cacheKey = `${userId}-${dateStr}-tasks`;
    if (cache.api.activities.has(cacheKey)) {
        console.log('Données d\'activités en cache pour:', cacheKey);
        return cache.api.activities.get(cacheKey);
    }
    try {
        const url = `../../api/responsibilities/individual-view.php?action=get_worker_activities&user_id=${userId}&date=${dateStr}&is_responsible=false`;
        const data = await apiRequest(url);
        const activities = data.data.activities || [];
        cache.api.activities.set(cacheKey, activities);
        console.log('Activités (non responsable) chargées pour l\'utilisateur:', activities);
        return activities;
    } catch (error) {
        console.error('Erreur lors du chargement des activités (non responsable):', error);
        throw error;
    }
}

function displaySelectedContent() {
    if (!selectedPersonId || !window.currentDate) {
        console.log('Aucune personne ou date sélectionnée, rien à afficher');
        return;
    }
    
    console.log(`Affichage du contenu pour ${selectedPersonId} à la date ${window.currentDate}, type: ${selectedContent}`);
    
    // Récupérer les données d'activités du cache
    const cacheKey = `${selectedPersonId}-${window.currentDate}-${selectedContent}`;
    const activitiesData = cache.api.activities.get(cacheKey) || [];
    
    // Effacer le conteneur actuel
    const container = document.getElementById('individualActivitiesContainer');
    container.innerHTML = '';
    
    // Trouver les informations de l'utilisateur
    const dateStr = window.currentDate;
    const workers = workersData[dateStr] || [];
    
    // Vérifier si l'utilisateur existe à cette date
    const userInfo = workers.find(worker => String(worker.id) === String(selectedPersonId));
    
    if (!userInfo) {
        console.warn(`Informations utilisateur non trouvées pour l'ID: ${selectedPersonId} à la date ${dateStr}`);
        console.log('Liste des travailleurs disponibles:', workers.map(w => w.id));
        clearIndividualActivities();
        return;
    }
    
    let hasContent = false;
    
    // Afficher les activités
    if (activitiesData && activitiesData.length > 0) {
        console.log(`Affichage de ${activitiesData.length} activités pour l'utilisateur ${selectedPersonId}`);
        
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
    } else {
        console.log(`Aucune activité trouvée pour l'utilisateur ${selectedPersonId} à la date ${dateStr}`);
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