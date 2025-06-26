/**
 * Module de sélecteur de date dynamique
 * 
 * Fournit un composant de sélection de date avec :
 * - Navigation par année (précédente/suivante)
 * - Affichage de la date actuelle
 * - Ouverture d'un calendrier pour sélection précise
 */

// État global du sélecteur de date
let currentSelectedDate = new Date();
let dateChangeCallbacks = [];

/**
 * Initialise le sélecteur de date avec une date par défaut
 * @param {Date|string} defaultDate - Date par défaut (aujourd'hui si non spécifiée)
 */
export function initDateSelector(defaultDate = null) {
    if (defaultDate) {
        currentSelectedDate = new Date(defaultDate);
    } else {
        currentSelectedDate = new Date();
    }
    
    // Mettre à jour la date globale de l'application
    window.currentDate = formatDateForAPI(currentSelectedDate);
}

/**
 * Formate une date pour l'API (YYYY-MM-DD)
 * @param {Date} date - Date à formater
 * @returns {string} Date formatée
 */
export function formatDateForAPI(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formate une date pour l'affichage (DD/MM/YYYY)
 * @param {Date} date - Date à formater
 * @returns {string} Date formatée
 */
export function formatDateForDisplay(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Crée le HTML du sélecteur de date
 * @returns {string} HTML du sélecteur
 */
export function createDateSelectorHTML() {
    const currentDate = formatDateForDisplay(currentSelectedDate);
    
    return `
        <div class="date-selector">
            <button class="btn date-nav-btn" id="prevYearBtn" title="Année précédente">
                <span class="date-nav-arrow">←</span>
            </button>
            <button class="btn date-display-btn" id="currentDateBtn" title="Cliquer pour ouvrir le calendrier">
                <span class="date-display-text">${currentDate}</span>
            </button>
            <button class="btn date-nav-btn" id="nextYearBtn" title="Année suivante">
                <span class="date-nav-arrow">→</span>
            </button>
        </div>
    `;
}

/**
 * Configure les événements du sélecteur de date
 * @param {string} containerSelector - Sélecteur du conteneur parent
 */
export function setupDateSelectorEvents(containerSelector = 'body') {
    const container = document.querySelector(containerSelector);
    
    // Navigation année précédente
    const prevBtn = container.querySelector('#prevYearBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            navigateToPreviousYear();
        });
    }
    
    // Navigation année suivante
    const nextBtn = container.querySelector('#nextYearBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            navigateToNextYear();
        });
    }
    
    // Ouverture du calendrier
    const dateBtn = container.querySelector('#currentDateBtn');
    if (dateBtn) {
        dateBtn.addEventListener('click', () => {
            openDatePicker();
        });
    }
}

/**
 * Navigue vers l'année précédente
 */
function navigateToPreviousYear() {
    const newDate = new Date(currentSelectedDate);
    newDate.setFullYear(newDate.getFullYear() - 1);
    updateSelectedDate(newDate);
}

/**
 * Navigue vers l'année suivante
 */
function navigateToNextYear() {
    const newDate = new Date(currentSelectedDate);
    newDate.setFullYear(newDate.getFullYear() + 1);
    updateSelectedDate(newDate);
}

/**
 * Met à jour la date sélectionnée
 * @param {Date} newDate - Nouvelle date
 */
function updateSelectedDate(newDate) {
    currentSelectedDate = newDate;
    window.currentDate = formatDateForAPI(newDate);
    
    // Mettre à jour l'affichage
    updateDateDisplay();
    
    // Notifier les callbacks
    notifyDateChange();
}

/**
 * Met à jour l'affichage de la date
 */
function updateDateDisplay() {
    const dateBtn = document.querySelector('#currentDateBtn');
    if (dateBtn) {
        const dateText = dateBtn.querySelector('.date-display-text');
        if (dateText) {
            dateText.textContent = formatDateForDisplay(currentSelectedDate);
        }
    }
}

/**
 * Ouvre le sélecteur de date natif
 */
function openDatePicker() {
    const input = document.createElement('input');
    input.type = 'date';
    input.value = formatDateForAPI(currentSelectedDate);
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    input.style.opacity = '0';
    
    input.addEventListener('change', (e) => {
        if (e.target.value) {
            const newDate = new Date(e.target.value);
            updateSelectedDate(newDate);
        }
        document.body.removeChild(input);
    });
    
    input.addEventListener('blur', () => {
        document.body.removeChild(input);
    });
    
    document.body.appendChild(input);
    input.focus();
    input.click();
}

/**
 * S'abonne aux changements de date
 * @param {Function} callback - Fonction appelée quand la date change
 */
export function onDateChange(callback) {
    dateChangeCallbacks.push(callback);
}

/**
 * Notifie tous les callbacks de changement de date
 */
function notifyDateChange() {
    dateChangeCallbacks.forEach(callback => {
        try {
            callback(currentSelectedDate, formatDateForAPI(currentSelectedDate));
        } catch (error) {
            console.error('Erreur dans le callback de changement de date:', error);
        }
    });
}

/**
 * Récupère la date actuellement sélectionnée
 * @returns {Date} Date sélectionnée
 */
export function getCurrentDate() {
    return new Date(currentSelectedDate);
}

/**
 * Récupère la date actuellement sélectionnée formatée pour l'API
 * @returns {string} Date formatée YYYY-MM-DD
 */
export function getCurrentDateFormatted() {
    return formatDateForAPI(currentSelectedDate);
} 