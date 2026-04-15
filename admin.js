// ===== ADMIN.JS — CustomViz =====

let allFunctions = [];
let pendingDeleteId = null;

// ---- Chargement ----
async function loadAdminList() {
  const { data, error } = await db
    .from('fonctions')
    .select('id, nom, categorie, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    document.getElementById('adminList').innerHTML =
      `<p style="color:var(--danger);font-family:var(--font-mono);font-size:0.82rem">Erreur : ${error.message}</p>`;
    return;
  }
  allFunctions = data || [];
  renderAdminList(allFunctions);
}

function renderAdminList(list) {
  const container = document.getElementById('adminList');
  if (list.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);padding:1rem 0;font-size:0.85rem">Aucune mesure pour l'instant.</p>`;
    return;
  }
  container.innerHTML = list.map(fn => `
    <div class="admin-item">
      <div class="admin-item-info">
        <div class="admin-item-name">${escHtml(fn.nom)}</div>
        <div class="admin-item-cat">${fn.categorie || 'Général'}</div>
      </div>
      <button class="btn-delete" data-id="${fn.id}">Supprimer</button>
    </div>
  `).join('');

  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingDeleteId = btn.dataset.id;
      document.getElementById('deleteOverlay').classList.add('open');
    });
  });
}

// ---- Recherche ----
document.getElementById('adminSearch').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  const filtered = allFunctions.filter(f =>
    f.nom.toLowerCase().includes(q) ||
    (f.categorie || '').toLowerCase().includes(q)
  );
  renderAdminList(filtered);
});

// ---- Live SVG preview ----
document.getElementById('inputSvg').addEventListener('input', e => {
  const preview = document.getElementById('svgLivePreview');
  const val = e.target.value.trim();
  if (val) {
    preview.innerHTML = val;
  } else {
    preview.innerHTML = `<span style="color:var(--text-muted);font-family:var(--font-mono);font-size:0.76rem">L'aperçu SVG apparaîtra ici</span>`;
  }
});

// ---- Ajout ----
document.getElementById('btnAjouter').addEventListener('click', async () => {
  const nom         = document.getElementById('inputNom').value.trim();
  const categorie   = document.getElementById('inputCategorie').value.trim();
  const description = document.getElementById('inputDesc').value.trim();
  const code        = document.getElementById('inputCode').value.trim();
  const svg_preview = document.getElementById('inputSvg').value.trim() || null;
  const msg         = document.getElementById('formMsg');

  if (!nom || !categorie || !description || !code) {
    msg.textContent = '⚠ Tous les champs obligatoires doivent être remplis.';
    msg.className = 'form-msg error';
    return;
  }

  msg.textContent = 'Enregistrement…';
  msg.className = 'form-msg';

  const { error } = await db
    .from('fonctions')
    .insert([{ nom, categorie, description, code, svg_preview }]);

  if (error) {
    msg.textContent = `❌ Erreur : ${error.message}`;
    msg.className = 'form-msg error';
    return;
  }

  msg.textContent = '✓ Mesure ajoutée avec succès !';
  msg.className = 'form-msg success';

  document.getElementById('inputNom').value = '';
  document.getElementById('inputCategorie').value = '';
  document.getElementById('inputDesc').value = '';
  document.getElementById('inputCode').value = '';
  document.getElementById('inputSvg').value = '';
  document.getElementById('svgLivePreview').innerHTML =
    `<span style="color:var(--text-muted);font-family:var(--font-mono);font-size:0.76rem">L'aperçu SVG apparaîtra ici</span>`;

  setTimeout(() => { msg.textContent = ''; }, 3000);
  loadAdminList();
});

// ---- Suppression ----
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

loadAdminList();
