// modules/store/example-usage.js
// Exemples d'utilisation du store dans les différentes vues

import { appStore } from './store.js';
import { 
    setYear, 
    getYear,
    selectWorker, 
    setResponsibilityFilter,
    expandCard,
    collapseCard,
    isCardExpanded,
    selectActivityType,
    expandGlobalCard,
    collapseGlobalCard,
    isGlobalCardExpanded,
    getIndividualState,
    getGlobalState
} from './responsibilities.js';

// ===== EXEMPLE D'UTILISATION DE L'ÉTAT GLOBAL (USER) =====

// 1. Récupérer l'utilisateur actuel
const currentUser = appStore.getCurrentUser();
console.log('Utilisateur actuel:', currentUser);

// 2. Définir l'utilisateur actuel (après authentification)
function handleUserLogin(userData) {
    appStore.setCurrentUser(userData);
    console.log('Utilisateur connecté:', userData);
}

// 3. S'abonner aux changements de l'utilisateur
appStore.subscribeToUser((user) => {
    console.log('Utilisateur changé:', user);
    if (user) {
        // Mettre à jour l'interface utilisateur
        updateUserInterface(user);
    } else {
        // Rediriger vers la page de connexion
        redirectToLogin();
    }
});

// 4. Récupérer l'application actuelle
const currentApp = appStore.getCurrentApp();
console.log('Application actuelle:', currentApp);

// 5. Changer d'application
function switchToApp(appName) {
    appStore.setCurrentApp(appName);
    console.log('Changement vers l\'application:', appName);
}

// 6. S'abonner aux changements d'application
appStore.subscribeToApp((app) => {
    console.log('Application changée:', app);
    // Mettre à jour la navigation ou l'interface
    updateAppNavigation(app);
});

// ===== FONCTIONS UTILITAIRES POUR L'ÉTAT GLOBAL =====

function updateUserInterface(user) {
    // Mettre à jour l'affichage des informations utilisateur
    console.log('Mise à jour UI utilisateur:', {
        name: user.name,
        role: user.role,
        avatar: user.avatar
    });
}

function redirectToLogin() {
    console.log('Redirection vers la page de connexion');
    // window.location.href = '/login';
}

function updateAppNavigation(app) {
    // Mettre à jour la navigation selon l'application
    console.log('Mise à jour navigation pour:', app);
}

// ===== EXEMPLE D'UTILISATION DANS INDIVIDUAL VIEW =====

// 1. S'abonner aux changements de l'année (partagée)
appStore.subscribe('responsibilities', (state) => {
    console.log('Année changée:', state.year);
    // Recharger les données pour la nouvelle année
    loadWorkerData(state.year);
});

// 2. S'abonner aux changements de la vue individual
appStore.subscribe('responsibilities.individual', (state) => {
    console.log('État individual changé:', state);
    // Mettre à jour l'interface utilisateur
    updateIndividualUI(state);
});

// 3. Exemples d'actions dans individual-view
function handleYearChange(newYear) {
    setYear(newYear); // Met à jour automatiquement toutes les vues
}

function handleWorkerSelection(workerId) {
    selectWorker(workerId);
}

function handleResponsibilityFilterChange(filter) {
    setResponsibilityFilter(filter); // 'all', 'responsible', 'other'
}

function handleCardToggle(cardId) {
    if (isCardExpanded(cardId)) {
        collapseCard(cardId);
    } else {
        expandCard(cardId);
    }
}

// ===== EXEMPLE D'UTILISATION DANS GLOBAL VIEW =====

// 1. S'abonner aux changements de la vue globale
appStore.subscribe('responsibilities.global', (state) => {
    console.log('État global changé:', state);
    // Mettre à jour l'interface utilisateur
    updateGlobalUI(state);
});

// 2. Exemples d'actions dans global-view
function handleActivityTypeChange(type) {
    selectActivityType(type);
}

function handleGlobalCardToggle(cardId) {
    if (isGlobalCardExpanded(cardId)) {
        collapseGlobalCard(cardId);
    } else {
        expandGlobalCard(cardId);
    }
}

// ===== FONCTIONS UTILITAIRES =====

function loadWorkerData(year) {
    // Charger les données pour l'année sélectionnée
    console.log(`Chargement des données pour l'année ${year}`);
}

function updateIndividualUI(state) {
    // Mettre à jour l'interface de la vue individual
    console.log('Mise à jour UI individual:', {
        selectedWorker: state.selectedWorker,
        responsibilityFilter: state.responsibilityFilter,
        expandedCards: state.expandedCards
    });
}

function updateGlobalUI(state) {
    // Mettre à jour l'interface de la vue globale
    console.log('Mise à jour UI global:', {
        selectedActivityType: state.selectedActivityType,
        expandedCards: state.expandedCards
    });
}

// ===== EXEMPLE DE SYNCHRONISATION AUTOMATIQUE =====

// La date est partagée entre toutes les vues
// Quand elle change dans une vue, toutes les autres sont mises à jour automatiquement

// Dans individual-view :
setDate('2024-06-15');

// Dans global-view :
setDate('2024-06-15');

// Les deux vues se synchronisent automatiquement !

// ===== NOUVEAU SÉLECTEUR DE DATE =====

// Initialisation du sélecteur de date
import { initDateSelector, onDateChange } from '../components/date-selector.js';

// Initialiser avec aujourd'hui par défaut
initDateSelector();

// Ou avec une date spécifique
initDateSelector('2024-06-15');

// S'abonner aux changements
onDateChange((newDate, formattedDate) => {
    console.log('Date changée:', formattedDate);
    // Recharger les données pour la nouvelle date
    loadDataForDate(formattedDate);
});

// ===== UTILISATION AVEC LE STORE =====

// Le sélecteur de date met automatiquement à jour window.currentDate
// qui est utilisé par toutes les vues

// Dans individual-view.js :
onDateChange(async (newDate, formattedDate) => {
    await loadWorkersForDate(formattedDate);
    if (selectedPersonId) {
        await loadPersonData(selectedPersonId, formattedDate);
    }
});

// Dans global-view.js :
onDateChange(async (newDate, formattedDate) => {
    displayDataForCurrentSelection();
}); 