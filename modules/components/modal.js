/**
 * Module Modal - Composant réutilisable pour afficher des modals
 * 
 * Ce module fournit une fonction pour créer et afficher des modals
 * avec gestion automatique de la fermeture (clic extérieur, touche Échap, bouton de fermeture)
 */

/**
 * Afficher un contenu dans un modal
 * @param {HTMLElement|string} content - Le contenu à afficher (élément DOM ou HTML string)
 * @param {Object} options - Options de configuration du modal
 * @param {string} options.title - Titre du modal (optionnel)
 * @param {boolean} options.showCloseButton - Afficher le bouton de fermeture (défaut: true)
 * @param {boolean} options.closeOnOutsideClick - Fermer en cliquant à l'extérieur (défaut: true)
 * @param {boolean} options.closeOnEscape - Fermer avec la touche Échap (défaut: true)
 * @param {string} options.width - Largeur du modal (défaut: 'auto')
 * @param {string} options.maxWidth - Largeur maximale (défaut: '90vw')
 * @param {string} options.height - Hauteur du modal (défaut: 'auto')
 * @param {string} options.maxHeight - Hauteur maximale (défaut: '90vh')
 * @param {Function} options.onClose - Callback appelé lors de la fermeture
 * @returns {Object} Objet avec les méthodes { close(), destroy() }
 */
export function showModal(content, options = {}) {
    const {
        title,
        showCloseButton = true,
        closeOnOutsideClick = true,
        closeOnEscape = true,
        width = 'auto',
        maxWidth = '90vw',
        height = 'auto',
        maxHeight = '90vh',
        onClose
    } = options;

    // Créer l'overlay modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
    `;

    // Créer le contenu modal
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
        background: #fff;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 16px rgba(0,0,0,0.2);
        width: ${width};
        max-width: ${maxWidth};
        height: ${height};
        max-height: ${maxHeight};
        overflow-y: auto;
        position: relative;
        transform: scale(0.9);
        transition: transform 0.2s ease-in-out;
    `;

    // Ajouter le titre si fourni
    if (title) {
        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        titleElement.style.cssText = `
            margin: 0 0 1rem 0;
            font-size: 1.5rem;
            font-weight: 600;
            color: #333;
        `;
        modalContent.appendChild(titleElement);
    }

    // Ajouter le contenu
    if (typeof content === 'string') {
        modalContent.insertAdjacentHTML('beforeend', content);
    } else {
        modalContent.appendChild(content);
    }

    // Ajouter le bouton de fermeture si demandé
    if (showCloseButton) {
        const closeButton = document.createElement('button');
        closeButton.className = 'modal-close';
        closeButton.innerHTML = '&times;';
        closeButton.style.cssText = `
            position: absolute;
            top: 8px;
            right: 12px;
            background: transparent;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            z-index: 1;
            color: #666;
            transition: color 0.2s ease;
        `;
        
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.color = '#333';
        });
        
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.color = '#666';
        });
        
        closeButton.addEventListener('click', closeModal);
        modalContent.appendChild(closeButton);
    }

    modal.appendChild(modalContent);

    // Fonction de fermeture
    function closeModal() {
        modal.style.opacity = '0';
        modalContent.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            if (closeOnEscape) {
                document.removeEventListener('keydown', handleEscape);
            }
            if (onClose) {
                onClose();
            }
        }, 200);
    }

    // Gestionnaire pour la touche Échap
    function handleEscape(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    }

    // Événements de fermeture
    if (closeOnOutsideClick) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    if (closeOnEscape) {
        document.addEventListener('keydown', handleEscape);
    }

    // Ajouter le modal au DOM
    document.body.appendChild(modal);

    // Animation d'entrée
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
    });

    // Retourner les méthodes de contrôle
    return {
        close: closeModal,
        destroy: () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            if (closeOnEscape) {
                document.removeEventListener('keydown', handleEscape);
            }
        }
    };
}

/**
 * Créer un modal de confirmation
 * @param {string} message - Message à afficher
 * @param {string} title - Titre du modal (défaut: 'Confirmation')
 * @param {string} confirmText - Texte du bouton de confirmation (défaut: 'Confirmer')
 * @param {string} cancelText - Texte du bouton d'annulation (défaut: 'Annuler')
 * @returns {Promise<boolean>} Promise qui se résout à true si confirmé, false si annulé
 */
export function showConfirmModal(message, title = 'Confirmation', confirmText = 'Confirmer', cancelText = 'Annuler') {
    return new Promise((resolve) => {
        const content = `
            <div style="margin-bottom: 1.5rem;">
                <p style="margin: 0; color: #666; line-height: 1.5;">${message}</p>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button class="btn btn-secondary" id="modal-cancel" style="
                    padding: 0.5rem 1rem;
                    border: 1px solid #ddd;
                    background: #f8f9fa;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                ">${cancelText}</button>
                <button class="btn btn-primary" id="modal-confirm" style="
                    padding: 0.5rem 1rem;
                    border: 1px solid #007bff;
                    background: #007bff;
                    color: white;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                ">${confirmText}</button>
            </div>
        `;

        const modal = showModal(content, {
            title,
            showCloseButton: false,
            closeOnOutsideClick: false,
            closeOnEscape: false,
            width: '400px'
        });

        // Gestionnaires des boutons
        setTimeout(() => {
            const confirmBtn = document.getElementById('modal-confirm');
            const cancelBtn = document.getElementById('modal-cancel');

            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    modal.close();
                    resolve(true);
                });
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    modal.close();
                    resolve(false);
                });
            }
        }, 100);
    });
}

/**
 * Créer un modal d'alerte
 * @param {string} message - Message à afficher
 * @param {string} title - Titre du modal (défaut: 'Information')
 * @param {string} buttonText - Texte du bouton (défaut: 'OK')
 * @returns {Promise<void>} Promise qui se résout quand le modal est fermé
 */
export function showAlertModal(message, title = 'Information', buttonText = 'OK') {
    return new Promise((resolve) => {
        const content = `
            <div style="margin-bottom: 1.5rem;">
                <p style="margin: 0; color: #666; line-height: 1.5;">${message}</p>
            </div>
            <div style="display: flex; justify-content: flex-end;">
                <button class="btn btn-primary" id="modal-ok" style="
                    padding: 0.5rem 1rem;
                    border: 1px solid #007bff;
                    background: #007bff;
                    color: white;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                ">${buttonText}</button>
            </div>
        `;

        const modal = showModal(content, {
            title,
            showCloseButton: false,
            closeOnOutsideClick: false,
            closeOnEscape: false,
            width: '400px',
            onClose: resolve
        });

        // Gestionnaire du bouton
        setTimeout(() => {
            const okBtn = document.getElementById('modal-ok');
            if (okBtn) {
                okBtn.addEventListener('click', () => {
                    modal.close();
                });
            }
        }, 100);
    });
} 