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
import { formatDateForAPI } from '/modules/utils/date-utils.js';

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

