# Formulaires d'édition - Vue Editor

Ce dossier contient les formulaires d'édition pour la vue Editor de l'application Responsibilities.

## Fichiers

### `create-responsible-for.js`
Formulaire pour ajouter un.e responsable à une activité.

**Fonctions principales :**
- `createResponsibleForForm()` - Crée le formulaire HTML
- `showCreateResponsibleForModal()` - Affiche le formulaire dans un modal
- `createResponsibleFor()` - Appelle l'API pour créer un responsable
- `loadAvailableUsers()` - Charge la liste des utilisateurs disponibles

**Utilisation :**
```javascript
import { showCreateResponsibleForModal } from './create-responsible-for.js';

const availableUsers = await loadAvailableUsers(date);
showCreateResponsibleForModal(activity, availableUsers, onSaveCallback);
```

### `create-assigned-to.js`
Formulaire pour assigner un.e travailleur.se à une tâche.

**Fonctions principales :**
- `createAssignedToForm()` - Crée le formulaire HTML
- `showCreateAssignedToModal()` - Affiche le formulaire dans un modal
- `createAssignedTo()` - Appelle l'API pour créer une assignation
- `loadAvailableUsers()` - Charge la liste des utilisateurs disponibles

**Utilisation :**
```javascript
import { showCreateAssignedToModal } from './create-assigned-to.js';

const availableUsers = await loadAvailableUsers(date);
showCreateAssignedToModal(task, availableUsers, onSaveCallback);
```

### `revise-responsible-for.js`
Formulaire pour réviser/modifier une responsabilité existante.

**Fonctions principales :**
- `showReviseResponsibleForModal()` - Affiche le formulaire de révision
- `saveResponsibility()` - Sauvegarde les modifications

## Structure commune

Tous les formulaires suivent la même structure :

1. **Création du formulaire** - Fonction qui génère les éléments HTML
2. **Validation** - Vérification des données avant envoi
3. **Appel API** - Communication avec le backend
4. **Modal** - Affichage dans une fenêtre modale
5. **Callback** - Gestion du succès/erreur

## Champs communs

- **Utilisateur** : Sélection d'un.e travailleur.se
- **Date de début** : Date obligatoire
- **Date de fin** : Date optionnelle (doit être après la date de début)

## Validation

- Utilisateur obligatoire
- Date de début obligatoire
- Date de fin doit être postérieure à la date de début
- Validation côté client et serveur

## API Endpoints

- **Responsables** : `/api/controllers/responsibilities/responsible-for-controller.php?action=createEntry`
- **Assignations** : `/api/controllers/responsibilities/assigned-to-controller.php?action=create`
- **Utilisateurs** : `/api/controllers/responsibilities/user-controller.php?action=list` 