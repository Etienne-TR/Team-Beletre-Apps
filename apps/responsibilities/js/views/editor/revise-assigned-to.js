// Formulaire d'édition des assignations
import { showModal, showConfirmModal } from '/modules/components/modal.js';

/**
 * Créer le formulaire de révision des assignations
 * @param {Object} assignment - Données de l'assignation à réviser
 * @param {Function} onSave - Callback appelé lors de la sauvegarde
 * @param {Function} onDelete - Callback appelé lors de la suppression
 * @returns {HTMLElement} Le formulaire créé
 */
export function createReviseAssignedToForm(assignment, onSave, onDelete) {
    const form = document.createElement('div');
    form.className = 'edit-assignment-form';
    
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
        const confirmed = await showConfirmModal(
            'Êtes-vous sûr de vouloir supprimer cette assignation ? Cette action est irréversible.',
            'Confirmation de suppression',
            'Supprimer',
            'Annuler'
        );
        
        if (!confirmed) {
            return;
        }
        
        try {
            // Désactiver le bouton pendant la suppression
            deleteButton.disabled = true;
            deleteButton.textContent = 'Suppression...';
            
            // Appeler l'API de suppression
            await deleteAssignment(assignment);
            
            // Appeler le callback onDelete si fourni
            if (onDelete) {
                onDelete(assignment);
            }
            
            // Fermer le modal en cas de succès de suppression
            if (form._modal) {
                form._modal.close();
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
            const result = await saveAssignment(assignment, formData);
            
            // Appeler le callback onSave si fourni
            if (onSave) {
                onSave(assignment, formData);
            }
            
            // Fermer le modal en cas de succès de sauvegarde
            if (form._modal) {
                form._modal.close();
            }
            
        } catch (error) {
            // Réactiver le bouton en cas d'erreur
            saveButton.disabled = false;
            saveButton.textContent = 'Enregistrer';
            
            // Afficher l'erreur
            alert('Erreur lors de l\'enregistrement : ' + error.message);
        }
    });
    
    buttonsContainer.appendChild(saveButton);
    buttonsContainer.appendChild(deleteButton);
    form.appendChild(buttonsContainer);
    
    return form;
}

/**
 * Afficher le formulaire dans un modal
 * @param {Object} assignment - Données de l'assignation à réviser
 * @param {Function} onSave - Callback appelé lors de la sauvegarde
 * @param {Function} onDelete - Callback appelé lors de la suppression
 */
export function showReviseAssignedToModal(assignment, onSave, onDelete) {
    // Créer le formulaire
    const form = createReviseAssignedToForm(assignment, onSave, onDelete);
    
    // Afficher le formulaire dans un modal
    const modal = showModal(form, {
        title: 'Réviser l\'assignation',
        width: '500px',
        maxWidth: '90vw'
    });
    
    // Passer la référence du modal au formulaire pour la fermeture automatique
    form._modal = modal;
    
    return modal;
}

/**
 * Valider les données du formulaire
 * @param {Object} formData - Données du formulaire
 * @returns {Object} Résultat de la validation {isValid: boolean, errors: Array}
 */
export function validateReviseAssignedToForm(formData) {
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
 * Sauvegarder une assignation via l'API updateVersion
 * @param {Object} assignment - Données de l'assignation à sauvegarder
 * @param {Object} formData - Données du formulaire
 * @returns {Promise} Résultat de la sauvegarde
 */
export async function saveAssignment(assignment, formData) {
    try {
        // Préparer les données selon le format attendu par updateAssignedTo
        const apiData = {
            task: assignment.task || assignment.taskEntry || assignment.task_id,
            user: assignment.assigned_user_id || assignment.user_id || assignment.user,
            start_date: formData.start_date,
            end_date: formData.end_date || null
        };
        // Ajouter la version si elle existe
        if (assignment.version) {
            apiData.version = assignment.version;
        }
        // Validation des données requises
        if (!apiData.task) {
            throw new Error('Champ "task" manquant dans les données de l\'assignation');
        }
        if (!apiData.user) {
            throw new Error('Champ "user" manquant dans les données de l\'assignation');
        }
        const apiUrl = `/api/controllers/responsibilities/assigned-to-controller.php?action=updateAssignedTo&version=${assignment.version}`;
        // Appel à l'API updateAssignedTo
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData)
        });
        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (parseError) {
                errorData = { error: errorText };
            }
            throw new Error(errorData.error || `Erreur HTTP ${response.status}: ${response.statusText}`);
        }
        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            result = { success: true, data: responseText };
        }
        return result;
    } catch (error) {
        throw error;
    }
}

/**
 * Supprimer une assignation via l'API deleteEntryAssignedTo
 * @param {Object} assignment - Données de l'assignation à supprimer
 * @returns {Promise} Résultat de la suppression
 */
export async function deleteAssignment(assignment) {
    try {
        // Validation des données requises
        if (assignment.entry === undefined || assignment.entry === null || assignment.entry === '') {
            throw new Error('Champ "entry" manquant dans les données de l\'assignation');
        }
        
        const apiUrl = `/api/controllers/responsibilities/assigned-to-controller.php?action=deleteEntry&entry=${assignment.entry}`;

        // Appel à l'API deleteEntry
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ _method: 'DELETE' })
        });

        if (!response.ok) {
            const errorText = await response.text();
            
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (parseError) {
                errorData = { error: errorText };
            }
            
            throw new Error(errorData.error || `Erreur HTTP ${response.status}: ${response.statusText}`);
        }

        const responseText = await response.text();
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            result = { success: true, data: responseText };
        }
        
        return result;
    } catch (error) {
        throw error;
    }
} 