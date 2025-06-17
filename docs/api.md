**Boutons d'action** :

➕ Créer nouvelle entrée
📝 Modifier (crée nouvelle version)
📅 Voir historique (toutes les versions)
⏰ Voyager dans le temps (état à une date)

Plus de bouton "Supprimer" → remplacé par "Archiver" (marque deprecated sans version current)


### Exemple de données

**Table activities** :

Prérequis :
- status : current, deprecated, delete
- index sur original_id pour faciliter le time travel

Time travel :
-- État au 15 janvier (une seule requête !)
SELECT * FROM roles_at_date 
WHERE created_at <= '2025-01-15'
AND status != 'deleted'  -- Exclut les supprimés
-- + logique pour prendre la dernière version

id | original_id | name           | status     | created_at
1  | 1          | "Jardinage"    | deprecated | 2025-01-10
2  | 1          | "Maraîchage"   | current    | 2025-01-12
3  | 2          | "Comptabilité" | current    | 2025-01-05

**Table tasks** :

id | original_id | activity_original_id | description    | status     | created_at
1  | 1          | 1                   | "Planter"      | deprecated | 2025-01-10
2  | 1          | 1                   | "Semer graines"| current    | 2025-01-11
3  | 2          | 2                   | "Faire bilan"  | current    | 2025-01-06

### Requête "état au 11 janvier"

SELECT * FROM tasks t1
WHERE t1.created_at <= '2025-01-11'
AND t1.created_at = (
    SELECT MAX(t2.created_at) 
    FROM tasks t2 
    WHERE t2.original_id = t1.original_id 
    AND t2.created_at <= '2025-01-11'
);

### Ce que ça fait étape par étape
t1 = première instance de la table (ligne qu'on examine)
t2 = deuxième instance de la même table (pour comparer)
Pour chaque ligne t1 :

### Garde seulement si created_at <= '2025-01-11'
Trouve la date MAX de toutes les versions du même original_id avant le 11 janvier
Garde seulement si c'est LA plus récente version

### Résultat au 11 janvier

id=2, "Semer graines", current, 2025-01-11  (version la plus récente de original_id=1)
id=3, "Faire bilan", current, 2025-01-06    (seule version de original_id=2)