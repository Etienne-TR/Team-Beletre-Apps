// Formulaire d'édition des tâches
import { showModal, showConfirmModal } from '/modules/components/modal.js';

/**
 * Créer le formulaire de révision des tâches
 * @param {Object} task - Données de la tâche à réviser
 * @param {Function} onSave - Callback appelé lors de la sauvegarde
 * @param {Function} onDelete - Callback appelé lors de la suppression
 * @returns {HTMLElement} Le formulaire créé
 */
export function createReviseTaskForm(task, onSave, onDelete) {
    const form = document.createElement('div');
    form.className = 'edit-task-form';
    
    // Conteneur des champs
    const fieldsContainer = document.createElement('div');
    fieldsContainer.className = 'form-fields';
    
    // Champ Nom
    const nameContainer = document.createElement('div');
    nameContainer.className = 'form-field';
    
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Nom:';
    nameLabel.htmlFor = 'name-input';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'name-input';
    nameInput.name = 'name';
    nameInput.value = task.task_name || task.name || '';
    nameInput.required = true;
    
    nameContainer.appendChild(nameLabel);
    nameContainer.appendChild(nameInput);
    fieldsContainer.appendChild(nameContainer);
    
    // Champ Description
    const descriptionContainer = document.createElement('div');
    descriptionContainer.className = 'form-field';
    
    const descriptionLabel = document.createElement('label');
    descriptionLabel.textContent = 'Description:';
    descriptionLabel.htmlFor = 'description-input';
    
    const descriptionInput = document.createElement('textarea');
    descriptionInput.id = 'description-input';
    descriptionInput.name = 'description';
    descriptionInput.value = task.task_description || task.description || '';
    descriptionInput.rows = 3;
    
    descriptionContainer.appendChild(descriptionLabel);
    descriptionContainer.appendChild(descriptionInput);
    fieldsContainer.appendChild(descriptionContainer);
    
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
    startDateInput.value = task.start_date || '';
    
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
    endDateInput.value = task.end_date || '';
    
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
        const hasChanges = nameInput.value !== (task.task_name || task.name || '') || 
                          descriptionInput.value !== (task.task_description || task.description || '') ||
                          startDateInput.value !== (task.start_date || '') || 
                          endDateInput.value !== (task.end_date || '');
        saveButton.disabled = !hasChanges;
    };
    
    // Écouter les changements sur les champs
    nameInput.addEventListener('input', checkFormChanges);
    descriptionInput.addEventListener('input', checkFormChanges);
    startDateInput.addEventListener('input', checkFormChanges);
    endDateInput.addEventListener('input', checkFormChanges);
    
    // Vérifier l'état initial
    checkFormChanges();
    
    deleteButton.addEventListener('click', async () => {
        // Demander confirmation avant suppression
        const confirmed = await showConfirmModal(
            'Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.',
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
            await deleteTask(task);
            
            // Appeler le callback onDelete si fourni
            if (onDelete) {
                onDelete(task);
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
            name: nameInput.value,
            description: descriptionInput.value,
            start_date: startDateInput.value,
            end_date: endDateInput.value
        };
        
        console.log('[saveButton click] Début de la sauvegarde');
        console.log('[saveButton click] Task:', task);
        console.log('[saveButton click] FormData:', formData);
        
        try {
            // Désactiver le bouton pendant la sauvegarde
            saveButton.disabled = true;
            saveButton.textContent = 'Enregistrement...';
            
            // Appeler le callback onSave qui gère l'API et le rechargement
            if (onSave) {
                console.log('[saveButton click] Appel du callback onSave');
                await onSave(task, formData);
            } else {
                // Fallback : appeler directement l'API si pas de callback
                console.log('[saveButton click] Appel direct de saveTask...');
                const result = await saveTask(task, formData);
                console.log('[saveButton click] Résultat de saveTask:', result);
            }
            
            // Fermer le modal en cas de succès de sauvegarde
            if (form._modal) {
                console.log('[saveButton click] Fermeture du modal');
                form._modal.close();
            }
            
        } catch (error) {
            console.error('[saveButton click] Erreur capturée:', error);
            
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
 * @param {Object} task - Données de la tâche à réviser
 * @param {Function} onSave - Callback appelé lors de la sauvegarde
 * @param {Function} onDelete - Callback appelé lors de la suppression
 */
export function showReviseTaskModal(task, onSave, onDelete) {
    // Créer le formulaire
    const form = createReviseTaskForm(task, onSave, onDelete);
    
    // Afficher le formulaire dans un modal
    const modal = showModal(form, {
        title: 'Modifier une tâche',
        width: '500px',
        maxWidth: '90vw'
    });
    
    // Passer la référence du modal au formulaire pour la fermeture automatique
    form._modal = modal;
    
    console.log('[showReviseTaskModal] Modal affiché avec le formulaire');
    
    return modal;
}

/**
 * Valider les données du formulaire
 * @param {Object} formData - Données du formulaire
 * @returns {Object} Résultat de la validation {isValid: boolean, errors: Array}
 */
export function validateReviseTaskForm(formData) {
    const errors = [];
    
    // Vérifier que le nom est renseigné
    if (!formData.name || formData.name.trim() === '') {
        errors.push('Le nom de la tâche est obligatoire');
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
 * Sauvegarder une tâche via l'API updateVersionTask
 * @param {Object} task - Données de la tâche à sauvegarder
 * @param {Object} formData - Données du formulaire
 * @returns {Promise} Résultat de la sauvegarde
 */
export async function saveTask(task, formData) {
    try {
        console.log('[saveTask] Début de la fonction');
        console.log('[saveTask] Task reçu:', task);
        console.log('[saveTask] FormData reçu:', formData);
        
        // Préparer les données selon le format attendu par updateVersionTask
        const apiData = {
            name: formData.name,
            description: formData.description,
            start_date: formData.start_date,
            end_date: formData.end_date || null
        };

        console.log('[saveTask] Données préparées pour l\'API:', apiData);
        // S'assurer que nous avons la version
        const version = task.version || task.task_version;
        if (!version) {
            throw new Error('Version de la tâche non trouvée dans les données');
        }
        
        console.log('[saveTask] URL de l\'API:', `/api/controllers/responsibilities/activity-controller.php?action=updateVersionTask&version=${version}`);

        // Appel à l'API updateVersionTask
        const response = await fetch(`/api/controllers/responsibilities/activity-controller.php?action=updateVersionTask&version=${version}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData)
        });

        console.log('[saveTask] Réponse reçue:', response);
        console.log('[saveTask] Status de la réponse:', response.status);
        console.log('[saveTask] Status text:', response.statusText);

        if (!response.ok) {
            console.error('[saveTask] Erreur HTTP:', response.status, response.statusText);
            const errorData = await response.json();
            console.error('[saveTask] Données d\'erreur:', errorData);
            throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
        }

        const result = await response.json();
        console.log('[saveTask] Résultat de la sauvegarde:', result);
        
        return result;
    } catch (error) {
        console.error('[saveTask] Erreur lors de la sauvegarde:', error);
        console.error('[saveTask] Stack trace:', error.stack);
        throw error;
    }
}

/**
 * Supprimer une tâche via l'API deleteEntryTask
 * @param {Object} task - Données de la tâche à supprimer
 * @returns {Promise} Résultat de la suppression
 */
export async function deleteTask(task) {
    try {
        console.log('Suppression de la tâche:', task);

        // S'assurer que nous avons l'entry
        const entry = task.entry || task.task_id;
        if (!entry) {
            throw new Error('Entry de la tâche non trouvée dans les données');
        }
        
        // Appel à l'API deleteEntryTask
        const response = await fetch(`/api/controllers/responsibilities/activity-controller.php?action=deleteEntryTask&entry=${entry}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
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