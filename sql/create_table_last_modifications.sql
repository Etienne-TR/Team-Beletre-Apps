-- Création de la table pour gérer les timestamps de dernière modification
CREATE TABLE IF NOT EXISTS table_last_modifications (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL UNIQUE,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes par nom de table
CREATE INDEX IF NOT EXISTS idx_table_last_modifications_table_name ON table_last_modifications(table_name);

-- Insertion du premier enregistrement pour la table activities
INSERT INTO table_last_modifications (table_name, last_update) 
VALUES ('activities', CURRENT_TIMESTAMP)
ON CONFLICT (table_name) DO NOTHING;

-- Commentaire sur l'utilisation
-- Cette table est utilisée par l'architecture de synchronisation pour détecter
-- les modifications externes et optimiser les requêtes de polling.
-- Les triggers sur les autres tables mettront à jour le champ last_update
-- de cette table à chaque modification. 