# 📋 Application Responsabilités

## 📊 Vue d'ensemble

L'application **Responsabilités** permet de gérer et visualiser les responsabilités des membres de l'équipe pour différentes activités et tâches. Elle offre deux vues principales : une vue individuelle par membre et une vue globale par activité.

## 🏗️ Architecture

```
apps/responsibilities/
├── components/          # Composants UI spécifiques
│   ├── activity-card.js # Composant de carte d'activité
│   └── README.md        # Documentation des composants
├── pages/               # Pages de l'application
│   ├── global-view/     # Vue globale par activité
│   └── worker-view/     # Vue individuelle par membre
├── services/            # Services et logique métier
│   └── shared.js        # Fonctions utilitaires partagées
├── css/                 # Styles spécifiques
├── index.html           # Page d'accueil de l'application
├── index.js             # Point d'entrée principal
└── README.md            # Cette documentation
```

## 🎯 Fonctionnalités principales

### Vue Individuelle (`worker-view`)
- **Sélection du membre** : Choix du membre de l'équipe
- **Filtrage des responsabilités** : Toutes, Responsable, Autres
- **Affichage des activités** : Cartes pliables avec détails
- **Gestion des tâches** : Liste des tâches par activité

### Vue Globale (`global-view`)
- **Sélection du type d'activité** : Filtrage par catégorie
- **Vue d'ensemble** : Toutes les activités du type sélectionné
- **Responsables par activité** : Badges des responsables
- **Navigation temporelle** : Sélecteur de date

## 🔧 Composants UI

### `activity-card.js`
Composant principal pour l'affichage des activités avec :
- **En-tête compact** : Nom de l'activité + badges des responsables
- **Contenu détaillé** : Description + liste des tâches (pliable)
- **Gestion d'état** : Mémorisation de l'expansion/réduction
- **Responsive design** : Adaptation mobile/tablet/desktop

**Utilisation :**
```javascript
import { createActivityCard } from '/apps/responsibilities/components/activity-card.js';

const card = createActivityCard(activity, responsibles, tasks, options);
```

## 🔗 Intégration avec les modules

### Store centralisé
```javascript
import { appStore } from '/modules/store/store.js';

// État de l'application
appStore.state.responsibilities.individual.selectedWorker
appStore.state.responsibilities.global.selectedActivityType
```

### Cache global
```javascript
import { cache } from '/modules/cache/cache.js';

// Cache des données
cache.api.workers.set('2025-01-15', workersData);
cache.api.activities.set('123-2025-01-15', activitiesData);
```

### Composants UI globaux
```javascript
import { DateSelector } from '/modules/components/date-selector.js';
import { createResponsibleBadge } from '/modules/components/badges.js';
```

## 📱 Interface utilisateur

### Navigation
- **En-tête** : Titre + informations utilisateur + bouton retour
- **Filtres** : Sélecteur de membre/type d'activité
- **Sélecteur de date** : Navigation temporelle
- **Contenu principal** : Liste des activités/tâches

### Responsive Design
- **Desktop** : Affichage complet avec toutes les informations
- **Tablet** (≤768px) : Adaptation des badges et espacement
- **Mobile** (≤480px) : Simplification de l'affichage

## 🔄 Flux de données

### 1. Initialisation
```javascript
// Chargement des données initiales
await loadWorkers();
await loadActivities(date);
await loadTasks(date);
```

### 2. Mise à jour des filtres
```javascript
// Changement de membre sélectionné
appStore.commit('responsibilities/individual/setSelectedWorker', workerId);
await loadActivitiesForWorker(workerId, date);
```

### 3. Navigation temporelle
```javascript
// Changement de date
dateSelector.onDateChange(async (newDate) => {
    await reloadAllData(newDate);
});
```

## 🎨 Styles CSS

### Structure des styles
- **`shared/style.css`** : Styles de base et composants globaux
- **`apps/responsibilities/css/`** : Styles spécifiques à l'application
- **Responsive** : Breakpoints à 768px et 480px

### Classes principales
- `.app-header` : En-tête de l'application
- `.activity-card` : Carte d'activité
- `.badge` : Badges des responsables
- `.date-selector` : Sélecteur de date

## 🚀 Démarrage rapide

### 1. Accès à l'application
```
http://localhost/apps/responsibilities/
```

### 2. Navigation
- **Vue Individuelle** : `/apps/responsibilities/pages/worker-view/`
- **Vue Globale** : `/apps/responsibilities/pages/global-view/`

### 3. Utilisation
1. Sélectionner un membre ou un type d'activité
2. Naviguer dans le temps avec le sélecteur de date
3. Cliquer sur les cartes pour voir les détails
4. Utiliser les filtres pour affiner l'affichage

## 🔧 Développement

### Ajouter une nouvelle fonctionnalité
1. **Créer le composant** dans `components/`
2. **Ajouter la page** dans `pages/` si nécessaire
3. **Mettre à jour le store** si besoin d'état
4. **Tester** sur desktop, tablet et mobile

### Modifier un composant existant
1. **Maintenir la compatibilité** de l'API
2. **Tester** dans les deux vues
3. **Mettre à jour la documentation**

### Bonnes pratiques
- **Composants réutilisables** : Créer des composants génériques
- **Gestion d'état centralisée** : Utiliser le store
- **Performance** : Utiliser le cache pour les données
- **Accessibilité** : Respecter les standards WCAG

## 📊 Données et API

### Endpoints utilisés
- `/api/workers.php` : Liste des membres de l'équipe
- `/api/activities.php` : Activités et responsabilités
- `/api/tasks.php` : Tâches par activité

### Structure des données
```javascript
// Activité
{
    id: 123,
    name: "Nom de l'activité",
    type: "tech",
    description: "Description...",
    responsible: [...], // IDs des responsables
    tasks: [...]        // IDs des tâches
}

// Responsable
{
    id: 456,
    initials: "EF",
    displayname: "Étienne"
}

// Tâche
{
    id: 789,
    name: "Nom de la tâche",
    activity_id: 123,
    assignments: [...]  // Affectations
}
```

## 🔍 Dépannage

### Problèmes courants
1. **Données non chargées** : Vérifier la connexion API
2. **Cache obsolète** : Vider le cache navigateur
3. **Affichage incorrect** : Vérifier les styles CSS
4. **Performance lente** : Vérifier les requêtes API

### Logs et débogage
- **Console navigateur** : Erreurs JavaScript
- **Network** : Requêtes API et temps de réponse
- **Store** : État de l'application dans la console

## 📝 Maintenance

### Tâches régulières
- **Mise à jour des données** : Vérifier la fraîcheur des données
- **Performance** : Surveiller les temps de chargement
- **Compatibilité** : Tester sur différents navigateurs
- **Documentation** : Maintenir à jour cette documentation 