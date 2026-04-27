// ============================================================
// stock.js
// ============================================================

let stockData = [];

async function iniciarStock() {
  document.getElementById('stock-loading').style.display = 'flex';
  document.getElementById('stock-table').style.display = 'none';
  try {
    const data = await apiGet('getProductos');
    stockData = data.slice(1);
    renderStock(stockData);
    document.getElementById('stock-loading').style.display = 'none';
    document.getElementById('stock-table').style.display = 'table';
  } catch (e) { showToast('Error al cargar stock', 'error'); }
}

function renderStock(rows) {
  document.getElementById('stock-body').innerHTML = rows.length === 0
    ? '<tr><td colspan="6" style="text-align:center;color:var(--mid-gray);padding:20px">No hay productos</td></tr>'
    : rows.map(p => {
        const stock = Number(p[5]) || 0;
        const minimo = Number(p[6]) || 0;
        let badge;
        if (stock === 0) {
          badge = `<span class="badge badge-zero">Sin stock</span>`;
        } else if (minimo > 0 && stock <= minimo) {
          badge = `<span class="badge badge-low">${stock} ⚠️</span>`;
        } else {
          badge = `<span class="badge badge-ok">${stock}</span>`;
        }
        return `<tr>
          <td><code style="color:var(--terracotta);font-size:12px">${p[0]}</code></td>
          <td>${p[1]}</td>
          <td>${p[7] || '—'}</td>
          <td>${formatPeso(p[3])}</td>
          <td>${badge}</td>
          <td style="color:var(--mid-gray);font-size:12px">${minimo > 0 ? 'Mín: ' + minimo : '—'}</td>
        </tr>`;
      }).join('');
}

function filtrarStock() {
  const q = document.getElementById('stock-buscar').value.toLowerCase();
  renderStock(stockData.filter(p =>
    p[0].toString().toLowerCase().includes(q) || p[1].toString().toLowerCase().includes(q)
  ));
}
