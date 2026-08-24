// ============================================================
// CIRCO HAUS — Módulo de clientes
// Alta, edición, listado, indicadores e historial.
// ============================================================

function llenarSelectClientes(){
  const sel=document.getElementById('vta-cliente');if(!sel)return;
  sel.innerHTML='<option value="">Seleccioná cliente...</option>';
  clientesData.forEach(c=>sel.innerHTML+=`<option value="${c[0]}">${c[1]}</option>`);
}

function abrirModalCliente(){document.getElementById('modal-nuevo-cliente').classList.add('open')}

async function guardarCliente(){
  const nombre=document.getElementById('cli-nombre').value.trim();
  if(!nombre){showToast('Ingresá el nombre','error');return}
  try{
    const res=await apiPost('agregarCliente',{nombre,contacto:document.getElementById('cli-contacto').value.trim(),notas:document.getElementById('cli-notas').value.trim()});
    showToast('Cliente guardado');cerrarModal('modal-nuevo-cliente');
    ['cli-nombre','cli-contacto','cli-notas'].forEach(id=>document.getElementById(id).value='');
    cache.invalidar('getClientes');
    const data=await apiGet('getClientes');cache.set('getClientes',data);clientesData=data.slice(1);llenarSelectClientes();
    if(document.getElementById('panel-clientes')?.classList.contains('active'))await iniciarClientes();
  }catch(e){showToast('Error','error')}
}

let clientesModuloFilas=[];

async function iniciarClientes(){
  const loading=document.getElementById('cli-loading'),tabla=document.getElementById('cli-table');
  loading.style.display='flex';tabla.style.display='none';
  try{
    const[dataClientes,dataVentas,dataCpc]=await Promise.all([cacheGet('getClientes'),cacheGet('getVentas'),cacheGet('getCuentasPorCobrar')]);
    clientesData=(dataClientes||[]).slice(1);
    const ventas=(dataVentas||[]).slice(1),cpcs=(dataCpc||[]).slice(1);
    clientesModuloFilas=clientesData.map(cliente=>{
      const id=String(cliente[0]);
      const ventasCliente=ventas.filter(v=>String(v[3])===id&&String(v[7]||'').toLowerCase()!=='cancelada');
      const ultima=ventasCliente.reduce((max,v)=>fechaStr(v[1])>max?fechaStr(v[1]):max,'');
      const saldo=cpcs.filter(c=>String(c[2])===id&&String(c[6]||'').toLowerCase()!=='cancelada').reduce((s,c)=>s+Math.max(0,Number(c[5])||0),0);
      return{cliente,ventas:ventasCliente,cpcs:cpcs.filter(c=>String(c[2])===id),ultima,saldo};
    });
    document.getElementById('cli-kpi-total').textContent=clientesModuloFilas.length;
    document.getElementById('cli-kpi-deuda').textContent=clientesModuloFilas.filter(x=>x.saldo>0).length;
    document.getElementById('cli-kpi-saldo').textContent=formatPeso(clientesModuloFilas.reduce((s,x)=>s+x.saldo,0));
    renderClientesModulo(clientesModuloFilas);
  }catch(e){showToast(e.message||'Error al cargar clientes','error');}
  finally{loading.style.display='none';tabla.style.display='table';}
}

function renderClientesModulo(filas){
  document.getElementById('cli-body').innerHTML=filas.length?filas.map(x=>{
    const c=x.cliente;
    return`<tr><td><strong>${textoSeguro(c[1]||'Sin nombre')}</strong></td><td>${textoSeguro(c[2]||'—')}</td><td style="color:var(--text-mid)">${textoSeguro(c[3]||'—')}</td><td>${x.ultima||'—'}</td><td style="font-weight:600;color:${x.saldo>0?'var(--error)':'var(--success)'}">${formatPeso(x.saldo)}</td><td style="white-space:nowrap"><button class="btn-warning" onclick="verHistorialCliente('${c[0]}')">Historial</button><button class="btn-secondary" style="margin-left:6px;padding:6px 9px" onclick="abrirEditarCliente('${c[0]}')">Editar</button></td></tr>`;
  }).join(''):'<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:24px">No hay clientes registrados</td></tr>';
}

function filtrarClientesModulo(){
  const q=document.getElementById('cli-buscar').value.trim().toLowerCase();
  renderClientesModulo(clientesModuloFilas.filter(x=>[x.cliente[1],x.cliente[2],x.cliente[3]].some(v=>String(v||'').toLowerCase().includes(q))));
}

function abrirEditarCliente(id){
  const cliente=clientesData.find(c=>String(c[0])===String(id));if(!cliente)return;
  document.getElementById('edit-cli-id').value=cliente[0];
  document.getElementById('edit-cli-nombre').value=cliente[1]||'';
  document.getElementById('edit-cli-contacto').value=cliente[2]||'';
  document.getElementById('edit-cli-notas').value=cliente[3]||'';
  document.getElementById('modal-editar-cliente').classList.add('open');
}

async function guardarEdicionCliente(){
  const id=document.getElementById('edit-cli-id').value,nombre=document.getElementById('edit-cli-nombre').value.trim();
  if(!nombre){showToast('Ingresá el nombre','error');return;}
  await apiPost('editarCliente',{id,nombre,contacto:document.getElementById('edit-cli-contacto').value.trim(),notas:document.getElementById('edit-cli-notas').value.trim()});
  cache.invalidar('getClientes');
  const data=await apiGet('getClientes');cache.set('getClientes',data);clientesData=data.slice(1);llenarSelectClientes();
  cerrarModal('modal-editar-cliente');await iniciarClientes();showToast('Cliente actualizado');
}

function verHistorialCliente(id){
  const fila=clientesModuloFilas.find(x=>String(x.cliente[0])===String(id));if(!fila)return;
  const c=fila.cliente,ventas=[...fila.ventas].sort((a,b)=>fechaStr(b[1]).localeCompare(fechaStr(a[1])));
  document.getElementById('hist-cli-titulo').textContent=`Historial — ${c[1]||'Cliente'}`;
  document.getElementById('hist-cli-contenido').innerHTML=`
    <div style="background:var(--pearl);border-radius:10px;padding:14px;margin:12px 0 18px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
      <div><div style="font-size:10px;text-transform:uppercase;color:var(--text-light)">Contacto</div><strong>${textoSeguro(c[2]||'—')}</strong></div>
      <div><div style="font-size:10px;text-transform:uppercase;color:var(--text-light)">Ventas vigentes</div><strong>${ventas.length}</strong></div>
      <div><div style="font-size:10px;text-transform:uppercase;color:var(--text-light)">Saldo pendiente</div><strong style="color:${fila.saldo>0?'var(--error)':'var(--success)'}">${formatPeso(fila.saldo)}</strong></div>
    </div>
    ${c[3]?`<div style="font-size:12px;color:var(--text-mid);margin-bottom:16px"><strong>Notas:</strong> ${textoSeguro(c[3])}</div>`:''}
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-mid);margin-bottom:7px">Ventas</div>
    <table><thead><tr><th>Fecha</th><th>Venta</th><th>Estado</th><th>Total</th><th></th></tr></thead><tbody>${ventas.length?ventas.map(v=>{const esV2=String(v[25]||'')==='V2',total=esV2?Number(v[16])||0:Number(v[5])||0;return`<tr><td>${fechaStr(v[1])}</td><td><code>${v[0]}</code></td><td>${v[7]||'—'}</td><td>${formatPeso(total)}</td><td><button class="btn-warning" onclick="cerrarModal('modal-historial-cliente');verDetalleVenta('${v[0]}')">Ver</button></td></tr>`;}).join(''):'<tr><td colspan="5" style="text-align:center;color:var(--text-light)">Todavía no tiene ventas registradas</td></tr>'}</tbody></table>`;
  document.getElementById('modal-historial-cliente').classList.add('open');
}

