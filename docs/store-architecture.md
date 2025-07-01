# 🏗️ Architecture du Store Centralisé

## 📋 Vue d'ensemble

Store centralisé unique pour l'ensemble des applications et modules, gestion des états de l'interface (filtres en particulier) et des données structurées récupérées par l'api (mise à jour par pull périodique).

## 🎯 Choix techniques

### **1. Store unique centralisé**
- ✅ Un seul store pour l'ensemble des applications et modules
- ✅ Organisation par sections : applications (responsibilities, decisions, etc.), vues d'applications (individual, global, etc.) et modules (ui, utils, etc.)

### **2. Synchronisation automatique**
- ✅ UI mise à jour immédiatement
- ✅ Synchronisation automatique entre les vues d'applications
- ✅ Pas de redondance dans l'état

## 🏗️ Structure du store

### **Organisation hiérarchique : Applications, Modules et Vues**

Les données brutes comme les autres états (états des filtres, états d'affichage des cartes, etc.) sont également des états à l'intérieur du store.

```
store.state
├── user                    # État global partagé
├── currentApp             # Application active
├── responsibilities       # Application responsibilities
│   ├── activities        # Données brutes
│   ├── workers           # Données brutes
│   ├── year              # État partagé entre vues
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

### **Exemples d'états simples**

**✅ États de l'interface :**

Par exemple pour l'application responsibilities: 
- `selectedYear: '2025'`
- `selectedWorker: 'Joëlle'`
- `expandedCards: ['card-1', 'card-3']`
- `loading: false`



### **Principes d'organisation**

1. **Applications** : Chaque application a sa propre section (`responsibilities`, `decisions`, etc.)
2. **Vues d'applications** : Chaque application peut avoir plusieurs vues (`individual`, `global`, etc.)
3. **Modules partagés** : Modules utilisés par toutes les applications (`ui`, `utils`, etc.)
4. **État partagé ou spécifique** : dépend de la place de l'état dans la hiérarchie du store, possibilité pour chaque composent de s'abonner ou non à un état

## 🔄 Actions et getters sur les états du store

### **Actions pour les données**

Les actions pour les données permettent de modifier les états des données brutes du store.

La fonction `setActivities` remplace complètement la liste des activités par de nouvelles données, généralement utilisée lors du chargement initial depuis l'API.

La fonction `addActivity` ajoute une nouvelle activité à la liste existante, utile lors de la création d'une nouvelle activité par l'utilisateur.

La fonction `updateActivity` modifie une activité existante en appliquant les changements spécifiés, permettant la mise à jour partielle des données.

### **Actions pour les filtres**

Les actions pour les filtres gèrent les sélections de l'utilisateur qui déterminent quelles données afficher.

La fonction `selectYear` définit l'année sélectionnée pour filtrer les activités, permettant à l'utilisateur de naviguer entre différentes périodes.

La fonction `selectType` filtre les activités par type, offrant une vue catégorisée des responsabilités.

La fonction `selectPerson` sélectionne une personne spécifique pour afficher uniquement ses activités, facilitant la vue individuelle des responsabilités.

### **Getters pour les calculs**

Les getters effectuent des calculs dynamiques sur les données brutes du store.

La fonction `getFilteredActivities` combine les activités avec les filtres actifs pour retourner une liste filtrée selon l'année et le type sélectionnés.

La fonction `getActivitiesByPerson` filtre les activités pour une personne spécifique tout en respectant le filtre d'année actuel.

La fonction `getAvailableYears` extrait automatiquement toutes les années disponibles dans les données pour peupler les sélecteurs d'interface utilisateur.

## 🎯 Utilisation dans les composants

### **S'abonner aux changements**

Les composants s'abonnent aux changements du store pour être automatiquement notifiés lorsque les données évoluent. Cette approche garantit que l'interface utilisateur reste synchronisée avec l'état de l'application sans nécessiter de mises à jour manuelles. Lorsqu'un composant s'abonne à une section du store, il reçoit une notification à chaque modification, lui permettant de recalculer les données dérivées et de rafraîchir son affichage en conséquence.

### **Déclencher des changements**

Les composants déclenchent des changements en appelant les actions appropriées du store. Ces actions modifient l'état centralisé, ce qui déclenche automatiquement la mise à jour de tous les composants abonnés aux sections concernées. Cette architecture permet une synchronisation transparente entre les différentes vues de l'application, où une modification dans une vue se propage instantanément vers toutes les autres vues utilisant les mêmes données.

## 🔄 Synchronisation automatique

### **Avantage principal**
```javascript
// 1. Modification dans une vue
addActivity({ id: 1, name: 'Nouvelle activité', year: '2025' });

// 2. Résultat automatique :
// → Toutes les vues qui utilisent les activités sont mises à jour
// → global-view affiche la nouvelle activité
// → individual-view met à jour les statistiques
// → Pas de code supplémentaire nécessaire
```

## 📁 Organisation des fichiers

```
modules/
├── store/
│   ├── store.js              # Store principal
│   ├── responsibilities.js   # Actions responsibilities
│   ├── decisions.js          # Actions decisions (futur)
│   └── ui.js                 # Actions UI
```

## 🎯 Avantages de cette architecture

### **1. Simplicité**
- ✅ Un seul store à comprendre
- ✅ Pas de redondance dans l'état
- ✅ Calculs automatiques

### **2. Performance**
- ✅ Calculs à la demande
- ✅ Pas de rechargements inutiles
- ✅ Synchronisation automatique

### **3. Maintenabilité**
- ✅ Code centralisé
- ✅ Actions réutilisables
- ✅ Debugging facilité

### **4. Évolutivité**
- ✅ Facile d'ajouter de nouvelles apps
- ✅ Patterns cohérents
- ✅ Extensible avec middleware


## 🚀 Fonctionnalités à ajouter plus tard

Cette section liste les fonctionnalités avancées qui pourront être ajoutées progressivement selon les besoins.


### **Synchronisation temps réel**

#### **Server-Sent Events (SSE)**

Temps réel Serveur -> Client

Unidirectionnel, limitation qui nécessite gestion conflits de version entre les différents clients

SSE plutôt que websocket car disponible sur serveur php/mysql alors que websock nécessite un serveur dédié (voir quand meme si ouvaton.coop propose ce service ?)


### **Cache intelligent**
- Cache automatique pour les getters coûteux
- Invalidation intelligente du cache
- Optimisation des performances

### **Mise à jour optimiste**
- UI mise à jour immédiatement
- Rollback automatique en cas d'erreur API
- Gestion des conflits de données

### **Persistance et synchronisation**
- Sauvegarde automatique en localStorage
- Synchronisation temps réel (WebSocket)
- Gestion hors ligne (localStorage + interface adaptée, file d'attente des actions, résolution des conflits, indicateurs de statut)

### **Outils de debugging**
- Middleware de logging
- Time travel debugging
- Inspection de l'état en temps réel

### **Optimisations avancées**
- Lazy loading des données
- Mémoisation des calculs coûteux
- Gestion de la mémoire

### **Critères d'ajout**
- Ajouter uniquement quand nécessaire
- Maintenir la simplicité
- Tester chaque fonctionnalité
- Documenter les changements 

# Architecture du Store - Application Responsabilités

## 🎯 Vue d'ensemble

Le store centralise l'état de l'application Responsabilités et permet la synchronisation automatique entre les différentes vues (individual-view et global-view).

## 📊 Structure de l'état

```javascript
{
    user: null,                    // Utilisateur connecté
    currentApp: 'responsibilities', // Application active
    
    responsibilities: {
        date: '2024-06-15',        // Date sélectionnée (partagée)
        
        individual: {
            selectedWorker: null,   // Travailleur sélectionné
            responsibilityFilter: 'all',
            expandedCards: []       // Cartes dépliées
        },
        
        global: {
            selectedActivityType: null,
            expandedCards: []       // Cartes dépliées
        }
    }
}
```

## 🔄 Actions principales

### **Gestion de la date**
```javascript
import { setDate, getDate } from './store/responsibilities.js';

// Changer la date sélectionnée
setDate('2024-06-15');

// Récupérer la date actuelle
const currentDate = getDate(); // '2024-06-15'
```

### **Synchronisation automatique**
Quand la date change dans une vue, toutes les autres vues sont automatiquement mises à jour grâce au système de callbacks du sélecteur de date.

## 🎨 Interface utilisateur

### **Sélecteur de date dynamique**
Le nouveau sélecteur de date remplace l'ancien sélecteur d'année statique :

- **Navigation par année** : Boutons ← et → pour naviguer entre les années
- **Affichage de la date** : Bouton central affichant la date actuelle (DD/MM/YYYY)
- **Sélection précise** : Clic sur le bouton central ouvre un calendrier natif
- **Valeur par défaut** : Aujourd'hui

### **Comportement**
- La navigation par année garde le jour et le mois, change seulement l'année
- Le calendrier permet une sélection précise de n'importe quelle date
- Toutes les vues se synchronisent automatiquement

## 🔧 Utilisation dans les composants

### **S'abonner aux changements de date**
```javascript
import { onDateChange } from '../components/date-selector.js';

onDateChange((newDate, formattedDate) => {
    console.log('Date changée:', formattedDate);
    // Recharger les données pour la nouvelle date
    await loadDataForDate(formattedDate);
});
```

### **Initialisation**
```javascript
import { initDateSelector } from '../components/date-selector.js';

// Initialiser avec aujourd'hui par défaut
initDateSelector();

// Ou avec une date spécifique
initDateSelector('2024-06-15');
```

## 🎯 Avantages du nouveau système

1. **Flexibilité** : Sélection de n'importe quelle date, pas seulement des années
2. **UX améliorée** : Interface intuitive avec navigation et calendrier
3. **Synchronisation** : Toutes les vues restent synchronisées automatiquement
4. **Performance** : Chargement dynamique des données par année
5. **Maintenabilité** : Code centralisé et réutilisable

## 🔄 Migration depuis l'ancien système

### **Ancien système (déprécié)**
```javascript
// Ancien sélecteur d'année statique
<button data-date="2024-06-01">2024</button>
<button data-date="2025-06-01">2025</button>
<button data-date="2026-06-01">2026</button>
```

### **Nouveau système**
```javascript
// Nouveau sélecteur de date dynamique
<div class="date-selector">
    <button id="prevYearBtn">←</button>
    <button id="currentDateBtn">15/06/2024</button>
    <button id="nextYearBtn">→</button>
</div>
```

Les anciennes fonctions `setYear()` et `getYear()` sont encore disponibles mais marquées comme dépréciées pour assurer la compatibilité. 