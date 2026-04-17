// ===== ADMIN.JS — CustomViz =====

let allApproved = [];
let pendingDeleteId = null;

// ============================================================
//  AUTH
// ============================================================
function isAdmin() {
  return sessionStorage.getItem('cv-admin') === '1';
}

function showAuthOverlay() {
  document.getElementById('authOverlay').classList.add('open');
  document.getElementById('authError').textContent = '';
  document.getElementById('authInput').value = '';
}

function hideAuthOverlay() {
  document.getElementById('authOverlay').classList.remove('open');
}

document.getElementById('authSubmitBtn').addEventListener('click', checkPassword);
document.getElementById('authInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkPassword();
});

function checkPassword() {
  const val = document.getElementById('authInput').value;
  if (val === ADMIN_PASSWORD) {
    sessionStorage.setItem('cv-admin', '1');
    hideAuthOverlay();
    init();
  } else {
    document.getElementById('authError').textContent = 'Mot de passe incorrect.';
    document.getElementById('authInput').value = '';
    document.getElementById('authInput').focus();
  }
}

// ============================================================
//  INIT
// ============================================================
function init() {
  loadPendingList();
  loadAdminList();
}

// ============================================================
//  PENDING (en attente de validation)
// ============================================================
async function loadPendingList() {
  const { data, error } = await db
    .from('fonctions')
    .select('id, nom, categorie, created_at')
    .eq('statut', 'pending')
    .order('created_at', { ascending: true });

  const container = document.getElementById('pendingList');
  if (error) {
    container.innerHTML = `<p style="color:var(--danger);font-family:var(--font-mono);font-size:.82rem">Erreur : ${error.message}</p>`;
    return;
  }

  const badge = document.getElementById('pendingBadge');
  const count = (data || []).length;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'inline-flex' : 'none';

  if (count === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);padding:1rem 0;font-size:.85rem">Aucune mesure en attente.</p>`;
    return;
  }

  container.innerHTML = data.map(fn => `
    <div class="admin-item pending-item pending-item-row" data-id="${fn.id}" style="cursor:pointer">
      <div class="admin-item-info">
        <div class="admin-item-name">${escHtml(fn.nom)}</div>
        <div class="admin-item-cat">${fn.categorie || 'Général'} · <span class="badge-pending">En attente</span></div>
      </div>
      <span class="pending-arrow">→</span>
    </div>
  `).join('');

  container.querySelectorAll('.pending-item-row').forEach(row => {
    row.addEventListener('click', () => openProposalModal(row.dataset.id));
  });
}

// ============================================================
//  PROPOSAL DETAIL MODAL
// ============================================================
let activeProposalId = null;

async function openProposalModal(id, mode = 'pending') {
  activeProposalId = id;
  const { data, error } = await db
    .from('fonctions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return;

  document.getElementById('propModalCat').textContent  = data.categorie || 'Général';
  document.getElementById('propModalName').textContent = data.nom;
  document.getElementById('propModalDesc').textContent = data.description || '';
  document.getElementById('propModalCode').textContent = data.code || '';

  const svgWrap = document.getElementById('propSvgPreview');
  svgWrap.innerHTML = data.svg_preview
    ? data.svg_preview
    : `<span style="color:var(--text-muted);font-family:var(--font-mono);font-size:.78rem">Aucun aperçu SVG fourni.</span>`;

  // Actions selon le mode
  const isPending  = mode === 'pending';
  document.getElementById('propRejectBtn').style.display  = isPending ? '' : 'none';
  document.getElementById('propApproveBtn').style.display = isPending ? '' : 'none';
  document.getElementById('propDeleteBtn').style.display  = isPending ? 'none' : '';

  // Reset tabs
  document.querySelectorAll('[data-ptab]').forEach(b => b.classList.remove('active'));
  document.getElementById('propTabSvg').classList.add('active');
  document.getElementById('propTabDax').classList.remove('active');
  document.querySelector('[data-ptab="svg"]').classList.add('active');

  document.getElementById('proposalOverlay').classList.add('open');
}

function closeProposalModal() {
  document.getElementById('proposalOverlay').classList.remove('open');
  activeProposalId = null;
}

// Tabs inside proposal modal
document.querySelectorAll('[data-ptab]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-ptab]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.ptab;
    document.getElementById('propTabSvg').classList.toggle('active', tab === 'svg');
    document.getElementById('propTabDax').classList.toggle('active', tab === 'dax');
  });
});

// Copy DAX
document.getElementById('propCopyBtn').addEventListener('click', () => {
  const code = document.getElementById('propModalCode').textContent;
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.getElementById('propCopyBtn');
    btn.textContent = '✓ Copié';
    setTimeout(() => { btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copier`; }, 1500);
  });
});

// Approve / Reject from modal
document.getElementById('propApproveBtn').addEventListener('click', async () => {
  if (!activeProposalId) return;
  await approveMeasure(activeProposalId);
  closeProposalModal();
});

document.getElementById('propRejectBtn').addEventListener('click', async () => {
  if (!activeProposalId) return;
  await rejectMeasure(activeProposalId);
  closeProposalModal();
});

document.getElementById('propDeleteBtn').addEventListener('click', () => {
  pendingDeleteId = activeProposalId;
  closeProposalModal();
  document.getElementById('deleteOverlay').classList.add('open');
});

document.getElementById('propModalClose').addEventListener('click', closeProposalModal);
document.getElementById('proposalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeProposalModal();
});

async function approveMeasure(id) {
  const { error } = await db
    .from('fonctions')
    .update({ statut: 'approved' })
    .eq('id', id);
  if (!error) { loadPendingList(); loadAdminList(); }
}

async function rejectMeasure(id) {
  const { error } = await db.from('fonctions').delete().eq('id', id);
  if (!error) loadPendingList();
}

// ============================================================
//  APPROVED LIST
// ============================================================
async function loadAdminList() {
  const { data, error } = await db
    .from('fonctions')
    .select('id, nom, categorie, created_at')
    .eq('statut', 'approved')
    .order('created_at', { ascending: false });

  if (error) {
    document.getElementById('adminList').innerHTML =
      `<p style="color:var(--danger);font-family:var(--font-mono);font-size:.82rem">Erreur : ${error.message}</p>`;
    return;
  }
  allApproved = data || [];
  renderAdminList(allApproved);
}

function renderAdminList(list) {
  const container = document.getElementById('adminList');
  if (list.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);padding:1rem 0;font-size:.85rem">Aucune mesure approuvée.</p>`;
    return;
  }
  container.innerHTML = list.map(fn => `
    <div class="admin-item pending-item-row" data-id="${fn.id}" style="cursor:pointer">
      <div class="admin-item-info">
        <div class="admin-item-name">${escHtml(fn.nom)}</div>
        <div class="admin-item-cat">${fn.categorie || 'Général'}</div>
      </div>
      <span class="pending-arrow">→</span>
    </div>
  `).join('');

  container.querySelectorAll('.pending-item-row').forEach(row => {
    row.addEventListener('click', () => openProposalModal(row.dataset.id, 'approved'));
  });
}

// ---- Recherche ----
document.getElementById('adminSearch').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  renderAdminList(allApproved.filter(f =>
    f.nom.toLowerCase().includes(q) ||
    (f.categorie || '').toLowerCase().includes(q)
  ));
});


// ============================================================
//  SUPPRESSION
// ============================================================
document.getElementById('deleteConfirmBtn').addEventListener('click', async () => {
  if (!pendingDeleteId) return;
  const { error } = await db.from('fonctions').delete().eq('id', pendingDeleteId);
  document.getElementById('deleteOverlay').classList.remove('open');
  pendingDeleteId = null;
  if (!error) loadAdminList();
});

document.getElementById('deleteCancel').addEventListener('click', closeDeleteModal);
document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteModal);
document.getElementById('deleteOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeDeleteModal();
});

function closeDeleteModal() {
  document.getElementById('deleteOverlay').classList.remove('open');
  pendingDeleteId = null;
}

// ============================================================
//  UTILS
// ============================================================
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ---- Mobile sidebar ----
const sbToggle = document.getElementById('sbToggle');
const sidebar  = document.getElementById('sidebar');
if (sbToggle && sidebar) {
  sbToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== sbToggle)
      sidebar.classList.remove('open');
  });
}

// ============================================================
//  START
// ============================================================
if (isAdmin()) {
  init();
} else {
  showAuthOverlay();
}
