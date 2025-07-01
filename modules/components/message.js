/**
 * Module de gestion des messages
 * 
 * Fournit des fonctions pour afficher des messages
 * d'information ou d'erreur dans l'interface utilisateur.
 */

// Affiche un message d'information ou d'erreur en haut de la page
export function showMessage(message, type = 'info') {
    const div = document.createElement('div');
    div.textContent = message;
    
    // Utiliser les nouvelles classes CSS au lieu des styles inline
    if (type === 'error') {
        div.className = 'message-error';
    } else if (type === 'success') {
        div.className = 'message-success';
    } else if (type === 'warning') {
        div.className = 'message-warning';
    } else {
        div.className = 'message-info';
    }
    
    document.body.insertBefore(div, document.body.firstChild);
    setTimeout(() => div.remove(), 5000);
} 