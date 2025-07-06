import { globalStore } from '/modules/store/store.js';
import { formatDateForAPI } from '/modules/utils/date-utils.js';

// Système d'événements pour notifier les vues des changements
const eventListeners = new Map();

/**
 * Ajouter un écouteur d'événement pour les changements d'état
 * @param {string} event - Nom de l'événement ('selectedActivityType', 'selectedDate', etc.)
 * @param {Function} callback - Fonction à appeler quand l'événement se produit
 */
export function addEventListener(event, callback) {
    if (!eventListeners.has(event)) {
        eventListeners.set(event, []);
    }
    eventListeners.get(event).push(callback);
}

/**
 * Supprimer un écouteur d'événement
 * @param {string} event - Nom de l'événement
 * @param {Function} callback - Fonction à supprimer
 */
export function removeEventListener(event, callback) {
    if (eventListeners.has(event)) {
        const listeners = eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }
}

/**
 * Déclencher un événement
 * @param {string} event - Nom de l'événement
 * @param {any} data - Données à passer aux écouteurs
 */
function triggerEvent(event, data) {
    console.log('=== TRIGGER EVENT ===');
    console.log('Événement:', event);
    console.log('Données:', data);
    console.log('Écouteurs enregistrés:', eventListeners.has(event) ? eventListeners.get(event).length : 0);
    
    if (eventListeners.has(event)) {
        eventListeners.get(event).forEach(callback => {
            try {
                console.log('Appel du callback...');
                callback(data);
                console.log('Callback exécuté avec succès');
            } catch (error) {
                console.error('Erreur dans l\'écouteur d\'événement:', error);
            }
        });
    } else {
        console.log('Aucun écouteur pour cet événement');
    }
}

// État initial de responsibilities
const initialState = {
    selectedDate: formatDateForAPI(new Date()),
    selectedActivityType: null,
    expandedActivityCard: null,
    individual: {
        selectedWorker: null,
        responsibleForFilter: null
    },
    editor: {
        expandedTaskCard: null
    }
};

// Initialiser l'état responsibilities dans le store global
globalStore.setState('responsibilities', initialState);
console.log('=== INITIALISATION STORE RESPONSIBILITIES ===');
console.log('État initial responsibilities:', globalStore.getState('responsibilities'));

// ===== ACTIONS POUR L'ÉTAT PARTAGÉ (responsibilities) =====

/**
 * Change la date sélectionnée (partagée entre toutes les vues)
 * @param {string} date - Date au format YYYY-MM-DD
 */
export function setSelectedDate(date) {
    globalStore.setState('responsibilities', { selectedDate: date });
    triggerEvent('selectedDate', date);
}

/**
 * Récupère la date actuellement sélectionnée
 * @returns {string} Date au format YYYY-MM-DD
 */
export function getSelectedDate() {
    return globalStore.getState('responsibilities.selectedDate');
}

/**
 * Sélectionne un type d'activité
 * @param {string} type - Type d'activité sélectionné
 */
export function setSelectedActivityType(type) {
    globalStore.setState('responsibilities', { selectedActivityType: type });
    triggerEvent('selectedActivityType', type);
}

/**
 * Récupère le type d'activité actuellement sélectionné
 * @returns {string} Type d'activité sélectionné
 */
export function getSelectedActivityType() {
    return globalStore.getState('responsibilities.selectedActivityType');
}

/**
 * Définit la carte d'activité dépliée
 * @param {string} cardId - ID de la carte d'activité dépliée
 */
export function setExpandedActivityCard(cardId) {
    console.log('=== STORE setExpandedActivityCard ===');
    console.log('cardId reçu:', cardId);
    globalStore.setState('responsibilities', { expandedActivityCard: cardId });
    console.log('État mis à jour, déclenchement de l\'événement...');
    triggerEvent('expandedActivityCard', cardId);
    console.log('Événement expandedActivityCard déclenché');
}

/**
 * Récupère l'ID de la carte d'activité dépliée
 * @returns {string|null} ID de la carte d'activité dépliée ou null
 */
export function getExpandedActivityCard() {
    return globalStore.getState('responsibilities.expandedActivityCard');
}

/**
 * Efface la carte d'activité dépliée
 */
export function clearExpandedActivityCard() {
    globalStore.setState('responsibilities', { expandedActivityCard: null });
    triggerEvent('expandedActivityCard', null);
}

// ===== ACTIONS POUR EDITOR VIEW =====

/**
 * Définit la carte de tâche dépliée
 * @param {string} taskCardId - ID de la carte de tâche dépliée
 */
export function setExpandedTaskCard(taskCardId) {
    globalStore.setState('responsibilities.editor', { expandedTaskCard: taskCardId });
}

/**
 * Récupère l'ID de la carte de tâche dépliée
 * @returns {string|null} ID de la carte de tâche dépliée ou null
 */
export function getExpandedTaskCard() {
    return globalStore.getState('responsibilities.editor.expandedTaskCard');
}

/**
 * Efface la carte de tâche dépliée
 */
export function clearExpandedTaskCard() {
    globalStore.setState('responsibilities.editor', { expandedTaskCard: null });
}

// ===== ACTIONS POUR INDIVIDUAL VIEW =====

/**
 * Sélectionne un worker dans la vue individual
 * @param {string} workerId - ID du worker sélectionné
 */
export function setSelectedWorker(workerId) {
    globalStore.setState('responsibilities.individual', { selectedWorker: workerId });
}

/**
 * Récupère le worker actuellement sélectionné
 * @returns {string|null} ID du worker sélectionné ou null
 */
export function getSelectedWorker() {
    return globalStore.getState('responsibilities.individual.selectedWorker');
}

/**
 * Change le filtre de responsabilité (En responsabilité / Autre)
 * @param {string} filter - Filtre de responsabilité
 */
export function setResponsibleForFilter(filter) {
    globalStore.setState('responsibilities.individual', { responsibleForFilter: filter });
}

/**
 * Récupère le filtre de responsabilité actuel
 * @returns {string} Filtre de responsabilité
 */
export function getResponsibleForFilter() {
    return globalStore.getState('responsibilities.individual.responsibleForFilter');
} 