/**
 * Module de badges utilisateur pour l'interface
 * 
 * Fournit les fonctions pour créer des badges visuels
 * représentant les utilisateurs dans l'interface.
 */

/**
 * Crée un badge utilisateur avec display_name
 * @param {Object} person - Objet contenant display_name et initials
 * @param {string} person.display_name - Nom d'affichage
 * @param {string} person.initials - Initiales (optionnel)
 * @returns {HTMLElement} Badge utilisateur
 */
export function createUserBadge(person) {
    const badge = document.createElement('span');
    badge.className = 'badge badge-user';
    badge.textContent = person.display_name || person.name || 'Utilisateur';
    
    if (person.initials) {
        badge.title = `${person.display_name || person.name} (${person.initials})`;
    }
    
    return badge;
}

/**
 * Crée un badge d'assignation avec display_name
 * @param {Object} person - Objet contenant display_name et initials
 * @param {string} person.display_name - Nom d'affichage
 * @param {string} person.initials - Initiales (optionnel)
 * @returns {HTMLElement} Badge d'assignation
 */
export function createAssignmentBadge(person) {
    const badge = document.createElement('span');
    badge.className = 'badge badge-assigned-to';
    badge.textContent = person.display_name || person.name || 'Assigné';
    
    if (person.initials) {
        badge.title = `${person.display_name || person.name} (${person.initials})`;
    }
    
    return badge;
}

/**
 * Crée un badge de responsable avec display_name
 * @param {Object} person - Objet contenant display_name et initials
 * @param {string} person.display_name - Nom d'affichage
 * @param {string} person.initials - Initiales (optionnel)
 * @returns {HTMLElement} Badge de responsable
 */
export function createResponsibleBadge(person) {
    const badge = document.createElement('span');
    badge.className = 'badge badge-responsible-for';
    badge.textContent = person.display_name || person.name || 'Responsable';
    
    if (person.initials) {
        badge.title = `${person.display_name || person.name} (${person.initials})`;
    }
    
    return badge;
} 