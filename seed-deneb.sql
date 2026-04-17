-- ============================================================
--  SEED — Mesures Deneb / Vega-Lite pour CustomViz
--  Exécutez ce script dans l'éditeur SQL de votre projet Supabase
-- ============================================================

INSERT INTO fonctions (nom, categorie, description, code, preview, statut) VALUES

-- 1. Bar Chart Horizontal
('Bar Chart Horizontal', 'Deneb',
'Graphique en barres horizontales. Mappez une dimension sur "category" et une mesure sur "value".',
$${
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": { "name": "dataset" },
  "mark": { "type": "bar", "cornerRadiusEnd": 4, "tooltip": true },
  "encoding": {
    "y": {
      "field": "category",
      "type": "nominal",
      "sort": "-x",
      "axis": { "labelLimit": 150, "title": null }
    },
    "x": {
      "field": "value",
      "type": "quantitative",
      "axis": { "title": null, "grid": false }
    },
    "color": {
      "condition": { "test": "datum.value === max(data('dataset'), 'value')[0].value", "value": "#AB0000" },
      "value": "#E57373"
    },
    "tooltip": [
      { "field": "category", "title": "Catégorie" },
      { "field": "value", "title": "Valeur", "format": ",.0f" }
    ]
  }
}$$,
'<svg viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg"><rect x="18" y="7"  width="88" height="9" rx="2" fill="#AB0000"/><rect x="18" y="20" width="64" height="9" rx="2" fill="#E57373"/><rect x="18" y="33" width="48" height="9" rx="2" fill="#E57373"/><rect x="18" y="46" width="36" height="9" rx="2" fill="#E57373"/><rect x="18" y="59" width="24" height="9" rx="2" fill="#E57373"/></svg>',
'approved'),

-- 2. Line Chart Temporel
('Line Chart Temporel', 'Deneb',
'Courbe d''évolution dans le temps. Mappez une date sur "date" et une mesure sur "value".',
$${
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": { "name": "dataset" },
  "layer": [
    {
      "mark": { "type": "area", "line": true, "opacity": 0.15, "color": "#AB0000" },
      "encoding": {
        "x": { "field": "date", "type": "temporal", "axis": { "title": null, "format": "%b %Y" } },
        "y": { "field": "value", "type": "quantitative", "axis": { "title": null } }
      }
    },
    {
      "mark": { "type": "line", "color": "#AB0000", "strokeWidth": 2.5 },
      "encoding": {
        "x": { "field": "date", "type": "temporal" },
        "y": { "field": "value", "type": "quantitative" }
      }
    },
    {
      "mark": { "type": "point", "color": "#AB0000", "filled": true, "size": 60 },
      "encoding": {
        "x": { "field": "date", "type": "temporal" },
        "y": { "field": "value", "type": "quantitative" },
        "tooltip": [
          { "field": "date", "type": "temporal", "title": "Date", "format": "%d/%m/%Y" },
          { "field": "value", "title": "Valeur", "format": ",.0f" }
        ]
      }
    }
  ]
}$$,
'<svg viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg"><path d="M8,58 L28,44 L48,50 L68,30 L88,36 L112,14 L112,66 L8,66 Z" fill="#AB0000" opacity="0.15"/><polyline points="8,58 28,44 48,50 68,30 88,36 112,14" fill="none" stroke="#AB0000" stroke-width="2.5" stroke-linejoin="round"/><circle cx="8"   cy="58" r="3" fill="#AB0000"/><circle cx="28"  cy="44" r="3" fill="#AB0000"/><circle cx="48"  cy="50" r="3" fill="#AB0000"/><circle cx="68"  cy="30" r="3" fill="#AB0000"/><circle cx="88"  cy="36" r="3" fill="#AB0000"/><circle cx="112" cy="14" r="3" fill="#AB0000"/></svg>',
'approved'),

-- 3. Scatter Plot
('Scatter Plot', 'Deneb',
'Nuage de points pour analyser la corrélation entre deux mesures. Mappez "x", "y" et optionnellement "label".',
$${
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": { "name": "dataset" },
  "layer": [
    {
      "mark": { "type": "point", "filled": true, "size": 90, "opacity": 0.75 },
      "encoding": {
        "x": {
          "field": "x",
          "type": "quantitative",
          "axis": { "title": "Axe X", "grid": true }
        },
        "y": {
          "field": "y",
          "type": "quantitative",
          "axis": { "title": "Axe Y", "grid": true }
        },
        "color": { "field": "category", "type": "nominal", "legend": { "title": null } },
        "tooltip": [
          { "field": "label", "title": "Label" },
          { "field": "x", "title": "X", "format": ",.2f" },
          { "field": "y", "title": "Y", "format": ",.2f" }
        ]
      }
    },
    {
      "mark": { "type": "text", "dy": -10, "fontSize": 10, "opacity": 0.7 },
      "encoding": {
        "x": { "field": "x", "type": "quantitative" },
        "y": { "field": "y", "type": "quantitative" },
        "text": { "field": "label", "type": "nominal" }
      }
    }
  ]
}$$,
'<svg viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="52" r="5" fill="#AB0000" opacity="0.75"/><circle cx="40" cy="38" r="5" fill="#E57373" opacity="0.75"/><circle cx="55" cy="20" r="5" fill="#B71C1C" opacity="0.75"/><circle cx="70" cy="44" r="5" fill="#AB0000" opacity="0.75"/><circle cx="85" cy="28" r="5" fill="#E57373" opacity="0.75"/><circle cx="100" cy="55" r="5" fill="#B71C1C" opacity="0.75"/><circle cx="35" cy="60" r="5" fill="#AB0000" opacity="0.75"/><circle cx="92" cy="14" r="5" fill="#E57373" opacity="0.75"/></svg>',
'approved'),

-- 4. Donut / Arc Chart
('Donut Chart', 'Deneb',
'Graphique en anneau. Mappez une dimension sur "category" et une mesure sur "value".',
$${
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": { "name": "dataset" },
  "layer": [
    {
      "mark": {
        "type": "arc",
        "innerRadius": 60,
        "outerRadius": 110,
        "stroke": "white",
        "strokeWidth": 2,
        "tooltip": true
      },
      "encoding": {
        "theta": { "field": "value", "type": "quantitative" },
        "color": {
          "field": "category",
          "type": "nominal",
          "legend": { "title": null, "orient": "right" },
          "scale": { "range": ["#AB0000","#E57373","#FFCDD2","#B71C1C","#EF9A9A"] }
        },
        "tooltip": [
          { "field": "category", "title": "Catégorie" },
          { "field": "value", "title": "Valeur", "format": ",.0f" }
        ]
      }
    },
    {
      "mark": { "type": "text", "radius": 130, "fontSize": 11 },
      "encoding": {
        "theta": { "field": "value", "type": "quantitative", "stack": true },
        "text": {
          "field": "value",
          "type": "quantitative",
          "format": ",.0f"
        }
      }
    }
  ],
  "view": { "stroke": null }
}$$,
'<svg viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg"><path d="M35,5 A30,30 0 0,1 62,50 L53,44 A20,20 0 0,0 35,15 Z" fill="#AB0000"/><path d="M62,50 A30,30 0 0,1 10,55 L18,49 A20,20 0 0,0 53,44 Z" fill="#E57373"/><path d="M10,55 A30,30 0 0,1 35,5 L35,15 A20,20 0 0,0 18,49 Z" fill="#FFCDD2"/><circle cx="35" cy="35" r="15" fill="white"/></svg>',
'approved'),

-- 5. Heatmap Matrice
('Heatmap Matrice', 'Deneb',
'Carte de chaleur pour visualiser l''intensité sur deux dimensions. Mappez "row", "col" et "value".',
$${
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": { "name": "dataset" },
  "mark": { "type": "rect", "tooltip": true },
  "encoding": {
    "x": {
      "field": "col",
      "type": "ordinal",
      "axis": { "title": null, "labelAngle": -35 }
    },
    "y": {
      "field": "row",
      "type": "ordinal",
      "axis": { "title": null }
    },
    "color": {
      "field": "value",
      "type": "quantitative",
      "legend": { "title": null },
      "scale": { "scheme": "reds" }
    },
    "tooltip": [
      { "field": "row",   "title": "Ligne" },
      { "field": "col",   "title": "Colonne" },
      { "field": "value", "title": "Valeur", "format": ",.2f" }
    ]
  }
}$$,
'<svg viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg"><rect x="4"  y="4"  width="25" height="18" rx="1" fill="#FFCDD2"/><rect x="32" y="4"  width="25" height="18" rx="1" fill="#AB0000"/><rect x="60" y="4"  width="25" height="18" rx="1" fill="#E57373"/><rect x="88" y="4"  width="28" height="18" rx="1" fill="#B71C1C"/><rect x="4"  y="26" width="25" height="18" rx="1" fill="#E57373"/><rect x="32" y="26" width="25" height="18" rx="1" fill="#FFCDD2"/><rect x="60" y="26" width="25" height="18" rx="1" fill="#AB0000"/><rect x="88" y="26" width="28" height="18" rx="1" fill="#FFCDD2"/><rect x="4"  y="48" width="25" height="18" rx="1" fill="#B71C1C"/><rect x="32" y="48" width="25" height="18" rx="1" fill="#E57373"/><rect x="60" y="48" width="25" height="18" rx="1" fill="#FFCDD2"/><rect x="88" y="48" width="28" height="18" rx="1" fill="#E57373"/></svg>',
'approved'),

-- 6. Bullet Chart Vega-Lite
('Bullet Chart Deneb', 'Deneb',
'Graphique en bullet pour comparer réalisé vs objectif. Mappez "label", "value" (réalisé) et "target" (objectif).',
$${
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": { "name": "dataset" },
  "facet": {
    "row": { "field": "label", "type": "ordinal", "header": { "title": null } }
  },
  "spec": {
    "width": 300,
    "height": 20,
    "layer": [
      {
        "mark": { "type": "bar", "color": "#E5E7EB", "height": 20 },
        "encoding": {
          "x": {
            "field": "target",
            "type": "quantitative",
            "axis": { "title": null }
          }
        }
      },
      {
        "mark": { "type": "bar", "color": "#AB0000", "height": 10 },
        "encoding": {
          "x": { "field": "value", "type": "quantitative" }
        }
      },
      {
        "mark": { "type": "tick", "color": "#1F2937", "thickness": 3, "size": 22 },
        "encoding": {
          "x": { "field": "target", "type": "quantitative" }
        }
      }
    ]
  }
}$$,
'<svg viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="6"  width="100" height="10" rx="1" fill="#E5E7EB"/><rect x="4" y="9"  width="72"  height="4"  rx="1" fill="#AB0000"/><line x1="104" y1="4"  x2="104" y2="18" stroke="#1F2937" stroke-width="2.5"/><rect x="4" y="22" width="100" height="10" rx="1" fill="#E5E7EB"/><rect x="4" y="25" width="58"  height="4"  rx="1" fill="#AB0000"/><line x1="104" y1="20" x2="104" y2="34" stroke="#1F2937" stroke-width="2.5"/><rect x="4" y="38" width="100" height="10" rx="1" fill="#E5E7EB"/><rect x="4" y="41" width="85"  height="4"  rx="1" fill="#AB0000"/><line x1="104" y1="36" x2="104" y2="50" stroke="#1F2937" stroke-width="2.5"/><rect x="4" y="54" width="100" height="10" rx="1" fill="#E5E7EB"/><rect x="4" y="57" width="44"  height="4"  rx="1" fill="#AB0000"/><line x1="104" y1="52" x2="104" y2="66" stroke="#1F2937" stroke-width="2.5"/></svg>',
'approved')
ON CONFLICT (nom) DO UPDATE SET
  categorie   = EXCLUDED.categorie,
  description = EXCLUDED.description,
  code        = EXCLUDED.code,
  preview     = EXCLUDED.preview,
  statut      = EXCLUDED.statut;
