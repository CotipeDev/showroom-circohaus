// ============================================================
// proveedores.js
// ============================================================

let proveedoresData = [];

async function cargarProveedores() {
  try {
    const data = await apiGet('getProveedores');
    proveedoresData = data.slice(1);
    ['ing-proveedor', 'prod-proveedor', 'edit-proveedor'].forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      sel.innerHTML = '<option value="">Seleccioná proveedor...</option>';
      proveedoresData.forEach(p => sel.innerHTML += `<option value="${p[0]}">${p[1]}</option>`);
    });
  } catch (e) {}
}

async function iniciarProveedores() {
  document.getElementById('prov-loading').style.display = 'flex';
  document.getElementById('prov-table').style.display = 'none';
  try {
    const data = await apiGet('getProveedores');
    const rows = data.slice(1);
    document.getElementById('prov-body').innerHTML = rows.length === 0
      ? '<tr><td colspan="3" style="text-align:center;color:var(--mid-gray);padding:20px">No hay proveedores</td></tr>'
      : rows.map(p => `<tr><td><code style="color:var(--terracotta)">${p[0]}</code></td><td>${p[1]}</td><td>${p[2] || '—'}</td></tr>`).join('');
    document.getElementById('prov-loading').style.display = 'none';
    document.getElementById('prov-table').style.display = 'table';
  } catch (e) { showToast('Error al cargar proveedores', 'error'); }
}

async function agregarProveedor() {
  const codigo = document.getElementById('prov-codigo').value.trim();
  const nombre = document.getElementById('prov-nombre').value.trim();
  const contacto = document.getElementById('prov-contacto').value.trim();
  if (!codigo || !nombre) { showToast('Completá código y nombre', 'error'); return; }
  try {
    await apiPost('agregarProveedor', { codigo, nombre, contacto });
    showToast('Proveedor guardado correctamente');
    ['prov-codigo', 'prov-nombre', 'prov-contacto'].forEach(id => document.getElementById(id).value = '');
    setTimeout(() => { cargarProveedores(); iniciarProveedores(); }, 1500);
  } catch (e) { showToast('Error al guardar proveedor', 'error'); }
}
