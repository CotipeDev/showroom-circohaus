// ============================================================
// productos.js
// ============================================================

let productosData = [];
let prodTablaData = [];

async function cargarProductos() {
  try {
    const data = await apiGet('getProductos');
    productosData = data.slice(1);
  } catch (e) {}
}

async function iniciarProductos() {
  document.getElementById('prod-loading').style.display = 'flex';
  document.getElementById('prod-table').style.display = 'none';
  try {
    const data = await apiGet('getProductos');
    prodTablaData = data.slice(1);
    renderTablaProductos(prodTablaData);
    document.getElementById('prod-loading').style.display = 'none';
    document.getElementById('prod-table').style.display = 'table';
  } catch (e) { showToast('Error al cargar productos', 'error'); }
}

function renderTablaProductos(rows) {
  document.getElementById('prod-body').innerHTML = rows.length === 0
    ? '<tr><td colspan="6" style="text-align:center;color:var(--mid-gray);padding:20px">No hay productos</td></tr>'
    : rows.map(p => `
        <tr>
          <td><code style="color:var(--terracotta);font-size:12px">${p[0]}</code></td>
          <td>${p[1]}</td>
          <td>${p[7] || '—'}</td>
          <td>${formatPeso(p[3])}</td>
          <td>${p[5] || 0}</td>
          <td>${p[6] || '—'}</td>
          <td style="display:flex;gap:6px">
            <button class="btn-warning" onclick="abrirEditar('${p[0]}')">✏️ Editar</button>
            <button class="btn-danger" onclick="eliminarProducto('${p[0]}')">🗑️</button>
          </td>
        </tr>`).join('');
}

function filtrarTablaProductos() {
  const q = document.getElementById('prod-buscar').value.toLowerCase();
  renderTablaProductos(prodTablaData.filter(p =>
    p[0].toString().toLowerCase().includes(q) || p[1].toString().toLowerCase().includes(q)
  ));
}

function calcularPrecioVenta() {
  const costo = Number(document.getElementById('prod-pcosto').value);
  const margen = Number(document.getElementById('prod-margen').value);
  document.getElementById('prod-pventa').value = (costo > 0 && margen > 0) ? Math.round(costo * (1 + margen / 100)) : '';
}

async function agregarProducto() {
  const codigo = document.getElementById('prod-codigo').value.trim();
  const descripcion = document.getElementById('prod-desc').value.trim();
  const proveedor = document.getElementById('prod-proveedor').value;
  const precio_costo = Number(document.getElementById('prod-pcosto').value);
  const precio_venta = Number(document.getElementById('prod-pventa').value);
  const stock = Number(document.getElementById('prod-stock').value) || 0;
  const stock_minimo = Number(document.getElementById('prod-stock-min').value) || 0;

  if (!codigo || !descripcion) { showToast('Completá código y descripción', 'error'); return; }
  if (!precio_costo) { showToast('Ingresá el precio de costo', 'error'); return; }

  try {
    const data = await apiGet('getProductos');
    if (data.slice(1).some(p => p[0].toString().trim().toLowerCase() === codigo.toLowerCase())) {
      showToast(`El código ${codigo} ya existe`, 'error'); return;
    }
  } catch (e) { showToast('No se pudo verificar el código', 'error'); return; }

  try {
    await apiPost('agregarProducto', { codigo, descripcion, proveedor, precio_venta, precio_costo, stock, stock_minimo });
    showToast('Producto guardado correctamente');
    ['prod-codigo', 'prod-desc', 'prod-pcosto', 'prod-margen', 'prod-pventa', 'prod-stock', 'prod-stock-min'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('prod-proveedor').value = '';
    setTimeout(() => { cargarProductos(); iniciarProductos(); }, 1500);
  } catch (e) { showToast('Error al guardar producto', 'error'); }
}

async function eliminarProducto(codigo) {
  if (!confirm(`¿Seguro que querés eliminar el producto ${codigo}? Esta acción no se puede deshacer.`)) return;
  try {
    await apiPost('eliminarProducto', { codigo });
    showToast('Producto eliminado correctamente');
    setTimeout(() => { cargarProductos(); iniciarProductos(); }, 1500);
  } catch (e) { showToast('Error al eliminar producto', 'error'); }
}

// ——— EDICIÓN ———
function abrirEditar(codigo) {
  const p = prodTablaData.find(x => x[0].toString() === codigo.toString());
  if (!p) return;
  document.getElementById('edit-codigo').value = p[0];
  document.getElementById('edit-desc').value = p[1];
  document.getElementById('edit-proveedor').value = p[2] || '';
  document.getElementById('edit-pcosto').value = p[4] || '';
  document.getElementById('edit-pventa').value = p[3] || '';
  document.getElementById('edit-stock-min').value = p[6] || '';
  document.getElementById('edit-categoria').value = p[7] || '';
  document.getElementById('edit-margen').value = (p[4] > 0 && p[3] > 0) ? Math.round(((p[3] / p[4]) - 1) * 100) : '';
  document.getElementById('modal-editar').classList.add('open');
}

function cerrarModal() { document.getElementById('modal-editar').classList.remove('open'); }

function calcularPrecioVentaEdit() {
  const costo = Number(document.getElementById('edit-pcosto').value);
  const margen = Number(document.getElementById('edit-margen').value);
  document.getElementById('edit-pventa').value = (costo > 0 && margen > 0) ? Math.round(costo * (1 + margen / 100)) : '';
}

async function guardarEdicion() {
  const codigo = document.getElementById('edit-codigo').value.trim();
  const descripcion = document.getElementById('edit-desc').value.trim();
  const proveedor = document.getElementById('edit-proveedor').value;
  const precio_costo = Number(document.getElementById('edit-pcosto').value);
  const precio_venta = Number(document.getElementById('edit-pventa').value);
  const stock_minimo = Number(document.getElementById('edit-stock-min').value) || 0;
  if (!descripcion) { showToast('Completá la descripción', 'error'); return; }
  try {
    await apiPost('editarProducto', { codigo, descripcion, proveedor, precio_venta, precio_costo, stock_minimo });
    showToast('Producto actualizado correctamente');
    cerrarModal();
    setTimeout(() => { cargarProductos(); iniciarProductos(); }, 1500);
  } catch (e) { showToast('Error al actualizar producto', 'error'); }
}
