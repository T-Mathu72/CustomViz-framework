#!/usr/bin/env node
// ============================================================
//  ingest.js — Upsert data/dax-processed.json into Supabase fonctions
//  Usage : node scripts/ingest.js  (depuis la racine du projet)
//
//  - Lit SUPABASE_URL et ADMIN_SERVICE_KEY depuis js/config.js
//  - Upsert sur la colonne UNIQUE "nom" (merge-duplicates)
//  - Idempotent : peut être ré-exécuté sans créer de doublons
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PROCESSED = path.join(ROOT, 'data', 'dax-processed.json');
const CONFIG = path.join(ROOT, 'js', 'config.js');

// ── 1. Lire la config Supabase ──────────────────────────────
if (!fs.existsSync(CONFIG)) {
  console.error('✗ config.js introuvable');
  process.exit(1);
}
const cfg = fs.readFileSync(CONFIG, 'utf8');
const url = (cfg.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)/) || [])[1];
const key = (cfg.match(/ADMIN_SERVICE_KEY\s*=\s*['"]([^'"]+)/) || [])[1]
         || (cfg.match(/SUPABASE_KEY\s*=\s*['"]([^'"]+)/) || [])[1];

if (!url || !key) {
  console.error('✗ Impossible de lire SUPABASE_URL / ADMIN_SERVICE_KEY depuis config.js');
  process.exit(1);
}

// ── 2. Lire et valider dax-processed.json ───────────────────
if (!fs.existsSync(PROCESSED)) {
  console.error(`✗ Fichier introuvable : ${PROCESSED}`);
  process.exit(1);
}
let data;
try {
  data = JSON.parse(fs.readFileSync(PROCESSED, 'utf8'));
} catch (e) {
  console.error('✗ JSON invalide dans dax-processed.json :', e.message);
  process.exit(1);
}
if (!Array.isArray(data)) {
  console.error('✗ dax-processed.json doit être un tableau JSON');
  process.exit(1);
}
if (data.length === 0) {
  console.log('ℹ Aucune mesure à ingérer (dax-processed.json est vide)');
  process.exit(0);
}

const REQUIRED = ['nom', 'type', 'categorie', 'description', 'code', 'preview'];
const errors = [];
data.forEach((row, i) => {
  REQUIRED.forEach(f => {
    if (row[f] === undefined || row[f] === null || row[f] === '') {
      errors.push(`ligne ${i} ("${row.nom || '?'}") : champ "${f}" manquant`);
    }
  });
});
if (errors.length) {
  console.error('✗ Erreurs de validation :');
  errors.forEach(e => console.error('  -', e));
  process.exit(1);
}

// ── 3. Normaliser les lignes ────────────────────────────────
const rows = data.map(r => ({
  nom: r.nom,
  type: r.type,
  categorie: r.categorie,
  sous_categorie: r.sous_categorie || null,
  description: r.description,
  code: r.code,
  preview: r.preview,
  sample_data: r.sample_data || null,
  generator: r.generator || null,
  statut: r.statut || 'approved'
}));

// ── 4. Upsert vers Supabase ─────────────────────────────────
(async () => {
  console.log(`→ Upsert de ${rows.length} mesure(s) vers ${url}…`);

  const res = await fetch(`${url}/rest/v1/fonctions?on_conflict=nom`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(rows)
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error(`✗ Erreur ${res.status} :`, txt);
    if (res.status === 401 || res.status === 403) {
      console.error('  → Vérifie que ADMIN_SERVICE_KEY dans config.js est bien la clé service_role.');
    }
    if (res.status === 409 || /constraint/i.test(txt)) {
      console.error('  → As-tu exécuté seed-svg-categories.sql (UNIQUE sur nom) ?');
    }
    process.exit(1);
  }

  const result = await res.json();
  console.log(`✓ ${result.length} ligne(s) upsertée(s) :`);
  result.forEach(r => {
    const sub = r.sous_categorie ? `/${r.sous_categorie}` : '';
    console.log(`   • ${r.nom}  [${r.type}/${r.categorie}${sub}]`);
  });
})();
