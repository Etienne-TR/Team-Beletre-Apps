/**
 * Utilitaires pour la manipulation de chaînes de caractères
 */

/**
 * Échapper le HTML pour éviter les injections XSS
 * @param {string} text - Le texte à échapper
 * @returns {string} Le texte échappé
 */
export function escapeHtml(text) {
    if (text === null || text === undefined) {
        return '';
    }
    
    // Utiliser une approche plus simple qui préserve les accents
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Tronquer un texte à une longueur donnée
 * @param {string} text - Le texte à tronquer
 * @param {number} maxLength - La longueur maximale
 * @param {string} suffix - Le suffixe à ajouter (défaut: '...')
 * @returns {string} Le texte tronqué
 */
export function truncateText(text, maxLength, suffix = '...') {
    if (!text || text.length <= maxLength) {
        return text;
    }
    
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitaliser la première lettre d'une chaîne
 * @param {string} text - Le texte à capitaliser
 * @returns {string} Le texte avec la première lettre en majuscule
 */
export function capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Nettoyer une chaîne pour l'utiliser comme ID ou classe CSS
 * @param {string} text - Le texte à nettoyer
 * @returns {string} Le texte nettoyé
 */
export function sanitizeForId(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
} 