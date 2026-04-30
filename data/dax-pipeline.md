# Pipeline d'ingestion DAX

Ajouter rapidement des mesures DAX à la bibliothèque sans passer par l'UI.

## Workflow

1. **Toi** — Tu colles tes mesures brutes dans `data/dax-queue.dax` (fichier texte, **pas** JSON) :

   ```
   // HINT: barre horizontale rouge clair (facultatif)
   Jauge Basic Table =
   VAR Prod = MAX(...)
   RETURN "..."

   ---

   Mini KPI =
   VAR Val = MAX(...)
   RETURN "..."
   ```

   Règles :
   - DAX brut, **aucun échappement** (les `"` du DAX restent tels quels).
   - Séparateur : ligne contenant exactement `---` entre deux mesures.
   - Le nom est extrait de la ligne `Nom =`.
   - `// HINT: …` (avant un bloc) donne un indice de contexte facultatif.

2. **Moi (Claude)** — Tu me dis « malaxe le marsupial ». Je lis `data/dax-queue.dax` et je remplis `data/dax-processed.json` avec, pour chaque mesure :
   - `nom`, `type` (toujours `svg`), `categorie` (`Table` / `Card`), `sous_categorie` (Jauge, KPI…),
   - `description`, `code` (DAX nettoyé), `preview` (SVG statique), `generator` (optionnel), `statut` (`approved`).

   Tu peux relire / corriger `data/dax-processed.json` avant l'ingestion.

3. **Toi** — Tu lances depuis la racine du projet :
   ```bash
   node scripts/ingest.js
   ```
   Le script upsert dans Supabase via `ON CONFLICT (nom) DO UPDATE`. Aucun doublon, ré-exécutable à volonté.

## Pré-requis

- Node 18+ (pour `fetch` natif).
- `sql/seed-svg-categories.sql` exécuté une fois (crée la contrainte `UNIQUE (nom)` et les colonnes nécessaires).
- `ADMIN_SERVICE_KEY` dans `js/config.js` doit être la clé **service_role** (sinon RLS bloque les écritures).

## Format de `data/dax-processed.json`

```json
[
  {
    "nom": "Jauge Basic Table",
    "type": "svg",
    "categorie": "Table",
    "sous_categorie": "Jauge",
    "description": "Barre de progression horizontale arrondie.",
    "code": "Jauge Basic Table = ...",
    "preview": "<svg>…</svg>",
    "sample_data": null,
    "generator": null,
    "statut": "approved"
  }
]
```

## Champ `generator` (optionnel)

Donne à l'onglet "Générer" un formulaire **sémantique** (ex: dropdown catégorie qui change couleur+icône d'un coup), au lieu du fallback générique qui se contente de parser le SVG.

Si `null` → fallback automatique sur `buildGenericGenerator` (couleurs/stroke/rx/font-size détectés dans le `preview`).

### Format

```json
"generator": {
  "params": [
    { "id": "rx", "label": "Arrondi", "type": "range", "min": 0, "max": 20, "step": 1, "default": 14, "unit": "px" },
    { "id": "color", "label": "Couleur", "type": "color", "default": "#F59E0B" },
    { "id": "txt", "label": "Texte", "type": "text", "default": "OK" },
    {
      "id": "cat", "label": "Catégorie", "type": "select", "default": "Premium",
      "options": [
        { "value": "Premium", "label": "Premium", "bg": "#FEF3C7", "text": "#92400E" },
        { "value": "Basic",   "label": "Basic",   "bg": "#F3F4F6", "text": "#374151" }
      ]
    }
  ],
  "template": "<svg…><rect rx='{{rx}}' fill='{{cat.bg}}'/><text fill='{{cat.text}}'>{{txt}}</text></svg>"
}
```

### Substitutions dans `template`

- `{{id}}` → valeur courante du paramètre `id`.
- `{{id.field}}` → si `id` est un `select` avec options-objets, prend le sous-champ de l'option sélectionnée.

### Quand le remplir

- **Logique sémantique** (catégories qui change plusieurs propriétés d'un coup, libellés, valeurs métier) → remplir `generator`.
- **Tweak purement visuel** (juste les couleurs / arrondi / épaisseur du SVG) → laisser `null` ; le générique fait le job.

## Vider la queue après ingestion

Une fois `node scripts/ingest.js` réussi, tu peux :
- vider `data/dax-queue.dax` (effacer les mesures, garder l'en-tête),
- remettre `data/dax-processed.json` à `[]`.

Prêt pour le prochain lot.
