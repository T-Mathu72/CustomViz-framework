-- ============================================================
--  SEED — Mesures Deneb / Vega-Lite pour CustomViz
--  Exécutez ce script dans l'éditeur SQL de votre projet Supabase
-- ============================================================

INSERT INTO fonctions (nom, categorie, description, code, svg_preview, statut) VALUES

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
NULL, 'approved'),

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
NULL, 'approved'),

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
NULL, 'approved'),

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
NULL, 'approved'),

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
NULL, 'approved'),

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
NULL, 'approved');
