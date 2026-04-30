// ===== SEED.JS — Insertion des mesures DAX SVG de démonstration =====
// Lancer avec : node seed.js

const SUPABASE_URL = 'https://fcgdefombxdwpeqmqsaa.supabase.co';
// ⚠ Pour insérer/mettre à jour les données, utilisez la clé service_role (Project Settings → API)
// La clé anon ne peut pas faire UPDATE à cause du Row Level Security de Supabase.
// Remplacez par votre clé service_role, lancez "node seed.js", puis remettez la clé anon.
const SUPABASE_KEY = 'REMPLACER_PAR_VOTRE_CLE_SERVICE_ROLE';

// ── Mesures à insérer ──────────────────────────────────────────────
const mesures = [

  // 1. Jauge Basic Table (exemple fourni)
  {
    nom: 'Jauge Basic Table',
    categorie: 'Jauge',
    description: 'Barre de progression horizontale arrondie à fond rouge clair. Affiche un pourcentage d\'avancement dans une colonne de table Power BI.',
    code: `Jauge Basic Table =
VAR Prod = MAX(D_Formateur[%R&D])
VAR ProdCapped = MIN(Prod, 1)
VAR MaxWidthSvg = 227
VAR WidthJauge = INT(ProdCapped * MaxWidthSvg)
VAR CouleurBackground = "#FFE2E2"
VAR CouleurJauge = "#CC0000"

RETURN
    "data:image/svg+xml;utf8, " &
    "<svg width='227' height='22' viewBox='0 0 227 22' fill='none' xmlns='http://www.w3.org/2000/svg'>" &
        "<rect x='0' y='0' width='227' height='22' rx='11' fill='" & CouleurBackground & "'/>" &
        "<rect x='0' y='0' width='" & WidthJauge & "' height='22' rx='11' fill='" & CouleurJauge & "'/>" &
    "</svg>"`,
    preview: `<svg width="227" height="22" viewBox="0 0 227 22" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="227" height="22" rx="11" fill="#FFE2E2"/>
  <rect x="0" y="0" width="170" height="22" rx="11" fill="#CC0000"/>
</svg>`
  },

  // 2. Jauge Couleur Dynamique
  {
    nom: 'Jauge Couleur Dynamique',
    categorie: 'Jauge',
    description: 'Barre de progression dont la couleur change automatiquement selon la valeur : rouge < 50 %, orange entre 50 et 80 %, vert ≥ 80 %.',
    code: `Jauge Couleur Dynamique =
VAR Valeur = [% Atteinte Objectif]
VAR ValeurCapped = MIN(Valeur, 1)
VAR MaxWidthSvg = 227
VAR WidthJauge = INT(ValeurCapped * MaxWidthSvg)
VAR CouleurFond = "#F0F0F0"
VAR CouleurJauge =
    SWITCH(
        TRUE(),
        Valeur >= 0.8, "#22C55E",
        Valeur >= 0.5, "#F59E0B",
        "#EF4444"
    )

RETURN
    "data:image/svg+xml;utf8, " &
    "<svg width='227' height='22' viewBox='0 0 227 22' fill='none' xmlns='http://www.w3.org/2000/svg'>" &
        "<rect x='0' y='0' width='227' height='22' rx='11' fill='" & CouleurFond & "'/>" &
        "<rect x='0' y='0' width='" & WidthJauge & "' height='22' rx='11' fill='" & CouleurJauge & "'/>" &
    "</svg>"`,
    preview: `<svg width="227" height="22" viewBox="0 0 227 22" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="227" height="22" rx="11" fill="#F0F0F0"/>
  <rect x="0" y="0" width="193" height="22" rx="11" fill="#22C55E"/>
</svg>`
  },

  // 3. Feux Tricolores
  {
    nom: 'Feux Tricolores',
    categorie: 'Indicateur',
    description: 'Indicateur de statut en trois états (rouge / orange / vert) représenté sous forme de feux tricolores. Idéal pour les tableaux de bord de suivi de projets.',
    code: `Feux Tricolores =
VAR Valeur = [% Atteinte]
VAR RougeActif  = IF(Valeur < 0.5,             "#EF4444", "#FECACA")
VAR OrangeActif = IF(Valeur >= 0.5 && Valeur < 0.8, "#F59E0B", "#FDE68A")
VAR VertActif   = IF(Valeur >= 0.8,            "#22C55E", "#BBF7D0")

RETURN
    "data:image/svg+xml;utf8, " &
    "<svg width='72' height='24' viewBox='0 0 72 24' fill='none' xmlns='http://www.w3.org/2000/svg'>" &
        "<rect width='72' height='24' rx='12' fill='#1F2937'/>" &
        "<circle cx='16' cy='12' r='7' fill='" & RougeActif  & "'/>" &
        "<circle cx='36' cy='12' r='7' fill='" & OrangeActif & "'/>" &
        "<circle cx='56' cy='12' r='7' fill='" & VertActif   & "'/>" &
    "</svg>"`,
    preview: `<svg width="72" height="24" viewBox="0 0 72 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="72" height="24" rx="12" fill="#1F2937"/>
  <circle cx="16" cy="12" r="7" fill="#FECACA"/>
  <circle cx="36" cy="12" r="7" fill="#FDE68A"/>
  <circle cx="56" cy="12" r="7" fill="#22C55E"/>
</svg>`
  },

  // 4. Badge KPI
  {
    nom: 'Badge KPI',
    categorie: 'KPI',
    description: 'Pastille colorée affichant un pourcentage d\'atteinte. La couleur du badge passe automatiquement du rouge au vert selon la performance.',
    code: `Badge KPI =
VAR Valeur  = [Ventes Total]
VAR Objectif = [Objectif Ventes]
VAR Ratio   = DIVIDE(Valeur, Objectif, 0)
VAR Couleur =
    IF(Ratio >= 1,   "#22C55E",
    IF(Ratio >= 0.7, "#F59E0B",
                     "#EF4444"))
VAR Texte   = FORMAT(Ratio, "0%")

RETURN
    "data:image/svg+xml;utf8, " &
    "<svg width='64' height='26' viewBox='0 0 64 26' fill='none' xmlns='http://www.w3.org/2000/svg'>" &
        "<rect width='64' height='26' rx='13' fill='" & Couleur & "'/>" &
        "<text x='32' y='18' text-anchor='middle' font-family='Arial,sans-serif' " &
        "font-size='11' font-weight='700' fill='white'>" & Texte & "</text>" &
    "</svg>"`,
    preview: `<svg width="64" height="26" viewBox="0 0 64 26" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="26" rx="13" fill="#22C55E"/>
  <text x="32" y="18" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="white">87%</text>
</svg>`
  },

  // 5. Cercle de Progression
  {
    nom: 'Cercle de Progression',
    categorie: 'KPI',
    description: 'Jauge circulaire (donut) avec le pourcentage affiché au centre. Utilise stroke-dasharray/dashoffset pour animer l\'arc de progression.',
    code: `Cercle de Progression =
VAR Valeur     = [% Atteinte]
VAR ValCapped  = MIN(MAX(Valeur, 0), 1)
-- Circonférence d'un cercle r=30 : 2π×30 ≈ 188.5
VAR Offset     = (1 - ValCapped) * 188.5
VAR Couleur    =
    IF(ValCapped >= 0.8, "#22C55E",
    IF(ValCapped >= 0.5, "#F59E0B", "#EF4444"))
VAR PctTexte   = FORMAT(ValCapped, "0%")

RETURN
    "data:image/svg+xml;utf8, " &
    "<svg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>" &
        "<circle cx='40' cy='40' r='30' fill='none' stroke='#E5E7EB' stroke-width='7'/>" &
        "<circle cx='40' cy='40' r='30' fill='none' stroke='" & Couleur & "' stroke-width='7' " &
        "stroke-linecap='round' stroke-dasharray='188.5' " &
        "stroke-dashoffset='" & Offset & "' transform='rotate(-90 40 40)'/>" &
        "<text x='40' y='45' text-anchor='middle' font-family='Arial,sans-serif' " &
        "font-size='14' font-weight='700' fill='#374151'>" & PctTexte & "</text>" &
    "</svg>"`,
    preview: `<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <circle cx="40" cy="40" r="30" fill="none" stroke="#E5E7EB" stroke-width="7"/>
  <circle cx="40" cy="40" r="30" fill="none" stroke="#6366F1" stroke-width="7" stroke-linecap="round" stroke-dasharray="188.5" stroke-dashoffset="47" transform="rotate(-90 40 40)"/>
  <text x="40" y="45" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="#374151">75%</text>
</svg>`
  },

  // 6. Bullet Chart
  {
    nom: 'Bullet Chart',
    categorie: 'Comparaison',
    description: 'Graphique bullet comparant la valeur réelle à un objectif. La barre indigo représente le réalisé, le trait noir vertical représente la cible.',
    code: `Bullet Chart =
VAR Valeur   = [Ventes Total]
VAR Objectif = [Objectif Ventes]
VAR MaxRef   = Objectif * 1.2
VAR LMax     = 200
VAR LValeur  = INT(MIN(DIVIDE(Valeur,   MaxRef, 0), 1) * LMax)
VAR LObjectif = INT(MIN(DIVIDE(Objectif, MaxRef, 0), 1) * LMax)

RETURN
    "data:image/svg+xml;utf8, " &
    "<svg width='220' height='32' viewBox='0 0 220 32' fill='none' xmlns='http://www.w3.org/2000/svg'>" &
        "<rect x='10' y='9'  width='200' height='14' rx='3' fill='#E5E7EB'/>" &
        "<rect x='10' y='11' width='" & LValeur   & "' height='10' rx='3' fill='#6366F1'/>" &
        "<rect x='" & (10 + LObjectif - 1) & "' y='5' width='3' height='22' rx='1' fill='#1F2937'/>" &
    "</svg>"`,
    preview: `<svg width="220" height="32" viewBox="0 0 220 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="9" width="200" height="14" rx="3" fill="#E5E7EB"/>
  <rect x="10" y="11" width="138" height="10" rx="3" fill="#6366F1"/>
  <rect x="176" y="5" width="3" height="22" rx="1" fill="#1F2937"/>
</svg>`
  },

  // 7. Mini Sparkline Barres
  {
    nom: 'Mini Sparkline Barres',
    categorie: 'Tendance',
    description: 'Mini graphique à barres de 5 périodes (ex : 5 derniers mois). La dernière barre est mise en évidence. Parfait pour une colonne "Tendance" dans une table.',
    code: `Mini Sparkline Barres =
VAR V1 = CALCULATE([Ventes Total], DATEADD('Calendrier'[Date], -4, MONTH))
VAR V2 = CALCULATE([Ventes Total], DATEADD('Calendrier'[Date], -3, MONTH))
VAR V3 = CALCULATE([Ventes Total], DATEADD('Calendrier'[Date], -2, MONTH))
VAR V4 = CALCULATE([Ventes Total], DATEADD('Calendrier'[Date], -1, MONTH))
VAR V5 = [Ventes Total]
VAR MaxVal = MAXX({V1,V2,V3,V4,V5}, [Value])
VAR H  = 28
VAR W  = 8
VAR G  = 4
VAR B1 = IF(MaxVal = 0, 4, MAX(INT(DIVIDE(V1, MaxVal) * H), 4))
VAR B2 = IF(MaxVal = 0, 4, MAX(INT(DIVIDE(V2, MaxVal) * H), 4))
VAR B3 = IF(MaxVal = 0, 4, MAX(INT(DIVIDE(V3, MaxVal) * H), 4))
VAR B4 = IF(MaxVal = 0, 4, MAX(INT(DIVIDE(V4, MaxVal) * H), 4))
VAR B5 = IF(MaxVal = 0, 4, MAX(INT(DIVIDE(V5, MaxVal) * H), 4))

RETURN
    "data:image/svg+xml;utf8, " &
    "<svg width='68' height='34' viewBox='0 0 68 34' xmlns='http://www.w3.org/2000/svg'>" &
        "<rect x='2'              y='" & (32-B1) & "' width='" & W & "' height='" & B1 & "' rx='2' fill='#C7D2FE'/>" &
        "<rect x='" & (2+W+G)    & "' y='" & (32-B2) & "' width='" & W & "' height='" & B2 & "' rx='2' fill='#A5B4FC'/>" &
        "<rect x='" & (2+(W+G)*2) & "' y='" & (32-B3) & "' width='" & W & "' height='" & B3 & "' rx='2' fill='#818CF8'/>" &
        "<rect x='" & (2+(W+G)*3) & "' y='" & (32-B4) & "' width='" & W & "' height='" & B4 & "' rx='2' fill='#6366F1'/>" &
        "<rect x='" & (2+(W+G)*4) & "' y='" & (32-B5) & "' width='" & W & "' height='" & B5 & "' rx='2' fill='#4F46E5'/>" &
    "</svg>"`,
    preview: `<svg width="68" height="34" viewBox="0 0 68 34" xmlns="http://www.w3.org/2000/svg">
  <rect x="2"  y="14" width="8" height="18" rx="2" fill="#C7D2FE"/>
  <rect x="14" y="20" width="8" height="12" rx="2" fill="#A5B4FC"/>
  <rect x="26" y="6"  width="8" height="26" rx="2" fill="#818CF8"/>
  <rect x="38" y="16" width="8" height="16" rx="2" fill="#6366F1"/>
  <rect x="50" y="10" width="8" height="22" rx="2" fill="#4F46E5"/>
</svg>`
  },

  // 8. Note Étoiles
  {
    nom: 'Note Étoiles',
    categorie: 'Évaluation',
    description: 'Affiche une note sur 5 étoiles avec remplissage dynamique. Les étoiles pleines sont dorées, les vides sont grises. Arrondi à 0.5 près.',
    code: `Note Étoiles =
VAR NoteRaw  = [Note Moyenne]
VAR NoteArr  = ROUND(NoteRaw * 2, 0) / 2          -- arrondi au 0.5 près
VAR NbPleines = INT(NoteArr)
VAR DemiEtoile = NoteArr - NbPleines               -- 0 ou 0.5
VAR NbVides  = 5 - NbPleines - IF(DemiEtoile > 0, 1, 0)
VAR Or       = "#F59E0B"
VAR Gris     = "#D1D5DB"

-- Génère les étoiles pleines
VAR E1 = IF(NbPleines >= 1, "<circle cx='9'  cy='9' r='7' fill='" & Or   & "'/>", "<circle cx='9'  cy='9' r='7' fill='" & Gris & "'/>")
VAR E2 = IF(NbPleines >= 2, "<circle cx='27' cy='9' r='7' fill='" & Or   & "'/>", "<circle cx='27' cy='9' r='7' fill='" & Gris & "'/>")
VAR E3 = IF(NbPleines >= 3, "<circle cx='45' cy='9' r='7' fill='" & Or   & "'/>", "<circle cx='45' cy='9' r='7' fill='" & Gris & "'/>")
VAR E4 = IF(NbPleines >= 4, "<circle cx='63' cy='9' r='7' fill='" & Or   & "'/>", "<circle cx='63' cy='9' r='7' fill='" & Gris & "'/>")
VAR E5 = IF(NbPleines >= 5, "<circle cx='81' cy='9' r='7' fill='" & Or   & "'/>", "<circle cx='81' cy='9' r='7' fill='" & Gris & "'/>")

RETURN
    "data:image/svg+xml;utf8, " &
    "<svg width='90' height='18' viewBox='0 0 90 18' xmlns='http://www.w3.org/2000/svg'>" &
        E1 & E2 & E3 & E4 & E5 &
    "</svg>"`,
    preview: `<svg width="90" height="18" viewBox="0 0 90 18" xmlns="http://www.w3.org/2000/svg">
  <circle cx="9"  cy="9" r="7" fill="#F59E0B"/>
  <circle cx="27" cy="9" r="7" fill="#F59E0B"/>
  <circle cx="45" cy="9" r="7" fill="#F59E0B"/>
  <circle cx="63" cy="9" r="7" fill="#F59E0B"/>
  <circle cx="81" cy="9" r="7" fill="#D1D5DB"/>
</svg>`
  }

];

// ── Insertion ──────────────────────────────────────────────────────
async function seed() {
  console.log(`\nInsertion de ${mesures.length} mesures dans Supabase…\n`);

  // Vérifier/ajouter la colonne preview si nécessaire
  const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/fonctions?limit=1`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  if (!checkRes.ok) {
    console.error('Impossible de joindre Supabase. Vérifiez votre clé.');
    process.exit(1);
  }

  // Détecte si la colonne preview existe
  let hasSvgCol = true;
  const testRes = await fetch(`${SUPABASE_URL}/rest/v1/fonctions`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ nom: '__test__', categorie: 'test', description: 'test', code: 'test', preview: null })
  });
  if (!testRes.ok) {
    const testErr = await testRes.text();
    if (testErr.includes('preview')) {
      hasSvgCol = false;
      console.warn('  ⚠  Colonne preview absente — les aperçus SVG ne seront pas insérés.');
      console.warn('     Ajoutez-la dans Supabase SQL Editor :');
      console.warn('     ALTER TABLE fonctions ADD COLUMN preview text;\n');
    }
  } else {
    // Supprime la ligne de test
    await fetch(`${SUPABASE_URL}/rest/v1/fonctions?nom=eq.__test__`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
  }

  let ok = 0, fail = 0;
  for (const m of mesures) {
    // Vérifie si la mesure existe déjà (par nom)
    const checkExist = await fetch(
      `${SUPABASE_URL}/rest/v1/fonctions?nom=eq.${encodeURIComponent(m.nom)}&select=id`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const existing = await checkExist.json();

    if (existing.length > 0 && hasSvgCol) {
      // Met à jour le preview sur la ligne existante
      const id = existing[0].id;
      const upd = await fetch(`${SUPABASE_URL}/rest/v1/fonctions?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({ preview: m.preview })
      });
      if (upd.ok) {
        console.log(`  ↻  ${m.nom}  — preview mis à jour`);
        ok++;
      } else {
        console.error(`  ✗  ${m.nom} (update) — ${await upd.text()}`);
        fail++;
      }
      continue;
    }

    const payload = hasSvgCol ? m : (({ preview, ...rest }) => rest)(m);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/fonctions`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      console.log(`  ✓  ${m.nom}  (${m.categorie})`);
      ok++;
    } else {
      const err = await res.text();
      console.error(`  ✗  ${m.nom} — ${err}`);
      fail++;
    }
  }

  console.log(`\n${ok} insérées, ${fail} erreur(s).\n`);
}

seed().catch(console.error);
