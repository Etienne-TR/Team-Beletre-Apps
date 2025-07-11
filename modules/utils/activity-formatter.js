/**
 * Module utilitaire pour le formatage des noms d'activités
 */

/**
 * Formate le nom d'affichage d'un type d'activité
 * @param {string} rawType - Le nom du type tel qu'il est dans la base de données
 * @returns {string} Le nom formaté pour l'affichage avec première lettre en majuscule
 */
export function formatTypeName(rawType) {
    if (!rawType) return 'Activité';
    return rawType.charAt(0).toUpperCase() + rawType.slice(1);
}

/**
 * Formate le nom d'une activité en gérant la casse
 * @param {string} rawName - Le nom de l'activité tel qu'il est dans la base de données
 * @returns {string} Le nom formaté pour l'affichage
 */
export function formatActivityNameOnly(rawName) {
    if (!rawName) return '';
    
    // Si les deux premières lettres sont en majuscule, c'est probablement un acronyme
    if (rawName.length >= 2 && 
        rawName.charAt(0) === rawName.charAt(0).toUpperCase() && 
        rawName.charAt(1) === rawName.charAt(1).toUpperCase()) {
        return rawName; // Garder l'acronyme tel quel
    }
    
    // Sinon, mettre en minuscules sauf la première lettre
    return rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
}

/**
 * Formate le nom d'une activité avec son type et son icône
 * @param {Object} activity - L'objet activité contenant name, type et icon
 * @param {string} activity.name - Le nom de l'activité
 * @param {string} activity.type - Le type de l'activité (tel qu'il est dans la base de données)
 * @param {string} activity.icon - L'icône de l'activité
 * @param {Object} [options] - Options d'affichage
 * @param {boolean} [options.hideType] - Si true, n'affiche pas le type
 * @param {boolean} [options.hideIcon] - Si true, n'affiche pas l'icône
 * @returns {string} Le nom formaté
 */
export function formatActivityName(activity, options = {}) {
    const rawName = activity.name || '';
    const rawType = activity.type || 'Activité';
    const icon = activity.icon || '📋';
    const name = formatActivityNameOnly(rawName);
    
    // Si on cache le type
    if (options.hideType) {
        return options.hideIcon ? name : `${icon} ${name}`;
    }
    
    // Si on cache l'icône
    if (options.hideIcon) {
        const type = formatTypeName(rawType);
        return `${type} ${name}`;
    }
    
    // Affichage complet par défaut
    const type = formatTypeName(rawType);
    return `${icon} ${type} ${name}`;
}

/**
 * Formate le nom d'une activité avec son type et son icône (alias pour compatibilité)
 * @param {Object} activity - L'objet activité
 * @returns {string} Le nom formaté avec icône
 */
export function formatActivityNameEscaped(activity) {
    return formatActivityName(activity);
} 