// ===== APP.JS — CustomViz DAX Library =====

let allFunctions = [];
let activeCategory = 'all';

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
    .from('fonctions').select('*').order('created_at', { ascending: false });

  if (error) {
    document.getElementById('grid').innerHTML =
      `<div class="empty"><span class="empty-icon">⚠️</span><p>${error.message}</p></div>`;
    document.getElementById('carouselTrack').innerHTML = '';
    return;
  }

  allFunctions = data || [];

  // Stats
  document.getElementById('statTotal').textContent = allFunctions.length;
  const cats = [...new Set(allFunctions.map(f => f.categorie).filter(Boolean))];
  document.getElementById('statCats').textContent = cats.length;

  buildSidebarCats(cats);
  buildFilters(cats);
  renderGrid(allFunctions);
}

// ---- Sidebar catégories ----
function buildSidebarCats(cats) {
  const container = document.getElementById('sbCats');
  if (!container) return;

  // Bouton "Toutes"
  const allBtn = document.createElement('button');
  allBtn.className = 'sb-cat-btn active';
  allBtn.dataset.cat = 'all';
  allBtn.innerHTML = `
    <span class="sb-cat-dot" style="background:var(--accent)"></span>
    Toutes
    <span class="sb-cat-count">${allFunctions.length}</span>`;
  container.appendChild(allBtn);

  cats.forEach(cat => {
    const count = allFunctions.filter(f => f.categorie === cat).length;
    const color = categoryColor(cat);
    const btn = document.createElement('button');
    btn.className = 'sb-cat-btn';
    btn.dataset.cat = cat;
    btn.innerHTML = `
      <span class="sb-cat-dot" style="background:${color}"></span>
      ${escHtml(cat)}
      <span class="sb-cat-count">${count}</span>`;
    container.appendChild(btn);
  });

  container.querySelectorAll('.sb-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      container.querySelectorAll('.sb-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      syncFilters();
      applyFilters();
    });
  });
}

// ---- Filtres top ----
function buildFilters(cats) {
  const container = document.getElementById('filters');
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
    const thumb = fn.svg_preview && fn.svg_preview.trim()
      ? `<div class="fn-svg-thumb">${stripSvgDims(fn.svg_preview)}</div>`
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
  let filtered = allFunctions;
  if (activeCategory !== 'all') filtered = filtered.filter(f => f.categorie === activeCategory);
  if (q) filtered = filtered.filter(f =>
    f.nom.toLowerCase().includes(q) ||
    (f.description || '').toLowerCase().includes(q) ||
    (f.code || '').toLowerCase().includes(q)
  );
  renderGrid(filtered);
}
document.getElementById('searchInput').addEventListener('input', applyFilters);

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
  svgWrap.innerHTML = fn.svg_preview && fn.svg_preview.trim()
    ? fn.svg_preview
    : `<div class="svg-empty"><span>🎨</span>Aucun aperçu SVG.</div>`;

  switchTab('dax');

  const btn = document.getElementById('copyBtn');
  btn.classList.remove('copied');
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copier`;

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

// ---- Copier ----
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

// ---- Helpers ----
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
}

loadFunctions();
