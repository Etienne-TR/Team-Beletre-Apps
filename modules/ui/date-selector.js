/**
 * Module UI pour la sélection de date
 * Affiche trois boutons alignés horizontalement : précédent, date actuelle, suivant
 */
function formatDateFr(date) {
    // Format JJ/MM/AA
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}

/**
 * Formate une date pour l'API (YYYY-MM-DD)
 */
function formatDateForAPI(date) {
    if (!date) return '';
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date; // Déjà au bon format
    }
    const d = new Date(date);
    return d.toISOString().slice(0, 10);
}

export class DateSelector {
    constructor(container, options = {}) {
        this.container = container;
        this.initialDate = options.initialDate ? new Date(options.initialDate) : new Date();
        this.currentDate = new Date(this.initialDate);
        this.onDateChange = options.onDateChange || (() => {});
        this.init();
    }
    
    init() {
        // S'assurer que currentDate est correctement initialisé
        this.currentDate = new Date(this.initialDate);
        console.log('DateSelector initialisé avec la date:', formatDateForAPI(this.currentDate));
        this.render();
    }
    
    render() {
        const dateStr = formatDateFr(this.currentDate);
        this.container.innerHTML = `
            <div class="date-selector">
                <button class="btn btn-outline date-nav-btn" onclick="this.parentElement.parentElement.dateSelector.navigateYear(-1)" title="Année précédente">
                    <span>‹</span>
                </button>
                <button class="btn date-display-btn" disabled>
                    <span>${dateStr}</span>
                </button>
                <button class="btn btn-outline date-nav-btn" onclick="this.parentElement.parentElement.dateSelector.navigateYear(1)" title="Année suivante">
                    <span>›</span>
                </button>
            </div>
        `;
        this.container.dateSelector = this;
    }
    
    navigateYear(direction) {
        // Créer une nouvelle date et modifier l'année
        const newDate = new Date(this.currentDate);
        newDate.setFullYear(this.currentDate.getFullYear() + direction);
        this.currentDate = newDate;
        
        // Mettre à jour l'affichage
        this.render();
        
        // Formater la date pour l'API (YYYY-MM-DD) avant de la passer au callback
        const formattedDate = formatDateForAPI(this.currentDate);
        console.log('DateSelector: nouvelle date sélectionnée:', formattedDate);
        
        // Appeler le callback avec la date formatée
        this.onDateChange(formattedDate);
    }
    
    getCurrentDate() {
        return formatDateForAPI(this.currentDate);
    }
    
    setDate(date) {
        this.currentDate = new Date(date);
        this.render();
    }
} 