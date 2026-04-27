// ============================================================
// categorias.js
// ============================================================

let categoriasData = [];

async function cargarCategorias() {
  try {
    const data = await apiGet('getCategorias');
    categoriasData = data.slice(1).map(c => c[0]).filter(Boolean);
    ['prod-categoria', 'edit-categoria', 'stock-filtro-cat', 'prod-filtro-cat'].forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      const primera = sel.options[0]?.text || 'Todas';
      sel.innerHTML = `<option value="">${primera}</option>`;
      categoriasData.forEach(c => sel.innerHTML += `<option value="${c}">${c}</option>`);
    });
  } catch (e) {}
}

async function iniciarCategorias() {
  document.getElementById('cat-loading').style.display = 'flex';
  document.getElementById('cat-table').style.display = 'none';
  try {
    const data = await apiGet('getCategorias');
    const rows = data.slice(1).filter(r => r[0]);
    document.getElementById('cat-body').innerHTML = rows.length === 0
      ? '<tr><td style="text-align:center;color:var(--mid-gray);padding:20px">No hay categorías cargadas</td></tr>'
      : rows.map(c => `<tr><td>${c[0]}</td></tr>`).join('');
    document.getElementById('cat-loading').style.display = 'none';
    document.getElementById('cat-table').style.display = 'table';
  } catch (e) { showToast('Error al cargar categorías', 'error'); }
}

async function agregarCategoria() {
  const nombre = document.getElementById('cat-nombre').value.trim();
  if (!nombre) { showToast('Ingresá el nombre de la categoría', 'error'); return; }
  if (categoriasData.map(c => c.toLowerCase()).includes(nombre.toLowerCase())) {
    showToast('Esa categoría ya existe', 'error'); return;
  }
  try {
    await apiPost('agregarCategoria', { nombre });
    showToast('Categoría guardada correctamente');
    document.getElementById('cat-nombre').value = '';
    setTimeout(() => { cargarCategorias(); iniciarCategorias(); }, 1500);
  } catch (e) { showToast('Error al guardar categoría', 'error'); }
}
