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
    .select('id, nom, categorie, created_at, original_id')
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
        <div class="admin-item-cat">
          ${fn.categorie || 'Général'} ·
          ${fn.original_id
            ? `<span class="badge-modification">Modification</span>`
            : `<span class="badge-pending">En attente</span>`}
        </div>
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

  // Actions selon le mode
  const isPending  = mode === 'pending';
  document.getElementById('propRejectBtn').style.display  = isPending ? '' : 'none';
  document.getElementById('propApproveBtn').style.display = isPending ? '' : 'none';
  document.getElementById('propDeleteBtn').style.display  = isPending ? 'none' : '';

  // Rendu normal ou diff
  if (data.original_id) {
    const { data: original } = await db.from('fonctions').select('*').eq('id', data.original_id).single();
    original ? renderDiff(original, data) : renderNormal(data);
  } else {
    renderNormal(data);
  }

  // Reset tabs
  document.querySelectorAll('[data-ptab]').forEach(b => b.classList.remove('active'));
  document.getElementById('propTabSvg').classList.add('active');
  document.getElementById('propTabDax').classList.remove('active');
  document.querySelector('[data-ptab="svg"]').classList.add('active');

  document.getElementById('proposalOverlay').classList.add('open');
}

// ── Rendu normal (nouvelle proposition) ──────────────────────────────────
function renderNormal(data) {
  document.getElementById('propFieldsDiff').style.display = 'none';
  document.getElementById('propFieldsDiff').innerHTML = '';

  document.getElementById('propSvgDiff').innerHTML = data.preview?.trim()
    ? `<div class="svg-preview-wrap">${data.preview}</div>`
    : `<div class="svg-preview-wrap"><span style="color:var(--text-muted);font-family:var(--font-mono);font-size:.78rem">Aucun aperçu fourni.</span></div>`;

  document.getElementById('propCodeDiff').innerHTML = buildCodeBlock(data.code || '');
}

// ── Rendu diff (proposition de modification) ──────────────────────────────
function renderDiff(original, proposal) {
  const LABELS = {
    nom: 'Nom', type: 'Type', categorie: 'Catégorie',
    sous_categorie: 'Sous-catégorie', description: 'Description'
  };
  const fields      = Object.keys(LABELS);
  const changed     = fields.filter(f => (original[f] || '') !== (proposal[f] || ''));
  const unchanged   = fields.filter(f => (original[f] || '') === (proposal[f] || '') && original[f]);

  const fieldsDiff = document.getElementById('propFieldsDiff');
  if (changed.length > 0) {
    fieldsDiff.style.display = '';
    fieldsDiff.innerHTML = `<div class="diff-fields">
      ${changed.map(f => `
        <div class="diff-field">
          <span class="diff-field-label">${LABELS[f]}</span>
          <span class="diff-old">${escHtml(original[f] || '—')}</span>
          <span class="diff-arrow">→</span>
          <span class="diff-new">${escHtml(proposal[f] || '—')}</span>
        </div>`).join('')}
      ${unchanged.length > 0 ? `<div class="diff-unchanged-note">${unchanged.length} champ${unchanged.length > 1 ? 's' : ''} inchangé${unchanged.length > 1 ? 's' : ''}</div>` : ''}
    </div>`;
  } else {
    fieldsDiff.style.display = 'none';
    fieldsDiff.innerHTML = '';
  }

  // Aperçu avant / après
  const previewChanged = (original.preview || '') !== (proposal.preview || '');
  const previewOld = original.preview?.trim()  || '';
  const previewNew = proposal.preview?.trim()  || '';
  const emptyMsg   = `<span style="color:var(--text-muted);font-family:var(--font-mono);font-size:.78rem">Aucun aperçu</span>`;

  document.getElementById('propSvgDiff').innerHTML = previewChanged
    ? `<div class="diff-preview-cols">
        <div class="diff-preview-col diff-col-before">
          <div class="diff-col-label">Avant</div>
          <div class="svg-preview-wrap">${previewOld || emptyMsg}</div>
        </div>
        <div class="diff-preview-col diff-col-after">
          <div class="diff-col-label">Après</div>
          <div class="svg-preview-wrap">${previewNew || emptyMsg}</div>
        </div>
      </div>`
    : `<div class="svg-preview-wrap">${previewNew || emptyMsg}</div>`;

  // Code diff
  const codeChanged = (original.code || '') !== (proposal.code || '');
  if (codeChanged) {
    const diff     = computeLineDiff(original.code || '', proposal.code || '');
    const nAdded   = diff.filter(l => l.type === 'add').length;
    const nRemoved = diff.filter(l => l.type === 'remove').length;
    const COPY_ICO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    document.getElementById('propCodeDiff').innerHTML = `
      <div class="diff-code-header">
        <span class="diff-code-stat diff-minus">−${nRemoved}</span>
        <span class="diff-code-stat diff-plus">+${nAdded}</span>
        <button class="copy-btn" id="propCopyBtn" style="margin-left:auto">${COPY_ICO} Copier le nouveau</button>
      </div>
      <div class="diff-code-view">${renderDiffLines(diff)}</div>`;
  } else {
    document.getElementById('propCodeDiff').innerHTML = buildCodeBlock(proposal.code || '');
  }
}

// ── Code block HTML (vue normale) ────────────────────────────────────────
function buildCodeBlock(code) {
  const COPY_ICO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  return `<div class="code-block">
    <div class="code-header">
      <span class="code-lang"><span class="code-lang-dot"></span>Code</span>
      <button class="copy-btn" id="propCopyBtn">${COPY_ICO} Copier</button>
    </div>
    <pre>${escHtml(code)}</pre>
  </div>`;
}

// ── Rendu diff : masque les lignes inchangées, garde 2 lignes de contexte ─
function renderDiffLines(diff, ctx = 2) {
  const CONTEXT = ctx;
  const n = diff.length;
  // Marque les lignes à afficher (changed ou dans le contexte d'un changement)
  const show = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (diff[i].type !== 'same') {
      for (let k = Math.max(0, i - CONTEXT); k <= Math.min(n - 1, i + CONTEXT); k++)
        show[k] = 1;
    }
  }
  let html = '', skipped = 0;
  for (let i = 0; i < n; i++) {
    if (!show[i]) { skipped++; continue; }
    if (skipped > 0) {
      html += `<div class="diff-line diff-line-skip"><span class="diff-line-prefix">⋯</span><span class="diff-line-content">${skipped} ligne${skipped > 1 ? 's' : ''} inchangée${skipped > 1 ? 's' : ''}</span></div>`;
      skipped = 0;
    }
    const { type, line } = diff[i];
    const prefix = type === 'add' ? '+' : type === 'remove' ? '−' : ' ';
    const cls    = type === 'add' ? 'diff-line-add' : type === 'remove' ? 'diff-line-remove' : 'diff-line-same';
    html += `<div class="diff-line ${cls}"><span class="diff-line-prefix">${prefix}</span><span class="diff-line-content">${escHtml(line)}</span></div>`;
  }
  if (skipped > 0)
    html += `<div class="diff-line diff-line-skip"><span class="diff-line-prefix">⋯</span><span class="diff-line-content">${skipped} ligne${skipped > 1 ? 's' : ''} inchangée${skipped > 1 ? 's' : ''}</span></div>`;
  return html;
}

// ── Diff LCS ligne par ligne ──────────────────────────────────────────────
function computeLineDiff(oldText, newText) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const m = oldLines.length, n = newLines.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = oldLines[i-1] === newLines[j-1]
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1]);
  const result = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i-1] === newLines[j-1]) {
      result.unshift({ type: 'same', line: oldLines[i-1] }); i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      result.unshift({ type: 'add',    line: newLines[j-1] }); j--;
    } else {
      result.unshift({ type: 'remove', line: oldLines[i-1] }); i--;
    }
  }
  return result;
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

// Copier code — délégation sur la modal (le bouton est rendu dynamiquement)
document.getElementById('proposalOverlay').addEventListener('click', e => {
  const btn = e.target.closest('#propCopyBtn');
  if (!btn) return;
  const code = document.getElementById('propModalCode')?.textContent || '';
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = '✓ Copié';
    setTimeout(() => {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copier`;
    }, 1500);
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
  const { data: proposal } = await db.from('fonctions').select('*').eq('id', id).single();

  if (proposal?.original_id) {
    // Modification : mettre à jour le visuel original puis supprimer la proposition
    const { error } = await db.from('fonctions')
      .update({
        nom:            proposal.nom,
        type:           proposal.type,
        categorie:      proposal.categorie,
        sous_categorie: proposal.sous_categorie,
        description:    proposal.description,
        code:           proposal.code,
        preview:        proposal.preview
      })
      .eq('id', proposal.original_id);
    if (!error) {
      await db.from('fonctions').delete().eq('id', id);
      loadPendingList();
      loadAdminList();
    }
  } else {
    const { error } = await db.from('fonctions').update({ statut: 'approved' }).eq('id', id);
    if (!error) { loadPendingList(); loadAdminList(); }
  }
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
