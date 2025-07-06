# 🎨 Composants UI - Responsabilités (`apps/responsibilities/components/`)

## 📊 Rôle et objectif

Le dossier `components/` contient les **composants JavaScript spécifiques** à l'application Responsabilités. Ces composants gèrent des éléments d'interface spécialisés pour l'affichage des activités, tâches et responsabilités.

## 📋 Composants disponibles

### `activity-card.js`
**Composant de carte d'activité avec gestion des responsabilités et tâches**

Composant principal pour l'affichage des activités avec leurs responsables et tâches associées. Supporte l'expansion/réduction et la gestion d'état.

#### Utilisation
```javascript
import { 
    createActivityCard,
    createTaskCard,
    createActivityWithTasksCard,
    createSimpleTaskCard
} from '/apps/responsibilities/components/activity-card.js';

// Créer une carte d'activité complète
const activityCard = createActivityCard(activity, responsibles, tasks, options);

// Créer une carte de tâche
const taskCard = createTaskCard(task, options);

// Créer une carte d'activité avec tâches intégrées
const activityWithTasks = createActivityWithTasksCard(activity, responsibles, tasks, options);
```

#### Fonctionnalités
- **Affichage compact** : En-tête avec nom et badges des responsables
- **Contenu détaillé** : Description et liste des tâches (pliable)
- **Gestion d'état** : Mémorisation de l'état d'expansion/réduction
- **Responsive** : Adaptation automatique selon la taille d'écran
- **Accessibilité** : Support des interactions clavier et souris

#### API des fonctions

**`createActivityCard(activity, responsibles, tasks, options)`**
- `activity` : Objet activité à afficher
- `responsibles` : Liste des responsables (optionnel)
- `tasks` : Liste des tâches (optionnel)
- `options` : Options de configuration (nomTag, descriptionClass, etc.)

**`createTaskCard(task, options)`**
- `task` : Objet tâche à afficher
- `options` : Options de configuration

**`createActivityWithTasksCard(activity, responsibles, tasks, options)`**
- Version combinée avec tâches intégrées dans la carte d'activité

**`createSimpleTaskCard(task, assignments, options)`**
- Version simplifiée pour l'affichage en liste

#### Options de configuration
```javascript
const options = {
    nameTag: 'h3',                    // Tag HTML pour le nom
    descriptionClass: 'description',  // Classe CSS pour la description
    tasksSectionClass: 'tasks',       // Classe CSS pour la section tâches
    tasksTitleText: 'Tâches',         // Texte du titre des tâches
    noTasksText: 'Aucune tâche',      // Texte si pas de tâches
    isGlobalView: false,              // Mode vue globale
    selectedWorkerId: null            // ID du worker sélectionné
};
```

## 🔗 Intégration avec le store

Les composants utilisent le store centralisé pour :
- **Gestion d'état** : État d'expansion/réduction des cartes
- **Synchronisation** : Entre les vues individual et global
- **Persistance** : Mémorisation des préférences utilisateur

```javascript
import { 
    expandCard, 
    collapseCard, 
    isCardExpanded 
} from '/modules/store/responsibilities.js';
```

## 🎨 Styles CSS

Les composants utilisent les styles CSS de :
- `shared/style.css` : Styles de base et badges
- `apps/responsibilities/style.css` : Styles spécifiques aux responsabilités

### Classes CSS principales
- `.activity-card` : Conteneur principal de la carte
- `.compact-header` : En-tête compact avec nom et badges
- `.detailed-content` : Contenu détaillé (pliable)
- `.tasks-section` : Section des tâches
- `.task-card` : Carte de tâche individuelle

## 📱 Responsive Design

### Breakpoints
- **Desktop** : Affichage complet avec toutes les informations
- **Tablet** (≤768px) : Adaptation de la taille des badges
- **Mobile** (≤480px) : Simplification de l'affichage

### Comportement adaptatif
- Badges responsives avec texte réduit sur mobile
- Espacement adaptatif selon la taille d'écran
- Gestion optimisée du touch sur mobile

## 🔄 Maintenance et évolution

### Ajouter un nouveau composant
1. **Créer le fichier** : `nouveau-composant.js`
2. **Exporter les fonctions** : Utiliser `export function`
3. **Documenter l'API** : JSDoc pour chaque fonction
4. **Tester l'intégration** : Vérifier dans les pages existantes
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

### Page avec cartes d'activités
```javascript
import { createActivityCard } from '/apps/responsibilities/components/activity-card.js';

function displayActivities(activities, responsibles, tasks) {
    const container = document.getElementById('activities-container');
    
    activities.forEach(activity => {
        const activityResponsibles = responsibles.filter(r => 
            r.activity_id === activity.id
        );
        const activityTasks = tasks.filter(t => 
            t.activity_id === activity.id
        );
        
        const card = createActivityCard(
            activity, 
            activityResponsibles, 
            activityTasks,
            { isGlobalView: true }
        );
        
        container.appendChild(card);
    });
}
```

### Page avec tâches simples
```javascript
import { createSimpleTaskCard } from '/apps/responsibilities/components/activity-card.js';

function displayTasks(tasks, assignments) {
    const container = document.getElementById('tasks-container');
    
    tasks.forEach(task => {
        const taskAssignments = assignments.filter(a => 
            a.task_id === task.id
        );
        
        const card = createSimpleTaskCard(task, taskAssignments);
        container.appendChild(card);
    });
}
```

## 📝 Conventions de développement

### Nommage
- **Fichiers** : `kebab-case.js` (ex: `activity-card.js`)
- **Fonctions** : `camelCase` (ex: `createActivityCard`)
- **Classes CSS** : `kebab-case` (ex: `activity-card`)

### Structure d'un composant
```javascript
/**
 * Description du composant
 */

/**
 * Crée un élément DOM
 * @param {Object} data - Données à afficher
 * @param {Object} options - Options de configuration
 * @returns {HTMLElement} - L'élément DOM créé
 */
export function createComponent(data, options = {}) {
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