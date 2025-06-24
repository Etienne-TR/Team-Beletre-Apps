# 🔧 Utilitaires (`modules/utils/`)

## 📊 Rôle et objectif

Le dossier `utils/` contient des **fonctions utilitaires réutilisables** qui fournissent des fonctionnalités communes à travers l'application. Ces modules sont spécialisés dans des tâches spécifiques et peuvent être importés indépendamment.

## 📋 Modules disponibles

### `message.js`
**Affichage de messages d'information et d'erreur**

```javascript
import { showMessage } from '../../../modules/utils/message.js';

// Afficher un message d'information
showMessage('Opération réussie !', 'info');

// Afficher un message d'erreur
showMessage('Une erreur est survenue', 'error');
```

**API :**
- `showMessage(message, type = 'info')` : Affiche un message temporaire
- **Types** : `'info'` (vert) ou `'error'` (rouge)
- **Durée** : 5 secondes puis disparition automatique

### `date.js`
**Formatage de dates en français**

```javascript
import { formatDate, formatDateLabel } from '../../../modules/utils/date.js';

// Format court : 01/06/2024
const shortDate = formatDate('2024-06-01');

// Format long : 1 juin 2024
const longDate = formatDateLabel('2024-06-01');
```

**API :**
- `formatDate(dateString)` : Format court (DD/MM/YYYY)
- `formatDateLabel(dateString)` : Format long avec mois en lettres

### `string-utils.js`
**Utilitaires pour les chaînes de caractères**

```javascript
import { truncateText, capitalizeFirst } from '../../../modules/utils/string-utils.js';

// Tronquer un texte
const shortText = truncateText('Texte très long...', 50);

// Capitaliser la première lettre
const capitalized = capitalizeFirst('hello world');
```

**API :**
- `truncateText(text, maxLength, suffix = '...')` : Tronque un texte
- `capitalizeFirst(text)` : Met en majuscule la première lettre
- `sanitizeHtml(text)` : Nettoie le HTML pour l'affichage

### `activity-formatter.js`
**Formatage des noms d'activités**

```javascript
import { 
    formatActivityName, 
    formatTypeName,
    formatActivityNameEscaped 
} from '../../../modules/utils/activity-formatter.js';

// Formater un nom d'activité complet
const formatted = formatActivityName({
    activity_name: 'Mon activité',
    activity_type: 'pôle',
    icon: '🏢'
});
// Résultat : "🏢 Pôle Mon activité"

// Formater juste le type
const type = formatTypeName('pôle'); // "Pôle"
```

**API :**
- `formatActivityName(activity)` : Nom complet avec icône et type
- `formatTypeName(rawType)` : Type formaté (première lettre majuscule)
- `formatActivityNameEscaped(activity)` : Alias pour compatibilité

### `activity-description.js`
**Gestion des descriptions d'activités**

```javascript
import { 
    formatActivityDescription,
    truncateActivityDescription,
    formatDescriptionForCard 
} from '../../../modules/utils/activity-description.js';

// Formater une description
const formatted = formatActivityDescription('Description brute');

// Tronquer pour l'affichage
const truncated = truncateActivityDescription('Description très longue...', 150);

// Format pour carte
const cardDesc = formatDescriptionForCard('Description', false);
```

**API :**
- `formatActivityDescription(description)` : Nettoie et formate
- `truncateActivityDescription(description, maxLength, suffix)` : Tronque avec suffixe
- `formatDescriptionForCard(description, showFull)` : Format optimisé pour cartes

## 🔗 Comment utiliser

### Import simple
```javascript
import { showMessage } from '../../../modules/utils/message.js';
```

### Import multiple
```javascript
import { 
    formatDate, 
    formatDateLabel 
} from '../../../modules/utils/date.js';
```

### Import avec alias
```javascript
import { showMessage as displayMessage } from '../../../modules/utils/message.js';
```

## 📝 Conventions

### Nommage
- **Fichiers** : `kebab-case.js` (ex: `activity-formatter.js`)
- **Fonctions** : `camelCase` (ex: `formatActivityName`)
- **Constantes** : `UPPER_SNAKE_CASE` (ex: `DEFAULT_TIMEOUT`)

### Documentation
Chaque fonction doit être documentée avec JSDoc :
```javascript
/**
 * Description de la fonction
 * @param {string} param1 - Description du paramètre
 * @param {number} param2 - Description du paramètre
 * @returns {string} Description du retour
 * @example
 * const result = functionName('test', 42);
 */
```

### Gestion d'erreurs
- **Validation** : Vérifier les paramètres d'entrée
- **Fallbacks** : Valeurs par défaut pour les cas d'erreur
- **Messages** : Messages d'erreur explicites

## 🔄 Ajouter un nouvel utilitaire

1. **Créer le fichier** : `nouvel-utilitaire.js`
2. **Exporter les fonctions** : Utiliser `export function` ou `export { }`
3. **Documenter** : Ajouter JSDoc pour chaque fonction
4. **Tester** : Vérifier dans différents contextes
5. **Mettre à jour ce README** : Ajouter la documentation

## 📊 Bonnes pratiques

- **Simplicité** : Une fonction = une responsabilité
- **Réutilisabilité** : Fonction utilisable dans plusieurs contextes
- **Performance** : Éviter les calculs coûteux
- **Compatibilité** : Maintenir la compatibilité des API existantes 