// ============================================================
// ingresos.js
// ============================================================

let itemsIngreso = [];
let ingProductoSeleccionado = null;

function iniciarIngresos() {
  setFechaHoy('ing-fecha');
}

function filtrarProductosIngreso() {
  const q = document.getElementById('ing-buscar').value.toLowerCase();
  const lista = document.getElementById('ing-autocomplete');
  ingProductoSeleccionado = null;
  document.getElementById('ing-producto-seleccionado').style.display = 'none';
  if (!q) { lista.style.display = 'none'; return; }
  const filtrados = productosData.filter(p =>
    p[0].toString().toLowerCase().includes(q) || p[1].toString().toLowerCase().includes(q)
  ).slice(0, 8);
  if (!filtrados.length) { lista.style.display = 'none'; return; }
  lista.innerHTML = filtrados.map(p =>
    `<div class="autocomplete-item" onclick="seleccionarProductoIngreso('${p[0]}', '${p[1].replace(/'/g, "\\'")}')">
      <code>${p[0]}</code> — ${p[1]}
    </div>`
  ).join('');
  lista.style.display = 'block';
}

function seleccionarProductoIngreso(codigo, desc) {
  ingProductoSeleccionado = { codigo, desc };
  document.getElementById('ing-buscar').value = `${codigo} — ${desc}`;
  document.getElementById('ing-autocomplete').style.display = 'none';
  document.getElementById('ing-prod-nombre').textContent = `${codigo} — ${desc}`;
  document.getElementById('ing-producto-seleccionado').style.display = 'block';
}

function agregarItemIngreso() {
  if (!ingProductoSeleccionado) { showToast('Seleccioná un producto de la lista', 'error'); return; }
  const cantidad = Number(document.getElementById('ing-cantidad').value);
  const costo = Number(document.getElementById('ing-costo').value);
  if (!cantidad || cantidad < 1) { showToast('Ingresá una cantidad válida', 'error'); return; }
  itemsIngreso.push({ codigo: ingProductoSeleccionado.codigo, desc: ingProductoSeleccionado.desc, cantidad, precio_costo: costo });
  renderItemsIngreso();
  document.getElementById('ing-cantidad').value = '';
  document.getElementById('ing-costo').value = '';
  document.getElementById('ing-buscar').value = '';
  document.getElementById('ing-producto-seleccionado').style.display = 'none';
  ingProductoSeleccionado = null;
}

function renderItemsIngreso() {
  const lista = document.getElementById('items-lista');
  if (!itemsIngreso.length) { lista.innerHTML = '<div class="items-empty">Todavía no agregaste productos</div>'; return; }
  lista.innerHTML = itemsIngreso.map((item, i) => `
    <div class="item-row">
      <span><code style="color:var(--terracotta);font-size:11px">${item.codigo}</code> ${item.desc}</span>
      <span>${item.cantidad} unid.</span>
      <span>${item.precio_costo ? formatPeso(item.precio_costo) : '—'}</span>
      <button class="btn-danger" onclick="quitarItemIngreso(${i})">✕</button>
    </div>`).join('');
}

function quitarItemIngreso(i) { itemsIngreso.splice(i, 1); renderItemsIngreso(); }

async function confirmarIngreso() {
  const fecha = document.getElementById('ing-fecha').value;
  const proveedor = document.getElementById('ing-proveedor').value;
  const nro_remito = document.getElementById('ing-remito').value.trim();
  if (!fecha) { showToast('Seleccioná una fecha', 'error'); return; }
  if (!proveedor) { showToast('Seleccioná un proveedor', 'error'); return; }
  if (!itemsIngreso.length) { showToast('Agregá al menos un producto', 'error'); return; }
  try {
    await apiPost('registrarIngreso', { fecha, proveedor, nro_remito, items: itemsIngreso });
    showToast('Ingreso registrado. Stock actualizado.');
    limpiarIngreso();
    setTimeout(() => cargarProductos(), 2000);
  } catch (e) { showToast('Error al registrar el ingreso', 'error'); }
}

function limpiarIngreso() {
  itemsIngreso = []; renderItemsIngreso();
  document.getElementById('ing-remito').value = '';
  document.getElementById('ing-proveedor').value = '';
  document.getElementById('ing-buscar').value = '';
  document.getElementById('ing-producto-seleccionado').style.display = 'none';
  ingProductoSeleccionado = null;
  setFechaHoy('ing-fecha');
}
