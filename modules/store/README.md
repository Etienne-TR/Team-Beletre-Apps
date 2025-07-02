# 🏪 Store global

Store global pour l'ensemble des applications.

Remarque, si des états doivent être mis en cache pour avoir de la persistence, c'est de la responsabilité du store. Il n'y a pour l'instant pas d'état concerné.

## Architecture du store

Le store global (`store.js`) contient uniquement les états partagés entre toutes les applications (utilisateur, application active). Chaque application gère son propre état via des fichiers dédiés (ex: `responsibilities.js`) qui initialisent et manipulent leur état dans le store global. Cette approche permet un accès partagé aux données tout en maintenant une séparation claire des responsabilités.

### Usage dans les applications

Les applications importent le store global pour accéder aux données partagées et utilisent les fichiers d'état spécifiques pour leurs propres données :

```javascript
// Accès aux données globales
import { globalStore } from '/modules/store/store.js';
const user = globalStore.getUser();

// Accès aux données de l'application
import { setSelectedDate, getSelectedDate } from '/modules/store/responsibilities.js';
setSelectedDate('2024-01-15');
```

Remarque : en javascript, le premier import exectuté sert d'instanciation.

## États du store

```
globalStore.state
├── user                    # État global partagé
├── currentApp             # Application active
├── responsibilities       # Application responsibilities
│   ├── selectedDate       # Date sélectionnée
│   ├── selectedActivityType # Type d'activité sélectionné
│   ├── expandedActivityCard # ID de la carte d'activité dépliée
│   ├── individual         # Vue individual
│   │   ├── selectedWorker
│   │   └── responsibleForFilter
│   └── editor             # Vue editor
│       └── expandedTaskCard
```
