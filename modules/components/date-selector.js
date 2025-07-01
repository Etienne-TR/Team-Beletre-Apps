/**
 * Module UI pour la sélection de date
 * Affiche trois boutons alignés horizontalement : précédent, date actuelle, suivant
 * Le bouton central affiche un calendrier popup pour sélectionner une date précise
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
 * Simplifié : on utilise toujours YYYY-MM-DD
 */
function formatDateForAPI(date) {
    if (!date) return '';
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date; // Déjà au bon format
    }
    const d = new Date(date);
    return d.toISOString().slice(0, 10);
}

/**
 * Génère le HTML du calendrier
 */
function generateCalendarHTML(year, month, selectedDate) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Calcul du jour de la semaine du premier jour (lundi=0, dimanche=6)
    let firstWeekDay = firstDay.getDay() - 1;
    if (firstWeekDay < 0) firstWeekDay = 6; // dimanche devient 6
    // On veut le numéro du jour du mois du premier lundi affiché
    const startDay = 1 - firstWeekDay;
    const daysInMonth = lastDay.getDate();
    const weeks = Math.ceil((firstWeekDay + daysInMonth) / 7);
    
    let calendarHTML = `
        <div class="calendar-header">
            <span class="calendar-title">${new Date(year, month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
            <span class="calendar-nav-group">
                <button class="btn btn-sm btn-outline calendar-nav-btn" data-cal-nav="-1" title="Mois précédent"><span>‹</span></button>
                <button class="btn btn-sm btn-outline calendar-nav-btn" data-cal-nav="1" title="Mois suivant"><span>›</span></button>
            </span>
        </div>
        <div class="calendar-grid">
            <div class="calendar-weekdays">
                <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
            </div>
            <div class="calendar-days">
    `;
    for (let week = 0; week < weeks; week++) {
        for (let day = 0; day < 7; day++) {
            // Calcul correct de la date du bouton (évite les problèmes de fuseau horaire)
            const dateDay = startDay + week * 7 + day;
            const currentDate = new Date(year, month, dateDay);
            const isCurrentMonth = currentDate.getMonth() === month;
            const isSelected = selectedDate && 
                currentDate.getDate() === selectedDate.getDate() &&
                currentDate.getMonth() === selectedDate.getMonth() &&
                currentDate.getFullYear() === selectedDate.getFullYear();
            const isToday = new Date().toDateString() === currentDate.toDateString();
            let className = 'calendar-day';
            if (!isCurrentMonth) className += ' other-month';
            if (isSelected) className += ' selected';
            if (isToday) className += ' today';
            calendarHTML += `
                <button class="${className}" 
                        data-date="${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}"
                        ${!isCurrentMonth ? 'disabled' : ''}>
                    ${currentDate.getDate()}
                </button>
            `;
        }
    }
    calendarHTML += `
            </div>
        </div>
    `;
    return calendarHTML;
}

export class DateSelector {
    constructor(container, options = {}) {
        this.container = container;
        this.initialDate = options.initialDate ? new Date(options.initialDate) : new Date();
        this.currentDate = new Date(this.initialDate);
        this.onDateChange = options.onDateChange || (() => {});
        this.calendarVisible = false;
        this.calendarYear = this.currentDate.getFullYear();
        this.calendarMonth = this.currentDate.getMonth();
        this.init();
    }
    
    init() {
        // S'assurer que currentDate est correctement initialisé
        this.currentDate = new Date(this.initialDate);
        this.calendarYear = this.currentDate.getFullYear();
        this.calendarMonth = this.currentDate.getMonth();
        console.log('DateSelector initialisé avec la date:', formatDateForAPI(this.currentDate));
        this.render();
    }
    
    render() {
        const dateStr = formatDateFr(this.currentDate);
        this.container.innerHTML = `
            <div class="date-selector">
                <div class="date-nav-combo">
                    <span class="date-display-label" tabindex="0" title="Sélectionner une date">${dateStr}</span>
                    <span class="date-nav-arrow year-prev" tabindex="0" title="Année précédente">‹</span>
                    <span class="date-nav-arrow year-next" tabindex="0" title="Année suivante">›</span>
                </div>
                <div class="calendar-popup" style="display: none;">
                    ${generateCalendarHTML(this.calendarYear, this.calendarMonth, this.currentDate)}
                </div>
            </div>
        `;
        this.container.dateSelector = this;
        this.addStyles();
        this.attachCalendarEvents();

        // Gestion des clics sur la date et les flèches
        const combo = this.container.querySelector('.date-nav-combo');
        if (combo) {
            combo.addEventListener('click', (e) => {
                if (e.target.classList.contains('year-prev')) {
                    this.navigateYear(-1);
                    e.stopPropagation();
                } else if (e.target.classList.contains('year-next')) {
                    this.navigateYear(1);
                    e.stopPropagation();
                } else if (e.target.classList.contains('date-display-label')) {
                    this.toggleCalendar();
                }
            });
        }
    }
    
    addStyles() {
        if (document.getElementById('date-selector-styles')) return;
        const style = document.createElement('style');
        style.id = 'date-selector-styles';
        style.textContent = `
            :root {
                --date-selector-height: var(--input-height, 36px);
                --date-selector-arrow-width: 28px;
            }
            .date-selector {
                position: relative;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .date-nav-combo {
                display: flex;
                align-items: center;
                gap: 0;
                background: #fff;
                border: 1px solid #ced4da;
                color: #222;
                border-radius: 6px;
                height: var(--date-selector-height);
                font-size: 1em;
                cursor: pointer;
                transition: background 0.2s, border 0.2s;
                box-shadow: none;
                padding: 0;
                overflow: hidden;
            }
            .date-display-label {
                padding: 0 12px;
                font-weight: 500;
                font-size: 1em;
                color: #222;
                cursor: pointer;
                height: var(--date-selector-height);
                display: flex;
                align-items: center;
                background: none;
                border: none;
                transition: background 0.2s;
            }
            .date-display-label:hover, .date-display-label:focus {
                background: #f0f0f0;
            }
            .date-nav-arrow {
                display: flex;
                align-items: center;
                justify-content: center;
                width: var(--date-selector-arrow-width);
                height: var(--date-selector-height);
                font-size: 1.2em;
                color: #222;
                border: none;
                background: none;
                border-radius: 0 6px 6px 0;
                transition: background 0.2s;
                cursor: pointer;
            }
            .date-nav-arrow.year-prev {
                border-radius: 0;
            }
            .date-nav-arrow.year-next {
                border-radius: 0 6px 6px 0;
            }
            .date-nav-arrow:hover, .date-nav-arrow:focus {
                background: #f0f0f0;
            }
            .calendar-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                color: #222;
            }
            .calendar-title {
                font-weight: 600;
                text-transform: capitalize;
                color: #222;
                flex: 1;
                text-align: left;
            }
            .calendar-nav-group {
                display: flex;
                gap: 4px;
                margin-left: auto;
            }
            .calendar-header .calendar-nav-btn {
                width: var(--date-selector-arrow-width);
                height: var(--date-selector-height);
                min-width: var(--date-selector-arrow-width);
                min-height: var(--date-selector-height);
                max-width: var(--date-selector-arrow-width);
                max-height: var(--date-selector-height);
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
                padding: 0;
                font-size: 1.2em;
                background: none;
                transition: background 0.2s;
            }
            .calendar-header .calendar-nav-btn:hover,
            .calendar-header .calendar-nav-btn:focus {
                background: #f0f0f0;
            }
            .calendar-header .btn span {
                color: #222;
            }
            .calendar-popup {
                position: absolute;
                top: 100%;
                right: 0;
                left: auto;
                transform: none;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                min-width: 280px;
                padding: 12px;
                margin-top: 4px;
            }
            .calendar-weekdays {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 2px;
                margin-bottom: 8px;
            }
            .calendar-weekdays span {
                text-align: center;
                font-size: 0.8em;
                font-weight: 600;
                color: #666;
                padding: 4px;
            }
            .calendar-days {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 2px;
            }
            .calendar-day {
                border: none;
                background: none;
                padding: 8px 4px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9em;
                transition: background-color 0.2s;
            }
            .calendar-day:hover:not(:disabled) {
                background-color: #f0f0f0;
            }
            .calendar-day.selected {
                background-color: #007bff;
                color: white;
            }
            .calendar-day.today {
                font-weight: bold;
                border: 2px solid #007bff;
            }
            .calendar-day.other-month {
                color: #ccc;
            }
            .calendar-day:disabled {
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(style);
    }
    
    attachCalendarEvents() {
        const popup = this.container.querySelector('.calendar-popup');
        if (popup) {
            // Navigation mois
            popup.querySelectorAll('[data-cal-nav]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const dir = parseInt(btn.getAttribute('data-cal-nav'), 10);
                    this.navigateMonth(dir);
                });
            });
            // Sélection de date (délégation sur .calendar-days)
            const daysContainer = popup.querySelector('.calendar-days');
            if (daysContainer) {
                daysContainer.addEventListener('click', (e) => {
                    const btn = e.target.closest('button.calendar-day:not(:disabled)');
                    if (btn && btn.hasAttribute('data-date')) {
                        const dateStr = btn.getAttribute('data-date');
                        this.selectDate(dateStr);
                    }
                });
            }
        }
    }
    
    toggleCalendar() {
        const popup = this.container.querySelector('.calendar-popup');
        this.calendarVisible = !this.calendarVisible;
        
        if (this.calendarVisible) {
            popup.style.display = 'block';
            // Fermer le calendrier si on clique ailleurs
            setTimeout(() => {
                document.addEventListener('click', this.handleOutsideClick.bind(this), { once: true });
            }, 0);
        } else {
            popup.style.display = 'none';
        }
    }
    
    handleOutsideClick(event) {
        if (!this.container.contains(event.target)) {
            this.calendarVisible = false;
            this.container.querySelector('.calendar-popup').style.display = 'none';
        }
    }
    
    navigateMonth(direction) {
        this.calendarMonth += direction;
        if (this.calendarMonth > 11) {
            this.calendarMonth = 0;
            this.calendarYear++;
        } else if (this.calendarMonth < 0) {
            this.calendarMonth = 11;
            this.calendarYear--;
        }
        const popup = this.container.querySelector('.calendar-popup');
        popup.innerHTML = generateCalendarHTML(this.calendarYear, this.calendarMonth, this.currentDate);
        this.attachCalendarEvents();
    }
    
    selectDate(dateString) {
        const newDate = new Date(dateString);
        this.currentDate = newDate;
        this.calendarYear = this.currentDate.getFullYear();
        this.calendarMonth = this.currentDate.getMonth();
        // Mettre à jour l'affichage du bouton central
        const dateStr = formatDateFr(this.currentDate);
        const displayBtn = this.container.querySelector('.date-display-label');
        if (displayBtn) {
            displayBtn.textContent = dateStr;
        }
        // Formater la date pour l'API (YYYY-MM-DD) avant de la passer au callback
        const formattedDate = formatDateForAPI(this.currentDate);
        this.onDateChange(formattedDate);
        
        // Réactiver le gestionnaire d'événement pour fermer le calendrier en cliquant à l'extérieur
        setTimeout(() => {
            document.addEventListener('click', this.handleOutsideClick.bind(this), { once: true });
        }, 0);
    }
    
    navigateYear(direction) {
        // Créer une nouvelle date et modifier l'année
        const newDate = new Date(this.currentDate);
        newDate.setFullYear(this.currentDate.getFullYear() + direction);
        this.currentDate = newDate;
        
        // Mettre à jour les propriétés du calendrier pour qu'il affiche la bonne date
        this.calendarYear = this.currentDate.getFullYear();
        this.calendarMonth = this.currentDate.getMonth();
        
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
        this.calendarYear = this.currentDate.getFullYear();
        this.calendarMonth = this.currentDate.getMonth();
        this.render();
    }
} 