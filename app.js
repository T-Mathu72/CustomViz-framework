// ===== APP.JS — CustomViz DAX Library =====

let allFunctions        = [];
let activeType          = 'svg'; // 'svg' | 'html' | 'deneb'
let activeCategory      = 'all';
let activeSousCategorie = 'all';

// ---- Palette de couleurs par catégorie ----
const PALETTE = ['#5b6ef5','#7c3aed','#0891b2','#059669','#d97706','#db2777','#dc2626','#0284c7','#7c3aed','#4f46e5'];
function categoryColor(cat) {
  if (!cat) return PALETTE[0];
  let h = 0;
  for (let i = 0; i < cat.length; i++) h = cat.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

// ---- Chargement ----
async function loadFunctions() {
  const { data, error } = await db
    .from('fonctions').select('*').eq('statut', 'approved').order('created_at', { ascending: false });

  if (error) {
    document.getElementById('grid').innerHTML =
      `<div class="empty"><span class="empty-icon">⚠️</span><p>${error.message}</p></div>`;
    return;
  }

  allFunctions = data || [];

  const cats = [...new Set(allFunctions.map(f => f.categorie).filter(Boolean))];

  // Type counts
  Object.entries(typeFilter).forEach(([type, fn]) => {
    const el = document.getElementById('count' + type.charAt(0).toUpperCase() + type.slice(1));
    if (el) el.textContent = allFunctions.filter(fn).length;
  });

  buildTypeTabs();
  buildSidebarCats();
  buildFilters();
  applyFilters();
}

// ---- Helpers type (utilise la colonne `type` en DB) ----
// Les anciennes mesures sans type ou type='dax' tombent dans SVG par défaut
const isSvg   = f => !f.type || f.type === 'dax' || f.type === 'svg';
const isHtml  = f => f.type === 'html';
const isDeneb = f => f.type === 'deneb';
const typeFilter = { svg: isSvg, html: isHtml, deneb: isDeneb };

// ---- Type tabs ----
function buildTypeTabs() {
  document.querySelectorAll('.type-tab').forEach(btn => {
    btn.addEventListener('click', () => switchType(btn.dataset.type));
  });
}

function switchType(type) {
  activeType = type;
  activeCategory = 'all';
  activeSousCategorie = 'all';

  document.querySelectorAll('.type-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.type === type));

  const tableSection = document.getElementById('tableSection');
  const imageSection = document.getElementById('imageSection');

  if (type === 'svg') {
    tableSection.style.display = 'none';
    imageSection.style.display = '';
  } else {
    tableSection.style.display = '';
    imageSection.style.display = 'none';
    const titleEl = tableSection.querySelector('.section-title');
    if (titleEl) titleEl.textContent =
      type === 'html'  ? 'Visuels HTML' :
      type === 'deneb' ? 'Visuels Deneb / Vega-Lite' :
      'Visuels SVG';
  }

  buildSidebarCats();
  buildFilters();
  applyFilters();
}

// ---- Observateur pour le lazy-loading SVG ----
let _svgObserver = null;

// ---- Rendu section SVG (image grid, filtrée) ----
function renderImageSection(items) {
  const container = document.getElementById('imageCards');
  const countEl   = document.getElementById('countDisplay');
  if (!container) return;
  if (countEl) countEl.textContent = `${items.length} visuel${items.length !== 1 ? 's' : ''}`;

  // Déconnecter l'observateur précédent
  if (_svgObserver) { _svgObserver.disconnect(); _svgObserver = null; }

  if (items.length === 0) {
    container.innerHTML = `<div class="empty" style="grid-column:1/-1"><span class="empty-icon">📭</span><p>Aucun visuel trouvé.</p></div>`;
    return;
  }

  // Rendre les cartes sans SVG (placeholders) pour un affichage immédiat
  const fnMap = new Map(items.map(fn => [String(fn.id), fn]));
  container.innerHTML = items.map(fn => `
    <div class="img-card" data-id="${fn.id}">
      <div class="img-card-preview img-lazy-placeholder"></div>
      <div class="img-card-footer">
        <div>
          <span class="img-card-name">${escHtml(fn.nom)}</span>
          ${fn.sous_categorie ? `<span class="img-card-sub">${escHtml(fn.sous_categorie)}</span>` : ''}
        </div>
        <span class="img-card-arrow">→</span>
      </div>
    </div>`).join('');

  // Injecter les SVGs uniquement quand la carte entre dans le viewport
  _svgObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const card    = entry.target;
      const preview = card.querySelector('.img-lazy-placeholder');
      if (!preview) return;
      const fn = fnMap.get(card.dataset.id);
      preview.innerHTML = fn?.preview
        ? stripSvgDims(fn.preview)
        : '<div class="svg-empty" style="padding:1rem;color:var(--text-muted);font-size:.8rem">Aucun aperçu.</div>';
      preview.classList.remove('img-lazy-placeholder');
      _svgObserver.unobserve(card);
    });
  }, { rootMargin: '150px' });

  container.querySelectorAll('.img-card').forEach(card => {
    _svgObserver.observe(card);
    card.addEventListener('click', () => {
      const fn = fnMap.get(card.dataset.id);
      if (fn) openModal(fn);
    });
  });
}

// ---- Sidebar catégories (dynamique selon activeType) ----
function buildSidebarCats() {
  const container = document.getElementById('sbCats');
  if (!container) return;
  container.innerHTML = '';

  const items = allFunctions.filter(typeFilter[activeType]);
  const typeColors = { svg: '#0891b2', html: '#f59e0b', deneb: '#7c3aed' };
  const accentColor = typeColors[activeType];

  // Bouton "Toutes"
  const allBtn = document.createElement('button');
  allBtn.className = 'sb-cat-btn active';
  allBtn.dataset.cat = 'all';
  allBtn.innerHTML = `<span class="sb-cat-dot" style="background:${accentColor}"></span>Toutes<span class="sb-cat-count">${items.length}</span>`;
  allBtn.addEventListener('click', () => {
    activeCategory = 'all'; activeSousCategorie = 'all';
    refreshSidebarActive(); syncFilters(); applyFilters();
  });
  container.appendChild(allBtn);

  const cats = [...new Set(items.map(f => f.categorie).filter(Boolean))];

  if (activeType === 'svg') {
    // ── 2 niveaux : categorie → sous_categorie ──
    cats.forEach(cat => {
      const catItems = items.filter(f => f.categorie === cat);
      const subcats  = [...new Set(catItems.map(f => f.sous_categorie).filter(Boolean))];
      const color    = categoryColor(cat);

      const group = document.createElement('div');
      group.className = 'sb-cat-group';

      const parentBtn = document.createElement('button');
      parentBtn.className = 'sb-cat-btn sb-cat-parent';
      parentBtn.dataset.cat  = cat;
      parentBtn.dataset.sub  = 'all';
      parentBtn.innerHTML = `<span class="sb-cat-dot" style="background:${color}"></span>${escHtml(cat)}<span class="sb-cat-count">${catItems.length}</span>`;
      parentBtn.addEventListener('click', () => {
        activeCategory = cat; activeSousCategorie = 'all';
        group.classList.toggle('open');
        refreshSidebarActive(); applyFilters();
      });
      group.appendChild(parentBtn);

      if (subcats.length) {
        const children = document.createElement('div');
        children.className = 'sb-cat-children';
        subcats.forEach(sub => {
          const subCount = catItems.filter(f => f.sous_categorie === sub).length;
          const subBtn = document.createElement('button');
          subBtn.className = 'sb-subcat-btn';
          subBtn.dataset.cat = cat;
          subBtn.dataset.sub = sub;
          subBtn.innerHTML = `<span class="sb-subcat-dot"></span>${escHtml(sub)}<span class="sb-cat-count">${subCount}</span>`;
          subBtn.addEventListener('click', e => {
            e.stopPropagation();
            activeCategory = cat; activeSousCategorie = sub;
            group.classList.add('open');
            refreshSidebarActive(); applyFilters();
          });
          children.appendChild(subBtn);
        });
        group.appendChild(children);
      }
      container.appendChild(group);
    });

  } else {
    // ── 1 niveau pour HTML / Deneb ──
    cats.forEach(cat => {
      const count = items.filter(f => f.categorie === cat).length;
      const btn = document.createElement('button');
      btn.className = 'sb-cat-btn';
      btn.dataset.cat = cat;
      btn.innerHTML = `<span class="sb-cat-dot" style="background:${categoryColor(cat)}"></span>${escHtml(cat)}<span class="sb-cat-count">${count}</span>`;
      btn.addEventListener('click', () => {
        activeCategory = cat; activeSousCategorie = 'all';
        refreshSidebarActive(); syncFilters(); applyFilters();
      });
      container.appendChild(btn);
    });
  }

  refreshSidebarActive();
}

function refreshSidebarActive() {
  const container = document.getElementById('sbCats');
  if (!container) return;
  container.querySelectorAll('.sb-cat-btn, .sb-subcat-btn').forEach(b => {
    const matchCat = b.dataset.cat === activeCategory || (b.dataset.cat === 'all' && activeCategory === 'all');
    const matchSub = !b.dataset.sub || b.dataset.sub === activeSousCategorie ||
                     (b.dataset.sub === 'all' && activeSousCategorie === 'all' && b.dataset.cat === activeCategory);
    b.classList.toggle('active',
      b.dataset.cat === 'all'
        ? activeCategory === 'all'
        : b.classList.contains('sb-subcat-btn')
          ? b.dataset.cat === activeCategory && b.dataset.sub === activeSousCategorie
          : b.dataset.cat === activeCategory && activeSousCategorie === 'all'
    );
  });
}

// ---- Filtres sous-catégories (barre sous le titre de section) ----
function buildFilters() {
  const container = document.getElementById('filters');
  if (!container) return;
  const items = allFunctions.filter(typeFilter[activeType]);
  const cats  = [...new Set(items.map(f => f.categorie).filter(Boolean))];
  if (cats.length <= 1) { container.innerHTML = ''; return; }
  container.innerHTML = `<button class="filter-btn active" data-cat="all">Toutes</button>`;
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.cat = cat;
    btn.textContent = cat;
    container.appendChild(btn);
  });
  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      syncFilters();
      syncSidebar();
      applyFilters();
    });
  });
}

function syncFilters() {
  document.querySelectorAll('#filters .filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.cat === activeCategory));
}
function syncSidebar() {
  document.querySelectorAll('#sbCats .sb-cat-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.cat === activeCategory));
}

// Sidebar mobile toggle
const sbToggle = document.getElementById('sbToggle');
const sidebar  = document.getElementById('sidebar');
if (sbToggle && sidebar) {
  sbToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== sbToggle) {
      sidebar.classList.remove('open');
    }
  });
}

// Retire les attributs width/height du tag <svg> pour laisser le CSS contrôler la taille
function stripSvgDims(svgStr) {
  return svgStr.replace(/<svg\b([^>]*)>/i, (_, attrs) => {
    attrs = attrs.replace(/\s*(?:width|height)="[^"]*"/gi, '');
    return `<svg${attrs}>`;
  });
}

// ---- Rendu grille ----
function renderGrid(functions) {
  const grid  = document.getElementById('grid');
  const count = document.getElementById('countDisplay');
  count.textContent = `${functions.length} mesure${functions.length !== 1 ? 's' : ''}`;

  if (functions.length === 0) {
    grid.innerHTML = `<div class="empty"><span class="empty-icon">📭</span><p>Aucune mesure trouvée.</p></div>`;
    return;
  }

  grid.innerHTML = functions.map(fn => {
    const color = categoryColor(fn.categorie);
    const thumb = fn.preview && fn.preview.trim()
      ? `<div class="fn-svg-thumb">${stripSvgDims(fn.preview)}</div>`
      : `<div class="fn-dax-icon" style="color:${color}">DAX</div>`;
    return `
      <div class="fn-card" data-id="${fn.id}" style="--cat-color:${color}">
        <div class="fn-card-top">
          <div class="fn-card-info">
            <div class="fn-cat">${escHtml(fn.categorie || 'Général')}</div>
            <div class="fn-name">${escHtml(fn.nom)}</div>
            <div class="fn-desc">${escHtml(fn.description || '')}</div>
          </div>
          ${thumb}
        </div>
        <div class="fn-footer">
          <span class="fn-date">${formatDate(fn.created_at)}</span>
          <span class="fn-arrow">→</span>
        </div>
      </div>`;
  }).join('');

  grid.querySelectorAll('.fn-card').forEach(card => {
    card.addEventListener('click', () => {
      const fn = allFunctions.find(f => f.id === card.dataset.id);
      if (fn) openModal(fn);
    });
  });
}

// ---- Filtrage ----
function applyFilters() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  let filtered = allFunctions.filter(typeFilter[activeType]);
  if (activeCategory !== 'all')      filtered = filtered.filter(f => f.categorie === activeCategory);
  if (activeSousCategorie !== 'all') filtered = filtered.filter(f => f.sous_categorie === activeSousCategorie);

  if (q) filtered = filtered.filter(f =>
    f.nom.toLowerCase().includes(q) ||
    (f.description || '').toLowerCase().includes(q) ||
    (f.code || '').toLowerCase().includes(q)
  );

  const tableSection = document.getElementById('tableSection');
  const imageSection = document.getElementById('imageSection');

  if (activeType === 'svg') {
    if (tableSection) tableSection.style.display = 'none';
    if (imageSection) imageSection.style.display = '';
    renderImageSection(filtered);
  } else {
    if (imageSection) imageSection.style.display = 'none';
    if (tableSection) tableSection.style.display = '';
    renderGrid(filtered);
  }
}
const searchInputEl = document.getElementById('searchInput');
searchInputEl.addEventListener('input', () => {
  applyFilters();
});

// ---- Générateurs SVG ----
const SVG_GENERATORS = {
  'Jauge Basic Table': {
    params: [
      { id: 'val', label: 'Progression', type: 'range', min: 0, max: 1, step: 0.01, default: 0.75, fmt: v => Math.round(v*100)+'%' },
      { id: 'bg',  label: 'Couleur fond',  type: 'color', default: '#FFE2E2' },
      { id: 'bar', label: 'Couleur barre', type: 'color', default: '#CC0000' },
    ],
    render: p => `<svg width="227" height="22" viewBox="0 0 227 22" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="227" height="22" rx="11" fill="${p.bg}"/><rect x="0" y="0" width="${Math.round(p.val*227)}" height="22" rx="11" fill="${p.bar}"/></svg>`
  },
  'Jauge Couleur Dynamique': {
    params: [
      { id: 'val', label: 'Atteinte objectif', type: 'range', min: 0, max: 1, step: 0.01, default: 0.85, fmt: v => Math.round(v*100)+'%' },
    ],
    render: p => {
      const c = p.val >= 0.8 ? '#22C55E' : p.val >= 0.5 ? '#F59E0B' : '#EF4444';
      return `<svg width="227" height="22" viewBox="0 0 227 22" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="227" height="22" rx="11" fill="#F0F0F0"/><rect x="0" y="0" width="${Math.round(p.val*227)}" height="22" rx="11" fill="${c}"/></svg>`;
    }
  },
  'Feux Tricolores': {
    params: [
      { id: 'val', label: 'Atteinte', type: 'range', min: 0, max: 1, step: 0.01, default: 0.85, fmt: v => Math.round(v*100)+'%' },
    ],
    render: p => {
      const r = p.val < 0.5 ? '#EF4444' : '#FECACA';
      const o = (p.val >= 0.5 && p.val < 0.8) ? '#F59E0B' : '#FDE68A';
      const g = p.val >= 0.8 ? '#22C55E' : '#BBF7D0';
      return `<svg width="72" height="24" viewBox="0 0 72 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="72" height="24" rx="12" fill="#1F2937"/><circle cx="16" cy="12" r="7" fill="${r}"/><circle cx="36" cy="12" r="7" fill="${o}"/><circle cx="56" cy="12" r="7" fill="${g}"/></svg>`;
    }
  },
  'Badge KPI': {
    params: [
      { id: 'val', label: 'Ventes réalisées', type: 'number', min: 0, default: 87000 },
      { id: 'obj', label: 'Objectif',          type: 'number', min: 1, default: 100000 },
    ],
    render: p => {
      const ratio = p.obj > 0 ? p.val / p.obj : 0;
      const c = ratio >= 1 ? '#22C55E' : ratio >= 0.7 ? '#F59E0B' : '#EF4444';
      return `<svg width="64" height="26" viewBox="0 0 64 26" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="26" rx="13" fill="${c}"/><text x="32" y="18" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="white">${Math.round(ratio*100)}%</text></svg>`;
    }
  },
  'Cercle de Progression': {
    params: [
      { id: 'val', label: 'Atteinte', type: 'range', min: 0, max: 1, step: 0.01, default: 0.75, fmt: v => Math.round(v*100)+'%' },
      { id: 'color', label: 'Couleur arc', type: 'color', default: '#6366F1' },
    ],
    render: p => {
      const circ = 188.5;
      const offset = (1 - Math.min(Math.max(p.val,0),1)) * circ;
      return `<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="30" fill="none" stroke="#E5E7EB" stroke-width="7"/><circle cx="40" cy="40" r="30" fill="none" stroke="${p.color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${offset.toFixed(1)}" transform="rotate(-90 40 40)"/><text x="40" y="45" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="#374151">${Math.round(p.val*100)}%</text></svg>`;
    }
  },
  'Bullet Chart': {
    params: [
      { id: 'val', label: 'Réalisé',   type: 'number', min: 0, default: 115000 },
      { id: 'obj', label: 'Objectif',  type: 'number', min: 1, default: 120000 },
      { id: 'color', label: 'Couleur barre', type: 'color', default: '#6366F1' },
    ],
    render: p => {
      const max = p.obj * 1.2;
      const lV = Math.round(Math.min(p.val/max,1)*200);
      const lO = Math.round(Math.min(p.obj/max,1)*200);
      return `<svg width="220" height="32" viewBox="0 0 220 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="9" width="200" height="14" rx="3" fill="#E5E7EB"/><rect x="10" y="11" width="${lV}" height="10" rx="3" fill="${p.color}"/><rect x="${10+lO-1}" y="5" width="3" height="22" rx="1" fill="#1F2937"/></svg>`;
    }
  },
  'Mini Sparkline Barres': {
    params: [
      { id: 'v1', label: 'Mois -4',    type: 'number', min: 0, default: 80 },
      { id: 'v2', label: 'Mois -3',    type: 'number', min: 0, default: 65 },
      { id: 'v3', label: 'Mois -2',    type: 'number', min: 0, default: 90 },
      { id: 'v4', label: 'Mois -1',    type: 'number', min: 0, default: 72 },
      { id: 'v5', label: 'Mois actuel',type: 'number', min: 0, default: 88 },
    ],
    render: p => {
      const vals = [p.v1,p.v2,p.v3,p.v4,p.v5];
      const mx = Math.max(...vals) || 1;
      const colors = ['#C7D2FE','#A5B4FC','#818CF8','#6366F1','#4F46E5'];
      const bars = vals.map((v,i) => {
        const h = Math.max(Math.round((v/mx)*28),4);
        return `<rect x="${2+i*12}" y="${32-h}" width="8" height="${h}" rx="2" fill="${colors[i]}"/>`;
      }).join('');
      return `<svg width="68" height="34" viewBox="0 0 68 34" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`;
    }
  },
  'Note Étoiles': {
    params: [
      { id: 'note', label: 'Note (0–5)', type: 'range', min: 0, max: 5, step: 0.5, default: 4, fmt: v => v+'/5' },
      { id: 'color', label: 'Couleur étoile', type: 'color', default: '#F59E0B' },
    ],
    render: p => {
      const cx = [9,27,45,63,81];
      const circles = cx.map((x,i) => `<circle cx="${x}" cy="9" r="7" fill="${i < Math.round(p.note) ? p.color : '#D1D5DB'}"/>`).join('');
      return `<svg width="90" height="18" viewBox="0 0 90 18" xmlns="http://www.w3.org/2000/svg">${circles}</svg>`;
    }
  },

  'Flèche de Tendance': {
    params: [
      { id: 'val', label: 'Variation (%)', type: 'range', min: -0.5, max: 0.5, step: 0.01, default: 0.12, fmt: v => (v>0?'+':'')+Math.round(v*100)+'%' },
    ],
    render: p => {
      const c = p.val > 0.01 ? '#22C55E' : p.val < -0.01 ? '#EF4444' : '#9CA3AF';
      const path = p.val > 0.01 ? 'M12 19V5M5 12l7-7 7 7' : p.val < -0.01 ? 'M12 5v14M5 12l7 7 7-7' : 'M5 12h14';
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="${c}" opacity="0.15"/><path d="${path}" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/></svg>`;
    }
  },

  'Delta vs Période': {
    params: [
      { id: 'delta', label: 'Variation (%)', type: 'range', min: -0.5, max: 0.5, step: 0.01, default: 0.124, fmt: v => (v>=0?'+':'')+Math.round(v*1000)/10+'%' },
    ],
    render: p => {
      const c = p.delta >= 0 ? '#22C55E' : '#EF4444';
      const bg = p.delta >= 0 ? '#DCFCE7' : '#FEE2E2';
      const txt = (p.delta >= 0 ? '+' : '') + Math.round(p.delta*1000)/10 + '%';
      return `<svg width="80" height="26" viewBox="0 0 80 26" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="26" rx="6" fill="${bg}"/><text x="40" y="17" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="${c}">${txt}</text></svg>`;
    }
  },

  'Barre Empilée 2 Segments': {
    params: [
      { id: 'a', label: 'Réalisé',   type: 'number', min: 0, default: 130 },
      { id: 'b', label: 'Restant',   type: 'number', min: 0, default: 70 },
      { id: 'ca', label: 'Couleur A', type: 'color', default: '#6366F1' },
      { id: 'cb', label: 'Couleur B', type: 'color', default: '#A5B4FC' },
    ],
    render: p => {
      const total = (p.a + p.b) || 1;
      const lA = Math.round((p.a / total) * 200);
      const lB = 200 - lA;
      return `<svg width="210" height="20" viewBox="0 0 210 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="4" width="200" height="12" rx="6" fill="#E5E7EB"/><rect x="5" y="4" width="${lA}" height="12" rx="6" fill="${p.ca}"/><rect x="${5+lA}" y="4" width="${lB}" height="12" fill="${p.cb}"/></svg>`;
    }
  },

  'Score sur 10': {
    params: [
      { id: 'score', label: 'Score', type: 'range', min: 0, max: 10, step: 0.1, default: 8.4, fmt: v => v.toFixed(1) },
    ],
    render: p => {
      const c = p.score >= 8 ? '#22C55E' : p.score >= 5 ? '#F59E0B' : '#EF4444';
      return `<svg width="52" height="28" viewBox="0 0 52 28" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="52" height="28" rx="6" fill="${c}"/><text x="26" y="19" text-anchor="middle" font-family="Arial" font-size="13" font-weight="700" fill="white">${p.score.toFixed(1)}</text></svg>`;
    }
  },

  'Pastille Statut': {
    params: [
      { id: 'statut', label: 'Statut (0=Retard 0.5=Cours 1=Terminé)', type: 'range', min: 0, max: 1, step: 0.5, default: 0.5, fmt: v => v===0?'EN RETARD':v===1?'TERMINÉ':'EN COURS' },
    ],
    render: p => {
      const labels = { 0: 'EN RETARD', 0.5: 'EN COURS', 1: 'TERMINÉ' };
      const colors = { 0: '#EF4444', 0.5: '#3B82F6', 1: '#22C55E' };
      const bgs    = { 0: '#FEE2E2', 0.5: '#DBEAFE', 1: '#DCFCE7' };
      const key = p.statut === 0 ? 0 : p.statut >= 1 ? 1 : 0.5;
      return `<svg width="76" height="22" viewBox="0 0 76 22" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="76" height="22" rx="11" fill="${bgs[key]}"/><circle cx="11" cy="11" r="4" fill="${colors[key]}"/><text x="20" y="15" font-family="Arial" font-size="8" font-weight="700" fill="${colors[key]}">${labels[key]}</text></svg>`;
    }
  },

  'Jauge Semi-Circulaire': {
    params: [
      { id: 'val', label: 'Atteinte', type: 'range', min: 0, max: 1, step: 0.01, default: 0.75, fmt: v => Math.round(v*100)+'%' },
      { id: 'color', label: 'Couleur arc', type: 'color', default: '#6366F1' },
    ],
    render: p => {
      const arc = 113.1;
      const offset = (1 - Math.min(Math.max(p.val, 0), 1)) * arc;
      return `<svg width="90" height="52" viewBox="0 0 90 52" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 45 A36 36 0 0 1 81 45" stroke="#E5E7EB" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M9 45 A36 36 0 0 1 81 45" stroke="${p.color}" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="${arc}" stroke-dashoffset="${offset.toFixed(1)}"/><text x="45" y="48" text-anchor="middle" font-family="Arial" font-size="13" font-weight="700" fill="#374151">${Math.round(p.val*100)}%</text></svg>`;
    }
  },

  'Indicateur Delta Valeur': {
    params: [
      { id: 'delta', label: 'Delta (k€)', type: 'number', default: 23.5 },
    ],
    render: p => {
      const c = p.delta >= 0 ? '#22C55E' : '#EF4444';
      const arrow = p.delta >= 0 ? '▲' : '▼';
      const txt = `${arrow} ${p.delta >= 0 ? '+' : ''}${Number(p.delta).toFixed(1)}k`;
      return `<svg width="72" height="22" viewBox="0 0 72 22" fill="none" xmlns="http://www.w3.org/2000/svg"><text x="4" y="15" font-family="Arial" font-size="11" font-weight="700" fill="${c}">${txt}</text></svg>`;
    }
  },

  'Barre de Chaleur': {
    params: [
      { id: 'ratio', label: 'Intensité', type: 'range', min: 0, max: 1, step: 0.01, default: 0.6, fmt: v => Math.round(v*100)+'%' },
    ],
    render: p => {
      const g = Math.round(255 * (1 - p.ratio));
      const b = Math.round(255 * (1 - p.ratio));
      const hex = '#FF' + g.toString(16).padStart(2,'0') + b.toString(16).padStart(2,'0');
      return `<svg width="80" height="30" viewBox="0 0 80 30" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="30" fill="${hex}"/></svg>`;
    }
  },

  'Mini Courbe Tendance': {
    params: [
      { id: 'v1', label: 'M-5', type: 'number', min: 0, default: 60 },
      { id: 'v2', label: 'M-4', type: 'number', min: 0, default: 75 },
      { id: 'v3', label: 'M-3', type: 'number', min: 0, default: 55 },
      { id: 'v4', label: 'M-2', type: 'number', min: 0, default: 80 },
      { id: 'v5', label: 'M-1', type: 'number', min: 0, default: 70 },
      { id: 'v6', label: 'M actuel', type: 'number', min: 0, default: 90 },
    ],
    render: p => {
      const vals = [p.v1,p.v2,p.v3,p.v4,p.v5,p.v6];
      const mx = Math.max(...vals), mn = Math.min(...vals), rng = mx - mn || 1;
      const xs = [5,19,33,47,61,75];
      const pts = vals.map((v,i) => `${xs[i]},${Math.round(28 - ((v-mn)/rng)*24)}`).join(' ');
      const lastY = Math.round(28 - ((p.v6-mn)/rng)*24);
      return `<svg width="80" height="34" viewBox="0 0 80 34" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="${pts}" fill="none" stroke="#6366F1" stroke-width="2" stroke-linejoin="round"/><circle cx="75" cy="${lastY}" r="3" fill="#6366F1"/></svg>`;
    }
  },

  'Alerte Seuil': {
    params: [
      { id: 'val',   label: 'Valeur',  type: 'number', min: 0, default: 120 },
      { id: 'seuil', label: 'Seuil',   type: 'number', min: 0, default: 100 },
    ],
    render: p => {
      const over = p.val > p.seuil;
      const c = over ? '#EF4444' : '#22C55E';
      const bg = over ? '#FEE2E2' : '#DCFCE7';
      const icon = over
        ? 'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'
        : 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3';
      return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="${bg}"/><path d="${icon}" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>`;
    }
  },

  'Anneau Compact Table': {
    params: [
      { id: 'val',   label: 'Profit / Atteinte', type: 'range', min: -0.1, max: 1, step: 0.01, default: 0.42, fmt: v => Math.round(v*100)+'%' },
      { id: 'color', label: 'Couleur arc', type: 'color', default: '#AB0000' },
    ],
    render: p => {
      const R = 10, C = 2 * Math.PI * R;
      const pct = Math.min(1, Math.max(0, p.val));
      const dash = C * pct, gap = C - dash;
      const txt = Math.round(p.val * 100) + '%';
      return `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="28"><circle cx="18" cy="14" r="${R}" fill="none" stroke="#C5C5C5" stroke-width="4"/><circle cx="18" cy="14" r="${R}" fill="none" stroke="${p.color}" stroke-width="4" stroke-linecap="round" transform="rotate(-90 18 14)" stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}"/><text x="34" y="18" font-family="Segoe UI,Arial" font-size="12" font-weight="700" fill="${p.color}">${txt}</text></svg>`;
    }
  },

  'Anneau Performance': {
    params: [
      { id: 'profit', label: 'Marge / Profit', type: 'range', min: -0.1, max: 0.2, step: 0.005, default: 0.07, fmt: v => (v>=0?'+':'')+Math.round(v*100)+'%' },
    ],
    render: p => {
      const color =
        p.profit >= 0.10 ? '#748678' :
        p.profit >= 0.05 ? '#3b82f6' :
        p.profit >  0.00 ? '#6b7280' :
        p.profit >= -0.05 ? '#f59e0b' : '#ef4444';
      const R = 10, C = 2 * Math.PI * R;
      const pct = Math.min(1, Math.max(0, p.profit));
      const dash = C * pct, gap = C - dash;
      const txt = (p.profit >= 0 ? '+' : '') + Math.round(p.profit * 100) + '%';
      return `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="28"><circle cx="18" cy="14" r="${R}" fill="none" stroke="#C5C5C5" stroke-width="4"/><circle cx="18" cy="14" r="${R}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" transform="rotate(-90 18 14)" stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}"/><text x="34" y="18" font-family="Segoe UI,Arial" font-size="12" font-weight="700" fill="${color}">${txt}</text></svg>`;
    }
  },

  'Spark Area Remplie': {
    params: [
      { id: 'v1', label: 'M-5', type: 'number', min: 0, default: 60 },
      { id: 'v2', label: 'M-4', type: 'number', min: 0, default: 75 },
      { id: 'v3', label: 'M-3', type: 'number', min: 0, default: 55 },
      { id: 'v4', label: 'M-2', type: 'number', min: 0, default: 80 },
      { id: 'v5', label: 'M-1', type: 'number', min: 0, default: 70 },
      { id: 'v6', label: 'M actuel', type: 'number', min: 0, default: 90 },
      { id: 'color', label: 'Couleur', type: 'color', default: '#AB0000' },
    ],
    render: p => {
      const vals = [p.v1,p.v2,p.v3,p.v4,p.v5,p.v6];
      const mx = Math.max(...vals), mn = Math.min(...vals), rng = mx - mn || 1;
      const W = 80, H = 34, pad = 4;
      const xs = vals.map((_,i) => Math.round(pad + i * (W - pad*2) / (vals.length - 1)));
      const ys = vals.map(v => Math.round(H - pad - ((v - mn) / rng) * (H - pad*2)));
      const linePoints = xs.map((x,i) => `${x},${ys[i]}`).join(' ');
      const areaPoints = `${xs[0]},${H} ` + linePoints + ` ${xs[xs.length-1]},${H}`;
      // Parse hex color for fill opacity
      const hex = p.color.replace('#','');
      const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
      return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="${areaPoints}" fill="rgba(${r},${g},${b},0.15)"/><polyline points="${linePoints}" fill="none" stroke="${p.color}" stroke-width="2" stroke-linejoin="round"/><circle cx="${xs[xs.length-1]}" cy="${ys[ys.length-1]}" r="3" fill="${p.color}"/></svg>`;
    }
  },

  'Rangée de Puces': {
    params: [
      { id: 'val',   label: 'Progression (0–10)', type: 'range', min: 0, max: 10, step: 1, default: 7, fmt: v => v+'/10' },
      { id: 'color', label: 'Couleur active',      type: 'color', default: '#AB0000' },
    ],
    render: p => {
      const n = 10, w = 8, h = 12, gap = 4, total = n * w + (n-1) * gap;
      const squares = Array.from({length: n}, (_,i) =>
        `<rect x="${i*(w+gap)}" y="0" width="${w}" height="${h}" rx="2" fill="${i < p.val ? p.color : '#E5E7EB'}"/>`
      ).join('');
      return `<svg width="${total}" height="${h}" viewBox="0 0 ${total} ${h}" xmlns="http://www.w3.org/2000/svg">${squares}</svg>`;
    }
  },

  'Comparatif 2 Barres': {
    params: [
      { id: 'lbl1', label: 'Label A',    type: 'text',   default: 'Objectif' },
      { id: 'v1',   label: 'Valeur A',   type: 'number', min: 0, default: 115 },
      { id: 'lbl2', label: 'Label B',    type: 'text',   default: 'Réalisé' },
      { id: 'v2',   label: 'Valeur B',   type: 'number', min: 0, default: 88 },
      { id: 'c1',   label: 'Couleur A',  type: 'color',  default: '#AB0000' },
      { id: 'c2',   label: 'Couleur B',  type: 'color',  default: '#C5C5C5' },
    ],
    render: p => {
      const mx = Math.max(p.v1, p.v2, 1);
      const bw = 160;
      const l1 = Math.round((p.v1 / mx) * bw);
      const l2 = Math.round((p.v2 / mx) * bw);
      const lbl1 = String(p.lbl1 || 'A').slice(0, 10);
      const lbl2 = String(p.lbl2 || 'B').slice(0, 10);
      return `<svg width="220" height="38" viewBox="0 0 220 38" fill="none" xmlns="http://www.w3.org/2000/svg"><text x="0" y="10" font-family="Arial" font-size="8" fill="#6B7280">${lbl1}</text><rect x="0" y="13" width="${bw}" height="8" rx="4" fill="#F3F4F6"/><rect x="0" y="13" width="${l1}" height="8" rx="4" fill="${p.c1}"/><text x="${l1+4}" y="21" font-family="Arial" font-size="8" font-weight="700" fill="${p.c1}">${p.v1}</text><text x="0" y="30" font-family="Arial" font-size="8" fill="#6B7280">${lbl2}</text><rect x="0" y="32" width="${bw}" height="8" rx="4" fill="#F3F4F6"/><rect x="0" y="32" width="${l2}" height="8" rx="4" fill="${p.c2}"/><text x="${l2+4}" y="40" font-family="Arial" font-size="8" font-weight="700" fill="${p.c2}">${p.v2}</text></svg>`;
    }
  },

  'Barre Segmentée': {
    params: [
      { id: 'val',   label: 'Progression', type: 'range', min: 0, max: 1, step: 0.01, default: 0.6, fmt: v => Math.round(v*100)+'%' },
      { id: 'segs',  label: 'Nb segments', type: 'range', min: 2, max: 20, step: 1,    default: 10,  fmt: v => Math.round(v)+'' },
      { id: 'color', label: 'Couleur',     type: 'color', default: '#AB0000' },
    ],
    render: p => {
      const n = Math.round(p.segs), filled = Math.round(p.val * n);
      const W = 200, H = 16, segW = Math.floor((W - (n-1)*2) / n);
      const rects = Array.from({length: n}, (_,i) => {
        const x = i * (segW + 2);
        return `<rect x="${x}" y="0" width="${segW}" height="${H}" rx="3" fill="${i < filled ? p.color : '#E5E7EB'}"/>`;
      }).join('');
      return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
    }
  },
};

let _currentGenFn = null;

// ---- Générateur générique (parse le SVG et extrait les paramètres) ----
function buildGenericGenerator(fn) {
  const form = document.getElementById('genForm');
  const wrap = document.getElementById('genPreviewWrap');
  const svgOrig = fn.preview?.trim() || '';

  if (!svgOrig) {
    form.innerHTML = '';
    wrap.innerHTML = `<div class="svg-empty"><span>🎨</span>Aucun SVG disponible.</div>`;
    wrap._rawSvg = '';
    return;
  }

  const fields = [];
  const mods   = {};

  // ── Couleurs uniques (fill / stroke) ──
  const colorRx = /(?:fill|stroke)="(#[0-9A-Fa-f]{3,8})"/g;
  const seenC = new Map(); // color → count
  let cm;
  while ((cm = colorRx.exec(svgOrig)) !== null) {
    const c = cm[1];
    seenC.set(c, (seenC.get(c) || 0) + 1);
  }
  seenC.forEach((count, c) => {
    const id = 'c_' + c.replace('#', '');
    mods[id] = { type: 'color', original: c, current: c };
    fields.push({ id, type: 'color', label: `Couleur ${c}${count > 1 ? ' ×'+count : ''}`, default: c });
  });

  // ── Stroke-width ──
  const swM = svgOrig.match(/stroke-width="([0-9.]+)"/);
  if (swM) {
    mods['sw'] = { type: 'attr', attr: 'stroke-width', original: swM[1], current: swM[1] };
    fields.push({ id: 'sw', type: 'range', label: 'Épaisseur trait', min: 0.5, max: 12, step: 0.5, default: +swM[1], fmt: v => v });
  }

  // ── Opacity ──
  const opM = svgOrig.match(/\bopacity="([0-9.]+)"/);
  if (opM) {
    mods['op'] = { type: 'attr', attr: 'opacity', original: opM[1], current: opM[1] };
    fields.push({ id: 'op', type: 'range', label: 'Opacité', min: 0, max: 1, step: 0.05, default: +opM[1], fmt: v => Math.round(v*100)+'%' });
  }

  // ── Font-size ──
  const fsM = svgOrig.match(/font-size="([0-9.]+)"/);
  if (fsM) {
    mods['fs'] = { type: 'attr', attr: 'font-size', original: fsM[1], current: fsM[1] };
    fields.push({ id: 'fs', type: 'range', label: 'Taille texte', min: 6, max: 36, step: 1, default: +fsM[1], fmt: v => v+'px' });
  }

  // ── Rx (arrondi) ──
  const rxM = svgOrig.match(/\brx="([0-9.]+)"/);
  if (rxM) {
    mods['rx'] = { type: 'attr', attr: 'rx', original: rxM[1], current: rxM[1] };
    fields.push({ id: 'rx', type: 'range', label: 'Arrondi', min: 0, max: 20, step: 1, default: +rxM[1], fmt: v => v+'px' });
  }

  // ── Stroke-linecap (dropdown) ──
  const lcM = svgOrig.match(/stroke-linecap="([^"]+)"/);
  if (lcM) {
    mods['lc'] = { type: 'attr', attr: 'stroke-linecap', original: lcM[1], current: lcM[1] };
    fields.push({ id: 'lc', type: 'select', label: 'Extrémités', options: ['round','square','butt'], default: lcM[1] });
  }

  // ── Stroke-linejoin (dropdown) ──
  const ljM = svgOrig.match(/stroke-linejoin="([^"]+)"/);
  if (ljM) {
    mods['lj'] = { type: 'attr', attr: 'stroke-linejoin', original: ljM[1], current: ljM[1] };
    fields.push({ id: 'lj', type: 'select', label: 'Jointures', options: ['round','miter','bevel'], default: ljM[1] });
  }

  // ── Rendu du formulaire ──
  if (fields.length === 0) {
    form.innerHTML = `<p class="gen-no-support">Aucun paramètre modifiable détecté dans ce SVG.</p>`;
  } else {
    form.innerHTML = fields.map(f => {
      if (f.type === 'color') return `
        <div class="gen-field">
          <label>${f.label}</label>
          <div class="gen-field-row">
            <input type="color" data-id="${f.id}" value="${f.default}">
            <span class="gen-val-badge" id="badge-${f.id}">${f.default}</span>
          </div>
        </div>`;
      if (f.type === 'range') return `
        <div class="gen-field">
          <label>${f.label}</label>
          <div class="gen-field-row">
            <input type="range" data-id="${f.id}" min="${f.min}" max="${f.max}" step="${f.step}" value="${f.default}">
            <span class="gen-val-badge" id="badge-${f.id}">${f.fmt ? f.fmt(f.default) : f.default}</span>
          </div>
        </div>`;
      if (f.type === 'select') return `
        <div class="gen-field">
          <label>${f.label}</label>
          <select data-id="${f.id}" class="gen-select">
            ${f.options.map(o => `<option${o===f.default?' selected':''}>${o}</option>`).join('')}
          </select>
        </div>`;
    }).join('');
  }

  function applyAndPreview() {
    let svg = svgOrig;
    for (const mod of Object.values(mods)) {
      if (mod.type === 'color') {
        svg = svg.replaceAll(mod.original, mod.current);
      } else {
        svg = svg.replaceAll(`${mod.attr}="${mod.original}"`, `${mod.attr}="${mod.current}"`);
      }
    }
    wrap.innerHTML = stripSvgDims(svg);
    wrap._rawSvg = svg;
  }

  form.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', () => {
      const mod = mods[el.dataset.id];
      const field = fields.find(f => f.id === el.dataset.id);
      if (!mod) return;
      mod.current = el.value;
      const badge = document.getElementById('badge-' + el.dataset.id);
      if (badge) badge.textContent = field?.fmt ? field.fmt(parseFloat(el.value)) : el.value;
      applyAndPreview();
    });
  });

  applyAndPreview();
}

function buildGenerator(fn) {
  const genBtn = document.getElementById('tabGenBtn');
  genBtn.style.display = ''; // toujours visible
  _currentGenFn = fn;

  const gen = SVG_GENERATORS[fn.nom];

  if (gen) {
    // ── Générateur avec paramètres ──
    const form = document.getElementById('genForm');
    const vals = {};
    gen.params.forEach(p => { vals[p.id] = p.default; });

    function updatePreview() {
      const svgStr = gen.render(vals);
      document.getElementById('genPreviewWrap').innerHTML = stripSvgDims(svgStr);
      document.getElementById('genPreviewWrap')._rawSvg = svgStr;
    }

    form.innerHTML = gen.params.map(p => {
      if (p.type === 'range') {
        return `<div class="gen-field">
          <label>${p.label}</label>
          <div class="gen-field-row">
            <input type="range" data-id="${p.id}" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.default}">
            <span class="gen-val-badge" id="badge-${p.id}">${p.fmt ? p.fmt(p.default) : p.default}</span>
          </div>
        </div>`;
      } else if (p.type === 'color') {
        return `<div class="gen-field">
          <label>${p.label}</label>
          <div class="gen-field-row">
            <input type="color" data-id="${p.id}" value="${p.default}">
            <span class="gen-val-badge" id="badge-${p.id}">${p.default}</span>
          </div>
        </div>`;
      } else if (p.type === 'text') {
        return `<div class="gen-field">
          <label>${p.label}</label>
          <input type="text" data-id="${p.id}" value="${p.default}" style="width:100%">
        </div>`;
      } else {
        return `<div class="gen-field">
          <label>${p.label}</label>
          <input type="number" data-id="${p.id}" min="${p.min ?? 0}" value="${p.default}">
        </div>`;
      }
    }).join('');

    form.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        const param = gen.params.find(p => p.id === input.dataset.id);
        vals[input.dataset.id] = input.type === 'number' ? parseFloat(input.value) || 0
          : input.type === 'range' ? parseFloat(input.value) : input.value;
        const badge = document.getElementById('badge-' + input.dataset.id);
        if (badge) badge.textContent = param?.fmt ? param.fmt(vals[input.dataset.id]) : input.value;
        updatePreview();
      });
    });

    updatePreview();

  } else {
    // ── Générateur générique (extraction automatique des paramètres) ──
    buildGenericGenerator(fn);
  }
}

// ---- Modal ----
function openModal(fn) {
  const color = categoryColor(fn.categorie);
  const cat = document.getElementById('modalCategory');
  cat.textContent = fn.categorie || 'Général';
  cat.style.color = color;
  document.getElementById('modalName').textContent = fn.nom;
  document.getElementById('modalDesc').textContent = fn.description || '';
  document.getElementById('modalCode').textContent = fn.code || '';

  const svgWrap = document.getElementById('svgPreviewWrap');
  svgWrap.innerHTML = fn.preview && fn.preview.trim()
    ? fn.preview
    : `<div class="svg-empty"><span>🎨</span>Aucun aperçu.</div>`;

  buildGenerator(fn);
  switchTab('svg');

  const btn = document.getElementById('copyBtn');
  btn.classList.remove('copied');
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copier`;

  document.getElementById('proposeEditBtn').href = `submit.html?edit=${fn.id}`;

  // Bouton "Ouvrir dans l'éditeur Deneb" — visible uniquement pour les visuels deneb
  const denebBtn = document.getElementById('openInDenebBtn');
  if (fn.type === 'deneb') {
    denebBtn.style.display = '';
    denebBtn.onclick = () => {
      sessionStorage.setItem('cv-deneb-from-lib-spec', fn.code || '');
      sessionStorage.setItem('cv-deneb-from-lib-data', fn.sample_data || '[]');
      location.href = 'deneb-editor.html?from=lib';
    };
  } else {
    denebBtn.style.display = 'none';
    denebBtn.onclick = null;
  }

  document.getElementById('modalOverlay').classList.add('open');
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === 'tab' + tab.charAt(0).toUpperCase() + tab.slice(1));
  });
}
document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }

// ---- Copier DAX ----
document.getElementById('copyBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('modalCode').textContent).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.classList.add('copied');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Copié !`;
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copier`;
    }, 2000);
  });
});

// ---- Copier SVG généré ----
document.getElementById('genCopyBtn').addEventListener('click', () => {
  const wrap = document.getElementById('genPreviewWrap');
  const svg = wrap._rawSvg || wrap.innerHTML;
  navigator.clipboard.writeText(svg).then(() => {
    const btn = document.getElementById('genCopyBtn');
    btn.classList.add('copied');
    btn.textContent = 'Copié !';
    setTimeout(() => { btn.classList.remove('copied'); btn.textContent = 'Copier le code'; }, 2000);
  });
});

// ---- Helpers ----
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
}

loadFunctions();
