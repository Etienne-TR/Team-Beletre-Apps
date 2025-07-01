// Module pour la création des cartes d'activités - Responsabilités

// Import des modules ES6
import { 
    createResponsibleBadge,
    createAssignmentBadge
} from '/apps/responsibilities/services/shared.js';
import { formatActivityNameEscaped } from '/modules/utils/activity-formatter.js';
import { formatActivityDescription } from '/modules/utils/activity-description.js';
import { 
    expandCard, 
    collapseCard, 
    isCardExpanded,
    expandGlobalCard,
    collapseGlobalCard,
    isGlobalCardExpanded
} from '/modules/store/responsibilities.js';

/**
 * Crée une carte d'activité complète avec ses responsables et tâches - Version pliable
 * @param {Object} activity - L'activité à afficher
 * @param {Array} responsibles - Liste des responsables (optionnel)
 * @param {Array} tasks - Liste des tâches (optionnel)
 * @param {Object} options - Options de configuration
 * @returns {HTMLElement} - L'élément DOM de la carte
 */
export function createActivityCard(activity, responsibles = null, tasks = null, options = {}) {
    const card = document.createElement('div');
    card.className = 'activity-card card collapsible';
    
    // Générer un ID unique pour la carte basé uniquement sur l'ID de l'activité
    const cardId = `activity-${activity.id}`;
    card.dataset.cardId = cardId;
    
    // En-tête compact avec nom et badges des responsables
    const compactHeader = createCompactHeader(activity, responsibles, options);
    card.appendChild(compactHeader);
    
    // Contenu détaillé (masqué par défaut)
    const detailedContent = document.createElement('div');
    detailedContent.className = 'detailed-content';
    detailedContent.style.display = 'none';
    
    // Description de l'activité
    const description = createActivityDescription(activity, options);
    detailedContent.appendChild(description);
    
    // Section des tâches
    const tasksSection = createTasksSection(tasks || activity.tasks, options);
    detailedContent.appendChild(tasksSection);
    
    card.appendChild(detailedContent);
    
    // Restaurer l'état de la carte depuis le store
    restoreCardState(card, cardId, options);
    
    // Ajouter l'événement de clic pour basculer l'affichage
    setupCardToggle(card, compactHeader, cardId, options);
    
    return card;
}

/**
 * Crée l'en-tête compact d'une activité (nom + badges uniquement)
 * @param {Object} activity - L'activité
 * @param {Array} responsibles - Liste des responsables (optionnel)
 * @param {Object} options - Options de configuration
 * @returns {HTMLElement} - L'élément DOM de l'en-tête compact
 */
function createCompactHeader(activity, responsibles = null, options = {}) {
    const header = document.createElement('div');
    header.className = 'compact-header';
    
    const nameRow = document.createElement('div');
    nameRow.className = 'activity-name-row';
    
    const name = document.createElement(options.nameTag || 'h3');
    name.className = 'activity-name';
    name.textContent = formatActivityNameEscaped(activity);
    
    nameRow.appendChild(name);
    
    // Ajouter les badges des responsables sur la même ligne
    const responsiblesList = responsibles || activity.responsible;
    if (responsiblesList && responsiblesList.length > 0) {
        const badgesContainer = document.createElement('div');
        badgesContainer.className = 'responsibles-badges';
        
        responsiblesList.forEach(responsible => {
            const badge = createResponsibleBadge(responsible);
            badgesContainer.appendChild(badge);
        });
        
        nameRow.appendChild(badgesContainer);
    }
    
    header.appendChild(nameRow);
    return header;
}

/**
 * Crée la section de description de l'activité
 * @param {Object} activity - L'activité
 * @param {Object} options - Options de configuration
 * @returns {HTMLElement} - L'élément DOM de la description
 */
function createActivityDescription(activity, options = {}) {
    const descriptionSection = document.createElement('div');
    descriptionSection.className = 'description-section';
    
    const description = document.createElement('p');
    description.className = options.descriptionClass || 'activity-description';
    description.textContent = formatActivityDescription(activity.description || 'Aucune description disponible.');
    
    descriptionSection.appendChild(description);
    return descriptionSection;
}

/**
 * Configure le système de basculement pour la carte
 * @param {HTMLElement} card - La carte complète
 * @param {HTMLElement} header - L'en-tête compact
 * @param {string} cardId - L'ID unique de la carte
 * @param {Object} options - Options de configuration
 */
function setupCardToggle(card, header, cardId, options = {}) {
    const detailedContent = card.querySelector('.detailed-content');
    
    header.addEventListener('click', function(e) {
        // Éviter le basculement si on clique sur un badge
        if (e.target.closest('.badge')) {
            return;
        }
        
        const isExpanded = detailedContent.style.display !== 'none';
        
        if (isExpanded) {
            // Réduire
            detailedContent.style.display = 'none';
            card.classList.remove('expanded');
            
            // Mémoriser dans le store
            if (options.isGlobalView) {
                collapseGlobalCard(cardId);
            } else {
                collapseCard(cardId, options.selectedWorkerId);
            }
        } else {
            // Développer
            detailedContent.style.display = 'block';
            card.classList.add('expanded');
            
            // Mémoriser dans le store
            if (options.isGlobalView) {
                expandGlobalCard(cardId);
            } else {
                expandCard(cardId, options.selectedWorkerId);
            }
        }
    });
    
    // Rendre l'en-tête cliquable visuellement
    header.style.cursor = 'pointer';
}

/**
 * Crée la section des tâches
 * @param {Array} tasks - Liste des tâches
 * @param {Object} options - Options de configuration
 * @returns {HTMLElement} - L'élément DOM de la section
 */
function createTasksSection(tasks, options = {}) {
    if (tasks && tasks.length > 0) {
        const section = document.createElement('div');
        section.className = options.tasksSectionClass || 'tasks-section';
        
        const title = document.createElement(options.tasksTitleTag || 'h4');
        title.className = options.tasksTitleClass || 'tasks-title';
        title.textContent = options.tasksTitleText || 'Tâches';
        section.appendChild(title);
        
        const list = createTasksList(tasks, options);
        section.appendChild(list);
        
        return section;
    } else {
        const noTasks = document.createElement('div');
        noTasks.className = options.noTasksClass || 'no-tasks';
        noTasks.textContent = options.noTasksText || 'Aucune tâche assignée';
        return noTasks;
    }
}

/**
 * Crée la liste des tâches
 * @param {Array} tasks - Liste des tâches
 * @param {Object} options - Options de configuration
 * @returns {HTMLElement} - L'élément DOM de la liste
 */
function createTasksList(tasks, options = {}) {
    const list = document.createElement('div');
    list.className = options.tasksListClass || 'tasks-list';
    
    tasks.forEach(task => {
        const taskCard = createTaskCard(task, options);
        list.appendChild(taskCard);
    });
    
    return list;
}

/**
 * Crée une carte de tâche
 * @param {Object} task - La tâche à afficher
 * @param {Object} options - Options de configuration
 * @returns {HTMLElement} - L'élément DOM de la carte
 */
export function createTaskCard(task, options = {}) {
    const taskCard = document.createElement('div');
    taskCard.className = options.taskCardClass || 'task-card card collapsible';
    
    // Générer un ID unique pour la carte de tâche basé uniquement sur l'ID de la tâche
    const taskCardId = `task-${task.id || task.task_id}`;
    taskCard.dataset.taskCardId = taskCardId;
    
    // En-tête de la tâche avec nom et badges des assignations
    const taskHeader = document.createElement('div');
    taskHeader.className = options.taskHeaderClass || 'task-header';
    
    const taskNameRow = document.createElement('div');
    taskNameRow.className = 'task-name-row';
    
    const taskName = document.createElement(options.taskNameTag || 'h5');
    taskName.className = options.taskNameClass || 'task-name';
    taskName.textContent = task.name || task.task_name;
    
    taskNameRow.appendChild(taskName);
    
    // Ajouter les badges des assignations sur la même ligne (alignés à droite)
    const assignments = task.assigned_to || task.assigned;
    if (assignments && assignments.length > 0) {
        const assignmentsContainer = document.createElement('div');
        assignmentsContainer.className = options.assignmentsContainerClass || 'assignments-badges';
        
        // Filtrer les assignations si nécessaire (pour la vue des travailleurs)
        let filteredAssignments = assignments;
        if (options.filterAssignments && options.selectedWorkerId) {
            filteredAssignments = assignments.filter(assignment => assignment.id != options.selectedWorkerId);
        }
        
        filteredAssignments.forEach(assignment => {
            const badge = createAssignmentBadge(assignment);
            assignmentsContainer.appendChild(badge);
        });
        
        taskNameRow.appendChild(assignmentsContainer);
    }
    
    taskHeader.appendChild(taskNameRow);
    taskCard.appendChild(taskHeader);
    
    // Description de la tâche (masquée par défaut)
    const taskDescription = document.createElement('div');
    taskDescription.className = options.taskDescriptionClass || 'task-description';
    taskDescription.style.display = 'none';
    taskDescription.textContent = formatActivityDescription(task.description || task.task_description || 'Aucune description disponible.');
    
    taskCard.appendChild(taskDescription);
    
    // Restaurer l'état de la carte de tâche depuis le store
    restoreTaskCardState(taskCard, taskCardId, options);
    
    // Configurer le basculement pour la carte de tâche
    setupTaskCardToggle(taskCard, taskHeader, taskCardId, options);
    
    return taskCard;
}

/**
 * Configure le système de basculement pour la carte de tâche
 * @param {HTMLElement} taskCard - La carte de tâche
 * @param {HTMLElement} taskHeader - L'en-tête de la tâche
 * @param {string} taskCardId - L'ID unique de la carte de tâche
 * @param {Object} options - Options de configuration
 */
function setupTaskCardToggle(taskCard, taskHeader, taskCardId, options = {}) {
    const taskDescription = taskCard.querySelector('.task-description');
    
    taskHeader.addEventListener('click', function(e) {
        // Éviter le basculement si on clique sur un badge
        if (e.target.closest('.badge')) {
            return;
        }
        
        const isExpanded = taskDescription.style.display !== 'none';
        
        if (isExpanded) {
            // Réduire
            taskDescription.style.display = 'none';
            taskCard.classList.remove('expanded');
            
            // Mémoriser dans le store
            if (options.isGlobalView) {
                collapseGlobalCard(taskCardId);
            } else {
                collapseCard(taskCardId, options.selectedWorkerId);
            }
        } else {
            // Développer
            taskDescription.style.display = 'block';
            taskCard.classList.add('expanded');
            
            // Mémoriser dans le store
            if (options.isGlobalView) {
                expandGlobalCard(taskCardId);
            } else {
                expandCard(taskCardId, options.selectedWorkerId);
            }
        }
    });
    
    // Rendre l'en-tête cliquable visuellement
    taskHeader.style.cursor = 'pointer';
}

/**
 * Crée une carte d'activité avec tâches (format spécifique à la vue des travailleurs)
 * @param {Object} activity - L'activité
 * @param {Array} responsibles - Liste des responsables
 * @param {Array} tasks - Liste des tâches
 * @param {Object} options - Options de configuration
 * @returns {HTMLElement} - L'élément DOM de la carte
 */
export function createActivityWithTasksCard(activity, responsibles, tasks, options = {}) {
    // Options spécifiques pour la vue des travailleurs
    const workerOptions = {
        headerClass: 'responsibility-header',
        infoClass: 'responsibility-info',
        nameClass: 'responsibility-name',
        descriptionClass: 'responsibility-description',
        responsiblesSectionClass: 'co-responsibles-section',
        responsiblesTitleClass: 'co-responsibles-title',
        responsiblesListClass: 'co-responsibles-list',
        responsiblesTitleText: 'Co-responsables',
        noResponsiblesClass: 'no-co-responsibles',
        noResponsiblesText: 'Aucun co-responsable',
        tasksSectionClass: 'tasks-section',
        tasksTitleClass: 'tasks-title',
        tasksListClass: 'tasks-list',
        noTasksClass: 'no-tasks',
        noTasksText: 'Aucune tâche assignée',
        filterAssignments: true,
        selectedWorkerId: options.selectedWorkerId,
        ...options
    };
    
    return createActivityCard(activity, responsibles, tasks, workerOptions);
}

/**
 * Crée une carte de tâche simple (pour la vue des travailleurs)
 * @param {Object} task - La tâche
 * @param {Array} assignments - Les assignations
 * @param {Object} options - Options de configuration
 * @returns {HTMLElement} - L'élément DOM de la carte
 */
export function createSimpleTaskCard(task, assignments, options = {}) {
    const simpleOptions = {
        taskCardClass: 'task-card',
        taskHeaderClass: 'task-header',
        taskNameClass: 'task-name',
        taskDescriptionClass: 'task-description',
        assignmentsContainerClass: 'assignments-badges',
        filterAssignments: true,
        selectedWorkerId: options.selectedWorkerId,
        ...options
    };
    
    // Créer un objet task compatible avec createTaskCard
    const taskObject = {
        name: task.task_name,
        description: task.task_description,
        assigned_to: assignments
    };
    
    return createTaskCard(taskObject, simpleOptions);
}

/**
 * Restaure l'état d'une carte depuis le store
 * @param {HTMLElement} card - La carte à restaurer
 * @param {string} cardId - L'ID unique de la carte
 * @param {Object} options - Options de configuration
 */
function restoreCardState(card, cardId, options = {}) {
    const detailedContent = card.querySelector('.detailed-content');
    let isExpanded = false;
    
    // Vérifier l'état dans le store
    if (options.isGlobalView) {
        isExpanded = isGlobalCardExpanded(cardId);
    } else {
        // Pour la vue des travailleurs, utiliser le worker sélectionné
        isExpanded = isCardExpanded(cardId, options.selectedWorkerId);
    }
    
    // Appliquer l'état restauré
    if (isExpanded) {
        detailedContent.style.display = 'block';
        card.classList.add('expanded');
    } else {
        detailedContent.style.display = 'none';
        card.classList.remove('expanded');
    }
}

/**
 * Restaure l'état d'une carte de tâche depuis le store
 * @param {HTMLElement} taskCard - La carte de tâche
 * @param {string} taskCardId - L'ID unique de la carte de tâche
 * @param {Object} options - Options de configuration
 */
function restoreTaskCardState(taskCard, taskCardId, options = {}) {
    const taskDescription = taskCard.querySelector('.task-description');
    let isExpanded = false;
    
    // Vérifier l'état dans le store
    if (options.isGlobalView) {
        isExpanded = isGlobalCardExpanded(taskCardId);
    } else {
        // Pour la vue des travailleurs, utiliser le worker sélectionné
        isExpanded = isCardExpanded(taskCardId, options.selectedWorkerId);
    }
    
    // Appliquer l'état restauré
    if (isExpanded) {
        taskDescription.style.display = 'block';
        taskCard.classList.add('expanded');
    } else {
        taskDescription.style.display = 'none';
        taskCard.classList.remove('expanded');
    }
} 