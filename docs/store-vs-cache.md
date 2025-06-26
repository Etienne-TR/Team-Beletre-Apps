# Store vs Cache

## Store (état réactif)

Store centralisé /store

- États de l'interface et de l'application (ex : worker sélectionné, année, loading, filtres, cartes dépliées)
- Structure hiérarchique par application et vue
- Réactif : tout changement déclenche une mise à jour de l'UI ou une action
- Source de vérité pour l'état courant, partagé entre composants

**Arborescence :**
```
store.state
├── user                    # Utilisateur connecté
├── currentApp             # Application active
├── responsibilities       # App responsibilities
│   ├── selectedYear       # Année sélectionnée
│   ├── individual        # Vue individual
│   │   ├── selectedWorker    # Worker sélectionné
│   │   ├── selectedYear      # Année sélectionnée
│   │   └── loading           # État de chargement
│   └── global            # Vue global
│       ├── selectedActivityType
│       └── loading
└── admin             # App Admin
```

## Cache (optimisation et persistance)

Cache centralisé /cache

- Données API, résultats de calculs coûteux, ou états persistants pour l'UX
- Organisé par namespaces (api, computed, ui…)
- Utilisé pour éviter les appels API redondants ou restaurer l'expérience utilisateur
- Non réactif par défaut

**Mise à jour automatique :** Le cache API est mis à jour automatiquement et périodiquement. La routine vérifie la table `table_last_modifications` et invalide/met à jour le cache si le timestamp de modification des tables concernées est plus récent que maintenant. Cette logique de mise à jour est incluse dans le module `/cache` pour centraliser toute la gestion du cache.

**Arborescence :**
```
cache
├── api/                  # Données API
│   ├── responsibilities/
│   │   ├── individual/   # Vue individual
│   │   │   ├── workers-2025-06-01
│   │   │   ├── activities-123-2025-responsibilities
│   │   │   └── activities-123-2025-tasks
│   │   └── global/       # Vue global
│   │       └── global-view-2025-06-01
│   ├── admin/
│   │   ├── users-list
│   │   └── settings
│   └── auth/
│       └── current-user
├── computed/             # Calculs dérivés
│   ├── stats-2025
│   ├── workload-matrix-2025
│   └── filtered-activities-2025-tech
└── ui/                   # États persistants
    ├── selected-worker       # Sauvegardé par le store
    ├── selected-year         # Sauvegardé par le store
    ├── expanded-cards        # Géré par les composants
    ├── user-preferences      # Préférences globales
    └── navigation-state      # État de navigation
```

## Persistance d'états du store
- Certains états du store (ex : worker sélectionné, année, filtres) peuvent être persistés dans le cache pour être restaurés après rechargement
- Cette persistance est automatisée par des listeners du store : à chaque changement, le listener copie l'état dans le cache ; au démarrage, le store restaure ces états depuis le cache si besoin

## Résumé
- **Store** = états réactifs, logique métier, synchronisation UI
- **Cache** = optimisation, persistance, restauration UX
- **Une seule source de vérité** pour chaque donnée ; la persistance est automatisée si nécessaire par les listeners du store 