
ES6 uniquement

Chemins d'imports ES6 ou autre :
- relatifs pour les imports internes aux applications
- chemins absolues pour /modules et /shared

## Store centralisé (gestion des états de l'interface)
utiliser uniquement /modules/store/store.js
et les états d'applications /modules/store/app-name.js

ne pas crée d'état à l'intérieur d'une application !

si besoin de nouveaux état :
- commun aux applications : /modules/store/store.js
- spécifique à l'application : /modules/store/app-name.