// Formulaire d'édition des assignations
import { showModal, showConfirmModal } from '/modules/components/modal.js';

/**
 * Créer le formulaire de révision des assignations
 * @param {Object} assignment - Données de l'assignation à réviser
 * @param {Function} onSave - Callback appelé lors de la sauvegarde
 * @param {Function} onDelete - Callback appelé lors de la suppression
 * @returns {HTMLElement} Le formulaire créé
 */
export function createReviseResponsibleForForm(assignment, onSave, onDelete) {
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
            'Êtes-vous sûr de vouloir supprimer cette responsabilité ? Cette action est irréversible.',
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
            await deleteResponsibility(assignment);
            
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
        
        console.log('[saveButton click] Début de la sauvegarde');
        console.log('[saveButton click] Assignment:', assignment);
        console.log('[saveButton click] FormData:', formData);
        
        try {
            // Désactiver le bouton pendant la sauvegarde
            saveButton.disabled = true;
            saveButton.textContent = 'Enregistrement...';
            
            // Appeler le callback onSave qui gère l'API et le rechargement
            if (onSave) {
                console.log('[saveButton click] Appel du callback onSave');
                await onSave(assignment, formData);
            } else {
                // Fallback : appeler directement l'API si pas de callback
                console.log('[saveButton click] Appel direct de saveResponsibility...');
                const result = await saveResponsibility(assignment, formData);
                console.log('[saveButton click] Résultat de saveResponsibility:', result);
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
 * @param {Object} assignment - Données de l'assignation à réviser
 * @param {Function} onSave - Callback appelé lors de la sauvegarde
 * @param {Function} onDelete - Callback appelé lors de la suppression
 */
export function showReviseResponsibleForModal(assignment, onSave, onDelete) {
    // Créer le formulaire
    const form = createReviseResponsibleForForm(assignment, onSave, onDelete);
    
    // Afficher le formulaire dans un modal
    const modal = showModal(form, {
        title: 'Réviser l\'assignation',
        width: '500px',
        maxWidth: '90vw'
    });
    
    // Passer la référence du modal au formulaire pour la fermeture automatique
    form._modal = modal;
    
    console.log('[showReviseResponsibleForModal] Modal affiché avec le formulaire');
    
    return modal;
}

/**
 * Valider les données du formulaire
 * @param {Object} formData - Données du formulaire
 * @returns {Object} Résultat de la validation {isValid: boolean, errors: Array}
 */
export function validateReviseResponsibleForForm(formData) {
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
        console.log('[saveResponsibility] Début de la fonction');
        console.log('[saveResponsibility] Assignment reçu:', assignment);
        console.log('[saveResponsibility] FormData reçu:', formData);
        
        // Préparer les données selon le format attendu par updateResponsibleFor
        const apiData = {
            activity: assignment.activity,
            user_id: assignment.responsible_user_id,
            start_date: formData.start_date,
            end_date: formData.end_date || null
        };

        console.log('[saveResponsibility] Données préparées pour l\'API:', apiData);
        console.log('[saveResponsibility] URL de l\'API:', `/api/controllers/responsibilities/responsible-for-controller.php?action=updateVersion&version=${assignment.version}`);

        // Appel à l'API updateVersion
        const response = await fetch(`/api/controllers/responsibilities/responsible-for-controller.php?action=updateVersion&version=${assignment.version}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData)
        });

        console.log('[saveResponsibility] Réponse reçue:', response);
        console.log('[saveResponsibility] Status de la réponse:', response.status);
        console.log('[saveResponsibility] Status text:', response.statusText);

        if (!response.ok) {
            console.error('[saveResponsibility] Erreur HTTP:', response.status, response.statusText);
            const errorData = await response.json();
            console.error('[saveResponsibility] Données d\'erreur:', errorData);
            throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
        }

        const result = await response.json();
        console.log('[saveResponsibility] Résultat de la sauvegarde:', result);
        
        return result;
    } catch (error) {
        console.error('[saveResponsibility] Erreur lors de la sauvegarde:', error);
        console.error('[saveResponsibility] Stack trace:', error.stack);
        throw error;
    }
}

/**
 * Supprimer une responsabilité via l'API deleteEntryResponsibleFor
 * @param {Object} assignment - Données de l'assignation à supprimer
 * @returns {Promise} Résultat de la suppression
 */
export async function deleteResponsibility(assignment) {
    try {
        console.log('Suppression de la responsabilité:', assignment);

        // Appel à l'API deleteEntry
        const response = await fetch(`/api/controllers/responsibilities/responsible-for-controller.php?action=deleteEntry&entry=${assignment.entry}`, {
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