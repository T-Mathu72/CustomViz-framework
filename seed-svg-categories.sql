-- ============================================================
--  Mise à jour des catégories et sous-catégories SVG
--  À exécuter dans l'éditeur SQL Supabase
-- ============================================================

-- 1. Colonnes
ALTER TABLE fonctions ADD COLUMN IF NOT EXISTS sous_categorie TEXT;
ALTER TABLE fonctions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'svg';

-- 2. Types
UPDATE fonctions SET type = 'svg'   WHERE type IS NULL OR type = 'dax' OR type = '';
UPDATE fonctions SET type = 'html'  WHERE categorie = 'HTML';
UPDATE fonctions SET type = 'deneb' WHERE categorie = 'Deneb';

-- 3. Copier categorie → sous_categorie pour tous les SVG
UPDATE fonctions
SET sous_categorie = categorie
WHERE type = 'svg';

-- 4. Remettre categorie à 'Table' par défaut pour les SVG Table
--    (ajustez selon vos besoins : Table / Card / Slicer)
UPDATE fonctions SET categorie = 'Table'
WHERE type = 'svg' AND categorie NOT IN ('Carte', 'Card');

UPDATE fonctions SET categorie = 'Card'
WHERE type = 'svg' AND categorie IN ('Carte', 'Card');

-- Vérification
-- SELECT nom, type, categorie, sous_categorie FROM fonctions WHERE type = 'svg' ORDER BY categorie, sous_categorie;
