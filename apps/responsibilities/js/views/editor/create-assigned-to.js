// Formulaire d'ajout d'assignation de travailleur à une tâche
import { showModal, showConfirmModal } from '/modules/components/modal.js';

/**
 * Créer le formulaire d'ajout d'assignation de travailleur
 * @param {Object} task - Données de la tâche
 * @param {Array} availableUsers - Liste des utilisateurs disponibles
 * @param {Function} onSave - Callback appelé lors de la sauvegarde
 * @returns {HTMLElement} Le formulaire créé
 */
export function createAssignedToForm(task, availableUsers, onSave) {
    const form = document.createElement('div');
    form.className = 'add-assigned-to-form';
    
    // Conteneur des champs
    const fieldsContainer = document.createElement('div');
    fieldsContainer.className = 'form-fields';
    
    // Champ Utilisateur
    const userContainer = document.createElement('div');
    userContainer.className = 'form-field';
    
    const userLabel = document.createElement('label');
    userLabel.textContent = 'Travailleur.se:';
    userLabel.htmlFor = 'user-select';
    
    const userSelect = document.createElement('select');
    userSelect.id = 'user-select';
    userSelect.name = 'user';
    userSelect.required = true;
    
    // Option par défaut
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Sélectionnez un.e travaileur.se';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    userSelect.appendChild(defaultOption);
    
    // Options des utilisateurs
    if (availableUsers && availableUsers.length > 0) {
        availableUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.display_name || user.name || `Utilisateur ${user.id}`;
            userSelect.appendChild(option);
        });
    } else {
        const noUsersOption = document.createElement('option');
        noUsersOption.value = '';
        noUsersOption.textContent = 'Aucun utilisateur disponible';
        noUsersOption.disabled = true;
        userSelect.appendChild(noUsersOption);
    }
    
    userContainer.appendChild(userLabel);
    userContainer.appendChild(userSelect);
    fieldsContainer.appendChild(userContainer);
    
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
        const isValid = userSelect.value !== '' && startDateInput.value !== '';
        saveButton.disabled = !isValid;
    };
    
    // Écouter les changements sur les champs
    userSelect.addEventListener('change', checkFormValidity);
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
            user: parseInt(userSelect.value),
            start_date: startDateInput.value,
            end_date: endDateInput.value || null
        };
        
        try {
            // Désactiver le bouton pendant la sauvegarde
            saveButton.disabled = true;
            saveButton.textContent = 'Enregistrement...';
            
            // Appeler l'API d'ajout
            await createAssignedTo(task, formData);
            
            // Appeler le callback onSave si fourni
            if (onSave) {
                onSave(task, formData);
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
            alert('Erreur lors de l\'assignation : ' + error.message);
            console.error('Erreur lors de l\'assignation:', error);
        }
    });
    
    buttonsContainer.appendChild(saveButton);
    form.appendChild(buttonsContainer);
    
    return form;
}

/**
 * Afficher le formulaire dans un modal
 * @param {Object} task - Données de la tâche
 * @param {Array} availableUsers - Liste des utilisateurs disponibles
 * @param {Function} onSave - Callback appelé lors de la sauvegarde
 */
export function showCreateAssignedToModal(task, availableUsers, onSave) {
    // Créer le formulaire
    const form = createAssignedToForm(task, availableUsers, onSave);
    
    // Afficher le formulaire dans un modal
    const modal = showModal(form, {
        title: 'Assigner un.e travailleur.se à la tâche',
        width: '500px',
        maxWidth: '90vw'
    });
    
    // Passer la référence du modal au formulaire pour la fermeture automatique
    form._modal = modal;
    
    console.log('[showCreateAssignedToModal] Modal affiché avec le formulaire');
    
    return modal;
}

/**
 * Valider les données du formulaire
 * @param {Object} formData - Données du formulaire
 * @returns {Object} Résultat de la validation {isValid: boolean, errors: Array}
 */
export function validateCreateAssignedToForm(formData) {
    const errors = [];
    
    // Vérifier que l'utilisateur est sélectionné
    if (!formData.user) {
        errors.push('Le travailleur.se est obligatoire');
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
 * Créer une assignation de travailleur à une tâche via l'API
 * @param {Object} task - Données de la tâche
 * @param {Object} formData - Données du formulaire
 * @returns {Promise} Résultat de la création
 */
export async function createAssignedTo(task, formData) {
    try {
        // Préparer les données selon le format attendu par l'API
        const apiData = {
            task: task.task_id || task.id,
            user: formData.user, // utilisateur assigné
            start_date: formData.start_date,
            end_date: formData.end_date
        };

        console.log('Données à envoyer à l\'API:', apiData);

        // Appel à l'API create
        const response = await fetch(`/api/controllers/responsibilities/assigned-to-controller.php?action=createEntry`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de l\'assignation');
        }

        const result = await response.json();
        console.log('Résultat de l\'assignation:', result);
        
        return result;
    } catch (error) {
        console.error('Erreur lors de l\'assignation:', error);
        throw error;
    }
}

/**
 * Charger la liste des utilisateurs disponibles
 * @param {string} date - Date pour filtrer les travailleurs sous contrat (optionnel)
 * @returns {Promise<Array>} Liste des utilisateurs
 */
export async function loadAvailableUsers(date = null) {
    try {
        console.log('Chargement des travailleurs sous contrat...');
        
        // Utiliser la date fournie ou la date actuelle
        const filterDate = date || new Date().toISOString().split('T')[0];
        console.log('Date de filtrage:', filterDate);
        
        // Appel à l'API pour récupérer les travailleurs sous contrat
        const response = await fetch(`/api/controllers/responsibilities/user-controller.php?action=list&date=${filterDate}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors du chargement des travailleurs');
        }

        const result = await response.json();
        console.log('Résultat du chargement des travailleurs:', result);
        
        if (result.success && result.data && result.data.users) {
            console.log(`Travailleurs trouvés: ${result.data.total_count}`);
            return result.data.users;
        } else {
            console.warn('Format de réponse invalide pour les travailleurs:', result);
            return [];
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement des travailleurs:', error);
        return [];
    }
} 