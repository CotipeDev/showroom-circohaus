// ============================================================
// notificaciones.js
// ============================================================

async function cargarNotificaciones() {
  try {
    const data = await apiGet('getProductos');
    const alertas = data.slice(1).filter(p => {
      const stock = Number(p[5]) || 0;
      const minimo = Number(p[6]) || 0;
      return stock === 0 || (minimo > 0 && stock <= minimo);
    }).map(p => ({
      tipo: Number(p[5]) === 0 ? 'zero' : 'low',
      nombre: p[1], codigo: p[0],
      stock: Number(p[5]) || 0, minimo: Number(p[6]) || 0
    }));

    const html = alertas.length === 0
      ? `<div style="padding:20px;text-align:center;color:var(--text-mid);font-size:13px">✅ Todo el stock está en orden</div>`
      : alertas.map(a => {
          const esZero = a.tipo === 'zero';
          const color = esZero ? '#C44F4F' : 'var(--rose-dark)';
          const icono = esZero ? '🔴' : '🟠';
          const msg = esZero ? 'Sin stock' : `${a.stock} unid. (mín: ${a.minimo})`;
          return `<div style="padding:12px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px">
            <span style="font-size:18px">${icono}</span>
            <div>
              <div style="font-size:13px;font-weight:500;color:var(--navy)">${a.nombre}</div>
              <div style="font-size:11px;color:${color};margin-top:2px">${msg}</div>
              <div style="font-size:10px;color:var(--text-light)">${a.codigo}</div>
            </div>
          </div>`;
        }).join('');

    ['notif-lista','notif-lista-app'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    });
    ['notif-badge','notif-badge-app'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = alertas.length;
      el.style.display = alertas.length > 0 ? 'inline-block' : 'none';
    });
  } catch(e) {}
}

function toggleNotificaciones(origen) {
  const panelId = origen === 'home' ? 'notif-panel' : 'notif-panel-app';
  const panel = document.getElementById(panelId);
  const abierto = panel.style.display === 'block';
  panel.style.display = abierto ? 'none' : 'block';
  if (!abierto) cargarNotificaciones();
}
