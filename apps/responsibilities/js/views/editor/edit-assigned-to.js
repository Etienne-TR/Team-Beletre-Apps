// Formulaire d'édition des assignations

/**
 * Créer le formulaire d'édition des assignations
 * @param {Object} assignment - Données de l'assignation à éditer
 * @param {Function} onSave - Callback appelé lors de la sauvegarde
 * @param {Function} onDelete - Callback appelé lors de la suppression
 * @param {Function} onClose - Callback appelé pour fermer le modal
 * @returns {HTMLElement} Le formulaire créé
 */
export function createEditAssignmentForm(assignment, onSave, onDelete, onClose) {
    const form = document.createElement('div');
    form.className = 'edit-assignment-form';
    
    // Titre du formulaire
    const title = document.createElement('h3');
    title.textContent = 'Modifier l\'assignation';
    form.appendChild(title);
    
    // Conteneur des champs
    const fieldsContainer = document.createElement('div');
    fieldsContainer.className = 'form-fields';
    
    // Champ Date de début
    const startDateContainer = document.createElement('div');
    startDateContainer.className = 'form-field';
    
    const startDateLabel = document.createElement('label');
    startDateLabel.textContent = 'Date de début:';
    startDateLabel.htmlFor = 'start-date-input';
    
    const startDateInput = document.createElement('input');
    startDateInput.type = 'date';
    startDateInput.id = 'start-date-input';
    startDateInput.name = 'start_date';
    startDateInput.value = assignment.start_date || '';
    
    startDateContainer.appendChild(startDateLabel);
    startDateContainer.appendChild(startDateInput);
    fieldsContainer.appendChild(startDateContainer);
    
    // Champ Date de fin
    const endDateContainer = document.createElement('div');
    endDateContainer.className = 'form-field';
    
    const endDateLabel = document.createElement('label');
    endDateLabel.textContent = 'Date de fin:';
    endDateLabel.htmlFor = 'end-date-input';
    
    const endDateInput = document.createElement('input');
    endDateInput.type = 'date';
    endDateInput.id = 'end-date-input';
    endDateInput.name = 'end_date';
    endDateInput.value = assignment.end_date || '';
    
    endDateContainer.appendChild(endDateLabel);
    endDateContainer.appendChild(endDateInput);
    fieldsContainer.appendChild(endDateContainer);
    
    form.appendChild(fieldsContainer);
    
    // Conteneur des boutons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'form-buttons';
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.justifyContent = 'space-between';
    buttonsContainer.style.alignItems = 'center';
    buttonsContainer.style.gap = '1rem';
    
    // Bouton Supprimer
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn btn-danger';
    deleteButton.textContent = 'Supprimer';
    deleteButton.style.backgroundColor = '#dc3545';
    deleteButton.style.color = 'white';
    deleteButton.style.border = '1px solid #dc3545';
    deleteButton.style.padding = '0.5rem 1rem';
    deleteButton.style.borderRadius = '4px';
    deleteButton.style.cursor = 'pointer';
    deleteButton.style.fontWeight = 'bold';
    
    // Bouton Enregistrer
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'btn btn-primary';
    saveButton.textContent = 'Enregistrer';
    
    // Fonction pour vérifier si les valeurs ont changé
    const checkFormChanges = () => {
        const hasChanges = startDateInput.value !== (assignment.start_date || '') || 
                          endDateInput.value !== (assignment.end_date || '');
        saveButton.disabled = !hasChanges;
    };
    
    // Écouter les changements sur les champs
    startDateInput.addEventListener('input', checkFormChanges);
    endDateInput.addEventListener('input', checkFormChanges);
    
    // Vérifier l'état initial
    checkFormChanges();
    
    deleteButton.addEventListener('click', async () => {
        // Demander confirmation avant suppression
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette responsabilité ? Cette action est irréversible.')) {
            return;
        }
        
        try {
            // Désactiver le bouton pendant la suppression
            deleteButton.disabled = true;
            deleteButton.textContent = 'Suppression...';
            
            // Appeler l'API de suppression
            await deleteResponsibility(assignment);
            
            // Appeler le callback onDelete si fourni
            if (onDelete) {
                onDelete(assignment);
            }
            
            // Fermer le modal
            if (onClose) {
                onClose();
            }
            
        } catch (error) {
            // Réactiver le bouton en cas d'erreur
            deleteButton.disabled = false;
            deleteButton.textContent = 'Supprimer';
            
            // Afficher l'erreur
            alert('Erreur lors de la suppression : ' + error.message);
            console.error('Erreur lors de la suppression:', error);
        }
    });
    
    saveButton.addEventListener('click', async () => {
        const formData = {
            start_date: startDateInput.value,
            end_date: endDateInput.value
        };
        
        try {
            // Désactiver le bouton pendant la sauvegarde
            saveButton.disabled = true;
            saveButton.textContent = 'Enregistrement...';
            
            // Appeler l'API de sauvegarde
            await saveResponsibility(assignment, formData);
            
            // Appeler le callback onSave si fourni
            if (onSave) {
                onSave(assignment, formData);
            }
            
            // Fermer le modal
            if (onClose) {
                onClose();
            }
            
        } catch (error) {
            // Réactiver le bouton en cas d'erreur
            saveButton.disabled = false;
            saveButton.textContent = 'Enregistrer';
            
            // Afficher l'erreur
            alert('Erreur lors de l\'enregistrement : ' + error.message);
            console.error('Erreur lors de l\'enregistrement:', error);
        }
    });
    
    buttonsContainer.appendChild(saveButton);
    buttonsContainer.appendChild(deleteButton);
    form.appendChild(buttonsContainer);
    
    return form;
}

/**
 * Afficher le formulaire dans un modal
 * @param {Object} assignment - Données de l'assignation à éditer
 * @param {Function} onSave - Callback appelé lors de la sauvegarde
 * @param {Function} onDelete - Callback appelé lors de la suppression
 */
export function showEditAssignmentModal(assignment, onSave, onDelete) {
    // Créer le modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    // Style minimal pour rendre le modal visible
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.3)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.background = '#fff';
    modalContent.style.padding = '2rem';
    modalContent.style.borderRadius = '8px';
    modalContent.style.boxShadow = '0 2px 16px rgba(0,0,0,0.2)';
    modalContent.style.minWidth = '320px';
    modalContent.style.maxWidth = '90vw';
    modalContent.style.maxHeight = '90vh';
    modalContent.style.overflowY = 'auto';
    modalContent.style.position = 'relative';

    // Fonction pour fermer le modal
    const closeModal = () => {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', handleEscape);
    };

    // Créer le formulaire
    const form = createEditAssignmentForm(assignment, onSave, onDelete, closeModal);
    modalContent.appendChild(form);
    
    // Bouton de fermeture dans le conteneur du formulaire
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '8px';
    closeButton.style.right = '12px';
    closeButton.style.background = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '2rem';
    closeButton.style.cursor = 'pointer';
    closeButton.style.zIndex = '1';
    closeButton.addEventListener('click', closeModal);
    modalContent.appendChild(closeButton);
    
    modal.appendChild(modalContent);
    
    // Fermer le modal en cliquant à l'extérieur
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Fermer le modal avec la touche Échap
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Ajouter le modal au DOM
    document.body.appendChild(modal);
    console.log('[showEditAssignmentModal] Modal ajouté au DOM', modal);
}

/**
 * Valider les données du formulaire
 * @param {Object} formData - Données du formulaire
 * @returns {Object} Résultat de la validation {isValid: boolean, errors: Array}
 */
export function validateAssignmentForm(formData) {
    const errors = [];
    
    // Vérifier que la date de début est renseignée
    if (!formData.start_date) {
        errors.push('La date de début est obligatoire');
    }
    
    // Vérifier que la date de fin est après la date de début
    if (formData.start_date && formData.end_date) {
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);
        
        if (endDate <= startDate) {
            errors.push('La date de fin doit être postérieure à la date de début');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Sauvegarder une responsabilité via l'API updateResponsibleFor
 * @param {Object} assignment - Données de l'assignation à sauvegarder
 * @param {Object} formData - Données du formulaire
 * @returns {Promise} Résultat de la sauvegarde
 */
export async function saveResponsibility(assignment, formData) {
    try {
        // Préparer les données selon le format attendu par updateResponsibleFor
        const apiData = {
            activity: assignment.activity,
            user_id: assignment.responsible_user_id,
            date: formData.start_date,
            end_date: formData.end_date || null
        };

        console.log('Données à envoyer à l\'API:', apiData);

        // Appel à l'API updateResponsibleFor
        const response = await fetch(`/api/controllers/responsibilities/activity-controller.php?action=update_responsible_for&entry=${assignment.entry}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
        }

        const result = await response.json();
        console.log('Résultat de la sauvegarde:', result);
        
        return result;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        throw error;
    }
}

/**
 * Supprimer une responsabilité via l'API deleteResponsibleFor
 * @param {Object} assignment - Données de l'assignation à supprimer
 * @returns {Promise} Résultat de la suppression
 */
export async function deleteResponsibility(assignment) {
    try {
        console.log('Suppression de la responsabilité:', assignment);

        // Appel à l'API deleteResponsibleFor
        const response = await fetch(`/api/controllers/responsibilities/activity-controller.php?action=delete_responsible_for&entry=${assignment.entry}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ _method: 'DELETE' })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la suppression');
        }

        const result = await response.json();
        console.log('Résultat de la suppression:', result);
        
        return result;
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        throw error;
    }
} 