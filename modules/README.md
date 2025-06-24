# 📦 Dossier `modules/`

## 📊 Rôle et objectif

Le dossier `modules/` contient des **modules ES6 réutilisables** organisés par catégorie fonctionnelle. Ces modules fournissent des fonctionnalités spécialisées qui peuvent être importées dans n'importe quelle page de l'application.

## 🏗️ Architecture

```
modules/
├── utils/           # Utilitaires et fonctions helper
│   ├── message.js
│   ├── date.js
│   ├── string-utils.js
│   ├── activity-formatter.js
│   └── activity-description.js
└── ui/              # Composants d'interface utilisateur
    ├── app-header.js
    ├── badges.js
    ├── loading.js
    └── emptyState.js
```

## 📁 Organisation des sous-dossiers

### `utils/` - Utilitaires
Fonctions helper et utilitaires réutilisables :

- **`message.js`** : Affichage de messages d'information/erreur
- **`date.js`** : Formatage de dates en français
- **`string-utils.js`** : Utilitaires pour les chaînes de caractères
- **`activity-formatter.js`** : Formatage des noms d'activités
- **`activity-description.js`** : Gestion des descriptions d'activités

### `ui/` - Composants d'interface
Composants JavaScript réutilisables pour l'interface :

- **`app-header.js`** : Gestion de l'en-tête avec boutons retour
- **`badges.js`** : Création de badges (responsables, affectations)
- **`loading.js`** : Gestion des états de chargement
- **`emptyState.js`** : États vides et messages d'information

## 🔗 Comment utiliser

### Import d'un module
```javascript
// Import d'un utilitaire
import { showMessage } from '../../../modules/utils/message.js';
import { formatDate } from '../../../modules/utils/date.js';

// Import d'un composant UI
import { initializeBackButtons } from '../../../modules/ui/app-header.js';
import { createResponsibleBadge } from '../../../modules/ui/badges.js';
```

### Import multiple
```javascript
import { 
    formatActivityNameEscaped, 
    formatTypeName 
} from '../../../modules/utils/activity-formatter.js';
```

## 📝 Conventions de développement

### Nommage des fichiers
- **Utils** : `kebab-case.js` (ex: `activity-formatter.js`)
- **UI** : `kebab-case.js` (ex: `app-header.js`)
- **Fonctions exportées** : `camelCase` (ex: `formatActivityName`)

### Structure d'un module
```javascript
/**
 * Description du module
 */

/**
 * Description de la fonction
 * @param {string} param - Description du paramètre
 * @returns {string} Description du retour
 */
export function functionName(param) {
    // Implémentation
}

// Export multiple
export {
    function1,
    function2
};
```

## 🎨 Intégration avec l'interface

### CSS associé
- Les modules UI peuvent avoir des styles CSS associés
- Les styles sont importés dans les pages HTML
- Exemple : `app-header.js` utilise les styles de `shared/app-header.css`

### Responsive Design
- Les modules respectent le design responsive
- Breakpoints : 768px (tablet) et 480px (mobile)
- Adaptation automatique selon la taille d'écran

## 🔄 Maintenance et évolution

### Ajouter un nouveau module
1. Créer le fichier dans le bon sous-dossier
2. Exporter les fonctions avec `export`
3. Documenter l'API du module
4. Tester l'import dans une page

### Modifier un module existant
1. Maintenir la compatibilité des exports
2. Mettre à jour la documentation si nécessaire
3. Tester les pages qui utilisent le module

### Bonnes pratiques
- **Réutilisabilité** : Un module doit être utilisable dans plusieurs contextes
- **Simplicité** : Préférer des fonctions simples et spécialisées
- **Documentation** : Commenter les fonctions complexes
- **Tests** : Tester les modules dans différents contextes 