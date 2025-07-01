# Cartes d'activités dépliables

## Fonctionnalité

Les cartes d'activités dans l'éditeur d'activités sont maintenant cliquables et dépliables. Lorsqu'on clique sur une carte, elle s'étend pour afficher la liste des responsables de l'activité.

## Fonctionnement

### Interaction utilisateur
- **Clic sur une carte** : Déplie/réduit la carte pour afficher les responsables
- **Clic sur les boutons d'action** : N'affecte pas l'état de la carte (évite la propagation)
- **Animation fluide** : Transition douce lors du dépliage/réduction

### Chargement des données
- Les responsables sont chargés à la demande (lazy loading)
- Utilisation de l'API `editor.php` avec l'action `get_responsible_for`
- Indicateur de chargement pendant la récupération des données
- Gestion des erreurs avec affichage de messages appropriés

### Affichage des responsables
- Liste triée par date de début de responsabilité
- Affichage du nom du responsable et de sa période de responsabilité
- Format de date lisible (utilise `formatDateLabel`)
- État vide si aucun responsable n'est assigné

## Implémentation technique

### JavaScript
- **Fonction `createActivityCard`** : Crée une carte avec contenu dépliable
- **Fonction `toggleResponsiblesDisplay`** : Gère l'expansion/réduction
- **Fonction `loadResponsiblesForCard`** : Charge les responsables via API
- **Fonction `createResponsibleCardItem`** : Crée l'affichage d'un responsable

### CSS
- **Styles `.activity-card`** : Apparence de base avec hover et états étendus
- **Animation `slideDown`** : Animation fluide pour le contenu dépliable
- **Responsive design** : Adaptation mobile pour les cartes dépliables

### API
- **Endpoint** : `editor.php?action=get_responsible_for`
- **Paramètres** : `activity` (ID de l'activité), `date` (date de référence)
- **Réponse** : Liste des responsables avec leurs périodes

## Utilisation

1. Ouvrir l'éditeur d'activités (`editor.html`)
2. Cliquer sur une carte d'activité
3. La carte se déplie et affiche les responsables
4. Cliquer à nouveau pour réduire la carte

## Avantages

- **Interface intuitive** : Interaction naturelle par clic
- **Performance** : Chargement à la demande des données
- **Responsive** : Fonctionne sur mobile et desktop
- **Accessible** : Gestion des erreurs et états vides
- **Maintenable** : Code modulaire et bien structuré 