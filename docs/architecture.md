team-apps/
├── index.html (dashboard)
├── shared/
│   ├── style.css
│   └── common.js
├── api/(CRRUD : Create , Read current, Read past ,  Update , Delete)
│   ├── auth.php
│   ├── config.php
│   ├── responsibilities/
│   │   ├── activities_type.php (CRRUD pôle, atelier, mandat, projet)
│   │   ├── activities.php (CRRUD activités)
│   │   ├── tasks.php (CRRUD tâches)
│   │   ├── responsible_for.php (CRRUD responsables)
│   │   ├── assigned_to.php (CRRUD affectations des tâches)
│   │   └── audit.php (historique des changements)
│   └── decisions/
│       ├── decisions.php
│       └── approvals.php
├── responsibilities/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── decisions/
    ├── index.html
    ├── style.css
    └── script.js