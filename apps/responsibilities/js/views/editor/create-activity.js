// Formulaire de création d'activité
import { showModal, showConfirmModal } from '/modules/components/modal.js';
import { globalStore } from '/modules/store/store.js';

/**
 * Créer le formulaire de création d'activité
 * @param {Function} onSave - Callback appelé lors de la sauvegarde
 * @returns {HTMLElement} Le formulaire créé
 */
export function createActivityForm(onSave) {
    const form = document.createElement('div');
    form.className = 'create-activity-form';
    
    // Conteneur des champs
    const fieldsContainer = document.createElement('div');
    fieldsContainer.className = 'form-fields';
    
    // Champ Nom
    const nameContainer = document.createElement('div');
    nameContainer.className = 'form-field';
    
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Nom:';
    nameLabel.htmlFor = 'activity-name-input';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'activity-name-input';
    nameInput.name = 'name';
    nameInput.required = true;
    nameInput.placeholder = 'Nom de l\'activité';
    
    nameContainer.appendChild(nameLabel);
    nameContainer.appendChild(nameInput);
    fieldsContainer.appendChild(nameContainer);
    
    // Champ Description
    const descriptionContainer = document.createElement('div');
    descriptionContainer.className = 'form-field';
    
    const descriptionLabel = document.createElement('label');
    descriptionLabel.textContent = 'Description:';
    descriptionLabel.htmlFor = 'activity-description-input';
    
    const descriptionInput = document.createElement('textarea');
    descriptionInput.id = 'activity-description-input';
    descriptionInput.name = 'description';
    descriptionInput.required = true;
    descriptionInput.placeholder = 'Description de l\'activité';
    descriptionInput.rows = 4;
    
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
    startDateInput.required = true;
    // Définir la date d'aujourd'hui par défaut
    startDateInput.value = new Date().toISOString().split('T')[0];
    
    startDateContainer.appendChild(startDateLabel);
    startDateContainer.appendChild(startDateInput);
    fieldsContainer.appendChild(startDateContainer);
    
    // Champ Date de fin
    const endDateContainer = document.createElement('div');
    endDateContainer.className = 'form-field';
    
    const endDateLabel = document.createElement('label');
    endDateLabel.textContent = 'Date de fin (optionnel):';
    endDateLabel.htmlFor = 'end-date-input';
    
    const endDateInput = document.createElement('input');
    endDateInput.type = 'date';
    endDateInput.id = 'end-date-input';
    endDateInput.name = 'end_date';
    
    endDateContainer.appendChild(endDateLabel);
    endDateContainer.appendChild(endDateInput);
    fieldsContainer.appendChild(endDateContainer);
    
    form.appendChild(fieldsContainer);
    
    // Conteneur des boutons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'form-buttons';
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.justifyContent = 'flex-start';
    buttonsContainer.style.gap = '1rem';
    
    // Bouton Enregistrer
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'btn btn-primary';
    saveButton.textContent = 'Enregistrer';
    saveButton.disabled = true; // Désactivé par défaut
    
    // Fonction pour vérifier si le formulaire est valide
    const checkFormValidity = () => {
        const isValid = nameInput.value.trim() !== '' && 
                       descriptionInput.value.trim() !== '' && 
                       startDateInput.value !== '';
        saveButton.disabled = !isValid;
    };
    
    // Écouter les changements sur les champs
    nameInput.addEventListener('input', checkFormValidity);
    descriptionInput.addEventListener('input', checkFormValidity);
    startDateInput.addEventListener('input', checkFormValidity);
    endDateInput.addEventListener('input', () => {
        // Validation de la date de fin
        if (endDateInput.value && startDateInput.value) {
            if (endDateInput.value <= startDateInput.value) {
                endDateInput.setCustomValidity('La date de fin doit être postérieure à la date de début');
            } else {
                endDateInput.setCustomValidity('');
            }
        }
    });
    
    // Vérifier l'état initial
    checkFormValidity();
    
    saveButton.addEventListener('click', async () => {
        const formData = {
            name: nameInput.value.trim(),
            description: descriptionInput.value.trim(),
            start_date: startDateInput.value,
            end_date: endDateInput.value || null
        };
        
        try {
            // Désactiver le bouton pendant la sauvegarde
            saveButton.disabled = true;
            saveButton.textContent = 'Enregistrement...';
            
            // Appeler le callback onSave qui gère l'API et le rechargement
            if (onSave) {
                await onSave(formData);
            } else {
                // Fallback : appeler directement l'API si pas de callback
                await createEntryActivity(formData);
            }
            
            // Fermer le modal en cas de succès
            if (form._modal) {
                form._modal.close();
            }
            
        } catch (error) {
            // Réactiver le bouton en cas d'erreur
            saveButton.disabled = false;
            saveButton.textContent = 'Enregistrer';
            
            // Afficher l'erreur
            alert('Erreur lors de la création : ' + error.message);
            console.error('Erreur lors de la création:', error);
        }
    });
    
    buttonsContainer.appendChild(saveButton);
    form.appendChild(buttonsContainer);
    
    return form;
}

/**
 * Afficher le formulaire dans un modal
 * @param {Function} onSave - Callback appelé lors de la sauvegarde
 * @param {Object} activityType - Informations du type d'activité (optionnel)
 */
export function showCreateActivityModal(onSave, activityType = null) {
    // Créer le formulaire
    const form = createActivityForm(onSave);
    
    // Déterminer le titre en fonction du type
    let title = 'Créer une nouvelle activité';
    if (activityType && activityType.type_name) {
        title = `Créer un nouveau ${activityType.type_name.toLowerCase()}`;
    }
    
    // Afficher le formulaire dans un modal
    const modal = showModal(form, {
        title: title,
        width: '500px',
        maxWidth: '90vw'
    });
    
    // Passer la référence du modal au formulaire pour la fermeture automatique
    form._modal = modal;
    
    console.log('[showCreateActivityModal] Modal affiché avec le formulaire');
    
    return modal;
}

/**
 * Valider les données du formulaire
 * @param {Object} formData - Données du formulaire
 * @returns {Object} Résultat de la validation {isValid: boolean, errors: Array}
 */
export function validateCreateActivityForm(formData) {
    const errors = [];
    
    // Vérifier que le nom est renseigné
    if (!formData.name || formData.name.trim() === '') {
        errors.push('Le nom est obligatoire');
    }
    
    // Vérifier que la description est renseignée
    if (!formData.description || formData.description.trim() === '') {
        errors.push('La description est obligatoire');
    }
    
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
 * Créer une activité via l'API
 * @param {Object} formData - Données du formulaire
 * @returns {Promise} Résultat de la création
 */
export async function createEntryActivity(formData) {
    try {
        // Préparer les données selon le format attendu par l'API
        const currentUser = globalStore.getUser();
        const apiData = {
            created_by: currentUser?.id || 1, // Utiliser l'utilisateur courant ou une valeur par défaut
            name: formData.name,
            description: formData.description,
            start_date: formData.start_date,
            end_date: formData.end_date
        };

        // Ajouter les informations du type si disponibles
        if (formData.type) {
            apiData.type = formData.type;
        }

        console.log('Données à envoyer à l\'API:', apiData);

        // Appel à l'API createEntry
        const response = await fetch(`/api/controllers/responsibilities/activity-controller.php?action=createEntry`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData)
        });

        // Debug: afficher la réponse brute
        const responseText = await response.text();
        console.log('Réponse brute de l\'API:', responseText);
        console.log('Status:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            try {
                const errorData = JSON.parse(responseText);
                throw new Error(errorData.error || 'Erreur lors de la création');
            } catch (parseError) {
                throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
            }
        }

        // Parser la réponse JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Erreur de parsing JSON:', parseError);
            console.error('Réponse reçue:', responseText);
            throw new Error('Réponse invalide du serveur');
        }
        
        console.log('Résultat de la création:', result);
        
        return result;
    } catch (error) {
        console.error('Erreur lors de la création:', error);
        throw error;
    }
} 