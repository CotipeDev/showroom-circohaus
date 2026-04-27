// ============================================================
// home.js
// ============================================================

async function iniciarHome() {
  try {
    const productos = await apiGet('getProductos');
    const proveedores = await apiGet('getProveedores');
    const rows = productos.slice(1);
    const provRows = proveedores.slice(1);

    let alertas = 0;
    rows.forEach(p => {
      const stock = Number(p[5]) || 0;
      const minimo = Number(p[6]) || 0;
      if (stock === 0 || (minimo > 0 && stock <= minimo)) alertas++;
    });

    document.getElementById('kpi-productos').textContent = rows.length;
    document.getElementById('kpi-alertas').textContent = alertas;
    document.getElementById('kpi-proveedores').textContent = provRows.length;

    if (alertas > 0) {
      document.getElementById('kpi-alertas-wrap').classList.add('alerta');
    }
  } catch(e) {}
}

function irAModulo(nombre) {
  document.getElementById('home').style.display = 'none';
  document.getElementById('app-main').style.display = 'flex';
  const btn = document.querySelector(`.tab[data-panel="${nombre}"]`);
  if (btn) showPanel(nombre, btn);
}

function volverHome() {
  document.getElementById('home').style.display = 'block';
  document.getElementById('app-main').style.display = 'none';
  iniciarHome();
}
