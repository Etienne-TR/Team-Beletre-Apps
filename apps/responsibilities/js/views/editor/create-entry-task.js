// Formulaire d'ajout de tâche
import { showModal, showConfirmModal } from '/modules/components/modal.js';
import { globalStore } from '/modules/store/store.js';

/**
 * Créer le formulaire d'ajout de tâche
 * @param {Object} activity - Données de l'activité
 * @param {Function} onSave - Callback appelé lors de la sauvegarde
 * @returns {HTMLElement} Le formulaire créé
 */
export function createEntryTaskForm(activity, onSave) {
    const form = document.createElement('div');
    form.className = 'add-task-form';
    
    // Conteneur des champs
    const fieldsContainer = document.createElement('div');
    fieldsContainer.className = 'form-fields';
    
    // Champ Nom
    const nameContainer = document.createElement('div');
    nameContainer.className = 'form-field';
    
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Nom:';
    nameLabel.htmlFor = 'task-name-input';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'task-name-input';
    nameInput.name = 'name';
    nameInput.required = true;
    nameInput.placeholder = 'Nom de la tâche';
    nameInput.maxLength = 200;
    
    nameContainer.appendChild(nameLabel);
    nameContainer.appendChild(nameInput);
    fieldsContainer.appendChild(nameContainer);
    
    // Champ Description
    const descriptionContainer = document.createElement('div');
    descriptionContainer.className = 'form-field';
    
    const descriptionLabel = document.createElement('label');
    descriptionLabel.textContent = 'Description (optionnel):';
    descriptionLabel.htmlFor = 'task-description-input';
    
    const descriptionInput = document.createElement('textarea');
    descriptionInput.id = 'task-description-input';
    descriptionInput.name = 'description';
    descriptionInput.placeholder = 'Description de la tâche';
    descriptionInput.maxLength = 1000;
    descriptionInput.rows = 4;
    descriptionInput.style.resize = 'vertical';
    
    descriptionContainer.appendChild(descriptionLabel);
    descriptionContainer.appendChild(descriptionInput);
    fieldsContainer.appendChild(descriptionContainer);
    
    // Champ Date de début
    const startDateContainer = document.createElement('div');
    startDateContainer.className = 'form-field';
    
    const startDateLabel = document.createElement('label');
    startDateLabel.textContent = 'Date de début:';
    startDateLabel.htmlFor = 'task-start-date-input';
    
    const startDateInput = document.createElement('input');
    startDateInput.type = 'date';
    startDateInput.id = 'task-start-date-input';
    startDateInput.name = 'start_date';
    // Utiliser la date d'aujourd'hui comme valeur par défaut
    startDateInput.value = new Date().toISOString().split('T')[0];
    
    startDateContainer.appendChild(startDateLabel);
    startDateContainer.appendChild(startDateInput);
    fieldsContainer.appendChild(startDateContainer);
    
    // Champ Date de fin
    const endDateContainer = document.createElement('div');
    endDateContainer.className = 'form-field';
    
    const endDateLabel = document.createElement('label');
    endDateLabel.textContent = 'Date de fin (optionnel):';
    endDateLabel.htmlFor = 'task-end-date-input';
    
    const endDateInput = document.createElement('input');
    endDateInput.type = 'date';
    endDateInput.id = 'task-end-date-input';
    endDateInput.name = 'end_date';
    // Pas de valeur par défaut pour la date de fin (optionnel)
    
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
        const isValid = nameInput.value.trim() !== '';
        saveButton.disabled = !isValid;
    };
    
    // Écouter les changements sur les champs
    nameInput.addEventListener('input', checkFormValidity);
    
    // Vérifier l'état initial
    checkFormValidity();
    
    saveButton.addEventListener('click', async () => {
        const formData = {
            name: nameInput.value.trim(),
            description: descriptionInput.value.trim() || null,
            start_date: startDateInput.value || null,
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
                await createEntryTask(activity, formData);
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
 * @param {Object} activity - Données de l'activité
 * @param {Function} onSave - Callback appelé lors de la sauvegarde
 */
export function showCreateEntryTaskModal(activity, onSave) {
    // Créer le formulaire
    const form = createEntryTaskForm(activity, onSave);
    
    // Afficher le formulaire dans un modal
    const modal = showModal(form, {
        title: 'Créer nouvelle tâche',
        width: '500px',
        maxWidth: '90vw'
    });
    
    // Passer la référence du modal au formulaire pour la fermeture automatique
    form._modal = modal;
    
    console.log('[showCreateEntryTaskModal] Modal affiché avec le formulaire');
    
    return modal;
}

/**
 * Valider les données du formulaire
 * @param {Object} formData - Données du formulaire
 * @returns {Object} Résultat de la validation {isValid: boolean, errors: Array}
 */
export function validateCreateEntryTaskForm(formData) {
    const errors = [];
    
    // Vérifier que le nom est renseigné
    if (!formData.name || formData.name.trim() === '') {
        errors.push('Le nom de la tâche est obligatoire');
    }
    
    // Vérifier la longueur du nom
    if (formData.name && formData.name.length > 200) {
        errors.push('Le nom de la tâche ne peut pas dépasser 200 caractères');
    }
    
    // Vérifier la longueur de la description
    if (formData.description && formData.description.length > 1000) {
        errors.push('La description ne peut pas dépasser 1000 caractères');
    }
    
    // Vérifier que la date de début est valide si renseignée
    if (formData.start_date) {
        const startDate = new Date(formData.start_date);
        if (isNaN(startDate.getTime())) {
            errors.push('La date de début n\'est pas valide');
        }
    }
    
    // Vérifier que la date de fin est valide si renseignée
    if (formData.end_date) {
        const endDate = new Date(formData.end_date);
        if (isNaN(endDate.getTime())) {
            errors.push('La date de fin n\'est pas valide');
        }
    }
    
    // Vérifier que start_date <= end_date si les deux sont renseignées
    if (formData.start_date && formData.end_date) {
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);
        
        if (startDate > endDate) {
            errors.push('La date de début ne peut pas être postérieure à la date de fin');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Créer une tâche pour une activité via l'API
 * @param {Object} activity - Données de l'activité
 * @param {Object} formData - Données du formulaire
 * @returns {Promise} Résultat de la création
 */
export async function createEntryTask(activity, formData) {
    try {
        // Préparer les données selon le format attendu par l'API
        const currentUser = globalStore.getUser();
        const apiData = {
            name: formData.name,
            description: formData.description,
            activity: activity.entry,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null
        };

        console.log('Données à envoyer à l\'API:', apiData);

        // Appel à l'API createEntryTask
        const response = await fetch(`/api/controllers/responsibilities/activity-controller.php?action=create_entry_task`, {
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

// ========================================
// EXEMPLE D'UTILISATION
// ========================================

/**
 * Exemple d'utilisation du formulaire de création de tâche
 * 
 * // Dans votre composant ou page :
 * 
 * import { showCreateEntryTaskModal } from './create-entry-task.js';
 * 
 * // Créer un bouton pour ouvrir le modal
 * const addTaskButton = document.createElement('button');
 * addTaskButton.textContent = 'Ajouter une tâche';
 * addTaskButton.addEventListener('click', () => {
 *     const activity = {
 *         entry: 123, // ID de l'activité
 *         name: 'Nom de l\'activité'
 *     };
 *     
 *     // Callback appelé après la sauvegarde réussie
 *     const onSave = async (activity, formData) => {
 *         try {
 *             // Appeler l'API
 *             const result = await createEntryTask(activity, formData);
 *             
 *             // Recharger les données ou mettre à jour l'interface
 *             await reloadTasks();
 *             
 *             // Afficher un message de succès
 *             console.log('Tâche créée avec succès:', result);
 *             
 *         } catch (error) {
 *             console.error('Erreur lors de la création:', error);
 *             throw error; // Re-lancer l'erreur pour que le modal l'affiche
 *         }
 *     };
 *     
 *     // Afficher le modal
 *     showCreateEntryTaskModal(activity, onSave);
 * });
 * 
 * // Fonction pour recharger les tâches (à adapter selon votre application)
 * async function reloadTasks() {
 *     // Votre logique de rechargement
 *     console.log('Rechargement des tâches...');
 * }
 */ 