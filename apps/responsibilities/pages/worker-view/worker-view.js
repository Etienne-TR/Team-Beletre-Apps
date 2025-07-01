// Vue des travailleurs des responsabilités - JavaScript

// Import des modules ES6
import { 
    checkAuthAndLoadData, 
    showMessage, 
    apiRequest,
    createResponsibleBadge,
    createAssignmentBadge
} from '../../services/shared.js';
import { getDate, setDate } from '/modules/store/responsibilities.js';
import { appStore } from '/modules/store/store.js';
import { createAppHeader } from '/modules/components/app-header.js';
import { updateUserInfo } from '/modules/components/user-info.js';
import { formatActivityNameEscaped, formatTypeName } from '/modules/utils/activity-formatter.js';
import { formatActivityDescription } from '/modules/utils/activity-description.js';
import { 
    createActivityCard,
    createTaskCard,
    createActivityWithTasksCard
} from '/apps/responsibilities/components/activity-card.js';
import { cache } from '/modules/cache/cache.js';
import { DateSelector } from '/modules/components/date-selector.js';
import { formatDateForAPI } from '/modules/utils/date-utils.js';

// Variables spécifiques à la vue des travailleurs
let selectedWorkerId = null; // ID du travailleur sélectionné
let selectedContent = 'responsibilities'; // Type de contenu sélectionné
let workersData = {}; // Cache des données des travailleurs
let dateSelector = null; // Instance du sélecteur de date

// Initialisation
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Vue des travailleurs - début de l\'initialisation...');
    
    try {
        const authSuccess = await checkAuthAndLoadData();
        if (authSuccess) {
            // Initialiser la date dans le store si pas encore définie
            let currentDateFromStore = getDate();
            if (!currentDateFromStore) {
                setDate(formatDateForAPI(new Date()));
                currentDateFromStore = formatDateForAPI(new Date());
            }
            
            // Créer les filtres
            const filters = document.createElement('div');
            filters.className = 'filters';
            filters.innerHTML = `
                <div class="worker-selector">
                    <select id="workerSelect" class="select-style">
                        <option value="">Choisir un travailleur...</option>
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
                '../../index.html',
                'currentUserWorker',
                'app-view',
                filters
            );
            headerContainer.appendChild(header);
            
            // Initialiser le sélecteur de date avec la date du store
            const initialDate = getDate() || formatDateForAPI(new Date());
            dateSelector = new DateSelector(dateSelectorContainer, {
                initialDate: new Date(initialDate),
                onDateChange: (dateStr) => {
                    console.log('DateSelector.onDateChange - nouvelle date:', dateStr);
                    // Le DateSelector passe déjà une chaîne formatée YYYY-MM-DD
                    setDate(dateStr);
                    loadWorkersForDate(dateStr).then(() => {
                        if (selectedWorkerId) {
                            loadWorkerData(selectedWorkerId, dateStr);
                        }
                    });
                }
            });
            
            // Mettre à jour les informations utilisateur après la création du header
            updateUserInfo(appStore.getCurrentUser());
            
            document.getElementById('workerPage').style.display = 'block';
            document.getElementById('loadingSection').style.display = 'none';
            
            setupEventListeners();
            
            // Charger les travailleurs pour la date actuelle
            await loadWorkersForDate(getDate());
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
    
    // Gestion du sélecteur de travailleur
    const workerSelect = document.getElementById('workerSelect');
    if (workerSelect) {
        workerSelect.addEventListener('change', function() {
            const userId = this.value;
            if (userId) {
                selectedWorkerId = userId;
                loadWorkerData(userId, getDate());
            } else {
                selectedWorkerId = null;
                clearWorkerActivities();
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
    
    // Si un travailleur est sélectionné, recharger ses données
    if (selectedWorkerId) {
        loadWorkerData(selectedWorkerId, getDate());
    }
}

async function loadWorkersForDate(date) {
    // Toujours envoyer la date au format YYYY-MM-DD
    const dateStr = formatDateForAPI(date);
    console.log('Chargement des travailleurs pour la date:', dateStr);
    
    try {
        // Vérifier le cache d'abord
        if (cache.api.workers.has(dateStr)) {
            console.log('Travailleurs en cache pour la date:', dateStr);
            const workers = cache.api.workers.get(dateStr);
            workersData[dateStr] = workers; // Garder la compatibilité avec le code existant
            populateWorkerSelect(workers);
            return;
        }
        
        // Construction de l'URL d'API
        console.log('Appel API get_workers avec date=', dateStr);
        const url = `../../api/responsibilities/worker-view/worker-view.php?action=get_workers&date=${dateStr}`;
        
        // Appel API
        try {
            const data = await apiRequest(url);
            
            // Vérifier la structure de la réponse
            if (!data || !data.data || !Array.isArray(data.data.workers)) {
                console.error('Structure de réponse invalide:', data);
                workersData[dateStr] = []; // Initialiser comme tableau vide en cas d'erreur
                populateWorkerSelect([]);
                return;
            }
            
            const workers = data.data.workers;
            
            // Stocker dans le cache global
            cache.api.workers.set(dateStr, workers);
            workersData[dateStr] = workers; // Garder la compatibilité avec le code existant
            console.log(`${workers.length} travailleurs chargés pour la date ${dateStr}:`, workers);
            
            // Vérifier si le travailleur sélectionné existe toujours à cette date
            if (selectedWorkerId) {
                const userExists = workers.some(worker => String(worker.id) === String(selectedWorkerId));
                if (!userExists) {
                    console.log(`L'utilisateur ${selectedWorkerId} n'existe pas à la date ${dateStr}`);
                    showMessage(`Le travailleur sélectionné n'a pas de contrat actif à cette date`, 'warning');
                    selectedWorkerId = null; // Réinitialiser la sélection si l'utilisateur n'existe plus à cette date
                    clearWorkerActivities();
                }
            }
            
            populateWorkerSelect(workers);
            
        } catch (apiError) {
            console.error('Erreur lors de l\'appel API get_workers:', apiError);
            workersData[dateStr] = []; // Initialiser comme tableau vide en cas d'erreur
            populateWorkerSelect([]);
            showMessage('Erreur lors du chargement des travailleurs', 'error');
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement des travailleurs:', error);
        workersData[dateStr] = []; // Initialiser comme tableau vide en cas d'erreur
        populateWorkerSelect([]);
        showMessage('Erreur lors du chargement des travailleurs', 'error');
    }
}

function populateWorkerSelect(workers) {
    console.log('Population du sélecteur de travailleurs avec:', workers);
    const select = document.getElementById('workerSelect');
    
    if (!select) {
        console.error('Élément workerSelect non trouvé');
        return;
    }
    
    // Sauvegarder la sélection actuelle
    const currentSelection = selectedWorkerId;
    
    // Vider le select
    select.innerHTML = '<option value="">Choisir un travailleur...</option>';
    
    // Ajouter les options
    if (workers && workers.length > 0) {
        workers.forEach(worker => {
            const option = document.createElement('option');
            option.value = worker.id;
            option.textContent = worker.display_name;
            select.appendChild(option);
        });
        
        // Restaurer la sélection si le travailleur existe toujours dans la nouvelle liste
        if (currentSelection && workers.some(worker => String(worker.id) === String(currentSelection))) {
            selectedWorkerId = currentSelection;
            select.value = currentSelection;
            console.log('✅ Sélection restaurée avec succès:', selectedWorkerId);
        } else {
            // Si le travailleur n'existe plus, réinitialiser la sélection et effacer les activités
            selectedWorkerId = null;
            clearWorkerActivities();
            console.log('❌ Sélection réinitialisée car le travailleur n\'existe plus');
        }
    } else {
        // Aucun travailleur disponible
        selectedWorkerId = null;
        clearWorkerActivities();
    }
    
    // Ajuster la largeur du select
    adjustSelectWidth(select);
}

function adjustSelectWidth(select) {
    // Ajuster la largeur du select en fonction du contenu
    const tempOption = document.createElement('option');
    tempOption.textContent = select.options[select.selectedIndex]?.textContent || 'Choisir un travailleur...';
    select.appendChild(tempOption);
    const width = tempOption.offsetWidth + 20; // Ajouter un peu d'espace
    select.style.width = `${width}px`;
    select.removeChild(tempOption);
}

async function loadWorkerData(userId, date) {
    console.log(`Chargement des données pour le travailleur ${userId} à la date ${date}`);
    
    try {
        // Charger les activités en responsabilité
        const responsibleActivities = await loadWorkerActivitiesResponsible(userId, date);
        
        // Charger les activités non-responsable
        const notResponsibleActivities = await loadWorkerActivitiesNotResponsible(userId, date);
        
        // Afficher le contenu sélectionné
        displaySelectedContent();
        
    } catch (error) {
        console.error('Erreur lors du chargement des données du travailleur:', error);
        showMessage('Erreur lors du chargement des données', 'error');
    }
}

async function loadWorkerActivitiesResponsible(userId, date) {
    const dateStr = formatDateForAPI(date);
    console.log(`Chargement des activités en responsabilité pour ${userId} à la date ${dateStr}`);
    
    try {
        const url = `../../api/responsibilities/worker-view/worker-view.php?action=get_worker_activities&user_id=${userId}&date=${dateStr}&is_responsible=true`;
        const data = await apiRequest(url);
        
        if (data && data.data && Array.isArray(data.data.activities)) {
            workersData[`${userId}-${dateStr}-responsible`] = data.data.activities;
            console.log(`${data.data.activities.length} activités en responsabilité chargées pour ${userId}`);
            return data.data.activities;
        } else {
            console.warn('Aucune activité en responsabilité trouvée ou structure invalide');
            workersData[`${userId}-${dateStr}-responsible`] = [];
            return [];
        }
    } catch (error) {
        console.error('Erreur lors du chargement des activités en responsabilité:', error);
        workersData[`${userId}-${dateStr}-responsible`] = [];
        return [];
    }
}

async function loadWorkerActivitiesNotResponsible(userId, date) {
    const dateStr = formatDateForAPI(date);
    console.log(`Chargement des activités non-responsable pour ${userId} à la date ${dateStr}`);
    
    try {
        const url = `../../api/responsibilities/worker-view/worker-view.php?action=get_worker_activities&user_id=${userId}&date=${dateStr}&is_responsible=false`;
        const data = await apiRequest(url);
        
        if (data && data.data && Array.isArray(data.data.activities)) {
            workersData[`${userId}-${dateStr}-not_responsible`] = data.data.activities;
            console.log(`${data.data.activities.length} activités non-responsable chargées pour ${userId}`);
            return data.data.activities;
        } else {
            console.warn('Aucune activité non-responsable trouvée ou structure invalide');
            workersData[`${userId}-${dateStr}-not_responsible`] = [];
            return [];
        }
    } catch (error) {
        console.error('Erreur lors du chargement des activités non-responsable:', error);
        workersData[`${userId}-${dateStr}-not_responsible`] = [];
        return [];
    }
}

function displaySelectedContent() {
    if (!selectedWorkerId || !getDate()) {
        console.log('Aucun travailleur ou date sélectionnée, rien à afficher');
        return;
    }
    
    console.log(`Affichage du contenu pour ${selectedWorkerId} à la date ${getDate()}, type: ${selectedContent}`);
    
    const dateStr = formatDateForAPI(getDate());
    const cacheKey = `${selectedWorkerId}-${getDate()}-${selectedContent}`;
    
    // Récupérer les données du cache
    let activitiesData = [];
    if (selectedContent === 'responsibilities') {
        activitiesData = workersData[`${selectedWorkerId}-${dateStr}-responsible`] || [];
    } else if (selectedContent === 'tasks') {
        activitiesData = workersData[`${selectedWorkerId}-${dateStr}-not_responsible`] || [];
    }
    
    // Récupérer les informations du travailleur
    const workers = workersData[dateStr] || [];
    const userInfo = workers.find(worker => String(worker.id) === String(selectedWorkerId));
    
    if (!userInfo) {
        console.warn(`Informations utilisateur non trouvées pour l'ID: ${selectedWorkerId} à la date ${dateStr}`);
        return;
    }
    
    // Vider le conteneur des activités dans tous les cas
    const container = document.getElementById('workerActivitiesContainer');
    container.innerHTML = '';
    
    // Afficher les activités
    if (activitiesData.length > 0) {
        console.log(`Affichage de ${activitiesData.length} activités pour l'utilisateur ${selectedWorkerId}`);
        
        // Créer les cartes d'activités avec les options spécifiques à la vue travailleur
        const workerOptions = {
            selectedWorkerId, isGlobalView: false
        };
        
        activitiesData.forEach(item => {
            const card = createActivityCard(item.activity, item.responsibles, item.tasks, workerOptions);
            container.appendChild(card);
        });
        
        document.getElementById('workerEmptyState').style.display = 'none';
    } else {
        console.log(`Aucune activité trouvée pour l'utilisateur ${selectedWorkerId} à la date ${dateStr}`);
        
        // Afficher le message vide
        const emptyState = document.getElementById('workerEmptyState');
        const emptyTitle = emptyState.querySelector('h3');
        
        const contentType = selectedContent === 'responsibilities' ? 'responsabilité' : 'tâche';
        emptyTitle.textContent = `Aucune ${contentType} trouvée pour ce travailleur à cette période.`;
        
        emptyState.style.display = 'block';
    }
}

function clearWorkerActivities() {
    const container = document.getElementById('workerActivitiesContainer');
    container.innerHTML = '';
    document.getElementById('workerEmptyState').style.display = 'block';
}