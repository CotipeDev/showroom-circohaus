// ============================================================
// utils.js — Funciones compartidas
// ============================================================

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.className = 'toast', 3500);
}

function formatPeso(n) {
  return '$' + Number(n).toLocaleString('es-AR');
}

function setFechaHoy(inputId) {
  document.getElementById(inputId).value = new Date().toISOString().split('T')[0];
}

function showPanel(name, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  btn.classList.add('active');
  if (name === 'stock') iniciarStock();
  if (name === 'proveedores') iniciarProveedores();
  if (name === 'productos') iniciarProductos();
  if (name === 'ingresos') iniciarIngresos();
}
