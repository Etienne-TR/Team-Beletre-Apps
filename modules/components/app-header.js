/**
 * Module pour le bandeau d'en-tête des applications
 * Affiche le titre de l'application à gauche et le bouton retour à droite
 */

/**
 * Crée un bandeau d'en-tête pour une application
 * @param {string} title - Le titre de l'application
 * @param {string} backUrl - L'URL de retour
 * @param {string} userInfoId - L'ID de l'élément pour afficher les infos utilisateur
 * @param {string} context - Le contexte de la page ('app-view', 'app-home', 'dashboard')
 * @param {HTMLElement} additionalContent - Contenu supplémentaire à ajouter dans le header (filtres, etc.)
 * @returns {HTMLElement} L'élément header
 */
export function createAppHeader(title, backUrl, userInfoId = null, context = 'app-view', additionalContent = null) {
    const header = document.createElement('header');
    header.className = 'app-header';
    
    const headerContent = document.createElement('div');
    headerContent.className = 'header-content';
    
    const titleElement = document.createElement('h1');
    titleElement.className = 'heading-title';
    titleElement.textContent = title;
    
    const headerInfo = document.createElement('div');
    headerInfo.className = 'header-info';
    
    if (userInfoId) {
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        userInfo.id = userInfoId;
        headerInfo.appendChild(userInfo);
    }
    
    const backLink = document.createElement('a');
    backLink.href = backUrl;
    backLink.className = 'btn btn-outline';
    
    // Définir le libellé et l'action selon le contexte
    switch (context) {
        case 'dashboard':
            backLink.textContent = 'Déconnexion';
            backLink.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
            break;
        case 'app-home':
            backLink.textContent = '← Toutes les apps';
            backLink.addEventListener('click', function(e) {
                e.preventDefault();
                // Sur une page d'accueil d'application : aller au dashboard
                window.location.href = '/';
            });
            break;
        case 'app-view':
        default:
            backLink.textContent = '← Accueil de l\'app';
            backLink.addEventListener('click', function(e) {
                e.preventDefault();
                // Dans les vues d'application : aller à la page d'accueil de l'application
                window.location.href = backUrl;
            });
            break;
    }
    
    headerInfo.appendChild(backLink);
    
    headerContent.appendChild(titleElement);
    headerContent.appendChild(headerInfo);
    header.appendChild(headerContent);
    
    // Ajouter le contenu supplémentaire s'il existe
    if (additionalContent) {
        header.appendChild(additionalContent);
    }
    
    return header;
}

/**
 * Initialise les gestionnaires d'événements pour tous les boutons retour
 * @param {string} context - Le contexte de la page ('app-view', 'app-home', 'dashboard')
 */
export function initializeBackButtons(context = 'app-view') {
    const backButtons = document.querySelectorAll('.back-link');
    backButtons.forEach(button => {
        // Mettre à jour le libellé selon le contexte
        switch (context) {
            case 'dashboard':
                button.textContent = 'Déconnexion';
                break;
            case 'app-home':
                button.textContent = '← Toutes les apps';
                break;
            case 'app-view':
            default:
                button.textContent = '← Accueil de l\'app';
                break;
        }
        
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            switch (context) {
                case 'dashboard':
                    logout();
                    break;
                case 'app-home':
                    // Sur une page d'accueil d'application : aller au dashboard
                    window.location.href = '/';
                    break;
                case 'app-view':
                default:
                    // Dans les vues d'application : aller à la page d'accueil de l'application
                    const href = this.getAttribute('href');
                    if (href) {
                        window.location.href = href;
                    }
                    break;
            }
        });
    });
}

/**
 * Fonction de déconnexion
 */
function logout() {
    // Supprimer les données de session
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    
    // Rediriger vers la page de connexion
    window.location.href = '/';
} 