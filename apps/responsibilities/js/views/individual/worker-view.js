// Vue des travailleurs des responsabilités - JavaScript

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
    getWorkerExpandedActivityCard,
    setWorkerExpandedActivityCard,
    clearWorkerExpandedActivityCard,
    getResponsibleForFilter,
    setResponsibleForFilter,
    addEventListener,
    removeEventListener
} from '/modules/store/responsibilities.js';
import { globalStore } from '/modules/store/store.js';
import { updateUserInfo } from '/modules/components/user-info.js';
import { formatActivityNameEscaped, formatTypeName } from '/modules/utils/activity-formatter.js';
import { formatActivityDescription } from '/modules/utils/activity-description.js';
import {
    createActivityCard,
    createTaskCard,
    createActivityWithTasksCard
} from '../../components/activity-card.js';
import { cache } from '/modules/cache/cache.js';
import { DateSelector } from '/modules/components/date-selector.js';
import { showModal } from '/modules/components/modal.js';
import { formatDateForAPI, formatDateLiterary } from '/modules/utils/date-utils.js';
import { formatActivityName } from '/modules/utils/activity-formatter.js';

// Variables spécifiques à la vue des travailleurs
let selectedWorkerId = null; // ID du travailleur sélectionné
let workersData = {}; // Cache des données des travailleurs
let dateSelector = null; // Instance du sélecteur de date
let container = null; // Conteneur de la vue
let selectedDateChangeListener = null; // Écouteur de changement de date
let responsibleForFilterChangeListener = null; // Écouteur de changement de filtre
let workerExpandedActivityCardChangeListener = null; // Écouteur de changement de carte dépliée worker

/**
 * Initialiser la vue des travailleurs
 * @param {HTMLElement} viewContainer - Le conteneur de la vue
 */
export async function initializeWorkerView(viewContainer) {
    console.log('Vue des travailleurs - début de l\'initialisation...');
    container = viewContainer;
    
    try {
        // Initialiser la date dans le store si pas encore définie
        let currentDateFromStore = getSelectedDate();
        if (!currentDateFromStore) {
            setSelectedDate(formatDateForAPI(new Date()));
            currentDateFromStore = formatDateForAPI(new Date());
        }
        
        // Créer les filtres
        const filters = document.createElement('div');
        filters.className = 'view-filters';
        filters.innerHTML = `
            <div class="text-selector">
                <select id="workerSelect" class="select-style">
                    <option value="">Choisir un travailleur...</option>
                </select>
            </div>
            <div class="btn-group-container">
                <button class="btn active" data-content="responsibilities">En responsabilité</button>
                <button class="btn" data-content="tasks">Autres</button>
            </div>
            <div class="spacer"></div>
            <div class="print-button-container">
                <button id="printButton" class="btn btn-icon" title="Imprimer">
                    🖨️
                </button>
            </div>
        `;
        // Ajout dynamique du conteneur du sélecteur de date à la fin des filtres
        const dateSelectorContainer = document.createElement('div');
        filters.appendChild(dateSelectorContainer);
        // Ajouter les filtres directement au conteneur de la vue
        container.appendChild(filters);
        
        // Initialiser le sélecteur de date avec la date du store
        const initialDate = getSelectedDate() || formatDateForAPI(new Date());
        dateSelector = new DateSelector(dateSelectorContainer, {
            initialDate: new Date(initialDate),
            onDateChange: (dateStr) => {
                console.log('DateSelector.onDateChange - nouvelle date:', dateStr);
                setSelectedDate(dateStr);
                // Note: loadWorkersForDate() et loadWorkerData() seront appelés automatiquement par l'écouteur d'événement
            }
        });
        
        // Créer le conteneur des activités
        const workerActivitiesContainer = document.createElement('div');
        workerActivitiesContainer.id = 'workerActivitiesContainer';
        workerActivitiesContainer.className = 'content-cards-container';
        container.appendChild(workerActivitiesContainer);
        
        // Créer l'état vide
        const workerEmptyState = document.createElement('div');
        workerEmptyState.id = 'workerEmptyState';
        workerEmptyState.style.display = 'block';
        workerEmptyState.innerHTML = `
            <h3>Sélectionnez un travailleur</h3>
            <p>Choisissez un travailleur dans la liste pour voir ses activités.</p>
        `;
        container.appendChild(workerEmptyState);
        
        setupEventListeners();
        
        // Ajouter l'écouteur de changement de date
        setupSelectedDateChangeListener();
        
        // Ajouter l'écouteur de changement de filtre
        setupResponsibleForFilterChangeListener();
        
        // Ajouter l'écouteur de changement de carte dépliée worker
        setupWorkerExpandedActivityCardChangeListener();
        
        // Restaurer l'état des boutons de filtre depuis le store
        restoreFilterButtonsState();
        
        // Charger les travailleurs pour la date actuelle
        await loadWorkersForDate(getSelectedDate());
        
        // Afficher le contenu par défaut (responsabilités) si un travailleur est sélectionné
        if (selectedWorkerId) {
            displaySelectedContent();
        }
        
        console.log('Vue des travailleurs initialisée avec succès');
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la vue des travailleurs:', error);
        showMessage('Erreur lors de l\'initialisation de la vue des travailleurs', 'error');
    }
}

function setupEventListeners() {
    // Gestion des boutons de contenu (limités à la vue worker)
    const workerButtonsContainer = container.querySelector('.btn-group-container');
    if (workerButtonsContainer) {
        workerButtonsContainer.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const content = this.dataset.content;
                console.log('setupEventListeners - clic sur bouton:', this.textContent, 'data-content:', content);
                // Mettre à jour directement le store
                setResponsibleForFilter(content);
            });
        });
    }
    
    // Gestion du sélecteur de travailleur
    const workerSelect = document.getElementById('workerSelect');
    if (workerSelect) {
        workerSelect.addEventListener('change', function() {
            const userId = this.value;
            if (userId) {
                selectedWorkerId = userId;
                loadWorkerData(userId, getSelectedDate());
            } else {
                selectedWorkerId = null;
                clearWorkerActivities();
            }
        });
    }
    
    // Gestion du bouton d'impression
    const printButton = document.getElementById('printButton');
    if (printButton) {
        printButton.addEventListener('click', function() {
            console.log('Bouton d\'impression cliqué');
            handlePrintAction();
        });
    }
}



/**
 * Restaurer l'état des boutons de filtre depuis le store
 */
function restoreFilterButtonsState() {
    const currentFilter = getResponsibleForFilter();
    console.log('restoreFilterButtonsState - filtre actuel:', currentFilter);
    
    if (!currentFilter) {
        // Si aucun filtre n'est défini dans le store, utiliser 'responsibilities' par défaut
        console.log('restoreFilterButtonsState - aucun filtre défini, utilisation de la valeur par défaut');
        setResponsibleForFilter('responsibilities');
    }
    // Note: L'état visuel des boutons sera mis à jour automatiquement par l'écouteur du store
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
        const url = `../../api/controllers/responsibilities/worker-controller.php?action=get_workers&date=${dateStr}`;
        
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
    
    // S'assurer que le select utilise les styles partagés
    select.className = 'select-style';
    
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
        
        // Récupérer l'utilisateur courant depuis le store global
        const currentUser = globalStore.getUser();
        
        // Restaurer la sélection si le travailleur existe toujours dans la nouvelle liste
        if (currentSelection && workers.some(worker => String(worker.id) === String(currentSelection))) {
            selectedWorkerId = currentSelection;
            select.value = currentSelection;
            console.log('✅ Sélection restaurée avec succès:', selectedWorkerId);
        } else if (currentUser && currentUser.id) {
            // Si aucun travailleur n'est sélectionné, essayer de sélectionner l'utilisateur courant
            const currentUserExists = workers.some(worker => String(worker.id) === String(currentUser.id));
            if (currentUserExists) {
                selectedWorkerId = String(currentUser.id);
                select.value = selectedWorkerId;
                console.log('✅ Utilisateur courant sélectionné par défaut:', selectedWorkerId);
                // Charger les données du travailleur sélectionné
                loadWorkerData(selectedWorkerId, getSelectedDate());
            } else {
                // Si l'utilisateur courant n'existe pas dans la liste, réinitialiser la sélection
                selectedWorkerId = null;
                clearWorkerActivities();
                console.log('❌ Utilisateur courant non trouvé dans la liste des travailleurs');
            }
        } else {
            // Si le travailleur n'existe plus et pas d'utilisateur courant, réinitialiser la sélection
            selectedWorkerId = null;
            clearWorkerActivities();
            console.log('❌ Sélection réinitialisée car le travailleur n\'existe plus');
        }
    } else {
        // Aucun travailleur disponible
        selectedWorkerId = null;
        clearWorkerActivities();
    }
}

function adjustSelectWidth(select) {
    // Utiliser les classes CSS partagées
    // La classe select-style dans shared.css gère déjà la largeur correctement
    select.classList.add('select-style');
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
        const url = `../../api/controllers/responsibilities/worker-controller.php?action=get_worker_activities&user_id=${userId}&date=${dateStr}&is_responsible=true`;
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
        const url = `../../api/controllers/responsibilities/worker-controller.php?action=get_worker_activities&user_id=${userId}&date=${dateStr}&is_responsible=false`;
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
    if (!selectedWorkerId || !getSelectedDate()) {
        console.log('Aucun travailleur ou date sélectionnée, rien à afficher');
        return;
    }
    
    // S'assurer qu'un filtre est défini
    const currentFilter = getResponsibleForFilter();
    if (!currentFilter) {
        console.log('displaySelectedContent - aucun filtre défini, définition par défaut: responsibilities');
        setResponsibleForFilter('responsibilities');
        // Mettre à jour l'état visuel des boutons (limités à la vue worker)
        const workerButtonsContainer = container.querySelector('.btn-group-container');
        if (workerButtonsContainer) {
            workerButtonsContainer.querySelectorAll('.btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.content === 'responsibilities') {
                    btn.classList.add('active');
                    console.log('displaySelectedContent - bouton par défaut activé: responsibilities');
                }
            });
        }
    }
    
    console.log(`Affichage du contenu pour ${selectedWorkerId} à la date ${getSelectedDate()}, type: ${getResponsibleForFilter()}`);
    
    const dateStr = formatDateForAPI(getSelectedDate());
    const cacheKey = `${selectedWorkerId}-${getSelectedDate()}-${getResponsibleForFilter()}`;
    
    // Récupérer les données du cache
    let activitiesData = [];
    if (getResponsibleForFilter() === 'responsibilities') {
        activitiesData = workersData[`${selectedWorkerId}-${dateStr}-responsible`] || [];
    } else if (getResponsibleForFilter() === 'tasks') {
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
            selectedWorkerId, 
            isGlobalView: false
        };
        
        activitiesData.forEach(item => {
            const card = createActivityCard(item.activity, item.responsibles, item.tasks, workerOptions);
            container.appendChild(card);
        });
        
        // Restaurer l'état des cartes dépliées après l'affichage
        setTimeout(() => {
            restoreExpandedActivityCards();
        }, 10);
        
        document.getElementById('workerEmptyState').style.display = 'none';
    } else {
        console.log(`Aucune activité trouvée pour l'utilisateur ${selectedWorkerId} à la date ${dateStr}`);
        
        // Afficher le message vide
        const emptyState = document.getElementById('workerEmptyState');
        const emptyTitle = emptyState.querySelector('h3');
        
        const currentFilter = getResponsibleForFilter() || 'responsibilities';
        const contentType = currentFilter === 'responsibilities' ? 'responsabilité' : 'tâche';
        emptyTitle.textContent = `Aucune ${contentType} trouvée pour ce travailleur à cette période.`;
        
        emptyState.style.display = 'block';
    }
}

function clearWorkerActivities() {
    const container = document.getElementById('workerActivitiesContainer');
    container.innerHTML = '';
    document.getElementById('workerEmptyState').style.display = 'block';
}

/**
 * Restaurer l'état des cartes d'activité dépliées depuis le store worker
 */
function restoreExpandedActivityCards() {
    console.log('=== RESTAURATION DES CARTES DÉPLIÉES WORKER-VIEW ===');
    console.log('État worker actuel - expandedActivityCard:', getWorkerExpandedActivityCard());
    
    const expandedActivityId = getWorkerExpandedActivityCard();
    if (expandedActivityId) {
        const activityCard = document.querySelector(`[data-card-id="activity-${expandedActivityId}"]`);
        if (activityCard) {
            console.log('Carte d\'activité worker trouvée, restauration...');
            const body = activityCard.querySelector('.content-card-body');
            if (body) {
                body.classList.remove('content-card-body--collapsed');
                body.classList.add('content-card-body--expanded');
                activityCard.classList.add('expanded');
            }
        } else {
            console.log('Carte d\'activité worker non trouvée dans le DOM - pas de restauration');
        }
    }
}

/**
 * Configurer l'écouteur de changement de filtre responsibleForFilter
 */
function setupResponsibleForFilterChangeListener() {
    // Supprimer l'ancien écouteur s'il existe
    if (responsibleForFilterChangeListener) {
        removeEventListener('responsibleForFilter', responsibleForFilterChangeListener);
    }
    
    // Créer le nouvel écouteur
    responsibleForFilterChangeListener = (newFilter) => {
        console.log('Vue worker - Changement de filtre détecté:', newFilter);
        if (newFilter) {
            // Mettre à jour l'état visuel des boutons
            const workerButtonsContainer = container.querySelector('.btn-group-container');
            if (workerButtonsContainer) {
                workerButtonsContainer.querySelectorAll('.btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.content === newFilter) {
                        btn.classList.add('active');
                        console.log('Bouton activé via écouteur store:', btn.dataset.content);
                    }
                });
            }
            
            // Si un travailleur est sélectionné, recharger ses données
            if (selectedWorkerId) {
                loadWorkerData(selectedWorkerId, getSelectedDate());
            }
        }
    };
    
    // Ajouter l'écouteur
    addEventListener('responsibleForFilter', responsibleForFilterChangeListener);
}

/**
 * Configurer l'écouteur de changement de carte dépliée worker
 */
function setupWorkerExpandedActivityCardChangeListener() {
    // Supprimer l'ancien écouteur s'il existe
    if (workerExpandedActivityCardChangeListener) {
        removeEventListener('workerExpandedActivityCard', workerExpandedActivityCardChangeListener);
    }
    
    // Créer le nouvel écouteur
    workerExpandedActivityCardChangeListener = (cardId) => {
        console.log('Vue worker - Changement de carte dépliée worker détecté:', cardId);
        
        // Fermer toutes les cartes de la vue worker d'abord
        const workerContainer = document.getElementById('workerActivitiesContainer');
        if (workerContainer) {
            const allWorkerCards = workerContainer.querySelectorAll('.activity-card');
            allWorkerCards.forEach(card => {
                const body = card.querySelector('.content-card-body');
                if (body) {
                    body.classList.remove('content-card-body--expanded');
                    body.classList.add('content-card-body--collapsed');
                    card.classList.remove('expanded');
                }
            });
        }
        
        // Déplier la carte spécifiée si elle existe dans la vue worker
        if (cardId) {
            const workerContainer = document.getElementById('workerActivitiesContainer');
            if (workerContainer) {
                const targetCard = workerContainer.querySelector(`[data-card-id="activity-${cardId}"]`);
                if (targetCard) {
                    const body = targetCard.querySelector('.content-card-body');
                    if (body) {
                        body.classList.remove('content-card-body--collapsed');
                        body.classList.add('content-card-body--expanded');
                        targetCard.classList.add('expanded');
                        console.log('Carte worker dépliée avec succès:', cardId);
                    }
                } else {
                    console.log('Carte worker non trouvée dans le conteneur worker:', cardId);
                }
            }
        }
    };
    
    // Ajouter l'écouteur
    addEventListener('workerExpandedActivityCard', workerExpandedActivityCardChangeListener);
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
        console.log('Vue worker - Changement de date détecté:', newDate);
        if (newDate) {
            // Mettre à jour le sélecteur de date si nécessaire
            if (dateSelector && dateSelector.setDate) {
                dateSelector.setDate(new Date(newDate));
            }
            // Recharger les travailleurs et les données
            loadWorkersForDate(newDate).then(() => {
                if (selectedWorkerId) {
                    loadWorkerData(selectedWorkerId, newDate);
                }
            });
        }
    };
    
    // Ajouter l'écouteur
    addEventListener('selectedDate', selectedDateChangeListener);
}

/**
 * Gérer l'action d'impression
 */
async function handlePrintAction() {
    if (!selectedWorkerId) {
        showMessage('Veuillez sélectionner un travailleur avant d\'imprimer', 'warning');
        return;
    }
    
    console.log('Action d\'impression pour le travailleur:', selectedWorkerId);
    
    // Récupérer les informations du travailleur
    const dateStr = formatDateForAPI(getSelectedDate());
    const workers = workersData[dateStr] || [];
    const userInfo = workers.find(worker => String(worker.id) === String(selectedWorkerId));
    
    if (!userInfo) {
        showMessage('Impossible de récupérer les informations du travailleur', 'error');
        return;
    }
    
    // Charger les activités en responsabilité
    const responsibleActivities = await loadWorkerActivitiesResponsible(selectedWorkerId, getSelectedDate());
    
    // Charger les activités non-responsable
    const notResponsibleActivities = await loadWorkerActivitiesNotResponsible(selectedWorkerId, getSelectedDate());
    
    // Créer le contenu HTML de la fiche de poste
    const ficheContent = createFichePosteHTML(userInfo, getSelectedDate(), responsibleActivities, notResponsibleActivities);
    
    // Créer le contenu HTML avec le CSS intégré
    const ficheContentWithCSS = `
        <style>
            @import url('../../shared/css/variables.css');
            @import url('../../shared/css/print.css');
        </style>
        ${ficheContent}
    `;
    
    // Afficher le modal
    const modal = showModal(ficheContentWithCSS, {
        title: 'Fiche de poste',
        width: '800px',
        maxWidth: '90vw',
        height: 'auto',
        maxHeight: '90vh'
    });
    
    // Ajouter la fonctionnalité de copie
    setupCopyFunctionality();
}

/**
 * Créer le HTML de la fiche de poste
 */
function createFichePosteHTML(userInfo, date, responsibleActivities, notResponsibleActivities) {
    const dateLiterary = formatDateLiterary(date);
    const firstName = userInfo.first_name || '';
    const lastName = userInfo.last_name || '';
    
    // Utiliser first_name et last_name si disponibles, sinon fallback sur display_name
    const workerName = (firstName && lastName) ? `${firstName} ${lastName}` : (userInfo.display_name || 'Travailleur inconnu');
    
    const html = `
        <!-- Boutons d'action -->
        <div style="position: absolute; top: 10px; right: 50px; display: flex; gap: 10px;">
            <button id="print-button" class="fiche-poste-action-btn" title="Imprimer" style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 5px; border-radius: 3px;">
                🖨️
            </button>
            <button id="copy-button" class="fiche-poste-copy-btn" title="Copier le contenu" style="border: none;">
                📋
            </button>
        </div>
        
        <div class="print">
            <!-- Titre principal -->
            <h1>
                Fiche de poste - ${workerName} - ${dateLiterary}
            </h1>
            
            <!-- Activités en responsabilité -->
            <h2>
                Activités en responsabilité
            </h2>
            ${formatActivitiesList(responsibleActivities)}
            
            <!-- Autres activités -->
            <h2>
                Autres activités
            </h2>
            ${formatActivitiesList(notResponsibleActivities)}
        </div>
    `;
    
    return html;
}

/**
 * Formater la liste des activités
 */
function formatActivitiesList(activities) {
    if (!activities || activities.length === 0) {
        return '<p>Aucune activité trouvée</p>';
    }
    
    const activitiesHTML = activities.map(item => {
        const activity = item.activity;
        const responsibles = item.responsibles || [];
        const tasks = item.tasks || [];
        
        let html = `
            <h3>
                ${formatActivityName(activity, { hideIcon: true })}
            </h3>
        `;
        
        if (activity.description) {
            html += `
                <em>${activity.description}</em>
            `;
        }
        
        // Mapping des types de responsables selon le type d'activité
        const getResponsibleLabel = (activityType) => {
            switch (activityType) {
                case 'pôle':
                    return 'Responsables du pôle :';
                case 'atelier':
                    return 'Responsables de l\'atelier :';
                case 'mandat':
                    return 'Responsables du mandat :';
                case 'projet':
                    return 'Responsables du projet :';
                default:
                    return 'Responsables :';
            }
        };
        
        // Section des responsables
        const responsibleLabel = getResponsibleLabel(activity.type);
        if (responsibles.length > 0) {
            html += `
                <p>
                    <strong>${responsibleLabel}</strong> ${responsibles.map(responsible => responsible.display_name || responsible.name || 'Responsable inconnu').join(', ')}
                </p>
            `;
        } else {
            html += `
                <p>
                    <strong>${responsibleLabel}</strong> Aucun responsable assigné
                </p>
            `;
        }
        
        if (tasks.length > 0) {
            html += `
                <table>
                    <thead>
                        <tr>
                            <th style="width: 50%;">Tâches à réaliser</th>
                            <th style="width: 50%;">Partagé avec</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tasks.map(task => {
                            const assignedTo = task.assigned_to || task.assigned || [];
                            
                            // Filtrer pour exclure le travailleur actuel
                            const otherAssignments = assignedTo.filter(assignment => 
                                String(assignment.id) !== String(selectedWorkerId)
                            );
                            
                            let taskName = `${task.name || 'Tâche sans nom'}`;
                            if (task.description) {
                                taskName += `<br><em>${task.description}</em>`;
                            }
                            
                            const sharedWith = otherAssignments.length > 0 
                                ? otherAssignments.map(assignment => assignment.display_name || assignment.name || 'Assigné inconnu').join(', ')
                                : '-';
                            
                            return `
                                <tr>
                                    <td style="width: 50%;">${taskName}</td>
                                    <td style="width: 50%;">${sharedWith}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        }
        
        return html;
    }).join('');
    
    return activitiesHTML;
}

/**
 * Configurer la fonctionnalité de copie et d'impression
 */
function setupCopyFunctionality() {
    setTimeout(() => {
        const copyButton = document.getElementById('copy-button');
        const printButton = document.getElementById('print-button');
        
        // Configuration du bouton d'impression
        if (printButton) {
            printButton.addEventListener('click', () => {
                try {
                    // Créer une nouvelle fenêtre pour l'impression
                    const printWindow = window.open('', '_blank');
                    const modalContent = document.querySelector('.modal-content');
                    
                    if (modalContent && printWindow) {
                        // Cloner le contenu complet de la modal
                        const contentToPrint = modalContent.cloneNode(true);
                        
                        // Supprimer les boutons d'action et la croix de fermeture
                        const actionButtons = contentToPrint.querySelector('div[style*="position: absolute"]');
                        if (actionButtons) {
                            actionButtons.remove();
                        }
                        
                        // Supprimer la croix de fermeture de la modal
                        const closeButton = contentToPrint.querySelector('.modal-close');
                        if (closeButton) {
                            closeButton.remove();
                        }
                        
                        // Supprimer le titre de la modal (h3)
                        const modalTitle = contentToPrint.querySelector('h3');
                        if (modalTitle) {
                            modalTitle.remove();
                        }
                        
                        // Créer le HTML pour l'impression avec styles optimisés
                        const printHTML = `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <title>Fiche de poste</title>
                                <style>
                                    body {
                                        margin: 0;
                                        padding: 20px;
                                        font-family: Arial, sans-serif;
                                        background: white;
                                    }
                                    @media print {
                                        body { margin: 0; padding: 10px; }
                                    }
                                </style>
                                <link rel="stylesheet" href="../../shared/css/print.css">
                            </head>
                            <body>
                                ${contentToPrint.innerHTML}
                            </body>
                            </html>
                        `;
                        
                        printWindow.document.write(printHTML);
                        printWindow.document.close();
                        
                        // Attendre que le contenu soit chargé puis imprimer
                        printWindow.onload = () => {
                            printWindow.print();
                            printWindow.close();
                        };
                        
                        showMessage('Impression lancée', 'success');
                    }
                } catch (error) {
                    console.error('Erreur lors de l\'impression:', error);
                    showMessage('Erreur lors de l\'impression', 'error');
                }
            });
            
            // Effet hover pour le bouton d'impression
            printButton.addEventListener('mouseenter', () => {
                printButton.style.backgroundColor = '#f8f9fa';
            });
            
            printButton.addEventListener('mouseleave', () => {
                printButton.style.backgroundColor = 'transparent';
            });
        }
        
        // Configuration du bouton de copie
        if (copyButton) {
            copyButton.addEventListener('click', async () => {
                try {
                    // Trouver le contenu de la modal
                    const modalContent = document.querySelector('.modal-content');
                    if (modalContent) {
                        // Créer une copie du contenu
                        const contentToCopy = modalContent.cloneNode(true);
                        
                        // Supprimer le bouton de copie
                        const copyBtn = contentToCopy.querySelector('#copy-button');
                        if (copyBtn) {
                            copyBtn.remove();
                        }
                        
                        // Supprimer le bouton de fermeture de la modal (×)
                        const closeBtn = contentToCopy.querySelector('.modal-close');
                        if (closeBtn) {
                            closeBtn.remove();
                        }
                        
                        // Supprimer le titre de la modal (h3)
                        const modalTitle = contentToCopy.querySelector('h3');
                        if (modalTitle) {
                            modalTitle.remove();
                        }
                        
                        // Nettoyer les styles
                        function cleanStyles(element) {
                            // Supprimer les attributs style et class
                            element.removeAttribute('style');
                            element.removeAttribute('class');
                            
                            // Appliquer la couleur noire directement
                            element.style.color = '#000000';
                            
                            // Nettoyer les enfants
                            for (let child of element.children) {
                                cleanStyles(child);
                            }
                        }
                        
                        // Nettoyer tous les éléments
                        cleanStyles(contentToCopy);
                        
                        // Récupérer le HTML nettoyé
                        const htmlContent = contentToCopy.outerHTML;
                        
                        // Créer un objet ClipboardItem avec HTML et texte
                        const clipboardItem = new ClipboardItem({
                            'text/html': new Blob([htmlContent], { type: 'text/html' }),
                            'text/plain': new Blob([extractTextContent(contentToCopy)], { type: 'text/plain' })
                        });
                        
                        // Copier avec mise en page HTML
                        await navigator.clipboard.write([clipboardItem]);
                        
                        // Feedback visuel
                        copyButton.textContent = '✅';
                        copyButton.title = 'Copié !';
                        
                        setTimeout(() => {
                            copyButton.textContent = '📋';
                            copyButton.title = 'Copier le contenu';
                        }, 2000);
                        
                        showMessage('Contenu copié avec mise en page', 'success');
                    }
                } catch (error) {
                    console.error('Erreur lors de la copie:', error);
                    // Fallback vers la méthode texte simple
                    try {
                        const modalContent = document.querySelector('.modal-content');
                        if (modalContent) {
                            const contentToCopy = modalContent.cloneNode(true);
                            
                            // Supprimer les éléments indésirables
                            const copyBtn = contentToCopy.querySelector('#copy-button');
                            if (copyBtn) copyBtn.remove();
                            
                            const closeBtn = contentToCopy.querySelector('.modal-close');
                            if (closeBtn) closeBtn.remove();
                            
                            const modalTitle = contentToCopy.querySelector('h3');
                            if (modalTitle) modalTitle.remove();
                            
                            const textContent = extractTextContent(contentToCopy);
                            await navigator.clipboard.writeText(textContent);
                            showMessage('Contenu copié (texte seulement)', 'info');
                        }
                    } catch (fallbackError) {
                        console.error('Erreur lors de la copie de fallback:', fallbackError);
                        showMessage('Erreur lors de la copie', 'error');
                    }
                }
            });
            
            // Effet hover
            copyButton.addEventListener('mouseenter', () => {
                copyButton.style.backgroundColor = '#f8f9fa';
            });
            
            copyButton.addEventListener('mouseleave', () => {
                copyButton.style.backgroundColor = 'transparent';
            });
        }
    }, 100);
}

/**
 * Extraire le contenu texte rendu d'un élément HTML
 */
function extractTextContent(element) {
    let text = '';
    
    // Fonction récursive pour parcourir tous les éléments
    function extractText(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const trimmed = node.textContent.trim();
            if (trimmed) {
                text += trimmed + ' ';
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Gérer les sauts de ligne pour certains éléments
            const tagName = node.tagName.toLowerCase();
            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'li'].includes(tagName)) {
                if (text && !text.endsWith('\n')) {
                    text += '\n';
                }
            }
            
            // Parcourir les enfants
            for (let child of node.childNodes) {
                extractText(child);
            }
            
            // Ajouter un saut de ligne après certains éléments
            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div'].includes(tagName)) {
                if (!text.endsWith('\n')) {
                    text += '\n';
                }
            }
        }
    }
    
    extractText(element);
    
    // Nettoyer le texte final
    return text
        .replace(/\n\s*\n/g, '\n') // Supprimer les lignes vides multiples
        .replace(/\s+$/gm, '') // Supprimer les espaces en fin de ligne
        .trim();
}



