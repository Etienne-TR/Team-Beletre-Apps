// Formulaire d'ajout de responsable
import { showModal, showConfirmModal } from '/modules/components/modal.js';
import { globalStore } from '/modules/store/store.js';

/**
 * Créer le formulaire d'ajout de responsable
 * @param {Object} activity - Données de l'activité
 * @param {Array} availableUsers - Liste des utilisateurs disponibles
 * @param {Function} onSave - Callback appelé lors de la sauvegarde
 * @returns {HTMLElement} Le formulaire créé
 */
export function createResponsibleForForm(activity, availableUsers, onSave) {
    const form = document.createElement('div');
    form.className = 'add-responsible-form';
    
    // Conteneur des champs
    const fieldsContainer = document.createElement('div');
    fieldsContainer.className = 'form-fields';
    
    // Champ Utilisateur
    const userContainer = document.createElement('div');
    userContainer.className = 'form-field';
    
    const userLabel = document.createElement('label');
    userLabel.textContent = 'Utilisateur:';
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
            
            // Appeler le callback onSave qui gère l'API et le rechargement
            if (onSave) {
                await onSave(activity, formData);
            } else {
                // Fallback : appeler directement l'API si pas de callback
                await createResponsibleFor(activity, formData);
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
            alert('Erreur lors de l\'ajout : ' + error.message);
            console.error('Erreur lors de l\'ajout:', error);
        }
    });
    
    buttonsContainer.appendChild(saveButton);
    form.appendChild(buttonsContainer);
    
    return form;
}

/**
 * Afficher le formulaire dans un modal
 * @param {Object} activity - Données de l'activité
 * @param {Array} availableUsers - Liste des utilisateurs disponibles
 * @param {Function} onSave - Callback appelé lors de la sauvegarde
 */
export function showCreateResponsibleForModal(activity, availableUsers, onSave) {
    // Créer le formulaire
    const form = createResponsibleForForm(activity, availableUsers, onSave);
    
    // Afficher le formulaire dans un modal
    const modal = showModal(form, {
        title: 'Ajouter un.e responsable',
        width: '500px',
        maxWidth: '90vw'
    });
    
    // Passer la référence du modal au formulaire pour la fermeture automatique
    form._modal = modal;
    
    console.log('[showCreateResponsibleForModal] Modal affiché avec le formulaire');
    
    return modal;
}

/**
 * Valider les données du formulaire
 * @param {Object} formData - Données du formulaire
 * @returns {Object} Résultat de la validation {isValid: boolean, errors: Array}
 */
export function validateCreateResponsibleForForm(formData) {
    const errors = [];
    
    // Vérifier que l'utilisateur est sélectionné
    if (!formData.user) {
        errors.push('L\'utilisateur est obligatoire');
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
 * Créer un responsable pour une activité via l'API
 * @param {Object} activity - Données de l'activité
 * @param {Object} formData - Données du formulaire
 * @returns {Promise} Résultat de la création
 */
export async function createResponsibleFor(activity, formData) {
    try {
        // Préparer les données selon le format attendu par l'API
        const currentUser = globalStore.getUser();
        const apiData = {
            created_by: currentUser?.id || 1, // Utiliser l'utilisateur courant ou une valeur par défaut
            activity: activity.entry,
            user: formData.user,
            start_date: formData.start_date,
            end_date: formData.end_date
        };

        console.log('Données à envoyer à l\'API:', apiData);

        // Appel à l'API createEntry
        const response = await fetch(`/api/controllers/responsibilities/responsible-for-controller.php?action=createEntry`, {
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
                throw new Error(errorData.error || 'Erreur lors de l\'ajout');
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
        
        console.log('Résultat de l\'ajout:', result);
        
        return result;
    } catch (error) {
        console.error('Erreur lors de l\'ajout:', error);
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