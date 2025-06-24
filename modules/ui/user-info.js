/**
 * Module pour l'affichage des informations utilisateur
 * Gère l'affichage des initiales et autres informations utilisateur dans le header
 */

/**
 * Met à jour l'affichage des informations utilisateur dans tous les éléments avec la classe 'user-info'
 * @param {Object} user - L'objet utilisateur contenant les informations (initials, displayname, etc.)
 */
export function updateUserInfo(user) {
    const userElements = document.querySelectorAll('.user-info');
    userElements.forEach(element => {
        if (user && user.initials) {
            element.textContent = user.initials;
            if (user.displayname) {
                element.title = user.displayname;
            }
        } else {
            element.textContent = '?';
            element.title = 'Utilisateur inconnu';
        }
    });
}

/**
 * Récupère les informations utilisateur depuis l'API et met à jour l'affichage
 * @returns {Promise<Object|null>} L'objet utilisateur ou null si erreur
 */
export async function loadAndUpdateUserInfo() {
    try {
        const response = await fetch('../api/auth.php', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.user) {
            updateUserInfo(result.user);
            return result.user;
        } else {
            console.log('Aucune session utilisateur active');
            return null;
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement des informations utilisateur:', error);
        return null;
    }
}

/**
 * Initialise l'affichage des informations utilisateur au chargement de la page
 * @returns {Promise<Object|null>} L'objet utilisateur ou null si erreur
 */
export async function initializeUserInfo() {
    return await loadAndUpdateUserInfo();
} 