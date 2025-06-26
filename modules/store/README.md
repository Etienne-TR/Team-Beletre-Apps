# 🏪 Store Minimaliste - Responsibilities

Store centralisé pour l'ensemble des applications et modules avec gestion d'état simple et partagé.

## 📁 Structure des fichiers

```
modules/store/
├── store.js              # Store principal avec instance globale
├── responsibilities.js   # Actions et getters pour responsibilities
├── example-usage.js      # Exemples d'utilisation
└── README.md            # Cette documentation
```

## 🎯 État du store

### **Organisation hiérarchique**

```
appStore.state
├── user                    # État global partagé
├── currentApp             # Application active
├── responsibilities       # Application responsibilities
│   ├── year              # État partagé entre vues de l'application
│   ├── individual        # Vue individual
│   │   ├── selectedWorker
│   │   ├── responsibilityFilter
│   │   └── expandedCards
│   ├── global            # Vue global
│   │   ├── selectedActivityType
│   │   └── expandedCards
│   └── loading           # UI de l'application
├── decisions             # Application decisions (futur)
├── ui                    # Module UI partagé
└── utils                 # Module utils partagé
```

### **État responsibilities (application)**

**État partagé entre vues :**
- `year`: Année sélectionnée (partagée entre individual et global)

**État individual-view :**
- `selectedWorker`: ID du worker sélectionné
- `responsibilityFilter`: Filtre de responsabilité ('all', 'responsible', 'other')
- `expandedCards`: Liste des IDs des cartes dépliées

**État global-view :**
- `selectedActivityType`: Type d'activité sélectionné
- `expandedCards`: Liste des IDs des cartes dépliées

## 🚀 Utilisation rapide

### **1. Importer le store**
```javascript
import { appStore } from '../../../modules/store/store.js';
import { 
    setYear, 
    selectWorker, 
    setResponsibilityFilter,
    expandCard,
    selectActivityType 
} from '../../../modules/store/responsibilities.js';
```

### **2. S'abonner aux changements**
```javascript
// S'abonner à l'année (partagée)
appStore.subscribe('responsibilities', (state) => {
    console.log('Année changée:', state.year);
    // Recharger les données
});

// S'abonner à la vue individual
appStore.subscribe('responsibilities.individual', (state) => {
    console.log('État individual:', state);
    // Mettre à jour l'UI
});
```

### **3. Déclencher des changements**
```javascript
// Changer l'année (partagée)
setYear('2024');

// Sélectionner un worker
selectWorker('worker-123');

// Changer le filtre de responsabilité
setResponsibilityFilter('responsible');

// Déplier une carte
expandCard('card-456');
```

## 🔄 Synchronisation automatique

L'année est partagée entre toutes les vues. Quand elle change dans une vue, toutes les autres sont automatiquement mises à jour :

```javascript
// Dans individual-view
setYear('2024');

// Résultat automatique :
// → global-view reçoit la notification
// → Toutes les vues utilisant l'année sont synchronisées
// → Pas de code supplémentaire nécessaire
```

## 📋 Actions disponibles

### **Actions partagées**
- `setYear(year)`: Change l'année sélectionnée
- `getYear()`: Récupère l'année actuelle

### **Actions individual-view**
- `selectWorker(workerId)`: Sélectionne un worker
- `setResponsibilityFilter(filter)`: Change le filtre ('all', 'responsible', 'other')
- `expandCard(cardId)`: Déplie une carte
- `collapseCard(cardId)`: Replie une carte
- `isCardExpanded(cardId)`: Vérifie si une carte est dépliée

### **Actions global-view**
- `selectActivityType(type)`: Sélectionne un type d'activité
- `expandGlobalCard(cardId)`: Déplie une carte (vue globale)
- `collapseGlobalCard(cardId)`: Replie une carte (vue globale)
- `isGlobalCardExpanded(cardId)`: Vérifie si une carte est dépliée

### **Getters**
- `getIndividualState()`: État complet de la vue individual
- `getGlobalState()`: État complet de la vue globale
- `getResponsibilitiesState()`: État complet des responsibilities

## 🎯 Avantages

### **1. Simplicité**
- ✅ Un seul store à comprendre
- ✅ Actions claires et explicites
- ✅ Pas de redondance dans l'état

### **2. Synchronisation automatique**
- ✅ UI mise à jour immédiatement
- ✅ Synchronisation entre vues
- ✅ Pas de code supplémentaire

### **3. Maintenabilité**
- ✅ Code centralisé
- ✅ Actions réutilisables
- ✅ Debugging facilité

## 🔧 Extension future

Le store est conçu pour être facilement extensible :

1. **Ajouter de nouvelles données** : Étendre l'état dans `store.js`
2. **Ajouter de nouvelles actions** : Créer de nouvelles fonctions dans `responsibilities.js`