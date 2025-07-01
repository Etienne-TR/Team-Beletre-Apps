# 📁 Dossier `shared/`

## 📊 Rôle et objectif

Le dossier `shared/` contient les **ressources communes** utilisées par toutes les pages de l'application Team Apps. Ces fichiers fournissent l'infrastructure de base et les styles globaux.

## 📋 Contenu du dossier

### `style.css`
- **Rôle** : Styles CSS communs à toute l'application
- **Contenu** : 
  - Variables CSS (couleurs, espacements, typographie)
  - Reset CSS et styles de base
  - Layouts communs
  - Classes utilitaires
- **Utilisation** : Importé dans toutes les pages HTML

### `app-header.css`
- **Rôle** : Styles du bandeau d'en-tête des applications
- **Contenu** :
  - Styles de l'en-tête avec gradient vert
  - Composants : titre, info utilisateur, boutons retour
  - Design responsive (mobile-first)
  - Animations et transitions
- **Utilisation** : Importé dans toutes les pages avec en-tête

### `api-client.js`
- **Rôle** : Client API et fonctions d'authentification communes
- **Fonctions principales** :
  - `apiCall()` : Appels API génériques
  - `apiRequest()` : Appels API avec gestion d'erreur robuste
  - `checkAuth()` : Vérification d'authentification centralisée
- **Utilisation** : Client API pour toutes les applications

## 🔗 Comment utiliser

### Import CSS
```html
<link rel="stylesheet" href="../../shared/style.css">
<link rel="stylesheet" href="../../shared/app-header.css">
```

### Import JavaScript
```javascript
// Dans les modules ES6
import { apiRequest, checkAuth } from '../../../shared/api-client.js';
```

## 🎨 Conventions

- **CSS** : Classes en kebab-case (ex: `app-header`, `user-info`)
- **JavaScript** : Fonctions en camelCase (ex: `apiRequest`, `checkAuth`)
- **Responsive** : Mobile-first avec breakpoints 768px et 480px
- **Couleurs** : Palette verte (#2e7d32, #4caf50) pour la cohérence

## 📱 Responsive Design

Les styles sont conçus pour être responsive :
- **Desktop** : Layout horizontal avec flexbox
- **Tablet** (≤768px) : Layout vertical centré
- **Mobile** (≤480px) : Stack vertical complet

## 🔄 Maintenance

- **Ajout de styles** : Préférer `style.css` pour les styles globaux
- **Composants spécifiques** : Créer des fichiers séparés si nécessaire
- **JavaScript** : Garder `api-client.js` pour l'infrastructure API, pas la logique métier 