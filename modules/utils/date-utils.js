/**
 * Utilitaires pour la gestion des dates
 * Standardisation sur le format YYYY-MM-DD
 */

/**
 * Formate une date pour l'API (YYYY-MM-DD)
 * @param {Date|string} date - Date à formater
 * @returns {string} Date au format YYYY-MM-DD
 */
export function formatDateForAPI(date) {
    if (!date) return '';
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date; // Déjà au bon format
    }
    const d = new Date(date);
    return d.toISOString().slice(0, 10);
}

/**
 * Vérifie si une chaîne est au format YYYY-MM-DD
 * @param {string} dateStr - Chaîne à vérifier
 * @returns {boolean} True si le format est correct
 */
export function isValidDateFormat(dateStr) {
    return typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
} 

/**
 * Formate une date en français au format littéraire
 * @param {string} dateString - Date à formater
 * @param {boolean} shortMonth - Si true, utilise le format court du mois (ex: "oct." au lieu de "octobre")
 * @returns {string} Date formatée en français au format littéraire
 */
export function formatDateLiterary(dateString, shortMonth = false) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: shortMonth ? 'short' : 'long', 
        day: '2-digit' 
    };
    return date.toLocaleDateString('fr-FR', options);
}

/**
 * Formate une période entre deux dates selon la logique métier demandée
 * @param {string|Date} startDate - Date de début
 * @param {string|Date} endDate - Date de fin
 * @returns {string} Période formatée
 */
export function formatPeriodLiterary(startDate, endDate) {
    const hasStart = !!startDate && startDate !== 'null' && startDate !== '';
    const hasEnd = !!endDate && endDate !== 'null' && endDate !== '';
    const today = new Date();
    today.setHours(0,0,0,0);

    if (!hasStart && !hasEnd) {
        return 'Période non définie';
    }
    if (hasStart && hasEnd) {
        const startFormatted = formatDateLiterary(startDate, true);
        const endFormatted = formatDateLiterary(endDate, true);
        if (startFormatted && endFormatted) {
            return `du ${startFormatted} au ${endFormatted}`;
        }
    } else if (hasStart) {
        const startFormatted = formatDateLiterary(startDate, true);
        if (startFormatted) {
            const startObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
            startObj.setHours(0,0,0,0);
            if (startObj < today) {
                return `depuis le ${startFormatted}`;
            } else {
                return `à partir du ${startFormatted}`;
            }
        }
    } else if (hasEnd) {
        const endFormatted = formatDateLiterary(endDate, true);
        if (endFormatted) return `jusqu'au ${endFormatted}`;
    }
    return 'Période non définie';
} 