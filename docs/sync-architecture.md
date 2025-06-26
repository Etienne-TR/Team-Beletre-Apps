# 🔄 Architecture de Synchronisation Base ↔ Client

## 📋 Vue d'ensemble

Architecture de synchronisation bidirectionnelle entre la base de données et le client, permettant la persistance des modifications et la détection des changements externes.

## 🎯 Choix techniques

### **1. Synchronisation serveur → client**
- ✅ **Polling périodique avec condition** : Vérification de timestamp avant rechargement
- ✅ **Efficacité réseau** : Requêtes légères de vérification
- ✅ **Détection fiable** : Pas de perte de modifications externes

### **2. Synchronisation client → serveur**
- ✅ **Actions hybrides** : Mise à jour store + persistance en base
- ✅ **Mise à jour optimiste** : UI réactive immédiatement
- ✅ **Gestion d'erreur** : Rollback automatique en cas d'échec

### **3. Gestion des versions**
- ✅ **Versioning non-destructif** : Création de nouveaux enregistrements
- ✅ **Pas de conflits** : Chaque modification crée une nouvelle version
- ✅ **Historique complet** : Traçabilité des modifications

## 🏗️ Architecture de synchronisation

Le client et le serveur communiquent via des actions asynchrones orchestrées par le middleware.

Côté client, les actions utilisateur déclenchent des modifications du store et des appels API simultanés.

Le serveur traite ces requêtes en appliquant le versioning non-destructif et retourne les nouvelles données avec leurs métadonnées.

En parallèle, le client effectue des vérifications périodiques pour détecter les modifications externes, utilisant des timestamps optimisés pour minimiser les échanges réseau. Cette architecture garantit une synchronisation transparente tout en maintenant la réactivité de l'interface utilisateur.


## 🔄 Synchronisation Serveur → Client

### **Polling périodique avec condition**

Le système vérifie périodiquement si les données ont changé avant de procéder au rechargement. Cette approche utilise une requête légère qui récupère uniquement le timestamp de dernière modification de la base de données. Si ce timestamp est plus récent que celui stocké localement, le système recharge les données complètes. Sinon, aucune action n'est effectuée, économisant ainsi la bande passante et les ressources.

### **Gestion des timestamps**

Mémoire en base de données dans la table :

table_last_modifications
- table_name (clé primaire)
- last_update (now)

Triggers sur les tables pour renseigner les timesamp de table_last_modifications



## 🔄 Synchronisation Client → Serveur

**Capture des actions par middleware**

Le middleware écoute le store. Un filtre est appliqué sur les actions du store pour intercepter uniquement les actions de type create ou update.

Le middleware mène les actions suivantes :
1. Appel API de persistance
2. Gestion d'erreur + rollback du store si échec
3. Notifications utilisateur

**Cas d'échec réels :**
- Erreurs réseau (timeout, connexion perdue)
- Erreurs d'authentification (token expiré, permissions)
- Erreurs de validation (données invalides, contraintes)
- Erreurs serveur (500, base indisponible)
- Erreurs de sérialisation (format incompatible)

**Pas de conflits grâce au versioning non-destructif :**
✅ Chaque modification = nouvelle version
✅ Pas de suppression physique
✅ Timestamps identiques gérés par numéro de version
✅ Dernière écriture "gagne" automatiquement

Versionning non-destructif pour les tables de contenu d'applications mais pas pour les données personneles (données utilisateurs) ou les données d'administration (configuration serveurs, gestion des accès).

Les rôles (lecteur:list, éditeur:list) sont dans un table de contenu ? Plutôt oui. list = liste des applications ? de vues ? des modules ? Je dirais liste des applications.

## 🎯 Gestion des versions non-destructives

### **Avantages du versioning non-destructif**

Le système de versioning non-destructif élimine les conflits de synchronisation en créant systématiquement de nouveaux enregistrements lors des modifications. Cette approche garantit un historique complet des changements et permet des rollbacks vers des versions précédentes. L'absence de conflits simplifie considérablement la logique de synchronisation et améliore la fiabilité du système.

### **Implémentation côté serveur**

Lors d'une mise à jour, le système marque d'abord l'ancienne version comme obsolète, puis crée un nouvel enregistrement avec un numéro de version incrémenté. Cette opération s'effectue dans une transaction pour garantir l'intégrité des données. Un système d'audit enregistre chaque modification pour assurer la traçabilité complète des changements.

## 📊 Métriques de performance

### **Requête de vérification (légère)**

La requête de vérification récupère uniquement le timestamp de dernière modification de la table concernée. Cette opération s'exécute en quelques millisecondes et génère un trafic réseau minimal, de l'ordre de quelques dizaines d'octets. Elle s'exécute périodiquement, typiquement toutes les trente secondes.

### **Requête de rechargement (lourde)**

La requête de rechargement récupère l'ensemble des données actuelles de la table. Cette opération plus coûteuse s'exécute uniquement lorsque des changements sont détectés, optimisant ainsi l'utilisation des ressources réseau et serveur.

## 🚀 Plan d'implémentation

### **Phase 1 : Infrastructure de base**

La première phase consiste à ajouter les champs de timestamp aux tables de la base de données, créer l'endpoint de vérification de dernière modification dans l'API, et implémenter le mécanisme de polling côté client. Cette infrastructure de base permet la détection des changements externes.

### **Phase 2 : Actions hybrides**

La deuxième phase modifie les actions du store pour inclure la persistance automatique en base de données. Cette étape ajoute la gestion d'erreur avec rollback automatique et teste la synchronisation bidirectionnelle complète.

### **Phase 3 : Optimisations**

La troisième phase améliore l'expérience utilisateur en ajoutant des indicateurs de chargement, implémente une gestion robuste des erreurs réseau, et optimise les requêtes de vérification pour de meilleures performances.

## 🎯 Avantages de cette architecture

### **1. Simplicité**
- ✅ Polling conditionnel simple à comprendre et maintenir
- ✅ Actions hybrides transparentes pour les développeurs
- ✅ Absence de gestion de conflits complexe grâce au versioning non-destructif

### **2. Performance**
- ✅ Vérifications légères qui économisent les ressources
- ✅ Rechargement conditionnel qui évite les transferts inutiles
- ✅ Mise à jour optimiste qui améliore la réactivité de l'interface

### **3. Fiabilité**
- ✅ Versioning non-destructif qui élimine les conflits
- ✅ Rollback automatique qui garantit la cohérence des données
- ✅ Détection fiable des changements externes

### **4. Évolutivité**
- ✅ Facilité d'ajout de nouvelles tables à synchroniser
- ✅ Extensibilité vers des solutions temps réel (SSE, WebSocket)
- ✅ Patterns cohérents et réutilisables

---

## 📝 Notes techniques

- **Intervalle de polling** : Trente secondes par défaut, ajustable selon les besoins et la fréquence des modifications
- **Gestion d'erreur** : Reconnexion automatique en cas d'échec temporaire du réseau
- **Notifications** : Indicateurs discrets pour informer l'utilisateur des mises à jour
- **Performance** : Monitoring continu des temps de réponse et optimisation progressive 