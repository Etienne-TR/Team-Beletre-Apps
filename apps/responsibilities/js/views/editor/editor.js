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
import { showReviseResponsibleForModal, validateReviseResponsibleForForm, saveResponsibility } from './revise-responsible-for.js';
import { showReviseAssignedToModal, validateReviseAssignedToForm, saveAssignment } from './revise-assigned-to.js';
import { showCreateResponsibleForModal, validateCreateResponsibleForForm, createResponsibleFor, loadAvailableUsers } from './create-responsible-for.js';
import { showCreateAssignedToModal, loadAvailableUsers as loadAvailableUsersForAssignment } from './create-assigned-to.js';

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
        console.log('=== VUE ÉDITEUR - CHANGEMENT DE TYPE DÉTECTÉ ===');
        console.log('Nouveau type reçu:', newType);
        console.log('Type du nouveau type:', typeof newType);
        
        if (newType) {
            // Conserver l'état de la carte dépliée (ne pas l'effacer)
            const currentExpandedCard = getExpandedActivityCard();
            console.log('Vue éditeur - Carte dépliée conservée:', currentExpandedCard);
            
            // Mettre à jour les boutons
            const typeButtonsContainer = document.getElementById('type-buttons-container');
            console.log('Conteneur des boutons trouvé:', !!typeButtonsContainer);
            
            if (typeButtonsContainer) {
                const buttons = typeButtonsContainer.querySelectorAll('.btn[data-type]');
                console.log('Nombre de boutons trouvés:', buttons.length);
                
                buttons.forEach((btn, index) => {
                    console.log(`Bouton ${index}:`, {
                        dataset: btn.dataset,
                        textContent: btn.textContent,
                        className: btn.className
                    });
                    
                    btn.classList.remove('active');
                    if (btn.dataset.type === newType) {
                        console.log(`Activation du bouton pour le type: ${newType}`);
                        btn.classList.add('active');
                    }
                });
                
                console.log('Mise à jour des boutons terminée');
            } else {
                console.warn('Conteneur des boutons non trouvé');
            }
            
            // Recharger les activités
            console.log('Rechargement des activités...');
            loadActivities().then(() => {
                displayActivities();
                // La restauration automatique se fait dans displayActivities() via restoreExpandedCards()
            });
        } else {
            console.warn('Nouveau type est null ou undefined');
        }
    };
    
    // Ajouter l'écouteur
    addEventListener('selectedActivityType', activityTypeChangeListener);
    console.log('Écouteur de changement de type configuré pour la vue éditeur');
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
                            
                            // Afficher les entries des activités pour debug
                            console.log('loadCardData - Entries des activités:');
                            activities.forEach((a, index) => {
                                console.log(`  [${index}] entry: ${a.entry} (type: ${typeof a.entry})`);
                            });
                            
                            // Recherche directe de l'activité (entries maintenant cohérents)
                            // Convertir cardId en nombre pour la comparaison
                            const activity = activities.find(a => a.entry === Number(cardId));
                            
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
                            
                            // Recherche directe de l'activité (entries maintenant cohérents)
                            // Convertir expandedActivityId en nombre pour la comparaison
                            const activity = activities.find(a => a.entry === Number(expandedActivityId));
                            
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
                console.log('Activités disponibles dans ce type:', activities.map(a => a.entry));
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
                const assignmentsContainer = expandableContent.querySelector('.content-cards-container');
                if (assignmentsContainer && !taskItem.dataset.assignmentsLoaded) {
                    loadTaskAssignments(expandedTaskId, assignmentsContainer);
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
        // Utiliser l'API global-controller.php pour récupérer les types d'activités (même que global-view)
        const url = 'controllers/responsibilities/global-controller.php?action=get_activity_types';
        console.log('Appel API avec URL:', url);
        
        console.log('Envoi de la requête API...');
        console.log('URL complète qui sera utilisée: /api/' + url);
        
        console.log('Appel de apiRequest...');
        const data = await apiRequest(url);
        console.log('apiRequest terminé, data reçue:', !!data);
        console.log('Requête API terminée avec succès');
        
        console.log('=== RÉPONSE API BRUTE ===');
        console.log('Type de data:', typeof data);
        console.log('Data complète:', data);
        console.log('Data JSON stringifié:', JSON.stringify(data, null, 2));
        
        // Vérifier la structure de la réponse
        console.log('=== ANALYSE DE LA STRUCTURE ===');
        console.log('data existe:', !!data);
        console.log('data.data existe:', !!(data && data.data));
        console.log('data.data.activity_types existe:', !!(data && data.data && data.data.activity_types));
        
        if (data && data.data) {
            console.log('Clés disponibles dans data.data:', Object.keys(data.data));
            if (data.data.activity_types) {
                console.log('Type de activity_types:', typeof data.data.activity_types);
                console.log('activity_types est un array:', Array.isArray(data.data.activity_types));
                console.log('Nombre d\'éléments dans activity_types:', data.data.activity_types.length);
                
                // Afficher le premier élément pour voir sa structure
                if (data.data.activity_types.length > 0) {
                    console.log('Premier élément de activity_types:', data.data.activity_types[0]);
                    console.log('Clés du premier élément:', Object.keys(data.data.activity_types[0]));
                }
            }
        }
        
        // Vérifier si la réponse contient les données attendues
        if (!data || !data.data || !data.data.activity_types) {
            console.error('Réponse API invalide:', data);
            throw new Error('Réponse API invalide: ' + JSON.stringify(data));
        }
        
        // Récupérer les types d'activités de la réponse
        console.log('=== MAPPING DES TYPES ===');
        console.log('Données brutes à mapper:', data.data.activity_types);
        
        availableTypes = data.data.activity_types.map((type, index) => {
            console.log(`Mapping type ${index}:`, type);
            console.log(`  - type.name: ${type.name} (type: ${typeof type.name})`);
            console.log(`  - type.description: ${type.description} (type: ${typeof type.description})`);
            console.log(`  - type.entry: ${type.entry} (type: ${typeof type.entry})`);
            
            const mappedType = {
                type_name: type.name,
                type_description: type.description,
                type_emoji: '',
                entry: type.entry
            };
            
            console.log(`Type mappé ${index}:`, mappedType);
            return mappedType;
        });
        
        console.log('=== RÉSULTAT FINAL ===');
        console.log('Types d\'activités chargés:', availableTypes);
        console.log('Nombre de types:', availableTypes.length);
        console.log('Appel de generateTypeButtons avec', availableTypes.length, 'types');
        
        // Générer les boutons immédiatement sans délai
        generateTypeButtons();
        
    } catch (error) {
        console.error('=== ERREUR LORS DU CHARGEMENT DES TYPES ===');
        console.error('Message d\'erreur:', error.message);
        console.error('Stack trace:', error.stack);
        console.error('Erreur complète:', error);
        
        // Afficher un message d'erreur à l'utilisateur
        showMessage('Erreur lors du chargement des types d\'activités.', 'error');
    }
    
    console.log('=== FIN CHARGEMENT DES TYPES ===');
    console.log('availableTypes à la fin:', availableTypes);
    console.log('Nombre de types disponibles:', availableTypes.length);
}

/**
 * Charger la liste des travailleurs
 */
async function loadWorkers() {
    try {
        // Utiliser l'API appropriée pour récupérer les utilisateurs
        // TODO: Créer le fichier users.php ou utiliser une autre API
        // const url = '../../api/responsibilities/users.php?action=list';
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
    
    console.log('Conteneur trouvé:', !!container);
    console.log('ID du conteneur:', container ? container.id : 'N/A');
    console.log('Classes du conteneur:', container ? container.className : 'N/A');
    
    if (!container) {
        console.error('Conteneur des boutons de type non trouvé');
        console.log('Recherche de conteneurs alternatifs...');
        console.log('type-buttons-container:', document.getElementById('type-buttons-container'));
        console.log('.type-buttons:', document.querySelector('.type-buttons'));
        console.log('.btn-group-container:', document.querySelector('.btn-group-container'));
        return;
    }
    
    // Vider le conteneur
    container.innerHTML = '';
    console.log('Conteneur vidé');
    
    console.log('=== CRÉATION DES BOUTONS ===');
    console.log('availableTypes:', availableTypes);
    console.log('Nombre de types disponibles:', availableTypes.length);
    
    // Générer les boutons pour chaque type d'activité
    availableTypes.forEach((type, index) => {
        console.log(`Création du bouton ${index} pour le type:`, type);
        console.log(`  - type_name: ${type.type_name}`);
        console.log(`  - type_name formaté: ${formatTypeName(type.type_name)}`);
        
        const button = document.createElement('button');
        button.className = 'btn';
        button.textContent = formatTypeName(type.type_name);
        button.dataset.type = type.type_name;
        
        console.log(`Bouton créé:`, {
            textContent: button.textContent,
            dataset: button.dataset,
            className: button.className
        });
        
        button.addEventListener('click', async function() {
            console.log(`Clic sur le bouton pour le type: ${type.type_name}`);
            await selectType(type.type_name, this);
        });
        
        container.appendChild(button);
        console.log(`Bouton ${index} ajouté au conteneur`);
    });
    
    console.log('=== ÉTAT FINAL DU CONTENEUR ===');
    console.log('Nombre d\'enfants dans le conteneur:', container.children.length);
    console.log('HTML du conteneur:', container.innerHTML);
    
    // Note: L'état visuel des boutons sera mis à jour automatiquement par l'écouteur du store
    // Si aucun type n'est sélectionné, sélectionner le premier par défaut
    if (availableTypes.length > 0) {
        const currentSelectedType = getSelectedActivityType();
        console.log('Type actuellement sélectionné:', currentSelectedType);
        
        if (!currentSelectedType) {
            // Sélectionner le premier type par défaut
            const firstButton = container.querySelector('.btn[data-type]');
            console.log('Premier bouton trouvé:', !!firstButton);
            if (firstButton) {
                console.log('Sélection automatique du premier type:', firstButton.dataset.type);
                setSelectedActivityType(firstButton.dataset.type);
            }
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
    console.log('=== SÉLECTION DE TYPE ===');
    console.log('Type à sélectionner:', type);
    console.log('Type du paramètre:', typeof type);
    console.log('Bouton cliqué:', !!buttonElement);
    
    if (buttonElement) {
        console.log('Propriétés du bouton:', {
            textContent: buttonElement.textContent,
            dataset: buttonElement.dataset,
            className: buttonElement.className
        });
    }
    
    // Mettre à jour uniquement le store
    console.log('Mise à jour du store avec le type:', type);
    setSelectedActivityType(type);
    
    console.log('Sélection de type terminée');
    
    // Note: L'état visuel des boutons sera mis à jour automatiquement par l'écouteur du store
    // Note: loadActivities() et displayActivities() seront appelés automatiquement par l'écouteur du store
}

/**
 * Charger les activités pour le type sélectionné
 */
async function loadActivities() {
    console.log('=== DÉBUT CHARGEMENT DES ACTIVITÉS ===');
    
    try {
        const selectedDate = getSelectedDate() || formatDateForAPI(new Date());
        const selectedType = getSelectedActivityType();
        
        console.log('Date sélectionnée:', selectedDate);
        console.log('Type sélectionné:', selectedType);
        
        if (!selectedType) {
            console.warn('Aucun type d\'activité sélectionné');
            activities = [];
            return [];
        }
        
        const url = `controllers/responsibilities/activity-controller.php?action=get_activities&type=${selectedType}&date=${selectedDate}`;
        console.log('URL de la requête:', url);
        console.log('URL complète qui sera utilisée: /api/' + url);
        
        console.log('Envoi de la requête API pour les activités...');
        const data = await apiRequest(url);
        console.log('Requête API terminée, data reçue:', !!data);
        
        console.log('=== RÉPONSE API ACTIVITÉS ===');
        console.log('Type de data:', typeof data);
        console.log('Data complète:', data);
        console.log('Data JSON stringifié:', JSON.stringify(data, null, 2));
        
        if (data && data.data && data.data.activities) {
            console.log('Activités trouvées:', data.data.activities.length);
            activities = data.data.activities;
            return activities;
        } else {
            console.error('Format de réponse invalide:', data);
            console.log('Structure de data:', {
                'data existe': !!data,
                'data.data existe': !!(data && data.data),
                'data.data.activities existe': !!(data && data.data && data.data.activities)
            });
            showMessage('Erreur lors du chargement des activités', 'error');
            activities = [];
            return [];
        }
    } catch (error) {
        console.error('=== ERREUR LORS DU CHARGEMENT DES ACTIVITÉS ===');
        console.error('Message d\'erreur:', error.message);
        console.error('Stack trace:', error.stack);
        console.error('Erreur complète:', error);
        showMessage('Erreur lors du chargement des activités', 'error');
        activities = [];
        return [];
    }
    
    console.log('=== FIN CHARGEMENT DES ACTIVITÉS ===');
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
            const card = createActivityCard(activity, { isGlobalView: true });
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
function createActivityCard(activity, options = {}) {
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
    description.style.marginBottom = 'var(--gap-medium)';
    
    // Zone cliquable contenant le texte
    const clickableArea = document.createElement('span');
    clickableArea.style.cursor = 'pointer';
    clickableArea.textContent = activity.description || 'Aucune description disponible';
    
    // Effet souligné au survol
    clickableArea.addEventListener('mouseenter', () => {
        clickableArea.style.textDecoration = 'underline';
    });
    
    clickableArea.addEventListener('mouseleave', () => {
        clickableArea.style.textDecoration = 'none';
    });
    
    clickableArea.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        handleEditActivityClick(activity);
    });
    
    description.appendChild(clickableArea);
    body.appendChild(description);
    
    // Conteneur pour les responsables et tâches
    const detailsContent = document.createElement('div');
    detailsContent.className = 'activity-details-content';
    body.appendChild(detailsContent);
    
    card.appendChild(body);
    
    // Attacher l'écouteur d'événement UNIQUEMENT sur le header
    header.addEventListener('click', (e) => {
        // Empêcher la propagation vers d'autres éléments
        e.stopPropagation();
        
        // Si le clic est sur un élément interactif dans le header, ne pas déplier/replier
        if (e.target.closest('button')) {
            return;
        }
        
        toggleActivityCard(card, activity, detailsContent);
    });
    
    // Rendre le header visuellement cliquable
    header.classList.add('clickable');
    header.style.cursor = 'pointer';
    
    // S'assurer que le reste de la carte n'a pas le curseur pointer
    card.style.cursor = 'default';
    
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
    
    if (currentExpandedCardId === activity.entry || isCurrentlyExpanded) {
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
        setExpandedActivityCard(activity.entry);
    }
}

/**
 * Charger les responsables pour une carte spécifique
 */
async function loadResponsiblesForCard(card, activity, detailsContent, autoLoadFirstTab = false) {
    // Vérifier que l'activité existe et a un entry
    if (!activity || !activity.entry) {
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
        console.log('loadResponsiblesData - activity.entry:', activity?.entry);
        
        // Vérifier que l'activité existe et a un entry
        if (!activity || !activity.entry) {
            console.error('Activité invalide ou manquante:', activity);
            container.innerHTML = '<p class="error-state">Erreur: Activité invalide</p>';
            return;
        }
        
        const dateStr = getSelectedDate();
        const url = `../../api/controllers/responsibilities/responsible-for-controller.php?action=listFromDate&activity=${activity.entry}&date=${dateStr}`;
        
        console.log('loadResponsiblesData - URL de la requête:', url);
        console.log('loadResponsiblesData - Envoi de la requête HTTP...');
        
        const response = await apiRequest(url);
        
        console.log('loadResponsiblesData - Réponse reçue:', response);
        
        if (response.success && response.data) {
            const responsibles = response.data.responsibles || [];
            
            const responsiblesList = document.createElement('div');
            responsiblesList.className = 'content-cards-container content-cards-container--nested';
            
            if (responsibles.length > 0) {
                const sortedResponsibles = [...responsibles].sort((a, b) => {
                    if (!a.start_date) return 1;
                    if (!b.start_date) return -1;
                    return new Date(a.start_date) - new Date(b.start_date);
                });
                sortedResponsibles.forEach(responsible => {
                    // On passe l'entry d'activité à la carte de responsable
                    const responsibleItem = createResponsibleCardItem({ ...responsible, activity: activity.entry });
                    responsiblesList.appendChild(responsibleItem);
                });
            }
            
            // Ajouter la carte "Ajouter un.e responsable" à la fin
            const addResponsibleCard = createAddResponsibleCard(activity);
            responsiblesList.appendChild(addResponsibleCard);
            
            container.innerHTML = '';
            container.appendChild(responsiblesList);
            
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
        // Vérifier que l'activité existe et a un entry
        if (!activity || !activity.entry) {
            console.error('Activité invalide ou manquante:', activity);
            container.innerHTML = '<p class="error-state">Erreur: Activité invalide</p>';
            return;
        }
        
        const dateStr = getSelectedDate();
        const tasks = await getActivityTasksFromDate(activity.entry, dateStr);
        
        const tasksList = document.createElement('div');
        tasksList.className = 'content-cards-container content-cards-container--nested';
        
        if (tasks && tasks.length > 0) {
            tasks.forEach(task => {
                const item = createTaskViewItem(task);
                tasksList.appendChild(item);
            });
        }
        
        // Ajouter la carte "Ajouter une tâche" à la fin
        const addTaskCard = createAddTaskCard(activity);
        tasksList.appendChild(addTaskCard);
        
        container.innerHTML = '';
        container.appendChild(tasksList);
        
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
    item.classList.add('clickable');
    
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
    
    // Forcer les coins arrondis en bas sur le header
    header.style.borderRadius = 'var(--border-radius)';
    
    // Événement de clic pour ouvrir le modal d'édition
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        handleResponsibleCardClick(responsible);
    });
    
    return item;
}

/**
 * Créer la carte "Ajouter un.e responsable"
 */
function createAddResponsibleCard(activity) {
    const card = document.createElement('div');
    card.className = 'content-card content-card--subgroup content-card--nested content-card--create-new';
    card.classList.add('clickable');

    // En-tête de la carte
    const header = document.createElement('div');
    header.className = 'content-card-header content-card--nested';

    const title = document.createElement('div');
    title.className = 'content-card-title';
    title.textContent = '➕ Ajouter un.e responsable';

    header.appendChild(title);
    card.appendChild(header);

    // Événement de clic pour ajouter un nouveau responsable
    card.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        handleAddResponsibleClick(activity);
    });

    return card;
}

/**
 * Créer la carte "Ajouter une tâche"
 */
function createAddTaskCard(activity) {
    const card = document.createElement('div');
    card.className = 'content-card content-card--subgroup content-card--nested content-card--create-new';
    card.classList.add('clickable');

    // En-tête de la carte
    const header = document.createElement('div');
    header.className = 'content-card-header content-card--nested';

    const title = document.createElement('div');
    title.className = 'content-card-title';
    title.textContent = '➕ Ajouter une tâche';

    header.appendChild(title);
    card.appendChild(header);

    // Événement de clic pour ajouter une nouvelle tâche
    card.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        handleAddTaskClick(activity);
    });

    return card;
}

/**
 * Créer la carte "Ajouter un.e travailleur.se"
 */
function createAddWorkerCard(task) {
    const card = document.createElement('div');
    card.className = 'content-card content-card--subgroup content-card--nested content-card--create-new';
    card.classList.add('clickable');

    // En-tête de la carte
    const header = document.createElement('div');
    header.className = 'content-card-header content-card--nested';

    const title = document.createElement('div');
    title.className = 'content-card-title';
    title.textContent = '➕ Ajouter un.e travailleur.se';

    header.appendChild(title);
    card.appendChild(header);

    // Événement de clic pour ajouter un nouveau travailleur
    card.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        handleAddWorkerClick(task);
    });

    return card;
}

/**
 * Charger les assignations d'une tâche
 * @param {string} taskId - ID de la tâche
 * @param {HTMLElement} container - Conteneur pour afficher les assignations
 */
async function loadTaskAssignments(taskId, container) {
    try {
        console.log('Chargement des assignations pour la tâche:', taskId);
        
        const dateStr = getSelectedDate();
        const url = `../../api/controllers/responsibilities/assigned-to-controller.php?action=listFromDate&task=${taskId}&date=${dateStr}`;
        console.log('URL de la requête API pour les assignations:', url);
        
        const response = await apiRequest(url);
        console.log('Réponse API loadTaskAssignments:', response);
        
        if (response.success && response.data && response.data.assigned) {
            const assigned = response.data.assigned;
            
            container.innerHTML = '';
            
            if (assigned.length > 0) {
                assigned.forEach(assignment => {
                    const assignedItem = createAssignedWorkerItem(assignment);
                    container.appendChild(assignedItem);
                });
            }
            
            // Ajouter la carte "Ajouter un.e travailleur.se" à la fin
            const addWorkerCard = createAddWorkerCard({ task_id: taskId });
            container.appendChild(addWorkerCard);
            
        } else {
            container.innerHTML = '<p class="no-content-message">Aucune assignation trouvée</p>';
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement des assignations:', error);
        container.innerHTML = '<p class="error-state">Erreur lors du chargement des assignations</p>';
    }
}

/**
 * Récupérer les tâches d'une activité actives à partir d'une date donnée
 * @param {string} activityId - ID de l'activité
 * @param {string} dateStr - Date au format string (YYYY-MM-DD)
 * @returns {Array} Liste des tâches actives à partir de cette date (en cours et futures)
 */
async function getActivityTasksFromDate(activityId, dateStr) {
    try {
        console.log('Récupération des tâches pour l\'activité:', activityId, 'à partir de la date:', dateStr);
        
        // Appel API pour récupérer les tâches de l'activité
        const url = `../../api/controllers/responsibilities/activity-controller.php?action=get_activity_tasks&activity=${activityId}&date=${dateStr}`;
        console.log('URL de la requête API:', url);
        
        const response = await apiRequest(url);
        console.log('Réponse API getActivityTasksFromDate:', response);
        
        if (response.success && response.data && response.data.tasks) {
            console.log(`${response.data.tasks.length} tâches récupérées pour l'activité ${activityId}`);
            return response.data.tasks;
        } else {
            console.warn('Aucune tâche trouvée ou structure de réponse invalide:', response);
            return [];
        }
        
    } catch (error) {
        console.error('Erreur lors de la récupération des tâches:', error);
        return [];
    }
}

/**
 * Gérer le clic sur une carte de responsable
 * @param {Object} responsible - Données du responsable
 */
function handleResponsibleCardClick(responsible) {
    console.log('Clic sur la carte du responsable:', responsible);
    
    // Ouvrir le modal d'édition avec le nouveau formulaire
    showReviseResponsibleForModal(responsible, 
        // Callback de sauvegarde
        async (assignment, formData) => {
            console.log('Sauvegarde de l\'assignation:', formData);
            
            // Valider les données
            const validation = validateReviseResponsibleForForm(formData);
            if (!validation.isValid) {
                showMessage('Erreur de validation: ' + validation.errors.join(', '), 'error');
                return;
            }
            
            try {
                // Utiliser la nouvelle fonction saveResponsibility
                const result = await saveResponsibility(assignment, formData);
                console.log('Résultat de la sauvegarde:', result);
                showMessage('Responsabilité mise à jour avec succès', 'success');
                
                // Recharger les données de la carte d'activité après sauvegarde
                const activityCard = document.querySelector(`[data-activity-id="${responsible.activity}"]`);
                if (activityCard) {
                    const detailsContent = activityCard.querySelector('.activity-details-content');
                    if (detailsContent) {
                        // Recharger les responsables
                        const responsiblesContent = detailsContent.querySelector('#responsibles-tab-content');
                        if (responsiblesContent) {
                            // Réinitialiser le flag pour forcer le rechargement
                            activityCard.dataset.responsiblesLoaded = 'false';
                            // Trouver l'activité complète dans le tableau activities
                            const activity = activities.find(a => a.entry === responsible.activity);
                            if (activity) {
                                loadResponsiblesData(activityCard, activity, responsiblesContent);
                            } else {
                                console.error('Activité non trouvée pour le rechargement:', responsible.activity);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                showMessage('Erreur lors de la sauvegarde: ' + error.message, 'error');
            }
        },
        // Callback de suppression
        async (assignment) => {
            console.log('Suppression de l\'assignation:', assignment);
            
            // Recharger les données de la carte d'activité après suppression
            const activityCard = document.querySelector(`[data-activity-id="${responsible.activity}"]`);
            if (activityCard) {
                const detailsContent = activityCard.querySelector('.activity-details-content');
                if (detailsContent) {
                    // Recharger les responsables
                    const responsiblesContent = detailsContent.querySelector('#responsibles-tab-content');
                    if (responsiblesContent) {
                        // Réinitialiser le flag pour forcer le rechargement
                        activityCard.dataset.responsiblesLoaded = 'false';
                        // Trouver l'activité complète dans le tableau activities
                        const activity = activities.find(a => a.entry === responsible.activity);
                        if (activity) {
                            loadResponsiblesData(activityCard, activity, responsiblesContent);
                        } else {
                            console.error('Activité non trouvée pour le rechargement:', responsible.activity);
                        }
                    }
                }
            }
        }
    );
}

/**
 * Gérer le clic sur une carte de personne assignée à une tâche
 * @param {Object} assignment - Données de l'assignation
 */
function handleAssignedWorkerCardClick(assignment) {
    console.log('=== DÉBUT handleAssignedWorkerCardClick ===');
    console.log('[handleAssignedWorkerCardClick] Assignment reçu:', JSON.stringify(assignment, null, 2));
    
    // Vérifier les propriétés disponibles dans assignment
    console.log('[handleAssignedWorkerCardClick] Propriétés de assignment:');
    console.log('  - activity:', assignment.activity);
    console.log('  - assigned_user_id:', assignment.assigned_user_id);
    console.log('  - user_id:', assignment.user_id);
    console.log('  - task:', assignment.task);
    console.log('  - task_id:', assignment.task_id);
    console.log('  - version:', assignment.version);
    console.log('  - entry:', assignment.entry);
    console.log('  - start_date:', assignment.start_date);
    console.log('  - end_date:', assignment.end_date);
    
    // Ouvrir le modal d'édition avec le nouveau formulaire
    console.log('[handleAssignedWorkerCardClick] Ouverture du modal showReviseAssignedToModal...');
    showReviseAssignedToModal(assignment, 
        // Callback de sauvegarde
        async (assignment, formData) => {
            console.log('=== DÉBUT CALLBACK SAUVEGARDE ===');
            console.log('[handleAssignedWorkerCardClick] Sauvegarde de l\'assignation:', JSON.stringify(formData, null, 2));
            console.log('[handleAssignedWorkerCardClick] Assignment dans callback:', JSON.stringify(assignment, null, 2));
            
            // Valider les données
            console.log('[handleAssignedWorkerCardClick] Validation des données...');
            const validation = validateReviseAssignedToForm(formData);
            console.log('[handleAssignedWorkerCardClick] Résultat validation:', validation);
            
            if (!validation.isValid) {
                console.error('[handleAssignedWorkerCardClick] ❌ Erreur de validation:', validation.errors);
                showMessage('Erreur de validation: ' + validation.errors.join(', '), 'error');
                return;
            }
            
            try {
                console.log('[handleAssignedWorkerCardClick] Appel de saveAssignment...');
                // Utiliser la nouvelle fonction saveAssignment
                const result = await saveAssignment(assignment, formData);
                console.log('[handleAssignedWorkerCardClick] ✅ Résultat de la sauvegarde:', JSON.stringify(result, null, 2));
                showMessage('Assignation mise à jour avec succès', 'success');
                
                // Recharger les assignations de la tâche après sauvegarde
                console.log('[handleAssignedWorkerCardClick] Rechargement des assignations...');
                const taskId = assignment.task || assignment.task_id;
                console.log('[handleAssignedWorkerCardClick] Task ID pour rechargement:', taskId);
                
                const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
                console.log('[handleAssignedWorkerCardClick] Task card trouvée:', !!taskCard);
                
                if (taskCard) {
                    const assignmentsContainer = taskCard.querySelector('.content-cards-container');
                    console.log('[handleAssignedWorkerCardClick] Assignments container trouvé:', !!assignmentsContainer);
                    
                    if (assignmentsContainer) {
                        console.log('[handleAssignedWorkerCardClick] Appel de loadTaskAssignments...');
                        await loadTaskAssignments(taskId, assignmentsContainer);
                        console.log('[handleAssignedWorkerCardClick] ✅ Assignations rechargées');
                    }
                }
                console.log('=== FIN CALLBACK SAUVEGARDE ===');
            } catch (error) {
                console.error('=== ERREUR CALLBACK SAUVEGARDE ===');
                console.error('[handleAssignedWorkerCardClick] ❌ Erreur lors de la sauvegarde:', error);
                console.error('[handleAssignedWorkerCardClick] Message d\'erreur:', error.message);
                console.error('[handleAssignedWorkerCardClick] Stack trace:', error.stack);
                showMessage('Erreur lors de la sauvegarde: ' + error.message, 'error');
                console.error('=== FIN ERREUR CALLBACK SAUVEGARDE ===');
            }
        },
        // Callback de suppression
        async (assignment) => {
            console.log('=== DÉBUT CALLBACK SUPPRESSION ===');
            console.log('[handleAssignedWorkerCardClick] Suppression de l\'assignation:', JSON.stringify(assignment, null, 2));
            
            // Recharger les assignations de la tâche après suppression
            console.log('[handleAssignedWorkerCardClick] Rechargement des assignations après suppression...');
            const taskId = assignment.task || assignment.task_id;
            console.log('[handleAssignedWorkerCardClick] Task ID pour rechargement:', taskId);
            
            const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
            console.log('[handleAssignedWorkerCardClick] Task card trouvée:', !!taskCard);
            
            if (taskCard) {
                const assignmentsContainer = taskCard.querySelector('.content-cards-container');
                console.log('[handleAssignedWorkerCardClick] Assignments container trouvé:', !!assignmentsContainer);
                
                if (assignmentsContainer) {
                    console.log('[handleAssignedWorkerCardClick] Appel de loadTaskAssignments...');
                    await loadTaskAssignments(taskId, assignmentsContainer);
                    console.log('[handleAssignedWorkerCardClick] ✅ Assignations rechargées après suppression');
                }
            }
            console.log('=== FIN CALLBACK SUPPRESSION ===');
        }
    );
    console.log('=== FIN handleAssignedWorkerCardClick ===');
}

/**
 * Gérer le clic sur la carte "Ajouter un.e responsable"
 * @param {Object} activity - Données de l'activité
 */
async function handleAddResponsibleClick(activity) {
    console.log('Clic sur "Ajouter un.e responsable" pour l\'activité:', activity);
    
    try {
        // Récupérer la date sélectionnée pour filtrer les travailleurs sous contrat
        const selectedDate = getSelectedDate() || new Date().toISOString().split('T')[0];
        console.log('Date sélectionnée pour le filtrage des travailleurs:', selectedDate);
        
        // Charger la liste des travailleurs sous contrat à cette date
        const availableUsers = await loadAvailableUsers(selectedDate);
        console.log('Travailleurs disponibles:', availableUsers);
        
        // Ouvrir le modal d'ajout avec le nouveau formulaire
        showCreateResponsibleForModal(activity, availableUsers, 
            // Callback de sauvegarde
            async (activity, formData) => {
                console.log('Sauvegarde du nouveau responsable:', formData);
                
                // Valider les données
                const validation = validateCreateResponsibleForForm(formData);
                if (!validation.isValid) {
                    showMessage('Erreur de validation: ' + validation.errors.join(', '), 'error');
                    return;
                }
                
                try {
                            // Utiliser la nouvelle fonction createResponsibleFor
        const result = await createResponsibleFor(activity, formData);
                    console.log('Résultat de l\'ajout:', result);
                    showMessage('Responsable ajouté avec succès', 'success');
                    
                    // Recharger les données de la carte d'activité après sauvegarde
                    const activityCard = document.querySelector(`[data-activity-id="${activity.entry}"]`);
                    if (activityCard) {
                        const detailsContent = activityCard.querySelector('.activity-details-content');
                        if (detailsContent) {
                            // Recharger les responsables
                            const responsiblesContent = detailsContent.querySelector('#responsibles-tab-content');
                            if (responsiblesContent) {
                                // Réinitialiser le flag pour forcer le rechargement
                                activityCard.dataset.responsiblesLoaded = 'false';
                                loadResponsiblesData(activityCard, activity, responsiblesContent);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Erreur lors de l\'ajout:', error);
                    showMessage('Erreur lors de l\'ajout: ' + error.message, 'error');
                }
            }
        );
    } catch (error) {
        console.error('Erreur lors du chargement des travailleurs:', error);
        showMessage('Erreur lors du chargement des travailleurs: ' + error.message, 'error');
    }
}

/**
 * Gérer le clic sur la carte "Ajouter une tâche"
 * @param {Object} activity - Données de l'activité
 */
async function handleAddTaskClick(activity) {
    console.log('Clic sur "Ajouter une tâche" pour l\'activité:', activity);
    
    // Pour l'instant, afficher un message à l'utilisateur
    showMessage('La création de tâche n\'est pas encore disponible dans cette interface', 'info');
}

/**
 * Gérer le clic sur la carte "Ajouter un.e travailleur.se"
 * @param {Object} task - Données de la tâche
 */
async function handleAddWorkerClick(task) {
    console.log('Clic sur "Ajouter un.e travailleur.se" pour la tâche:', task);
    
    try {
        // Récupérer la date sélectionnée pour filtrer les travailleurs sous contrat
        const selectedDate = getSelectedDate() || new Date().toISOString().split('T')[0];
        console.log('Date sélectionnée pour le filtrage des travailleurs:', selectedDate);
        
        // Charger la liste des travailleurs sous contrat à cette date
        const availableUsers = await loadAvailableUsersForAssignment(selectedDate);
        console.log('Travailleurs disponibles:', availableUsers);
        
        // Ouvrir le modal d'ajout avec le nouveau formulaire
        showCreateAssignedToModal(task, availableUsers, async (task, formData) => {
            console.log('Assignation créée avec succès:', formData);
            
            // Recharger les assignations de la tâche
            const taskCard = document.querySelector(`[data-task-id="${task.task_id}"]`);
            if (taskCard) {
                const assignmentsContainer = taskCard.querySelector('.content-cards-container');
                if (assignmentsContainer) {
                    await loadTaskAssignments(task.task_id, assignmentsContainer);
                }
            }
        });
        
    } catch (error) {
        console.error('Erreur lors de l\'ouverture du formulaire d\'assignation:', error);
        showMessage('Erreur lors de l\'ouverture du formulaire d\'assignation', 'error');
    }
}

/**
 * Gérer le clic sur le crayon d'édition de tâche
 * @param {Object} task - Données de la tâche
 */
async function handleEditTaskClick(task) {
    console.log('Clic sur le crayon d\'édition pour la tâche:', task);
    
    // Pour l'instant, afficher un message à l'utilisateur
    showMessage('L\'édition de tâche n\'est pas encore disponible dans cette interface', 'info');
}

/**
 * Gérer le clic sur le crayon d'édition d'activité
 * @param {Object} activity - Données de l'activité
 */
async function handleEditActivityClick(activity) {
    console.log('Clic sur le crayon d\'édition pour l\'activité:', activity);
    
    // Pour l'instant, afficher un message à l'utilisateur
    showMessage('L\'édition d\'activité n\'est pas encore disponible dans cette interface', 'info');
}

/**
 * Créer un élément pour afficher une personne assignée à une tâche
 * @param {Object} assignment - Données de l'assignation
 * @returns {HTMLElement} Élément DOM pour l'assignation
 */
function createAssignedWorkerItem(assignment) {
    const card = document.createElement('div');
    card.className = 'content-card content-card--subgroup content-card--nested assigned-worker-card';
    card.classList.add('clickable');
    
    const header = document.createElement('div');
    header.className = 'content-card-header content-card--nested';
    
    const name = document.createElement('div');
    name.className = 'content-card-title';
    name.textContent = assignment.assigned_display_name || 'Nom non défini';
    
    const period = document.createElement('div');
    period.className = 'content-card-title-meta';
    period.textContent = formatPeriodLiterary(assignment.start_date, assignment.end_date) || '';
    
    header.appendChild(name);
    header.appendChild(period);
    card.appendChild(header);
    
    // Forcer les coins arrondis en bas sur le header
    header.style.borderRadius = 'var(--border-radius)';
    
    // Événement de clic pour ouvrir le modal d'édition
    card.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        handleAssignedWorkerCardClick(assignment);
    });
    
    return card;
}

/**
 * Créer un élément de vue pour une tâche
 * @param {Object} task - Données de la tâche
 * @returns {HTMLElement} Élément DOM pour la tâche
 */
function createTaskViewItem(task) {
    const item = document.createElement('div');
    item.className = 'content-card content-card--subgroup content-card--nested';
    item.dataset.taskId = task.task_id;
    item.style.cursor = 'default';
    
    // En-tête de la carte avec nom et période
    const header = document.createElement('div');
    header.className = 'content-card-header content-card--nested';
    
    const title = document.createElement('div');
    title.className = 'content-card-title';
    title.textContent = task.task_name || 'Tâche sans nom';
    
    const period = document.createElement('div');
    period.className = 'content-card-title-meta';
    period.textContent = formatPeriodLiterary(task.start_date, task.end_date) || '';
    
    header.appendChild(title);
    header.appendChild(period);
    item.appendChild(header);
    
    // Corps de la carte pour les détails et assignations
    const body = document.createElement('div');
    body.className = 'content-card-body content-card-body--collapsed';
    
    // Description de la tâche (en haut du corps)
    const description = document.createElement('div');
    description.className = 'activity-description-in-card';
    description.style.marginBottom = 'var(--gap-tight)';
    
    // Zone cliquable contenant le texte
    const clickableArea = document.createElement('span');
    clickableArea.style.cursor = 'pointer';
    clickableArea.textContent = task.task_description || 'Aucune description disponible';
    
    // Effet souligné au survol
    clickableArea.addEventListener('mouseenter', () => {
        clickableArea.style.textDecoration = 'underline';
    });
    
    clickableArea.addEventListener('mouseleave', () => {
        clickableArea.style.textDecoration = 'none';
    });
    
    clickableArea.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        handleEditTaskClick(task);
    });
    
    description.appendChild(clickableArea);
    body.appendChild(description);
    
    // Conteneur pour les assignations
    const assignmentsContainer = document.createElement('div');
    assignmentsContainer.className = 'content-cards-container content-cards-container--nested';
    assignmentsContainer.innerHTML = '<p class="no-content-message">Cliquez pour voir les assignations</p>';
    body.appendChild(assignmentsContainer);
    
    item.appendChild(body);
    
    // Événement de clic pour déplier/replier la carte
    header.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTaskCard(item, task, assignmentsContainer);
    });
    
    // Rendre le header visuellement cliquable
    header.classList.add('clickable');
    header.style.cursor = 'pointer';
    
    return item;
}

/**
 * Basculer l'affichage d'une carte de tâche
 * Assure qu'une seule carte de tâche soit dépliée à la fois dans le contexte de l'activité
 */
async function toggleTaskCard(card, task, assignmentsContainer) {
    const body = card.querySelector('.content-card-body');
    const isCurrentlyExpanded = card.classList.contains('expanded');
    
    if (isCurrentlyExpanded) {
        // Réduire la carte
        if (body) {
            body.classList.remove('content-card-body--expanded');
            body.classList.add('content-card-body--collapsed');
            card.classList.remove('expanded');
        }
        
        // Effacer l'état du store
        clearExpandedTaskCard();
    } else {
        // Fermer toutes les autres cartes de tâches dans cette activité
        const parentActivityCard = card.closest('.content-card[data-activity-id]');
        if (parentActivityCard) {
            const otherTaskCards = parentActivityCard.querySelectorAll('.content-card[data-task-id]');
            otherTaskCards.forEach(otherCard => {
                if (otherCard !== card) {
                    const otherBody = otherCard.querySelector('.content-card-body');
                    if (otherBody) {
                        otherBody.classList.remove('content-card-body--expanded');
                        otherBody.classList.add('content-card-body--collapsed');
                        otherCard.classList.remove('expanded');
                    }
                }
            });
        }
        
        // Développer la carte
        if (body) {
            body.classList.remove('content-card-body--collapsed');
            body.classList.add('content-card-body--expanded');
            card.classList.add('expanded');
        }
        
        // Charger les assignations si pas encore fait
        if (!card.dataset.assignmentsLoaded) {
            loadTaskAssignments(task.task_id, assignmentsContainer);
            card.dataset.assignmentsLoaded = 'true';
        }
        
        // Mettre à jour le store
        setExpandedTaskCard(task.task_id);
    }
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

// Fonction de test du modal d'édition des responsables
// window.testResponsibleModal = function() {
//     console.log('%cTEST DU MODAL D\'ÉDITION DES RESPONSABLES', 'background: green; color: white; font-size: 18px; font-weight: bold;');
//     testResponsibleEditModal();
// };