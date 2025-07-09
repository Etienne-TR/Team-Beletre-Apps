# 🎨 Composants UI (`modules/components/`)

## 📊 Rôle et objectif

Le dossier `components/` contient des **composants JavaScript réutilisables** pour l'interface utilisateur. Ces modules gèrent des éléments d'interface spécifiques et peuvent être intégrés dans n'importe quelle page de l'application.

## 📋 Composants disponibles

### `app-header.js`
**Gestion de l'en-tête avec boutons retour**

```javascript
import { initializeBackButtons } from '../../../modules/components/app-header.js';

// Initialiser les boutons retour dans l'en-tête
initializeBackButtons();
```

**Fonctionnalités :**
- Gestion automatique des boutons retour
- Navigation intelligente
- Intégration avec l'en-tête CSS (`shared/app-header.css`)

**API :**
- `initializeBackButtons()` : Configure les boutons retour de l'en-tête

### `badges.js`
**Création de badges pour responsables et affectations**

```javascript
import { 
    createResponsibleBadge, 
    createAssignmentBadge 
} from '../../../modules/components/badges.js';

// Créer un badge de responsable
const responsibleBadge = createResponsibleBadge('EF', 'Étienne');

// Créer un badge d'affectation
const assignmentBadge = createAssignmentBadge('Tâche assignée', 'success');
```

**API :**
- `createResponsibleBadge(initials, name)` : Badge avec initiales et nom
- `createAssignmentBadge(text, type)` : Badge d'affectation avec type
- **Types** : `'success'`, `'warning'`, `'info'`, `'error'`

### `loading.js`
**Gestion des états de chargement**

```javascript
import { showLoading, hideLoading } from '../../../modules/components/loading.js';

// Afficher l'état de chargement
showLoading();

// Masquer l'état de chargement
hideLoading();
```

**Fonctionnalités :**
- Affichage/masquage de l'écran de chargement
- Gestion automatique des sections `loadingSection` et `mainContent`

**API :**
- `showLoading()` : Affiche l'écran de chargement
- `hideLoading()` : Masque l'écran de chargement

### `emptyState.js`
**États vides et messages d'information**

```javascript
import { showEmptyState } from '../../../modules/components/emptyState.js';

// Afficher un état vide
showEmptyState('Aucune donnée disponible', 'info');
```

**Fonctionnalités :**
- Messages d'état vide personnalisables
- Différents types de messages (info, warning, error)

**API :**
- `showEmptyState(message, type = 'info')` : Affiche un état vide
- **Types** : `'info'`, `'warning'`, `'error'`

### `user-info.js`

Ce module gère l'affichage des informations utilisateur (initiales) dans le header des applications.

### Utilisation

```javascript
import { updateUserInfo, loadAndUpdateUserInfo, initializeUserInfo } from '../../modules/components/user-info.js';

// Option 1: Mettre à jour avec un objet utilisateur existant
const user = {
    initials: 'JD',
    displayname: 'John Doe'
};
updateUserInfo(user);

// Option 2: Charger depuis l'API et mettre à jour automatiquement
const user = await loadAndUpdateUserInfo();

// Option 3: Initialiser au chargement de la page (recommandé)
document.addEventListener('DOMContentLoaded', async function() {
    await initializeUserInfo();
});
```

### Structure HTML requise

Le module cherche les éléments avec la classe `user-info` :

```html
<div class="user-info" id="currentUser"></div>
```

### Fonctions disponibles

- `updateUserInfo(user)`: Met à jour l'affichage avec un objet utilisateur
- `loadAndUpdateUserInfo()`: Récupère les données depuis l'API et met à jour l'affichage
- `initializeUserInfo()`: Initialise l'affichage au chargement de la page

### Format de l'objet utilisateur

```javascript
{
    initials: 'JD',           // Initiales à afficher
    displayname: 'John Doe'   // Nom complet (utilisé pour le title)
}
```

### `date-selector.js`
**Sélecteur de date dynamique avec navigation et calendrier**

```javascript
import { 
    initDateSelector, 
    createDateSelectorHTML, 
    setupDateSelectorEvents, 
    onDateChange 
} from '../../../modules/components/date-selector.js';

// Initialiser avec aujourd'hui par défaut
initDateSelector();

// Créer le HTML du sélecteur
const dateSelectorHTML = createDateSelectorHTML();

// Configurer les événements
setupDateSelectorEvents();

// S'abonner aux changements
onDateChange((newDate, formattedDate) => {
    console.log('Date changée:', formattedDate);
    // Recharger les données
    await loadDataForDate(formattedDate);
});
```

**Fonctionnalités :**
- Navigation par année (précédente/suivante)
- Affichage de la date actuelle (DD/MM/YYYY)
- Sélection précise via calendrier natif
- Synchronisation automatique entre toutes les vues
- Valeur par défaut : aujourd'hui

**Interface :**
```
[←] [15/06/2024] [→]
```

**API :**
- `initDateSelector(defaultDate = null)` : Initialise le sélecteur
- `createDateSelectorHTML()` : Génère le HTML du composant
- `setupDateSelectorEvents(containerSelector = 'body')` : Configure les événements
- `onDateChange(callback)` : S'abonne aux changements de date
- `getCurrentDate()` : Récupère la date actuelle
- `getCurrentDateFormatted()` : Récupère la date formatée (YYYY-MM-DD)

**Comportement :**
- Navigation par année garde le jour et le mois
- Clic sur la date centrale ouvre un calendrier natif
- Toutes les vues se synchronisent automatiquement
- Responsive design avec adaptation mobile

### `modal.js`
**Composant modal réutilisable pour afficher des contenus dans des fenêtres modales**

```javascript
import { showModal, showConfirmModal, showAlertModal } from '../../../modules/components/modal.js';

// Afficher un contenu dans un modal
const modal = showModal(formElement, {
    title: 'Titre du modal',
    width: '500px',
    maxWidth: '90vw'
});

// Modal de confirmation
const confirmed = await showConfirmModal(
    'Êtes-vous sûr de vouloir supprimer cet élément ?',
    'Confirmation',
    'Supprimer',
    'Annuler'
);

// Modal d'alerte
await showAlertModal('Opération réussie !', 'Succès', 'OK');
```

**Fonctionnalités :**
- Affichage de contenu HTML ou éléments DOM
- Animations d'entrée et de sortie fluides
- Gestion automatique de la fermeture (clic extérieur, touche Échap, bouton)
- Modals de confirmation et d'alerte prêts à l'emploi
- Styles CSS inline pour une portabilité maximale

**API :**
- `showModal(content, options)` : Affiche un contenu dans un modal
- `showConfirmModal(message, title, confirmText, cancelText)` : Modal de confirmation
- `showAlertModal(message, title, buttonText)` : Modal d'alerte

**Options du modal :**
- `title` : Titre du modal (optionnel)
- `showCloseButton` : Afficher le bouton de fermeture (défaut: true)
- `closeOnOutsideClick` : Fermer en cliquant à l'extérieur (défaut: true)
- `closeOnEscape` : Fermer avec la touche Échap (défaut: true)
- `width` / `maxWidth` : Dimensions du modal
- `height` / `maxHeight` : Hauteur du modal
- `onClose` : Callback appelé lors de la fermeture

### `navigation-tabs.js`
**Navigation par onglets entre les vues d'application**

```javascript
import { 
    createTabNavigation, 
    setupTabNavigation, 
    createAndSetupTabNavigation 
} from '../../../modules/components/navigation-tabs.js';

// Définir les vues disponibles
const views = [
    { id: 'global-view', label: 'Vue globale', icon: '📋' },
    { id: 'editor', label: 'Éditeur', icon: '✏️' },
    { id: 'worker-view', label: 'Fiches de poste', icon: '👥' }
];

// Créer et configurer la navigation
const navigation = createAndSetupTabNavigation(views, {
    activeView: 'global-view',
    onViewChange: (viewName) => {
        console.log('Vue changée:', viewName);
    }
});

// Ajouter à la page
document.querySelector('.app-navigation').appendChild(navigation);
```

**Fonctionnalités :**
- Navigation fluide entre les vues d'application
- Gestion automatique de l'historique navigateur
- Support des icônes pour chaque vue
- Accessibilité complète (clavier, ARIA)
- Responsive design avec adaptation mobile
- Intégration avec le système de filtres existant

**Interface :**
```
[📋 Vue globale] [✏️ Éditeur] [👥 Fiches de poste]
```

**API :**
- `createTabNavigation(views, options)` : Crée l'élément de navigation
- `setupTabNavigation(element, options)` : Configure la logique
- `createAndSetupTabNavigation(views, options)` : Crée et configure en une fois
- `restoreTabState(element, currentView)` : Restaure l'état des onglets

**Options :**
- `activeView` : Vue active par défaut
- `className` : Classe CSS personnalisée
- `compact` : Mode compact pour les onglets
- `spacious` : Mode espacé pour les onglets
- `onViewChange` : Callback lors du changement de vue
- `updateURL` : Mise à jour automatique de l'URL

**Comportement :**
- Navigation sans rechargement de page
- Synchronisation avec l'URL (paramètre `?view=`)
- Gestion automatique des filtres par vue
- Transitions fluides entre les vues
- Support complet de l'accessibilité

## 🔗 Comment utiliser

### Import simple
```javascript
import { initializeBackButtons } from '../../../modules/components/app-header.js';
```

### Import multiple
```javascript
import { 
    showLoading, 
    hideLoading 
} from '../../../modules/components/loading.js';
```

### Utilisation dans une page
```javascript
// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les composants UI
    initializeBackButtons();
    
    // Charger les données
    showLoading();
    loadData().then(() => {
        hideLoading();
    });
});
```

## 🎨 Intégration avec le CSS

### Styles associés
- Les composants UI utilisent les styles CSS de `shared/`
- `app-header.js` ↔ `shared/app-header.css`
- Les badges utilisent les styles de `shared/style.css`

### Responsive Design
- Tous les composants sont responsives
- Adaptation automatique selon la taille d'écran
- Breakpoints : 768px (tablet) et 480px (mobile)

## 📝 Conventions de développement

### Nommage
- **Fichiers** : `kebab-case.js` (ex: `app-header.js`)
- **Fonctions** : `camelCase` (ex: `initializeBackButtons`)
- **Classes CSS** : `kebab-case` (ex: `app-header`)

### Structure d'un composant
```javascript
/**
 * Description du composant
 */

/**
 * Initialise le composant
 * @param {Object} options - Options de configuration
 */
export function initializeComponent(options = {}) {
    // Implémentation
}

// Export multiple si nécessaire
export {
    function1,
    function2
};
```

### Gestion des événements
- Utiliser `addEventListener` pour les interactions
- Gérer la suppression des événements si nécessaire
- Éviter les conflits entre composants

## 🔄 Maintenance et évolution

### Ajouter un nouveau composant
1. **Créer le fichier** : `nouveau-composant.js`
2. **Exporter les fonctions** : Utiliser `export function`
3. **Documenter l'API** : JSDoc pour chaque fonction
4. **Tester l'intégration** : Vérifier dans différentes pages
5. **Mettre à jour ce README** : Ajouter la documentation

### Modifier un composant existant
1. **Maintenir la compatibilité** : Ne pas casser l'API existante
2. **Tester les pages** : Vérifier que tout fonctionne
3. **Mettre à jour la documentation** : Si l'API change

### Bonnes pratiques
- **Simplicité** : Un composant = une responsabilité
- **Réutilisabilité** : Utilisable dans plusieurs contextes
- **Performance** : Éviter les manipulations DOM coûteuses
- **Accessibilité** : Respecter les standards d'accessibilité

## 🎯 Exemples d'utilisation

### Page avec en-tête et badges
```javascript
import { initializeBackButtons } from '../../../modules/components/app-header.js';
import { createResponsibleBadge } from '../../../modules/components/badges.js';

// Initialiser l'en-tête
initializeBackButtons();

// Créer des badges
const badge = createResponsibleBadge('EF', 'Étienne');
document.getElementById('badge-container').appendChild(badge);
```

### Page avec gestion de chargement
```javascript
import { showLoading, hideLoading } from '../../../modules/components/loading.js';

async function loadPageData() {
    showLoading();
    try {
        await fetchData();
        // Afficher les données
    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        hideLoading();
    }
} 