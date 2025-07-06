// Éditeur d'activités - JavaScript principal

// Import des modules ES6
import { 
    checkAuthAndLoadData, 
    showMessage, 
    apiRequest,
    createResponsibleBadge,
    createAssignmentBadge
} from '../../services/shared.js';

import { updateUserInfo } from '/modules/components/user-info.js';
import { formatActivityName, formatTypeName, formatActivityNameEscaped } from '/modules/utils/activity-formatter.js';
import { DateSelector } from '/modules/components/date-selector.js';
import { globalStore } from '/modules/store/store.js';
import { 
    getSelectedDate, 
    setSelectedDate, 
    getSelectedActivityType,
    setSelectedActivityType,
    getExpandedActivityCard, 
    getExpandedTaskCard, 
    setExpandedActivityCard, 
    clearExpandedActivityCard, 
    setExpandedTaskCard, 
    clearExpandedTaskCard,
    addEventListener,
    removeEventListener
} from '/modules/store/responsibilities.js';
import { formatDateForAPI, formatPeriodLiterary } from '/modules/utils/date-utils.js';

// Variables globales
let availableTypes = [];
let availableWorkers = [];
let activities = [];
let selectedActivity = null;
let currentEditingTask = null;
let isNewActivity = false;
let dateSelector = null;
let responsibleChanges = {};
let container = null; // Conteneur de la vue
let activityTypeChangeListener = null; // Écouteur de changement de type
let selectedDateChangeListener = null; // Écouteur de changement de date
let expandedActivityCardChangeListener = null; // Écouteur de changement de carte dépliée

console.log('=== INITIALISATION EDITOR ===');
console.log('État global initial - expandedActivityCard:', getExpandedActivityCard());
console.log('État global initial - selectedActivityType:', getSelectedActivityType());
console.log('État global initial - selectedDate:', getSelectedDate());

/**
 * Initialiser l'éditeur
 * @param {HTMLElement} viewContainer - Le conteneur de la vue
 */
export async function initializeEditorView(viewContainer) {
    console.log('=== DÉBUT INITIALISATION ÉDITEUR ===');
    container = viewContainer;
    console.log('État global initial - expandedActivityCard:', getExpandedActivityCard());
    console.log('État global initial - selectedActivityType:', getSelectedActivityType());
    console.log('État global initial - selectedDate:', getSelectedDate());
    
    // Initialiser la date dans le store si pas encore définie
    const currentDateFromStore = getSelectedDate();
    if (!currentDateFromStore) {
        setSelectedDate(formatDateForAPI(new Date()));
    }
    
    // Ajouter les écouteurs de changement d'état AVANT l'initialisation des composants
    setupActivityTypeChangeListener();
    setupSelectedDateChangeListener();
    setupExpandedActivityCardChangeListener();
    
    // Créer le header avec filtres (avant de charger les types)
    console.log('Création du header avec filtres...');
    createHeaderWithFilters();
    
    try {
        // Charger les types d'activités depuis la nouvelle API
        console.log('Chargement des types d\'activités...');
        await loadActivityTypes();
        console.log('Types chargés:', availableTypes.length);
        
        // Réactiver les boutons du sélecteur de date
        const dateSelectorContainer = container.querySelector('.view-filters > div:last-child');
        if (dateSelectorContainer) {
            Array.from(dateSelectorContainer.querySelectorAll('button, .date-display-label, .date-nav-arrow')).forEach(btn => btn.disabled = false);
        }
        
        // Créer le conteneur des activités AVANT de charger les activités
        const activitiesGrid = document.createElement('div');
        activitiesGrid.id = 'activitiesGrid';
        activitiesGrid.className = 'content-cards-container';
        container.appendChild(activitiesGrid);
        
        // Charger les activités
        console.log('Chargement des activités...');
        await loadActivities();
        console.log('Activités chargées:', activities.length);
        
    } catch (error) {
        console.error('Erreur pendant l\'initialisation:', error);
        showMessage('Erreur lors du chargement des données', 'error');
    }
    
    // Afficher les activités
    console.log('Affichage des activités...');
    displayActivities();
    
    // Note: restoreExpandedCards() est maintenant appelé automatiquement par displayActivities()
    
    console.log('=== FIN INITIALISATION ÉDITEUR ===');
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
        console.log('Vue éditeur - Changement de type détecté:', newType);
        if (newType) {
            // Conserver l'état de la carte dépliée (ne pas l'effacer)
            const currentExpandedCard = getExpandedActivityCard();
            console.log('Vue éditeur - Carte dépliée conservée:', currentExpandedCard);
            
            // Mettre à jour les boutons
            const typeButtonsContainer = document.getElementById('type-buttons-container');
            if (typeButtonsContainer) {
                typeButtonsContainer.querySelectorAll('.btn[data-type]').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.type === newType) {
                        btn.classList.add('active');
                    }
                });
            }
            // Recharger les activités
            loadActivities().then(() => {
                displayActivities();
                // La restauration automatique se fait dans displayActivities() via restoreExpandedCards()
            });
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
        console.log('=== VUE ÉDITEUR - CHANGEMENT DE DATE DÉTECTÉ ===');
        console.log('Nouvelle date reçue:', newDate);
        console.log('DateSelector disponible:', !!dateSelector);
        console.log('Méthode setDate disponible:', !!(dateSelector && dateSelector.setDate));
        
        if (newDate) {
            // Mettre à jour le sélecteur de date si nécessaire
            if (dateSelector && dateSelector.setDate) {
                console.log('Mise à jour du DateSelector avec la date:', newDate);
                dateSelector.setDate(new Date(newDate));
            } else {
                console.warn('DateSelector non disponible ou méthode setDate manquante');
            }
            
            // Recharger les activités
            console.log('Rechargement des activités pour la nouvelle date...');
            loadActivities().then(() => {
                displayActivities();
            }).catch(error => {
                console.error('Erreur lors du rechargement des activités:', error);
            });
        } else {
            console.warn('Date reçue est null ou undefined');
        }
    };
    
    // Ajouter l'écouteur
    addEventListener('selectedDate', selectedDateChangeListener);
    console.log('Écouteur de changement de date configuré pour la vue éditeur');
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
        console.log('Vue éditeur - Changement de carte dépliée détecté:', cardId);
        console.log('Container activitiesGrid:', document.getElementById('activitiesGrid'));
        
        const currentViewContainer = document.getElementById('activitiesGrid');
        if (!currentViewContainer) {
            console.log('Container activitiesGrid non trouvé, sortie');
            return;
        }
        
        // Fermer toutes les cartes d'abord DANS CETTE VUE SEULEMENT
        const allCards = currentViewContainer.querySelectorAll('.content-card[data-activity-id]');
        console.log('Nombre de cartes trouvées:', allCards.length);
        
        allCards.forEach(card => {
            const body = card.querySelector('.content-card-body');
            if (body) {
                body.classList.remove('content-card-body--expanded');
                body.classList.add('content-card-body--collapsed');
                card.classList.remove('expanded');
                console.log('Carte fermée:', card.dataset.activityId);
            }
        });
        
        // Déplier la carte spécifiée si elle existe DANS CETTE VUE SEULEMENT
        if (cardId) {
            const targetCard = currentViewContainer.querySelector(`[data-activity-id="${cardId}"]`);
            console.log('Carte cible trouvée:', !!targetCard);
            
            if (targetCard) {
                const body = targetCard.querySelector('.content-card-body');
                if (body) {
                    body.classList.remove('content-card-body--collapsed');
                    body.classList.add('content-card-body--expanded');
                    targetCard.classList.add('expanded');
                    console.log('Carte dépliée:', cardId);
                    
                    // Charger les données si pas encore fait
                    const detailsContent = body.querySelector('.activity-details-content');
                    if (detailsContent && !targetCard.dataset.responsiblesLoaded) {
                        // Attendre que les activités sont chargées
                        const loadCardData = () => {
                            console.log('loadCardData - cardId:', cardId, 'type:', typeof cardId);
                            console.log('loadCardData - activities:', activities);
                            
                            // Afficher les IDs des activités pour debug
                            console.log('loadCardData - IDs des activités:');
                            activities.forEach((a, index) => {
                                console.log(`  [${index}] id: ${a.id} (type: ${typeof a.id})`);
                            });
                            
                            // Recherche directe de l'activité (IDs maintenant cohérents)
                            // Convertir cardId en nombre pour la comparaison
                            const activity = activities.find(a => a.id === Number(cardId));
                            
                            console.log('loadCardData - activity trouvée:', activity);
                            console.log('loadCardData - targetCard.dataset.responsiblesLoaded:', targetCard.dataset.responsiblesLoaded);
                            
                            if (activity) {
                                console.log('loadCardData - Appel de loadResponsiblesForCard avec autoLoadFirstTab=true');
                                loadResponsiblesForCard(targetCard, activity, detailsContent, true);
                            } else {
                                // Si les activités ne sont pas encore chargées, réessayer dans 100ms
                                console.log('loadCardData - Activité non trouvée, retry dans 100ms');
                                setTimeout(loadCardData, 100);
                            }
                        };
                        loadCardData();
                    }
                }
            } else {
                console.log('Carte cible non trouvée pour l\'ID:', cardId);
            }
        } else {
            console.log('Aucune carte à déplier (cardId est null/undefined)');
        }
    };
    
    // Ajouter l'écouteur
    addEventListener('expandedActivityCard', expandedActivityCardChangeListener);
}

/**
 * Restaurer l'état des cartes dépliées depuis le store
 */
function restoreExpandedCards() {
    console.log('=== RESTAURATION DES CARTES DÉPLIÉES ===');
    console.log('État global actuel - expandedActivityCard:', getExpandedActivityCard());
    
    // Restaurer la carte d'activité dépliée DANS CETTE VUE SEULEMENT
    const expandedActivityId = getExpandedActivityCard();
    console.log('ID de la carte d\'activité à restaurer:', expandedActivityId);
    
    if (expandedActivityId) {
        const currentViewContainer = document.getElementById('activitiesGrid');
        if (currentViewContainer) {
            const activityCard = currentViewContainer.querySelector(`[data-activity-id="${expandedActivityId}"]`);
            if (activityCard) {
                console.log('Carte d\'activité trouvée dans cette vue, restauration...');
                const body = activityCard.querySelector('.content-card-body');
                if (body) {
                    body.classList.remove('content-card-body--collapsed');
                    body.classList.add('content-card-body--expanded');
                    activityCard.classList.add('expanded'); // Appliquer sur la carte
                    
                    // Charger les données si pas encore fait
                    const detailsContent = body.querySelector('.activity-details-content');
                    if (detailsContent && !activityCard.dataset.responsiblesLoaded) {
                        // Attendre que les activités sont chargées
                        const loadCardData = () => {
                            console.log('restoreExpandedCards - expandedActivityId:', expandedActivityId, 'type:', typeof expandedActivityId);
                            
                            // Recherche directe de l'activité (IDs maintenant cohérents)
                            // Convertir expandedActivityId en nombre pour la comparaison
                            const activity = activities.find(a => a.id === Number(expandedActivityId));
                            
                            if (activity) {
                                console.log('restoreExpandedCards - Activité trouvée, chargement des responsables');
                                loadResponsiblesForCard(activityCard, activity, detailsContent, true);
                            } else {
                                // Si les activités ne sont pas encore chargées, réessayer dans 100ms
                                console.log('restoreExpandedCards - Activité non trouvée, retry dans 100ms');
                                setTimeout(loadCardData, 100);
                            }
                        };
                        loadCardData();
                    }
                }
            } else {
                console.log('Carte d\'activité non trouvée dans cette vue - l\'activité n\'existe pas dans ce type');
                console.log('Activités disponibles dans ce type:', activities.map(a => a.id));
                // Ne pas effacer l'état du store ici - l'activité pourrait exister dans un autre type
            }
        }
    }
    
    // Restaurer la carte de tâche dépliée
    const expandedTaskId = getExpandedTaskCard();
    console.log('ID de la carte de tâche à restaurer:', expandedTaskId);
    
    if (expandedTaskId) {
        const taskItem = document.querySelector(`[data-task-id="${expandedTaskId}"]`);
        if (taskItem) {
            console.log('Carte de tâche trouvée, restauration...');
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
        } else {
            console.log('Carte de tâche non trouvée dans le DOM, effacement de l\'état...');
            // Si la carte n'existe plus dans le DOM, effacer l'état
            clearExpandedTaskCard();
        }
    }
}

/**
 * Créer le header avec les filtres
 */
function createHeaderWithFilters() {
    console.log('=== CRÉATION DU HEADER AVEC FILTRES ===');
    
    // Vérifier si le conteneur principal existe
    if (!container) {
        console.error('Container principal non trouvé');
        return;
    }
    
    // Nettoyer le conteneur principal pour éviter les doublons
    const existingFilters = container.querySelector('.view-filters');
    if (existingFilters) {
        container.removeChild(existingFilters);
    }
    
    // Créer les filtres
    const filters = document.createElement('div');
    filters.className = 'view-filters';
    
    // Créer le conteneur des boutons de type
    const typeButtonsContainer = document.createElement('div');
    typeButtonsContainer.className = 'type-buttons btn-group-container';
    typeButtonsContainer.id = 'type-buttons-container';
    filters.appendChild(typeButtonsContainer);
    
    // Ajouter le spacer
    const spacer = document.createElement('div');
    spacer.className = 'spacer';
    filters.appendChild(spacer);
    
    // Ajout du conteneur du sélecteur de date
    const dateSelectorContainer = document.createElement('div');
    filters.appendChild(dateSelectorContainer);
    
    // Ajouter les filtres au conteneur de la vue
    container.appendChild(filters);
    
    // Initialiser le sélecteur de date
    const currentDateFromStore = getSelectedDate() || formatDateForAPI(new Date());
    console.log('Initialisation du DateSelector avec la date:', currentDateFromStore);
    dateSelector = new DateSelector(dateSelectorContainer, {
        initialDate: new Date(currentDateFromStore),
        onDateChange: async (date) => {
            console.log('DateSelector onDateChange appelé avec la date:', date);
            setSelectedDate(formatDateForAPI(date));
            // Note: loadActivities() et displayActivities() seront appelés automatiquement par l'écouteur d'événement
        }
    });
    console.log('DateSelector initialisé:', !!dateSelector);
}

/**
 * Charger les types d'activités
 */
async function loadActivityTypes() {
    console.log('=== DÉBUT CHARGEMENT DES TYPES ===');
    
    try {
        // Utiliser l'API activities.php pour récupérer les types d'activités
        const url = '../../api/responsibilities/common/activities.php?action=get_activity_types';
        console.log('Appel API avec URL:', url);
        
        const data = await apiRequest(url);
        
        console.log('Réponse API des types:', data);
        
        // Vérifier si la réponse contient les données attendues
        if (!data || !data.data || !data.data.activity_types) {
            console.error('Réponse API invalide:', data);
            throw new Error('Réponse API invalide: ' + JSON.stringify(data));
        }
        
        // Récupérer les types d'activités de la réponse
        availableTypes = data.data.activity_types.map(type => ({
            type_name: type.name,
            type_description: type.description,
            type_emoji: '',
            entry: type.entry
        }));
        
        console.log('Types d\'activités chargés:', availableTypes);
        console.log('Appel de generateTypeButtons avec', availableTypes.length, 'types');
        
        // Générer les boutons immédiatement sans délai
        generateTypeButtons();
        
    } catch (error) {
        console.error('Erreur lors du chargement des types d\'activités:', error);
        
        // Afficher un message d'erreur à l'utilisateur
        showMessage('Erreur lors du chargement des types d\'activités.', 'error');
    }
    
    console.log('=== FIN CHARGEMENT DES TYPES ===');
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
 * Test de création des boutons de type
 */
function testTypeButtonsCreation() {
    console.log('=== TEST DE CRÉATION DES BOUTONS ===');
    
    // Vérifier si nous sommes dans la vue éditeur
    const editorContainer = document.getElementById('editor-container');
    console.log('Conteneur éditeur:', editorContainer);
    console.log('Conteneur éditeur display:', editorContainer ? editorContainer.style.display : 'N/A');
    
    // Vérifier si le conteneur existe
    const container = document.querySelector('.type-buttons');
    console.log('Conteneur .type-buttons:', container);
    
    if (container) {
        console.log('Contenu du conteneur:', container.innerHTML);
        console.log('Nombre d\'enfants:', container.children.length);
        console.log('Enfants du conteneur:', Array.from(container.children).map(child => ({
            tagName: child.tagName,
            className: child.className,
            textContent: child.textContent,
            style: {
                display: child.style.display,
                visibility: child.style.visibility,
                opacity: child.style.opacity
            }
        })));
        
        // Vérifier les styles
        const computedStyle = window.getComputedStyle(container);
        console.log('Display du conteneur:', computedStyle.display);
        console.log('Visibility du conteneur:', computedStyle.visibility);
        console.log('Opacity du conteneur:', computedStyle.opacity);
        console.log('Position du conteneur:', computedStyle.position);
        console.log('Z-index du conteneur:', computedStyle.zIndex);
        
        // Vérifier les boutons
        const buttons = container.querySelectorAll('button');
        console.log('Nombre de boutons trouvés:', buttons.length);
        
        buttons.forEach((btn, index) => {
            const btnStyle = window.getComputedStyle(btn);
            console.log(`Bouton ${index}:`, {
                text: btn.textContent,
                display: btnStyle.display,
                visibility: btnStyle.visibility,
                opacity: btnStyle.opacity,
                width: btnStyle.width,
                height: btnStyle.height,
                position: btnStyle.position,
                zIndex: btnStyle.zIndex,
                backgroundColor: btnStyle.backgroundColor,
                border: btnStyle.border
            });
        });
        
        // Vérifier si le conteneur parent est visible
        const parentContainer = container.parentElement;
        if (parentContainer) {
            const parentStyle = window.getComputedStyle(parentContainer);
            console.log('Conteneur parent:', {
                tagName: parentContainer.tagName,
                className: parentContainer.className,
                display: parentStyle.display,
                visibility: parentStyle.visibility,
                opacity: parentStyle.opacity,
                height: parentStyle.height,
                overflow: parentStyle.overflow
            });
        }
    } else {
        console.error('Conteneur .type-buttons non trouvé dans le DOM');
        console.log('Tous les éléments avec "type" dans la classe:', document.querySelectorAll('[class*="type"]'));
        console.log('Tous les éléments avec "btn" dans la classe:', document.querySelectorAll('[class*="btn"]'));
        
        // Vérifier tous les conteneurs de vue
        console.log('Conteneurs de vue disponibles:');
        console.log('editor-container:', document.getElementById('editor-container'));
        console.log('global-view-container:', document.getElementById('global-view-container'));
        console.log('worker-view-container:', document.getElementById('worker-view-container'));
    }
    
    console.log('=== FIN TEST ===');
}

/**
 * Générer les boutons de sélection de type
 */
function generateTypeButtons() {
    console.log('=== GÉNÉRATION DES BOUTONS DE TYPE ===');
    
    // Sélectionner le conteneur des boutons
    const container = document.getElementById('type-buttons-container') || document.querySelector('.type-buttons');
    
    if (!container) {
        console.error('Conteneur des boutons de type non trouvé');
        return;
    }
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Générer les boutons pour chaque type d'activité
    availableTypes.forEach(type => {
        const button = document.createElement('button');
        button.className = 'btn';
        button.textContent = formatTypeName(type.type_name);
        button.dataset.type = type.type_name;
        
        button.addEventListener('click', async function() {
            await selectType(type.type_name, this);
        });
        
        container.appendChild(button);
    });
    
    // Sélectionner le premier bouton par défaut si aucun type n'est sélectionné
    if (availableTypes.length > 0) {
        const currentSelectedType = getSelectedActivityType();
        let buttonToActivate = null;
        
        if (currentSelectedType) {
            // Si un type est déjà sélectionné dans le store, l'utiliser
            buttonToActivate = container.querySelector(`.btn[data-type="${currentSelectedType}"]`);
        }
        
        if (!buttonToActivate) {
            // Sinon, sélectionner le premier bouton par défaut
            buttonToActivate = container.querySelector('.btn[data-type]');
            if (buttonToActivate) {
                setSelectedActivityType(buttonToActivate.dataset.type);
            }
        }
        
        if (buttonToActivate) {
            buttonToActivate.classList.add('active');
        }
    }
    
    console.log('Boutons de type générés:', container.children.length);
}

/**
 * Sélectionner un type d'activité
 * @param {string} type - Le type à sélectionner
 * @param {HTMLElement} buttonElement - L'élément bouton cliqué (optionnel)
 */
async function selectType(type, buttonElement = null) {
    console.log('Sélection du type:', type);
    
    // Mettre à jour l'état global (cela déclenchera automatiquement les écouteurs d'événements)
    setSelectedActivityType(type);
    
    // Mettre à jour les styles de tous les boutons DANS CETTE VUE SEULEMENT
    const typeButtonsContainer = document.getElementById('type-buttons-container');
    if (typeButtonsContainer) {
        typeButtonsContainer.querySelectorAll('.btn[data-type]').forEach(btn => {
            btn.classList.remove('active');
        });
    }
    
    // Si un bouton est fourni, l'activer
    if (buttonElement) {
        buttonElement.classList.add('active');
    } else {
        // Sinon, trouver le bouton correspondant au type et l'activer DANS CETTE VUE SEULEMENT
        const typeButtonsContainer = document.getElementById('type-buttons-container');
        if (typeButtonsContainer) {
            const button = typeButtonsContainer.querySelector(`.btn[data-type="${type}"]`);
            if (button) {
                button.classList.add('active');
            }
        }
    }
    
    // Charger les activités pour ce type et mettre à jour l'affichage
    await loadActivities();
    displayActivities();
}

/**
 * Charger les activités pour le type sélectionné
 */
async function loadActivities() {
    try {
        const selectedDate = getSelectedDate() || formatDateForAPI(new Date());
        const selectedType = getSelectedActivityType();
        
        if (!selectedType) {
            console.warn('Aucun type d\'activité sélectionné');
            activities = [];
            return [];
        }
        
        const url = `../../api/responsibilities/editor/editor.php?action=get_activities&type=${selectedType}&date=${selectedDate}`;
        
        const data = await apiRequest(url);
        
        if (data && data.data && data.data.activities) {
            activities = data.data.activities;
            return activities;
        } else {
            console.error('Format de réponse invalide:', data);
            showMessage('Erreur lors du chargement des activités', 'error');
            activities = [];
            return [];
        }
    } catch (error) {
        console.error('Erreur lors du chargement des activités:', error);
        showMessage('Erreur lors du chargement des activités', 'error');
        activities = [];
        return [];
    }
}

/**
 * Afficher la grille des activités
 */
function displayActivities(activitiesToShow = activities) {
    const container = document.getElementById('activitiesGrid');
    if (!container) {
        console.error('Conteneur activitiesGrid non trouvé');
        return;
    }
    
    container.innerHTML = '';

    // Afficher les activités existantes en premier
    if (activitiesToShow && activitiesToShow.length > 0) {
        activitiesToShow.forEach((activity, index) => {
            const card = createActivityCard(activity);
            container.appendChild(card);
        });
    } else {
        // Afficher un message si aucune activité
        const noActivitiesMessage = document.createElement('div');
        noActivitiesMessage.className = 'no-activities-message';
        noActivitiesMessage.textContent = `Aucune activité de type "${getSelectedActivityType()}" trouvée pour cette date.`;
        container.appendChild(noActivitiesMessage);
    }

    // Ajouter la carte "Nouvelle activité" à la fin
    const newActivityCard = createNewActivityCard();
    container.appendChild(newActivityCard);
    
    // Restaurer l'état des cartes dépliées après l'affichage
    // Utiliser setTimeout pour s'assurer que le DOM est complètement rendu
    setTimeout(() => {
        restoreExpandedCards();
    }, 10);
    
    // Vérification finale supprimée pour la production
}

/**
 * Créer la carte "Nouvelle activité"
 */
function createNewActivityCard() {
    const card = document.createElement('div');
    card.className = 'content-card content-card--create-new';

    // Utilise directement le nom du type sélectionné en minuscules
    let typeLabel = 'activité';
    const selectedType = getSelectedActivityType();
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
        // Pour l'instant, afficher un message à l'utilisateur
        showMessage('La création d\'activité n\'est pas encore disponible dans cette nouvelle interface', 'info');
    });

    return card;
}

/**
 * Créer une carte d'activité pour la grille
 */
function createActivityCard(activity) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.dataset.activityId = activity.id;
    
    // Assurer que la carte est cliquable (utiliser les classes CSS au lieu des styles inline)
    card.classList.add('clickable');

    // En-tête de la carte (nom à gauche, dates à droite)
    const header = document.createElement('div');
    header.className = 'content-card-header';

    // Nom de l'activité (emoji+type+nom)
    const title = document.createElement('div');
    title.className = 'content-card-title';
    title.textContent = formatActivityNameEscaped({
        name: activity.name,
        type: activity.type,
        icon: activity.icon || activity.emoji
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
            body.classList.add('content-card-body--collapsed');
    
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
    
    // Attacher l'écouteur d'événement pour la carte
    
    // Événement click standard
    card.addEventListener('click', (e) => {
        handleCardInteraction(e, card, activity, detailsContent);
    });
    
    // Fonction de gestion commune pour tous les événements
    function handleCardInteraction(e, card, activity, detailsContent) {
        // Si le clic est sur un élément interactif à l'intérieur de la carte, ne pas déplier/replier
        if (e.target.closest('.tabs-nav-link') || e.target.closest('button:not(.content-card-header)')) {
            return;
        }
        
        toggleActivityCard(card, activity, detailsContent);
    }
    
    // Note: La restauration de l'état se fait dans restoreExpandedCards() après l'affichage de toutes les cartes
    // pour éviter les conflits et assurer une restauration cohérente
    
    return card;
}

/**
 * Basculer l'affichage d'une carte d'activité
 * Assure qu'une seule carte d'activité soit dépliée à la fois
 */
async function toggleActivityCard(card, activity, detailsContent) {
    const currentExpandedCardId = getExpandedActivityCard();
    const body = card.querySelector('.content-card-body');
    
    // Vérifier si la carte est actuellement visuellement ouverte
    const isCurrentlyExpanded = card.classList.contains('expanded');
    
    if (currentExpandedCardId === activity.id || isCurrentlyExpanded) {
        // Réduire la carte (soit elle est dans le store, soit elle est visuellement ouverte)
        if (body) {
            body.classList.remove('content-card-body--expanded');
            body.classList.add('content-card-body--collapsed');
            card.classList.remove('expanded');
        }
        
        // Réduire la carte en effaçant l'état du store
        clearExpandedActivityCard();
    } else {
        // Développer la carte
        if (body) {
            body.classList.remove('content-card-body--collapsed');
            body.classList.add('content-card-body--expanded');
            card.classList.add('expanded');
        }
        
        // Créer la structure des onglets sans charger les données automatiquement
        if (!card.dataset.responsiblesLoaded) {
            loadResponsiblesForCard(card, activity, detailsContent, true);
        }
        
        // Déplier la carte en mettant à jour le store
        setExpandedActivityCard(activity.id);
    }
}

/**
 * Charger les responsables pour une carte spécifique
 */
async function loadResponsiblesForCard(card, activity, detailsContent, autoLoadFirstTab = false) {
    // Vérifier que l'activité existe et a un ID
    if (!activity || !activity.id) {
        console.error('Activité invalide ou manquante dans loadResponsiblesForCard:', activity);
        detailsContent.innerHTML = '<p class="error-state">Erreur: Activité invalide</p>';
        return;
    }
    
    // Nettoyer uniquement la zone des responsables/tâches
    detailsContent.innerHTML = '';

    // Créer le système d'onglets
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'tabs-container';
    
    // Créer les onglets
    const tabsHeader = document.createElement('div');
    tabsHeader.className = 'tabs-nav';
    
    // Onglet Responsables
    const responsiblesTab = document.createElement('button');
    responsiblesTab.className = 'tabs-nav-link active';
    responsiblesTab.textContent = 'Responsables';
    
    // Onglet Tâches
    const tasksTab = document.createElement('button');
    tasksTab.className = 'tabs-nav-link';
    tasksTab.textContent = 'Tâches';
    
    tabsHeader.appendChild(responsiblesTab);
    tabsHeader.appendChild(tasksTab);
    tabsContainer.appendChild(tabsHeader);
    
    // Conteneur pour le contenu des onglets
    const tabsContent = document.createElement('div');
    tabsContent.className = 'tabs-content';
    
    // Contenu de l'onglet Responsables
    const responsiblesContent = document.createElement('div');
    responsiblesContent.className = 'tabs-panel active';
    responsiblesContent.id = 'responsibles-tab-content';
    responsiblesContent.innerHTML = '<p class="no-content-message">Cliquez pour voir les responsables</p>';
    
    // Contenu de l'onglet Tâches
    const tasksContent = document.createElement('div');
    tasksContent.className = 'tabs-panel';
    tasksContent.id = 'tasks-tab-content';
    tasksContent.innerHTML = '<p class="no-content-message">Cliquez pour voir les tâches</p>';
    
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
        responsiblesContent.classList.add('active');
        tasksContent.classList.remove('active');
        
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
        tasksContent.classList.add('active');
        responsiblesContent.classList.remove('active');
        
        // Charger les tâches si pas encore fait
        if (!card.dataset.tasksLoaded) {
            loadTasksData(card, activity, tasksContent);
        }
    });
    
    // Si restauration automatique, charger les responsables par défaut
    if (autoLoadFirstTab && !card.dataset.responsiblesLoaded) {
        console.log('loadResponsiblesForCard - autoLoadFirstTab=true, chargement automatique des responsables');
        // S'assurer que l'onglet Responsables est actif et visible
        responsiblesTab.classList.add('active');
        tasksTab.classList.remove('active');
        responsiblesContent.classList.add('active');
        tasksContent.classList.remove('active');
        
        loadResponsiblesData(card, activity, responsiblesContent);
    } else {
        console.log('loadResponsiblesForCard - autoLoadFirstTab:', autoLoadFirstTab, 'responsiblesLoaded:', card.dataset.responsiblesLoaded);
    }
}

/**
 * Charger les données des responsables
 */
async function loadResponsiblesData(card, activity, container) {
    try {
        console.log('loadResponsiblesData - Début de la fonction');
        console.log('loadResponsiblesData - activity:', activity);
        console.log('loadResponsiblesData - activity.id:', activity?.id);
        
        // Vérifier que l'activité existe et a un ID
        if (!activity || !activity.id) {
            console.error('Activité invalide ou manquante:', activity);
            container.innerHTML = '<p class="error-state">Erreur: Activité invalide</p>';
            return;
        }
        
        const dateStr = getSelectedDate();
        const url = `../../api/responsibilities/editor/editor.php?action=get_responsible_for&activity=${activity.id}&date=${dateStr}`;
        
        console.log('loadResponsiblesData - URL de la requête:', url);
        console.log('loadResponsiblesData - Envoi de la requête HTTP...');
        
        const response = await apiRequest(url);
        
        console.log('loadResponsiblesData - Réponse reçue:', response);
        
        if (response.success && response.data) {
            const responsibles = response.data.responsibles || [];
            
            if (responsibles.length === 0) {
                container.innerHTML = '<p class="no-content-message">Aucun responsable assigné</p>';
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
        // Vérifier que l'activité existe et a un ID
        if (!activity || !activity.id) {
            console.error('Activité invalide ou manquante:', activity);
            container.innerHTML = '<p class="error-state">Erreur: Activité invalide</p>';
            return;
        }
        
        const dateStr = getSelectedDate();
        const tasks = await getActivityTasks(activity.id, dateStr);
        
        if (!tasks || tasks.length === 0) {
            container.innerHTML = '<p class="no-content-message">Aucune tâche associée</p>';
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
 * Charger les assignations d'une tâche
 * @param {string} taskId - ID de la tâche
 * @param {HTMLElement} container - Conteneur pour afficher les assignations
 */
async function loadTaskAssignments(taskId, container) {
    try {
        console.log('Chargement des assignations pour la tâche:', taskId);
        // TODO: Implémenter le chargement des assignations
        container.innerHTML = '<p class="no-content-message">Fonctionnalité en cours de développement</p>';
    } catch (error) {
        console.error('Erreur lors du chargement des assignations:', error);
        container.innerHTML = '<p class="error-state">Erreur lors du chargement des assignations</p>';
    }
}

/**
 * Récupérer les tâches d'une activité
 * @param {string} activityId - ID de l'activité
 * @param {string} dateStr - Date au format string
 * @returns {Array} Liste des tâches
 */
async function getActivityTasks(activityId, dateStr) {
    try {
        console.log('Récupération des tâches pour l\'activité:', activityId);
        // TODO: Implémenter la récupération des tâches
        return [];
    } catch (error) {
        console.error('Erreur lors de la récupération des tâches:', error);
        return [];
    }
}

/**
 * Créer un élément de vue pour une tâche
 * @param {Object} task - Données de la tâche
 * @returns {HTMLElement} Élément DOM pour la tâche
 */
function createTaskViewItem(task) {
    const item = document.createElement('div');
    item.className = 'content-card content-card--subgroup content-card--nested';
    
    const header = document.createElement('div');
    header.className = 'content-card-header content-card--nested';
    
    const title = document.createElement('div');
    title.className = 'content-card-title';
    title.textContent = task.name || 'Tâche sans nom';
    
    header.appendChild(title);
    item.appendChild(header);
    
    return item;
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
 * Fonction de rechargement des données pour la vue éditeur
 * Exposée globalement pour être appelée depuis app.js
 */
async function reloadEditorViewData() {
    console.log('Rechargement des données de la vue éditeur...');
    await loadActivities();
    displayActivities();
}

// Exposer la fonction de rechargement globalement
window.editorViewReloadData = reloadEditorViewData;

// Fonction de test pour simuler un clic sur une carte
window.testCardClick = function(index) {
    console.log('%cTEST MANUEL DE CLIC SUR CARTE', 'background: yellow; color: black; font-size: 18px; font-weight: bold;');
    
    const cards = document.querySelectorAll('.content-card[data-activity-id]');
    console.log(`Nombre de cartes trouvées: ${cards.length}`);
    
    if (cards.length === 0) {
        console.error('Aucune carte trouvée dans le DOM!');
        return;
    }
    
    // Si index est défini et valide, cliquer sur cette carte
    if (index !== undefined && index >= 0 && index < cards.length) {
        console.log(`Tentative de clic sur la carte à l'index ${index}`);
        const card = cards[index];
        console.log('Carte:', card);
        console.log('ID de la carte:', card.dataset.activityId);
        
        // Simuler un clic
        console.log('Simulation de l\'événement click...');
        card.click();
        
        console.log('Simulation de l\'événement pointerdown...');
        const pointerEvent = new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        card.dispatchEvent(pointerEvent);
        
        return;
    }
    
    // Sinon, afficher toutes les cartes disponibles
    console.log('Cartes disponibles:');
    cards.forEach((card, idx) => {
        console.log(`[${idx}] ID: ${card.dataset.activityId}`);
    });
    console.log('\nUtilisation: testCardClick(index) où index est le numéro de la carte à tester');
};

// Fonction de diagnostic pour vérifier tous les styles qui pourraient affecter les clics
window.diagnoseCssIssues = function() {
    console.log('%cDIAGNOSTIC CSS POUR LES CARTES', 'background: cyan; color: black; font-size: 18px; font-weight: bold;');
    
    const cards = document.querySelectorAll('.content-card[data-activity-id]');
    
    if (cards.length === 0) {
        console.error('Aucune carte trouvée dans le DOM!');
        return;
    }
    
    cards.forEach((card, idx) => {
        console.log(`\n--- CARTE ${idx} ---`);
        const style = window.getComputedStyle(card);
        
        // Propriétés qui peuvent affecter la cliquabilité
        console.log(`pointer-events: ${style.pointerEvents}`);
        console.log(`display: ${style.display}`);
        console.log(`visibility: ${style.visibility}`);
        console.log(`opacity: ${style.opacity}`);
        console.log(`position: ${style.position}`);
        console.log(`z-index: ${style.zIndex}`);
        console.log(`height: ${style.height}`);
        console.log(`width: ${style.width}`);
        console.log(`overflow: ${style.overflow}`);
        console.log(`cursor: ${style.cursor}`);
        
        // Vérifier si quelque chose recouvre la carte
        const rect = card.getBoundingClientRect();
        console.log(`Position: x=${rect.left}, y=${rect.top}, w=${rect.width}, h=${rect.height}`);
        
        // Trouver les éléments à la même position
        const elementsAtSamePos = document.elementsFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
        console.log('Éléments empilés à cette position:');
        elementsAtSamePos.forEach((el, i) => {
            console.log(`[${i}] ${el.tagName}.${el.className}`);
        });
        
        // Est-ce que cette carte est le premier élément (celui qui reçoit les événements)
        const isTopElement = elementsAtSamePos[0] === card;
        console.log(`Cette carte est ${isTopElement ? 'au premier plan' : 'couverte par d\'autres éléments'}`);
    });
};