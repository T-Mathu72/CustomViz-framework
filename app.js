// ===== APP.JS — Page bibliothèque =====

let allFunctions = [];
let activeCategory = 'all';

// ---- Chargement depuis Supabase ----
async function loadFunctions() {
  const grid = document.getElementById('grid');

  const { data, error } = await db
    .from('fonctions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    grid.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><p>Erreur de chargement : ${error.message}</p></div>`;
    return;
  }

  allFunctions = data || [];
  buildFilters();
  renderGrid(allFunctions);
}

// ---- Filtres de catégorie ----
function buildFilters() {
  const cats = [...new Set(allFunctions.map(f => f.categorie).filter(Boolean))].sort();
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
      container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilters();
    });
  });
}

// ---- Affichage de la grille ----
function renderGrid(functions) {
  const grid = document.getElementById('grid');
  const count = document.getElementById('countDisplay');
  count.textContent = `${functions.length} fonction${functions.length !== 1 ? 's' : ''}`;

  if (functions.length === 0) {
    grid.innerHTML = `<div class="empty"><div class="empty-icon">📭</div><p>Aucune fonction trouvée.</p></div>`;
    return;
  }

  grid.innerHTML = functions.map(fn => `
    <div class="fn-card" data-id="${fn.id}">
      <div class="fn-cat">${fn.categorie || 'Général'}</div>
      <div class="fn-name">${escHtml(fn.nom)}</div>
      <div class="fn-desc">${escHtml(fn.description || '')}</div>
      <div class="fn-footer">
        <span class="fn-date">${formatDate(fn.created_at)}</span>
        <span class="fn-arrow">→</span>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.fn-card').forEach(card => {
    card.addEventListener('click', () => {
      const fn = allFunctions.find(f => f.id === card.dataset.id);
      if (fn) openModal(fn);
    });
  });
}

// ---- Filtrage combiné recherche + catégorie ----
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
  document.getElementById('modalCategory').textContent = fn.categorie || 'Général';
  document.getElementById('modalName').textContent = fn.nom;
  document.getElementById('modalDesc').textContent = fn.description || '';
  document.getElementById('modalCode').textContent = fn.code || '';
  document.getElementById('copyBtn').classList.remove('copied');
  document.getElementById('copyBtn').innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
    Copier le code`;
  document.getElementById('modalOverlay').classList.add('open');
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

// ---- Copier le code ----
document.getElementById('copyBtn').addEventListener('click', () => {
  const code = document.getElementById('modalCode').textContent;
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.classList.add('copied');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
      Copié !`;
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Copier le code`;
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

// ---- Init ----
loadFunctions();
