/**
 * Module pour la navigation par onglets entre les vues d'application
 * Utilise le système d'onglets de navigation (navigation-tabs.css) pour créer une navigation fluide
 */

/**
 * Crée une navigation par onglets pour les vues d'application
 * @param {Array} views - Liste des vues disponibles
 * @param {Object} options - Options de configuration
 * @returns {HTMLElement} - L'élément DOM de la navigation
 */
export function createTabNavigation(views, options = {}) {
    const {
        activeView = views[0]?.id
    } = options;

    // Créer le conteneur principal
    const container = document.createElement('div');
    container.className = 'navigation-tabs-container';

    // Créer la navigation des onglets
    const nav = document.createElement('ul');
    nav.className = 'navigation-tabs-nav';

    // Créer les onglets
    views.forEach(view => {
        const tabItem = document.createElement('li');
        tabItem.className = 'navigation-tabs-nav-item';

        const tabLink = document.createElement('button');
        tabLink.className = 'navigation-tabs-nav-link';
        tabLink.textContent = view.label;
        tabLink.dataset.view = view.id;
        tabLink.setAttribute('role', 'tab');
        tabLink.setAttribute('aria-selected', view.id === activeView ? 'true' : 'false');
        tabLink.setAttribute('aria-controls', `${view.id}-panel`);

        // Ajouter l'icône si fournie
        if (view.icon) {
            const icon = document.createElement('span');
            icon.className = 'navigation-tab-icon';
            icon.textContent = view.icon;
            icon.setAttribute('aria-hidden', 'true');
            tabLink.insertBefore(icon, tabLink.firstChild);
        }

        // Marquer l'onglet actif
        if (view.id === activeView) {
            tabLink.classList.add('active');
        }

        tabItem.appendChild(tabLink);
        nav.appendChild(tabItem);
    });

    container.appendChild(nav);
    return container;
}

/**
 * Configure la logique de navigation par onglets
 * @param {HTMLElement} navigationElement - L'élément de navigation créé
 * @param {Object} options - Options de configuration
 */
export function setupTabNavigation(navigationElement, options = {}) {
    const {
        onViewChange = null,
        containerSelector = '.view-content',
        updateURL = true
    } = options;

    const tabs = navigationElement.querySelectorAll('.navigation-tabs-nav-link');
    const viewContainer = document.querySelector(containerSelector);

    // Fonction pour changer de vue
    function switchView(viewName) {
        console.log('=== CHANGEMENT DE VUE ===');
        console.log('Nouvelle vue:', viewName);

        // Mettre à jour l'état des onglets
        tabs.forEach(tab => {
            const isActive = tab.dataset.view === viewName;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        // Masquer tous les conteneurs de vue
        if (viewContainer) {
            const viewContainers = viewContainer.querySelectorAll('.view-container');
            viewContainers.forEach(container => {
                container.style.display = 'none';
            });
        }

        // Afficher le conteneur de la vue demandée
        const targetContainer = document.getElementById(`${viewName}-container`);
        if (targetContainer) {
            targetContainer.style.display = 'block';
            console.log('Conteneur de vue affiché:', viewName);
        } else {
            console.warn('Conteneur de vue non trouvé:', viewName);
        }

        // Mettre à jour l'URL si demandé
        if (updateURL) {
            const url = new URL(window.location);
            url.searchParams.set('view', viewName);
            history.pushState({ view: viewName }, '', url);
        }

        // Appeler le callback si fourni
        if (onViewChange && typeof onViewChange === 'function') {
            onViewChange(viewName);
        }
    }

    // Ajouter les événements de clic
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = tab.dataset.view;
            switchView(viewName);
        });

        // Gestion du clavier pour l'accessibilité
        tab.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const viewName = tab.dataset.view;
                switchView(viewName);
            }
        });
    });

    // Gestion de l'historique navigateur
    window.addEventListener('popstate', (e) => {
        const viewName = e.state?.view || getViewFromURL();
        if (viewName) {
            switchView(viewName);
        }
    });

    // Fonction pour récupérer la vue depuis l'URL
    function getViewFromURL() {
        const url = new URL(window.location);
        return url.searchParams.get('view');
    }

    // Initialiser la vue depuis l'URL si présente
    const initialView = getViewFromURL();
    if (initialView) {
        switchView(initialView);
    }

    // Exposer la fonction switchView pour utilisation externe
    navigationElement.switchView = switchView;

    return navigationElement;
}

/**
 * Crée et configure une navigation par onglets complète
 * @param {Array} views - Liste des vues disponibles
 * @param {Object} options - Options de configuration
 * @returns {HTMLElement} - L'élément de navigation configuré
 */
export function createAndSetupTabNavigation(views, options = {}) {
    const navigationElement = createTabNavigation(views, options);
    setupTabNavigation(navigationElement, options);
    return navigationElement;
}

/**
 * Restaure l'état des onglets depuis le store global
 * @param {HTMLElement} navigationElement - L'élément de navigation
 * @param {string} currentView - La vue actuellement active
 */
export function restoreTabState(navigationElement, currentView) {
    console.log('=== RESTAURATION ÉTAT ONGLETS ===');
    console.log('Vue actuelle:', currentView);

    const tabs = navigationElement.querySelectorAll('.navigation-tabs-nav-link');
    
    tabs.forEach(tab => {
        const isActive = tab.dataset.view === currentView;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Afficher le contenu de la vue actuelle
    const targetContainer = document.getElementById(`${currentView}-container`);
    if (targetContainer) {
        targetContainer.style.display = 'block';
    }
}

/**
 * Exemple d'utilisation :
 * 
 * const views = [
 *   { id: 'global-view', label: 'Vue globale', icon: '📋' },
 *   { id: 'editor', label: 'Éditeur', icon: '✏️' },
 *   { id: 'worker-view', label: 'Fiches de poste', icon: '👥' }
 * ];
 * 
 * const navigation = createAndSetupTabNavigation(views, {
 *   activeView: 'global-view',
 *   onViewChange: (viewName) => {
 *     console.log('Vue changée:', viewName);
 *   }
 * });
 * 
 * document.querySelector('.app-navigation').appendChild(navigation);
 */ 