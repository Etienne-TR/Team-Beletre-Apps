import { appStore } from './store.js';

// ===== ACTIONS POUR L'ÉTAT PARTAGÉ =====

/**
 * Change la date sélectionnée (partagée entre toutes les vues)
 * @param {string} date - Date au format YYYY-MM-DD
 */
export function setDate(date) {
    appStore.setState('responsibilities', { date });
}

/**
 * Récupère la date actuellement sélectionnée
 * @returns {string} Date au format YYYY-MM-DD
 */
export function getDate() {
    return appStore.getState('responsibilities.date');
}

/**
 * Change l'année sélectionnée (partagée entre toutes les vues)
 * @deprecated Utilisez setDate() à la place
 */
export function setYear(year) {
    console.warn('setYear() est déprécié, utilisez setDate() à la place');
    const currentDate = getDate() || new Date().toISOString().split('T')[0];
    const [_, month, day] = currentDate.split('-');
    const newDate = `${year}-${month}-${day}`;
    setDate(newDate);
}

/**
 * Récupère l'année actuellement sélectionnée
 * @deprecated Utilisez getDate() à la place
 */
export function getYear() {
    console.warn('getYear() est déprécié, utilisez getDate() à la place');
    const date = getDate();
    return date ? date.substring(0, 4) : new Date().getFullYear().toString();
}

// ===== ACTIONS POUR INDIVIDUAL VIEW =====

/**
 * Sélectionne un worker dans la vue individual
 */
export function selectWorker(workerId) {
    appStore.setState('responsibilities.individual', { selectedWorker: workerId });
}

/**
 * Change le filtre de responsabilité (En responsabilité / Autre)
 */
export function setResponsibilityFilter(filter) {
    appStore.setState('responsibilities.individual', { responsibilityFilter: filter });
}

/**
 * Ajoute une carte à la liste des cartes dépliées
 */
export function expandCard(cardId) {
    const state = appStore.getState('responsibilities.individual');
    const { expandedCards } = state;
    
    if (!expandedCards.includes(cardId)) {
        appStore.setState('responsibilities.individual', {
            expandedCards: [...expandedCards, cardId]
        });
    }
}

/**
 * Retire une carte de la liste des cartes dépliées
 */
export function collapseCard(cardId) {
    const state = appStore.getState('responsibilities.individual');
    const { expandedCards } = state;
    
    appStore.setState('responsibilities.individual', {
        expandedCards: expandedCards.filter(id => id !== cardId)
    });
}

/**
 * Vérifie si une carte est dépliée
 */
export function isCardExpanded(cardId) {
    const state = appStore.getState('responsibilities.individual');
    return state.expandedCards.includes(cardId);
}

// ===== ACTIONS POUR GLOBAL VIEW =====

/**
 * Sélectionne un type d'activité dans la vue globale
 */
export function selectActivityType(type) {
    appStore.setState('responsibilities.global', { selectedActivityType: type });
}

/**
 * Ajoute une carte à la liste des cartes dépliées (vue globale)
 */
export function expandGlobalCard(cardId) {
    const state = appStore.getState('responsibilities.global');
    const { expandedCards } = state;
    
    if (!expandedCards.includes(cardId)) {
        appStore.setState('responsibilities.global', {
            expandedCards: [...expandedCards, cardId]
        });
    }
}

/**
 * Retire une carte de la liste des cartes dépliées (vue globale)
 */
export function collapseGlobalCard(cardId) {
    const state = appStore.getState('responsibilities.global');
    const { expandedCards } = state;
    
    appStore.setState('responsibilities.global', {
        expandedCards: expandedCards.filter(id => id !== cardId)
    });
}

/**
 * Vérifie si une carte est dépliée (vue globale)
 */
export function isGlobalCardExpanded(cardId) {
    const state = appStore.getState('responsibilities.global');
    return state.expandedCards.includes(cardId);
}

// ===== GETTERS =====

/**
 * Récupère l'état complet de la vue individual
 */
export function getIndividualState() {
    return appStore.getState('responsibilities.individual');
}

/**
 * Récupère l'état complet de la vue globale
 */
export function getGlobalState() {
    return appStore.getState('responsibilities.global');
}

/**
 * Récupère l'état complet des responsibilities
 */
export function getResponsibilitiesState() {
    return appStore.getState('responsibilities');
} 