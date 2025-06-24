/**
 * Module de formatage de dates
 * 
 * Fournit des fonctions utilitaires pour formater
 * les dates en français selon différents formats.
 */

// Formate une date en français (ex: 01/06/2024)
export function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR');
}

// Formate une date en français avec le mois en toutes lettres (ex: 1 juin 2024)
export function formatDateLabel(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
} 