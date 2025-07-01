// Éditeur d'activités - JavaScript principal

// Import des modules ES6
import { 
    checkAuthAndLoadData, 
    showMessage, 
    apiRequest
} from '../../services/shared.js';
import { createAppHeader } from '/modules/components/app-header.js';
import { updateUserInfo } from '/modules/components/user-info.js';
import { formatActivityName, formatTypeName, formatActivityNameEscaped } from '/modules/utils/activity-formatter.js';
import { DateSelector } from '/modules/components/date-selector.js';
import { appStore } from '/modules/store/store.js';
import { getDate, setDate } from '/modules/store/responsibilities.js';
import { formatDateForAPI, formatPeriodLiterary } from '/modules/utils/date-utils.js';

// Variables globales
let selectedType = 'atelier'; // Type par défaut
let availableTypes = [];
let availableWorkers = [];
let activities = [];
let selectedActivity = null;
let currentEditingTask = null;
let isNewActivity = false;
let dateSelector = null;
let responsibleChanges = {};

console.log('=== INITIALISATION EDITOR ===');

/**
 * Initialiser l'éditeur
 */
async function initializeEditor() {
    console.log('=== DÉBUT INITIALISATION ÉDITEUR ===');
    
    // Initialiser la date dans le store si pas encore définie
    const currentDateFromStore = getDate();
    if (!currentDateFromStore) {
        setDate(formatDateForAPI(new Date()));
    }
    
    // Charger les types d'activités EN PREMIER
    console.log('Chargement des types d\'activités...');
    await loadActivityTypes();
    console.log('Types chargés:', availableTypes.length);
    
    // Créer le header avec filtres (après avoir chargé les types)
    console.log('Création du header avec filtres...');
    createHeaderWithFilters();
    
    // Charger les activités
    console.log('Chargement des activités...');
    await loadActivities();
    console.log('Activités chargées:', activities.length);
    
    // Appliquer le filtre "atelier" par défaut
    selectType('atelier');
    
    // Afficher les activités
    console.log('Affichage des activités...');
    displayActivities();
    
    // Restaurer l'état des cartes dépliées
    restoreExpandedCards();
    
    // Afficher la page principale
    document.getElementById('editorPage').style.display = 'block';
    document.getElementById('loadingSection').style.display = 'none';
    
    // Mettre à jour les informations utilisateur
    updateUserInfo(appStore.getCurrentUser());
    
    console.log('=== FIN INITIALISATION ÉDITEUR ===');
}

/**
 * Restaurer l'état des cartes dépliées depuis le store
 */
function restoreExpandedCards() {
    // Restaurer la carte d'activité dépliée
    const expandedActivityId = appStore.getExpandedActivityCard();
    if (expandedActivityId) {
        const activityCard = document.querySelector(`[data-activity-id="${expandedActivityId}"]`);
        if (activityCard) {
            const body = activityCard.querySelector('.content-card-body');
            if (body) {
                body.style.display = 'block'; // Afficher le body
                activityCard.classList.add('expanded'); // Appliquer sur la carte
                
                // Charger les données si pas encore fait
                const detailsContent = body.querySelector('.activity-details-content');
                if (detailsContent && !activityCard.dataset.responsiblesLoaded) {
                    const activity = activities.find(a => a.entry === expandedActivityId);
                    if (activity) {
                        loadResponsiblesForCard(activityCard, activity, detailsContent);
                    }
                }
            }
        }
    }
    
    // Restaurer la carte de tâche dépliée
    const expandedTaskId = appStore.getExpandedTaskCard();
    if (expandedTaskId) {
        const taskItem = document.querySelector(`[data-task-id="${expandedTaskId}"]`);
        if (taskItem) {
            const expandableContent = taskItem.querySelector('.task-expandable-content');
            if (expandableContent) {
                expandableContent.classList.add('expanded');
                taskItem.classList.add('expanded');
                
                // Charger les assignations si pas encore fait
                const assignedList = expandableContent.querySelector('.assigned-workers-list');
                if (assignedList && !taskItem.dataset.assignmentsLoaded) {
                    loadTaskAssignments(expandedTaskId, assignedList);
                    taskItem.dataset.assignmentsLoaded = 'true';
                }
            }
        }
    }
}

/**
 * Créer le header avec filtres (comme dans global-view)
 */
function createHeaderWithFilters() {
    const headerContainer = document.getElementById('appHeader');
    
    // Créer les filtres
    const filters = document.createElement('div');
    filters.className = 'filters';
    filters.innerHTML = `
        <div class="type-buttons btn-group-container">
            <!-- Les boutons de type seront générés dynamiquement -->
        </div>
    `;
    
    // Ajout dynamique du conteneur du sélecteur de date
    const dateSelectorContainer = document.createElement('div');
    dateSelectorContainer.id = 'dateSelectorContainer';
    filters.appendChild(dateSelectorContainer);
    
    // Déterminer l'emoji à afficher dans le header
    let activityEmoji = '📋';
    if (activities && activities.length > 0 && activities[0].icon) {
        activityEmoji = activities[0].icon;
    }
    
    // Créer le header dynamiquement avec l'emoji d'activité
    const header = createAppHeader(
        `${activityEmoji} Édition des activités`,
        '../../index.html',
        'currentUserEditor',
        'app-view',
        filters
    );
    headerContainer.appendChild(header);
    
    // Initialiser le sélecteur de date
    const currentDateFromStore = getDate() || formatDateForAPI(new Date());
    dateSelector = new DateSelector(dateSelectorContainer, {
        initialDate: new Date(currentDateFromStore),
        onDateChange: (dateStr) => {
            // Le DateSelector passe déjà une chaîne formatée YYYY-MM-DD
            setDate(dateStr);
            console.log('Date sélectionnée via sélecteur :', dateStr);
            
            loadActivities().then(() => {
                displayActivities();
                // Restaurer l'état des cartes dépliées pour la nouvelle date
                restoreExpandedCards();
            });
        }
    });
    
    // Désactiver les boutons du sélecteur tant que les types ne sont pas chargés
    Array.from(dateSelectorContainer.querySelectorAll('button')).forEach(btn => btn.disabled = true);
    
    // Générer les boutons de type
    generateTypeButtons();
    
    // Réactiver les boutons après chargement des types
    Array.from(dateSelectorContainer.querySelectorAll('button')).forEach(btn => btn.disabled = false);
}

/**
 * Charger les types d'activités
 */
async function loadActivityTypes() {
    try {
        const url = '../../api/responsibilities/global-view/global-view.php?action=get_activity_types';
        const data = await apiRequest(url);
        availableTypes = data.data.types || [];
        console.log('Types d\'activités chargés:', availableTypes);
    } catch (error) {
        console.error('Erreur lors du chargement des types:', error);
        showMessage('Erreur lors du chargement des types d\'activités', 'error');
    }
}

/**
 * Charger la liste des travailleurs
 */
async function loadWorkers() {
    try {
        // Utiliser l'API appropriée pour récupérer les utilisateurs
        const url = '../../api/responsibilities/users.php?action=list';
        const data = await apiRequest(url);
        
        if (data.success && data.data) {
            availableWorkers = data.data;
            console.log('Travailleurs chargés:', availableWorkers.length);
        } else {
            console.warn('Aucun travailleur disponible ou erreur API');
            availableWorkers = [];
        }
    } catch (error) {
        console.error('Erreur lors du chargement des travailleurs:', error);
        // Ne pas afficher d'erreur pour l'instant, juste logger
        availableWorkers = [];
    }
}

/**
 * Générer les boutons de sélection de type
 */
function generateTypeButtons() {
    const container = document.querySelector('.type-buttons');
    if (!container) return;
    
    container.innerHTML = '';
    let atelierButton = null;
    let firstButton = null;
    
    // Boutons pour chaque type
    availableTypes.forEach((type, index) => {
        const button = document.createElement('button');
        button.className = 'btn selection-btn selection-btn--type';
        button.textContent = formatTypeName(type.type_name);
        button.dataset.type = type.type_name;
        
        if (type.type_name === 'atelier' || formatTypeName(type.type_name).toLowerCase().includes('atelier')) {
            atelierButton = button;
        }
        if (index === 0) {
            firstButton = button;
        }
        
        button.addEventListener('click', function() {
            selectType(type.type_name, this);
        });
        container.appendChild(button);
    });
    
    // Sélectionner visuellement et appliquer le filtre "Atelier" après que le DOM soit prêt
    setTimeout(() => {
        let btn = atelierButton || firstButton;
        if (btn) {
            // Forcer la classe active et la variable
            document.querySelectorAll('.selection-btn--type').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedType = btn.dataset.type;
            // Appliquer le filtre
            loadActivities().then(() => {
                displayActivities();
            });
            // Log pour debug
            console.log('Bouton sélectionné par défaut :', btn.textContent);
        }
    }, 50);
}

/**
 * Sélectionner un type d'activité
 */
function selectType(type, buttonElement = null) {
    console.log(`Sélection du type: ${type}`);
    selectedType = type;
    document.querySelectorAll('.selection-btn--type').forEach(btn => btn.classList.remove('active'));
    if (buttonElement) buttonElement.classList.add('active');
    loadActivities().then(() => {
        displayActivities();
    });
}

/**
 * Charger les activités
 */
async function loadActivities() {
    const dateStr = getDate();
    const typeParam = selectedType ? `&type=${encodeURIComponent(selectedType)}` : '';
    const url = `../../api/responsibilities/editor/editor.php?action=get_activities&date=${dateStr}${typeParam}`;
    console.log('Appel API loadActivities avec URL :', url);
    try {
        const data = await apiRequest(url);
        
        // Adapter les données reçues de editor.php au format attendu
        if (data.success && data.data && data.data.activities) {
            activities = data.data.activities.map(activity => {
                return {
                    entry: activity.id, // Convertir id en entry pour compatibilité
                    name: activity.name,
                    type_name: activity.type,
                    icon: activity.emoji,
                    start_date: activity.start_date,
                    end_date: activity.end_date,
                    description: activity.description // Ajout de la description
                };
            });
        } else {
            activities = [];
        }
        
        console.log('Activités chargées:', activities.length);
    } catch (error) {
        console.error('Erreur lors du chargement des activités:', error);
        showMessage('Erreur lors du chargement des activités', 'error');
        activities = [];
    }
}

/**
 * Afficher la grille des activités
 */
function displayActivities(activitiesToShow = activities) {
    const container = document.getElementById('activitiesGrid');
    container.innerHTML = '';
    container.className = 'content-cards-container';

    // Ajouter la carte "Nouvelle activité" en haut
    const newActivityCard = createNewActivityCard();
    container.appendChild(newActivityCard);

    // Afficher les activités existantes
    activitiesToShow.forEach(activity => {
        const card = createActivityCard(activity);
        container.appendChild(card);
    });
}

/**
 * Créer la carte "Nouvelle activité"
 */
function createNewActivityCard() {
    const card = document.createElement('div');
    card.className = 'content-card content-card--create-new';

    // Utilise directement le nom du type sélectionné en minuscules
    let typeLabel = 'activité';
    if (selectedType) {
        typeLabel = selectedType.toLowerCase();
    }

    const header = document.createElement('div');
    header.className = 'content-card-header';

    const title = document.createElement('div');
    title.className = 'content-card-title';
    title.textContent = `➕ Créer un ${typeLabel}`;

    header.appendChild(title);
    card.appendChild(header);

    // Événement de clic pour créer une nouvelle activité
    card.addEventListener('click', () => {
        createNewActivity();
    });

    return card;
}

/**
 * Créer une carte d'activité pour la grille
 */
function createActivityCard(activity) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.dataset.activityId = activity.entry;

    // En-tête de la carte (nom à gauche, dates à droite)
    const header = document.createElement('div');
    header.className = 'content-card-header';

    // Nom de l'activité (emoji+type+nom)
    const title = document.createElement('div');
    title.className = 'content-card-title';
    title.textContent = formatActivityNameEscaped({
        name: activity.name,
        type: activity.type_name,
        icon: activity.icon
    });

    // Dates de l'activité (à droite du titre)
    const titleMeta = document.createElement('div');
    titleMeta.className = 'content-card-title-meta';
            const formattedPeriod = formatPeriodLiterary(activity.start_date, activity.end_date);
    titleMeta.textContent = formattedPeriod || 'Période non définie';

    header.appendChild(title);
    header.appendChild(titleMeta);
    card.appendChild(header);
    
    // Corps de la carte pour la description, responsables et tâches
    const body = document.createElement('div');
    body.className = 'content-card-body';
    body.style.display = 'none'; // Masqué par défaut
    
    // Description de l'activité (en haut du corps)
    const description = document.createElement('div');
    description.className = 'activity-description-in-card';
    description.textContent = activity.description || 'Aucune description';
    body.appendChild(description);
    
    // Conteneur pour les responsables et tâches
    const detailsContent = document.createElement('div');
    detailsContent.className = 'activity-details-content';
    body.appendChild(detailsContent);
    
    card.appendChild(body);
    
    // Seul le header est cliquable pour plier/déplier
    header.addEventListener('click', (e) => {
        console.log('=== HEADER CLICK EVENT ===');
        console.log('Event target:', e.target);
        console.log('Event currentTarget:', e.currentTarget);
        console.log('Activity ID:', activity.entry);
        
        if (e.target.closest('.activity-actions')) {
            console.log('Click on activity-actions, ignoring...');
            return;
        }
        
        console.log('Calling toggleActivityCard...');
        toggleActivityCard(card, activity, detailsContent);
    });
    
    return card;
}

/**
 * Basculer l'affichage d'une carte d'activité
 */
async function toggleActivityCard(card, activity, detailsContent) {
    const body = card.querySelector('.content-card-body');
    const isExpanded = body.style.display !== 'none'; // Vérifier l'affichage du body
    const currentExpandedCardId = appStore.getExpandedActivityCard();
    
    console.log('=== TOGGLE ACTIVITY CARD ===');
    console.log('Activity ID:', activity.entry);
    console.log('Is expanded:', isExpanded);
    console.log('Current expanded card ID:', currentExpandedCardId);
    console.log('Card element:', card);
    console.log('Body display style:', body.style.display);
    
    if (isExpanded) {
        console.log('COLLAPSING card...');
        // Réduire la carte
        body.style.display = 'none';
        card.classList.remove('expanded');
        appStore.clearExpandedActivityCard();
        console.log('Card collapsed. Body display:', body.style.display);
    } else {
        console.log('EXPANDING card...');
        // Fermer la carte précédemment dépliée si elle existe
        if (currentExpandedCardId && currentExpandedCardId !== activity.entry) {
            const previousCard = document.querySelector(`[data-activity-id="${currentExpandedCardId}"]`);
            if (previousCard) {
                const previousBody = previousCard.querySelector('.content-card-body');
                if (previousBody) {
                    previousBody.style.display = 'none';
                    previousCard.classList.remove('expanded');
                    console.log('Previous card collapsed');
                }
            }
        }
        
        // Déplier la nouvelle carte
        body.style.display = 'block';
        card.classList.add('expanded');
        appStore.setExpandedActivityCard(activity.entry);
        console.log('Card expanded. Body display:', body.style.display);
        
        // Charger les responsables/tâches si pas encore fait
        if (!card.dataset.responsiblesLoaded) {
            await loadResponsiblesForCard(card, activity, detailsContent);
        }
    }
}

/**
 * Charger les responsables pour une carte spécifique
 */
async function loadResponsiblesForCard(card, activity, detailsContent) {
    // Nettoyer uniquement la zone des responsables/tâches
    detailsContent.innerHTML = '';

    // Créer le système d'onglets
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'activity-tabs-container';
    
    // Créer les onglets
    const tabsHeader = document.createElement('div');
    tabsHeader.className = 'tabs-header';
    
    // Onglet Responsables
    const responsiblesTab = document.createElement('button');
    responsiblesTab.className = 'tab-button active';
    responsiblesTab.textContent = 'Responsables';
    
    // Onglet Tâches
    const tasksTab = document.createElement('button');
    tasksTab.className = 'tab-button';
    tasksTab.textContent = 'Tâches';
    
    tabsHeader.appendChild(responsiblesTab);
    tabsHeader.appendChild(tasksTab);
    tabsContainer.appendChild(tabsHeader);
    
    // Conteneur pour le contenu des onglets
    const tabsContent = document.createElement('div');
    tabsContent.className = 'tabs-content';
    
    // Contenu de l'onglet Responsables
    const responsiblesContent = document.createElement('div');
    responsiblesContent.className = 'tab-content active';
    responsiblesContent.id = 'responsibles-tab-content';
    responsiblesContent.innerHTML = '<p class="empty-state">Chargement des responsables...</p>';
    
    // Contenu de l'onglet Tâches
    const tasksContent = document.createElement('div');
    tasksContent.className = 'tab-content';
    tasksContent.id = 'tasks-tab-content';
    tasksContent.innerHTML = '<p class="empty-state">Chargement des tâches...</p>';
    
    tabsContent.appendChild(responsiblesContent);
    tabsContent.appendChild(tasksContent);
    tabsContainer.appendChild(tabsContent);
    
    detailsContent.appendChild(tabsContainer);
    
    // Gestionnaires d'événements pour les onglets
    responsiblesTab.addEventListener('click', () => {
        // Activer l'onglet Responsables
        responsiblesTab.classList.add('active');
        tasksTab.classList.remove('active');
        
        // Afficher le contenu des responsables
        responsiblesContent.style.display = 'block';
        tasksContent.style.display = 'none';
        
        // Charger les responsables si pas encore fait
        if (!card.dataset.responsiblesLoaded) {
            loadResponsiblesData(card, activity, responsiblesContent);
        }
    });
    
    tasksTab.addEventListener('click', () => {
        // Activer l'onglet Tâches
        tasksTab.classList.add('active');
        responsiblesTab.classList.remove('active');
        
        // Afficher le contenu des tâches
        tasksContent.style.display = 'block';
        responsiblesContent.style.display = 'none';
        
        // Charger les tâches si pas encore fait
        if (!card.dataset.tasksLoaded) {
            loadTasksData(card, activity, tasksContent);
        }
    });
    
    // Charger les responsables par défaut (onglet actif)
    if (!card.dataset.responsiblesLoaded) {
        loadResponsiblesData(card, activity, responsiblesContent);
    }
}

/**
 * Charger les données des responsables
 */
async function loadResponsiblesData(card, activity, container) {
    try {
        const dateStr = getDate();
        const url = `../../api/responsibilities/editor/editor.php?action=get_responsible_for&activity=${activity.entry}&date=${dateStr}`;
        
        console.log('Chargement des responsables pour la carte:', url);
        const response = await apiRequest(url);
        
        if (response.success && response.data) {
            const responsibles = response.data.responsibles || [];
            
            if (responsibles.length === 0) {
                container.innerHTML = '<p class="empty-state">Aucun responsable assigné</p>';
            } else {
                // Créer la liste des responsables avec les classes CSS partagées
                const responsiblesList = document.createElement('div');
                responsiblesList.className = 'content-cards-container content-cards-container--nested';
                
                // Trier les responsables par date de début
                const sortedResponsibles = [...responsibles].sort((a, b) => {
                    if (!a.start_date) return 1;
                    if (!b.start_date) return -1;
                    return new Date(a.start_date) - new Date(b.start_date);
                });
                
                sortedResponsibles.forEach(responsible => {
                    const responsibleItem = createResponsibleCardItem(responsible);
                    responsiblesList.appendChild(responsibleItem);
                });
                
                container.innerHTML = '';
                container.appendChild(responsiblesList);
            }
            
            // Marquer comme chargé
            card.dataset.responsiblesLoaded = 'true';
            
        } else {
            throw new Error('Erreur lors du chargement des responsables');
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement des responsables:', error);
        container.innerHTML = '<p class="error-state">Erreur lors du chargement des responsables</p>';
    }
}

/**
 * Charger les données des tâches
 */
async function loadTasksData(card, activity, container) {
    try {
        const dateStr = getDate();
        const tasks = await getActivityTasks(activity.entry, dateStr);
        
        if (!tasks || tasks.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucune tâche associée</p>';
        } else {
            const tasksList = document.createElement('div');
            tasksList.className = 'content-cards-container content-cards-container--nested';
            
            tasks.forEach(task => {
                const item = createTaskViewItem(task);
                tasksList.appendChild(item);
            });
            
            container.innerHTML = '';
            container.appendChild(tasksList);
        }
        
        // Marquer comme chargé
        card.dataset.tasksLoaded = 'true';
        
    } catch (error) {
        console.error('Erreur lors du chargement des tâches:', error);
        container.innerHTML = '<p class="error-state">Erreur lors du chargement des tâches</p>';
    }
}

/**
 * Créer un élément responsable pour l'affichage dans la carte
 */
function createResponsibleCardItem(responsible) {
    const item = document.createElement('div');
    item.className = 'content-card content-card--subgroup content-card--nested';
    
    // En-tête de la carte avec nom et période
    const header = document.createElement('div');
    header.className = 'content-card-header content-card--nested';
    
    const name = document.createElement('div');
    name.className = 'content-card-title';
    name.textContent = responsible.responsible_display_name || 'Nom non défini';
    
    const period = document.createElement('div');
    period.className = 'content-card-title-meta';
    period.textContent = formatPeriodLiterary(responsible.start_date, responsible.end_date) || '';
    
    header.appendChild(name);
    header.appendChild(period);
    item.appendChild(header);
    
    return item;
}

/**
 * Sélectionner une activité pour édition
 */
function selectActivity(activity) {
    console.log('Sélection de l\'activité:', activity);
    console.log('ID de l\'activité sélectionnée:', activity.entry);
    
    // Mettre à jour la sélection visuelle
    document.querySelectorAll('.content-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-activity-id="${activity.entry}"]`).classList.add('selected');
    
    selectedActivity = activity;
    isNewActivity = false;
    
    // Remplir la vue d'information
    fillActivityForm(activity);
    
    // Afficher la section d'affichage
    document.getElementById('editingSection').style.display = 'block';
}

/**
 * Créer une nouvelle activité
 */
function createNewActivity() {
    // Pour l'instant, afficher un message à l'utilisateur
    showMessage('La création d\'activité n\'est pas encore disponible dans cette nouvelle interface', 'info');
    
    // TODO: Implémenter l'ouverture d'un modal de création d'activité
    console.log('Fonctionnalité à implémenter: création d\'activité');
}

/**
 * Fermer la vue de détail et revenir à la liste des activités
 */
function closeActivityDetails() {
    // Masquer la section d'édition
    document.getElementById('editingSection').style.display = 'none';
    
    // Désélectionner l'activité dans la grille
    document.querySelectorAll('.content-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Réinitialiser l'activité sélectionnée
    selectedActivity = null;
    
    // Message facultatif
    console.log('Retour à la liste des activités');
}

/**
 * Configurer les événements
 */
function setupEventListeners() {
    // Bouton retour
    document.getElementById('backToListBtn').addEventListener('click', closeActivityDetails);
    
    // Modal de tâche
    document.getElementById('closeTaskModal').addEventListener('click', closeTaskModal);
    
    // Modal d'édition de section
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('sectionEditModal').style.display = 'none';
    });
    
    document.getElementById('cancelModalBtn').addEventListener('click', () => {
        document.getElementById('sectionEditModal').style.display = 'none';
    });
    
    document.getElementById('saveModalBtn').addEventListener('click', () => {
        // Pour l'instant, juste fermer le modal
        document.getElementById('sectionEditModal').style.display = 'none';
        showMessage('Sauvegarde non implémentée', 'info');
    });
    
    // Garder uniquement les gestionnaires d'événements nécessaires pour la nouvelle interface
    console.log('Configuration des événements pour l\'interface non éditable');
    
    // Modal d'activité (exemple)
    document.getElementById('closeActivityModal').addEventListener('click', closeActivityModal);
}

/**
 * Fermer le modal de tâche
 */
function closeTaskModal() {
    document.getElementById('taskModal').style.display = 'none';
    currentEditingTask = null;
}

/**
 * Remplir le formulaire avec les données de l'activité
 */
function fillActivityForm(activity) {
    const container = document.getElementById('activityDetailsContainer');
    container.innerHTML = `
        <div class="activity-view-section">
            <h3>Informations générales</h3>
            <div class="activity-view-content">
                <div class="activity-name-display">${activity.icon || '📋'} ${activity.name}</div>
                <div class="activity-description-display">
                    <p>${activity.description || 'Aucune description'}</p>
                </div>
                <div class="activity-dates-display">
                    <div class="date-item">
                        <span class="date-label">Période:</span>
                        <span class="date-value">${formatPeriodLiterary(activity.start_date, activity.end_date) || 'Non définie'}</span>
                    </div>
                </div>
            </div>
            <button class="btn btn-edit-section" data-section="general-info">
                <i class="icon-pencil"></i> Modifier
            </button>
        </div>
        
        <div class="activity-view-section">
            <h3>Responsables</h3>
            <div class="activity-view-content" id="responsiblesViewList">
                <p class="empty-state">Chargement des responsables...</p>
            </div>
            <button class="btn btn-edit-section" data-section="responsibles">
                <i class="icon-pencil"></i> Gérer les responsables
            </button>
        </div>
        
        <div class="activity-view-section">
            <h3>Tâches</h3>
            <div class="activity-view-content" id="tasksViewList">
                <p class="empty-state">Chargement des tâches...</p>
            </div>
            <button class="btn btn-edit-section" data-section="tasks">
                <i class="icon-pencil"></i> Gérer les tâches
            </button>
        </div>
    `;
    
    // Charger et afficher les responsables et tâches
    if (activity.entry) {
        loadActivityDetails(activity.entry);
    }
    
    // Ajouter les gestionnaires d'événements pour les boutons d'édition
    setupEditButtons();
}

/**
 * Configurer les boutons d'édition
 */
function setupEditButtons() {
    document.querySelectorAll('.btn-edit-section').forEach(button => {
        button.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            openSectionEditor(section);
        });
    });
}

/**
 * Ouvrir l'éditeur de section
 */
function openSectionEditor(section) {
    console.log(`Ouvrir l'éditeur pour la section: ${section}`);
    
    // Référence au modal
    const modal = document.getElementById('sectionEditModal');
    const modalTitle = document.getElementById('modalTitle');
    const formContainer = document.getElementById('modalFormContainer');
    
    // Vider le contenu existant
    formContainer.innerHTML = '';
    
    // Configurer le titre et le formulaire en fonction de la section
    switch(section) {
        case 'general-info':
            modalTitle.textContent = 'Modifier les informations générales';
            
            // Formulaire simplifié pour infos générales
            formContainer.innerHTML = `
                <form id="generalInfoForm" class="section-edit-form">
                    <div class="form-group">
                        <label for="activityName">Nom de l'activité</label>
                        <input type="text" id="activityName" name="name" value="${selectedActivity.name || ''}">
                    </div>
                    <div class="form-group">
                        <label for="activityType">Type d'activité</label>
                        <select id="activityType" name="type">
                            <!-- Options à remplir dynamiquement -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="activityEmoji">Emoji</label>
                        <input type="text" id="activityEmoji" name="icon" value="${selectedActivity.icon || ''}">
                    </div>
                    <div class="form-group">
                        <label for="activityDescription">Description</label>
                        <textarea id="activityDescription" name="description">${selectedActivity.description || ''}</textarea>
                    </div>
                    <div class="form-group date-inputs">
                        <div>
                            <label for="activityStartDate">Date de début</label>
                            <input type="date" id="activityStartDate" name="start_date" value="${selectedActivity.start_date || ''}">
                        </div>
                        <div>
                            <label for="activityEndDate">Date de fin</label>
                            <input type="date" id="activityEndDate" name="end_date" value="${selectedActivity.end_date || ''}">
                        </div>
                    </div>
                </form>
            `;
            break;
            
        case 'responsibles':
            modalTitle.textContent = 'Gérer les responsables';
            
            // Formulaire simplifié pour responsables
            formContainer.innerHTML = `
                <form id="responsiblesForm" class="section-edit-form">
                    <div class="current-responsibles">
                        <h4>Responsables actuels</h4>
                        <div id="modalResponsiblesList" class="modal-responsibles-list">
                            <!-- Liste des responsables à remplir dynamiquement -->
                            <p class="empty-state">Chargement des responsables...</p>
                        </div>
                    </div>
                    <div class="add-responsible-section">
                        <h4>Ajouter un responsable</h4>
                        <div class="form-group">
                            <label for="newResponsible">Responsable</label>
                            <select id="newResponsible" name="responsible_id">
                                <option value="">Sélectionner un responsable...</option>
                                <!-- Options à remplir dynamiquement -->
                            </select>
                        </div>
                        <div class="form-group date-inputs">
                            <div>
                                <label for="responsibleStartDate">Date de début</label>
                                <input type="date" id="responsibleStartDate" name="responsible_start_date">
                            </div>
                            <div>
                                <label for="responsibleEndDate">Date de fin</label>
                                <input type="date" id="responsibleEndDate" name="responsible_end_date">
                            </div>
                        </div>
                        <button type="button" id="addResponsibleBtn" class="btn btn-secondary">Ajouter</button>
                    </div>
                </form>
            `;
            break;
            
        default:
            modalTitle.textContent = `Édition de la section "${section}"`;
            formContainer.innerHTML = `
                <div class="section-edit-placeholder">
                    <p>Le formulaire d'édition pour cette section est en cours de développement.</p>
                    <p>Revenez bientôt pour essayer cette fonctionnalité!</p>
                </div>
            `;
    }
    
    // Afficher le modal
    modal.classList.add('modal-visible');
    
    // Message temporaire
    showMessage(`La sauvegarde pour la section "${section}" est en cours d'implémentation`, 'info');
}

/**
 * Créer un élément responsable pour l'édition (dans le modal)
 */
function createResponsibleEditItem(responsible) {
    const item = document.createElement('div');
    item.className = 'responsible-edit-item';
    item.dataset.responsibleId = responsible.id;
    
    const info = document.createElement('div');
    info.className = 'responsible-info';
    
    // Nom du responsable
    const name = document.createElement('div');
    name.className = 'responsible-name';
    name.textContent = responsible.display_name;
    
    // Période avec champs de date modifiables
    const period = document.createElement('div');
    period.className = 'responsible-period';
    
    // Date de début
    const startDateInput = document.createElement('input');
    startDateInput.type = 'date';
    startDateInput.className = 'date-input start-date';
    startDateInput.value = responsible.start_date || '';
    
    // Date de fin
    const endDateInput = document.createElement('input');
    endDateInput.type = 'date';
    endDateInput.className = 'date-input end-date';
    endDateInput.value = responsible.end_date || '';
    
    period.appendChild(startDateInput);
    period.appendChild(document.createTextNode(' → '));
    period.appendChild(endDateInput);
    
    info.appendChild(name);
    info.appendChild(period);
    
    // Bouton de suppression
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove';
    removeBtn.innerHTML = '×';
    removeBtn.title = 'Supprimer le responsable';
    removeBtn.addEventListener('click', () => {
        // TODO: Implémenter la suppression
        showMessage('Fonctionnalité de suppression non implémentée', 'info');
    });
    
    item.appendChild(info);
    item.appendChild(removeBtn);
    
    return item;
}

/**
 * Afficher la liste des responsables
 */
function displayResponsibles(responsibles) {
    const container = document.getElementById('responsiblesViewList');
    container.innerHTML = '';
    
    if (!responsibles || responsibles.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'Aucun responsable assigné';
        container.appendChild(emptyState);
        return;
    }
    
    // Trier les responsables par date de début (start_date)
    const sortedResponsibles = [...responsibles].sort((a, b) => {
        // Gérer les cas où start_date est null ou undefined (placer à la fin)
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return new Date(a.start_date) - new Date(b.start_date);
    });
    
    // Créer un conteneur pour la liste des responsables avec les classes CSS partagées
    const responsiblesList = document.createElement('div');
    responsiblesList.className = 'content-cards-container content-cards-container--nested';
    
    sortedResponsibles.forEach(responsible => {
        const item = createResponsibleViewItem(responsible);
        responsiblesList.appendChild(item);
    });
    
    container.appendChild(responsiblesList);
}

/**
 * Créer un élément responsable (version affichage)
 */
function createResponsibleViewItem(responsible) {
    const item = document.createElement('div');
    item.className = 'content-card content-card--subgroup content-card--nested';
    item.dataset.responsibleId = responsible.id;
    
    // En-tête de la carte avec nom et période
    const header = document.createElement('div');
    header.className = 'content-card-header content-card--nested';
    
    const name = document.createElement('div');
    name.className = 'content-card-title';
    name.textContent = responsible.display_name;
    
    const period = document.createElement('div');
    period.className = 'content-card-title-meta';
    period.textContent = formatPeriodLiterary(responsible.start_date, responsible.end_date) || '';
    
    header.appendChild(name);
    header.appendChild(period);
    item.appendChild(header);
    
    return item;
}

/**
 * Charger les détails complets d'une activité
 */
async function loadActivityDetails(activityId) {
    try {
        const dateStr = getDate();
        const url = `../../api/responsibilities/editor/activities.php?action=get&entry=${activityId}&date=${dateStr}`;
        console.log('Chargement des détails de l\'activité:', url);
        const data = await apiRequest(url);
        console.log('Détails de l\'activité reçus:', data);
        const activity = data.data;
        
        // Récupérer TOUS les responsables pour cette activité, sans filtre de date
        const responsiblesWithDates = await getResponsibleDates(activityId);
        console.log('Liste complète des responsables (passés, présents, futurs):', responsiblesWithDates);
        
        // On utilise uniquement la liste complète des responsables depuis l'API responsible.php
        if (responsiblesWithDates.length > 0) {
            activity.responsible = responsiblesWithDates.map(resp => ({
                id: resp.responsible_user_id,
                display_name: resp.responsible_display_name,
                initials: resp.responsible_initials,
                start_date: resp.start_date,
                end_date: resp.end_date
            }));
            console.log('Nombre total de responsables récupérés:', activity.responsible.length);
        } else {
            console.warn('Aucun responsable trouvé pour l\'activité');
            activity.responsible = [];
        }
        
        // Récupérer les tâches de l'activité via l'API editor.php
        const tasksData = await getActivityTasks(activityId, dateStr);
        console.log('Tâches de l\'activité reçues:', tasksData);
        
        // Afficher les responsables dans la vue non éditable
        displayResponsibles(activity.responsible || []);
        
        // Afficher les tâches
        displayTasks(tasksData || []);
        
    } catch (error) {
        console.error('Erreur lors du chargement des détails:', error);
        showMessage('Erreur lors du chargement des détails de l\'activité', 'error');
    }
}

/**
 * Récupérer les dates de responsabilité pour une activité
 */
async function getResponsibleDates(activityId) {
    try {
        const url = `../../api/responsibilities/responsible.php?action=list&activity=${activityId}`;
        console.log('Récupération des dates de responsabilité:', url);
        const response = await apiRequest(url);
        
        // Vérifier les données reçues
        if (response.success && response.data) {
            console.log('Dates de responsabilité reçues:', response.data);
            return response.data;
        } else {
            console.warn('Aucune donnée de responsabilité disponible ou erreur API:', response);
            return [];
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des dates de responsabilité:', error);
        return [];
    }
}

/**
 * Récupérer les tâches d'une activité via l'API editor.php
 */
async function getActivityTasks(activityId, dateStr) {
    try {
        const url = `../../api/responsibilities/editor/editor.php?action=get_activity_tasks&activity=${activityId}&date=${dateStr}`;
        console.log('Récupération des tâches de l\'activité:', url);
        const response = await apiRequest(url);
        
        // Vérifier les données reçues
        if (response.success && response.data && response.data.tasks) {
            console.log('Tâches de l\'activité reçues:', response.data.tasks);
            // Log détaillé de la première tâche pour voir sa structure exacte
            if (response.data.tasks.length > 0) {
                const firstTask = response.data.tasks[0];
                console.log('Structure détaillée de la première tâche:', {
                    task_id: firstTask.task_id,
                    task_name: firstTask.task_name,
                    task_description: firstTask.task_description,
                    start_date: firstTask.start_date,
                    end_date: firstTask.end_date,
                    start_date_type: typeof firstTask.start_date,
                    end_date_type: typeof firstTask.end_date,
                    start_date_null: firstTask.start_date === null,
                    end_date_null: firstTask.end_date === null
                });
            }
            return response.data.tasks;
        } else {
            console.warn('Aucune tâche disponible ou erreur API:', response);
            return [];
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des tâches de l\'activité:', error);
        return [];
    }
}

/**
 * Afficher la liste des tâches
 */
function displayTasks(tasks) {
    const container = document.getElementById('tasksViewList');
    container.innerHTML = '';
    
    if (!tasks || tasks.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'Aucune tâche associée';
        container.appendChild(emptyState);
        return;
    }
    
    // Trier les tâches par date de début
    const sortedTasks = [...tasks].sort((a, b) => {
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return new Date(a.start_date) - new Date(b.start_date);
    });
    
    // Créer un conteneur pour la liste des tâches avec les classes CSS partagées
    const tasksList = document.createElement('div');
    tasksList.className = 'content-cards-container content-cards-container--nested';
    
    sortedTasks.forEach(task => {
        const item = createTaskViewItem(task);
        tasksList.appendChild(item);
    });
    
    container.appendChild(tasksList);
}

/**
 * Créer un élément tâche (version affichage)
 */
function createTaskViewItem(task) {
    console.log('=== CRÉATION TÂCHE ===');
    console.log('Task complet:', task);
    console.log('Dates de la tâche:', {
        start_date: task.start_date,
        end_date: task.end_date,
        start_date_type: typeof task.start_date,
        end_date_type: typeof task.end_date,
        start_date_null: task.start_date === null,
        end_date_null: task.end_date === null,
        start_date_undefined: task.start_date === undefined,
        end_date_undefined: task.end_date === undefined
    });
    
    // Test de création d'objets Date
    if (task.start_date) {
        const startDateObj = new Date(task.start_date);
        console.log('start_date Date object:', startDateObj, 'isValid:', !isNaN(startDateObj.getTime()));
    }
    if (task.end_date) {
        const endDateObj = new Date(task.end_date);
        console.log('end_date Date object:', endDateObj, 'isValid:', !isNaN(endDateObj.getTime()));
    }
    
    const item = document.createElement('div');
    item.className = 'content-card content-card--subgroup content-card--nested';
    item.dataset.taskId = task.task_id;
    
    // En-tête de la carte avec nom et période (HEADER CLIQUABLE)
    const header = document.createElement('div');
    header.className = 'content-card-header content-card--nested';
    
    const name = document.createElement('div');
    name.className = 'content-card-title';
    name.textContent = task.task_name;
    
    const period = document.createElement('div');
    period.className = 'content-card-title-meta';
    
    // Test direct du formatage
    console.log('Appel formatPeriod avec:', task.start_date, task.end_date);
    const formattedPeriod = formatPeriodLiterary(task.start_date, task.end_date);
    console.log('Résultat formatPeriod:', formattedPeriod);
    
    period.textContent = formattedPeriod || 'Période non définie';
    
    header.appendChild(name);
    header.appendChild(period);
    item.appendChild(header);
    
    // Corps de la carte pour le contenu dépliable (NON CLIQUABLE)
    const body = document.createElement('div');
    body.className = 'content-card-body';
    body.style.display = 'none'; // Masqué par défaut
    
    // Description
    const description = document.createElement('div');
    description.className = 'task-description';
    description.textContent = task.task_description || 'Aucune description';
    body.appendChild(description);
    
    // Conteneur pour les travailleurs assignés
    const assignedWorkersContainer = document.createElement('div');
    assignedWorkersContainer.className = 'task-assigned-workers';
    
    // Titre de la section
    const assignedTitle = document.createElement('div');
    assignedTitle.className = 'assigned-workers-title';
    assignedTitle.textContent = 'Travailleurs assignés:';
    assignedWorkersContainer.appendChild(assignedTitle);
    
    // Liste des travailleurs assignés
    const assignedList = document.createElement('div');
    assignedList.className = 'assigned-workers-list';
    assignedList.innerHTML = '<p class="empty-state">Chargement des assignations...</p>';
    assignedWorkersContainer.appendChild(assignedList);
    
    body.appendChild(assignedWorkersContainer);
    item.appendChild(body);
    
    // Dépliage au clic UNIQUEMENT sur le header
    let expanded = false;
    header.addEventListener('click', async (e) => {
        // Empêcher la propagation du clic
        e.stopPropagation();
        
        const currentExpandedTaskId = appStore.getExpandedTaskCard();
        
        if (expanded) {
            // Réduire la carte
            body.style.display = 'none';
            item.classList.remove('expanded');
            expanded = false;
            appStore.clearExpandedTaskCard();
        } else {
            // Fermer la carte précédemment dépliée si elle existe
            if (currentExpandedTaskId && currentExpandedTaskId !== task.task_id) {
                const previousTaskItem = document.querySelector(`[data-task-id="${currentExpandedTaskId}"]`);
                if (previousTaskItem) {
                    const previousBody = previousTaskItem.querySelector('.content-card-body');
                    if (previousBody) {
                        previousBody.style.display = 'none';
                        previousTaskItem.classList.remove('expanded');
                    }
                }
            }
            
            // Déplier la nouvelle carte
            body.style.display = 'block';
            item.classList.add('expanded');
            expanded = true;
            appStore.setExpandedTaskCard(task.task_id);
            
            // Charger les assignations si pas encore fait
            if (!item.dataset.assignmentsLoaded) {
                await loadTaskAssignments(task.task_id, assignedList);
                item.dataset.assignmentsLoaded = 'true';
            }
        }
    });
    
    return item;
}

/**
 * Charger les assignations d'une tâche via l'API
 */
async function loadTaskAssignments(taskId, container) {
    try {
        const dateStr = getDate();
        const url = `../../api/responsibilities/editor/editor.php?action=get_assigned_to&task=${taskId}&date=${dateStr}`;
        
        console.log('Chargement des assignations pour la tâche:', url);
        const response = await apiRequest(url);
        
        if (response.success && response.data) {
            const assigned = response.data.assigned || [];
            
            if (assigned.length === 0) {
                container.innerHTML = '<p class="empty-state">Aucun travailleur assigné</p>';
            } else {
                // Créer la liste des travailleurs assignés
                container.innerHTML = '';
                
                // Trier les assignations par date de début
                const sortedAssigned = [...assigned].sort((a, b) => {
                    if (!a.start_date) return 1;
                    if (!b.start_date) return -1;
                    return new Date(a.start_date) - new Date(b.start_date);
                });
                
                sortedAssigned.forEach(assignment => {
                    const assignmentItem = createTaskAssignmentItem(assignment);
                    container.appendChild(assignmentItem);
                });
            }
        } else {
            throw new Error('Erreur lors du chargement des assignations');
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement des assignations:', error);
        container.innerHTML = '<p class="error-state">Erreur lors du chargement des assignations</p>';
    }
}

/**
 * Créer un élément d'assignation pour l'affichage dans la tâche
 */
function createTaskAssignmentItem(assignment) {
    const item = document.createElement('div');
    item.className = 'task-assignment-item';
    
    // Ligne unique avec nom du travailleur à gauche et période à droite
    const contentLine = document.createElement('div');
    contentLine.className = 'flex justify-between items-center';
    
    // Nom du travailleur (à gauche)
    const name = document.createElement('div');
    name.className = 'assignment-worker-name';
    name.textContent = assignment.assigned_display_name || 'Nom non défini';
    
    // Période d'assignation (à droite)
    const period = document.createElement('div');
    period.className = 'assignment-worker-period';
    period.textContent = formatPeriodLiterary(assignment.start_date, assignment.end_date) || 'Période non définie';
    
    contentLine.appendChild(name);
    contentLine.appendChild(period);
    item.appendChild(contentLine);
    
    return item;
}

/**
 * Éditer une tâche
 */
function editTask(task) {
    currentEditingTask = task;
    openTaskModal(task);
}

/**
 * Supprimer une tâche
 */
function removeTask(taskId) {
    // TODO: Implémenter la suppression via API
    console.log('Suppression de la tâche:', taskId);
    showMessage('Fonctionnalité de suppression à implémenter', 'info');
}

/**
 * Ouvrir le modal d'édition de tâche
 */
function openTaskModal(task = null) {
    const modal = document.getElementById('taskModal');
    const title = document.getElementById('taskModalTitle');
    
    if (task) {
        title.textContent = 'Édition de la tâche';
        fillTaskForm(task);
    } else {
        title.textContent = 'Nouvelle tâche';
        clearTaskForm();
    }
    
    modal.classList.add('modal-visible');
}

/**
 * Remplir le formulaire de tâche
 */
function fillTaskForm(task) {
    document.getElementById('taskName').value = task.name || '';
    document.getElementById('taskDescription').value = task.description || '';
    displayAssignments(task.assigned_to || []);
}

/**
 * Vider le formulaire de tâche
 */
function clearTaskForm() {
    document.getElementById('taskName').value = '';
    document.getElementById('taskDescription').value = '';
    displayAssignments([]);
}

/**
 * Afficher les assignations d'une tâche
 */
function displayAssignments(assignments) {
    const container = document.getElementById('assignmentsList');
    container.innerHTML = '';
    
    if (assignments.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucune assignation</p>';
        return;
    }
    
    assignments.forEach(assignment => {
        const item = createAssignmentItem(assignment);
        container.appendChild(item);
    });
}

/**
 * Créer un élément d'assignation
 */
function createAssignmentItem(assignment) {
    const item = document.createElement('div');
    item.className = 'assignment-item';
    item.dataset.assignmentId = assignment.id;
    
    const info = document.createElement('div');
    info.className = 'assignment-info';
    
    const name = document.createElement('span');
    name.className = 'assignment-name';
    name.textContent = assignment.display_name;
    
    const dates = document.createElement('span');
    dates.className = 'assignment-dates';
    dates.textContent = formatPeriodLiterary(assignment.start_date, assignment.end_date) || 'Période non définie';
    
    info.appendChild(name);
    info.appendChild(dates);
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove';
    removeBtn.innerHTML = '×';
    removeBtn.title = 'Supprimer l\'assignation';
    removeBtn.addEventListener('click', () => removeAssignment(assignment.id));
    
    item.appendChild(info);
    item.appendChild(removeBtn);
    
    return item;
}

/**
 * Supprimer une assignation
 */
function removeAssignment(assignmentId) {
    // TODO: Implémenter la suppression via API
    console.log('Suppression de l\'assignation:', assignmentId);
    showMessage('Fonctionnalité de suppression à implémenter', 'info');
}

// Modal d'activité (exemple)
function openActivityModal(activity) {
    const modal = document.getElementById('activityModal');
    const modalTitle = document.getElementById('activityModalTitle');
    const modalContent = document.getElementById('activityModalContent');
    modalTitle.textContent = formatActivityNameEscaped({
        name: activity.name,
        type: activity.type_name,
        icon: activity.icon
    });
    modalContent.innerHTML = `<p>${activity.description || '<em>Aucune description</em>'}</p>`;
    modal.classList.add('modal-visible');
}

// Fermer le modal
function closeActivityModal() {
    document.getElementById('activityModal').classList.remove('modal-visible');
}

// Initialisation
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Éditeur d\'activités - début de l\'initialisation...');
    try {
        const authSuccess = await checkAuthAndLoadData();
        if (authSuccess) {
            // Initialiser l'interface
            await initializeEditor();
            
            // Configurer les événements
            setupEventListeners();
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        document.getElementById('loadingSection').style.display = 'none';
        showMessage('Erreur lors de l\'initialisation de l\'éditeur', 'error');
    }
});