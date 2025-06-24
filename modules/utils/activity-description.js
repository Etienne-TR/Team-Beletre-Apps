/**
 * Module utilitaire pour la gestion des descriptions d'activités
 */

/**
 * Formate une description d'activité pour l'affichage
 * @param {string} description - La description brute depuis la base de données
 * @returns {string} La description formatée
 */
export function formatActivityDescription(description) {
    if (!description) {
        return 'Aucune description disponible.';
    }
    
    // Nettoyer les espaces en début et fin
    return description.trim();
}

/**
 * Tronque une description à une longueur donnée
 * @param {string} description - La description à tronquer
 * @param {number} maxLength - La longueur maximale (défaut: 200)
 * @param {string} suffix - Le suffixe à ajouter (défaut: '...')
 * @returns {string} La description tronquée
 */
export function truncateActivityDescription(description, maxLength = 200, suffix = '...') {
    const formattedDescription = formatActivityDescription(description);
    
    if (!formattedDescription || formattedDescription.length <= maxLength) {
        return formattedDescription;
    }
    
    return formattedDescription.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Formate une description pour l'affichage dans une carte
 * @param {string} description - La description brute
 * @param {boolean} showFull - Si true, affiche la description complète (défaut: false)
 * @returns {string} La description formatée pour l'affichage
 */
export function formatDescriptionForCard(description, showFull = false) {
    if (showFull) {
        return formatActivityDescription(description);
    }
    return truncateActivityDescription(description, 150);
} 