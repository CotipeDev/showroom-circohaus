// ============================================================
// CIRCO HAUS — Módulo de medios de pago
// Configuración de cuentas, costos, acreditación y vigencia.
// ============================================================

// ── MEDIOS DE PAGO ──
async function iniciarMediosPago(){
  renderConfiguracionCobrosV2();
  if(mediosPagoData.length&&cuentasData.length){
    renderTablaMediosPago();
    llenarSelectCuentas(['mp-cuenta','edit-mp-cuenta']);
    document.getElementById('mp-loading').style.display='none';
    document.getElementById('mp-table').style.display='table';
    return;
  }
  document.getElementById('mp-loading').style.display='flex';
  document.getElementById('mp-table').style.display='none';
  try{
    const[dataMp,dataCuentas]=await Promise.all([cacheGet('getMediosPago'),cacheGet('getCuentas')]);
    mediosPagoData=dataMp.slice(1);
    cuentasData=dataCuentas.slice(1);
    renderTablaMediosPago();
    llenarSelectCuentas(['mp-cuenta','edit-mp-cuenta']);
    document.getElementById('mp-loading').style.display='none';
    document.getElementById('mp-table').style.display='table';
  }catch(e){showToast('Error al cargar medios de pago','error')}
}

function cobroActivo(valor){
  return valor===true||String(valor).toUpperCase()==='TRUE'||Number(valor)===1;
}

function mostrarPestanaCobros(pestana){
  ['tarifas','planes','anterior'].forEach(nombre=>{
    const vista=document.getElementById(`cobros-vista-${nombre}`);
    const boton=document.getElementById(`cobros-tab-${nombre}`);
    if(vista)vista.style.display=nombre===pestana?'block':'none';
    if(boton)boton.className=`btn ${nombre===pestana?'btn-primary':'btn-secondary'}`;
  });
}

function renderConfiguracionCobrosV2(){
  const nombreCuenta=id=>cuentasData.find(c=>String(c[0])===String(id))?.[1]||id||'—';
  const nombreProcesador=id=>procesadoresCobroData.find(p=>String(p[0])===String(id))?.[1]||id||'—';
  const tarifas=[...tarifasCobroData].sort((a,b)=>Number(cobroActivo(b[10]))-Number(cobroActivo(a[10]))||String(a[2]).localeCompare(String(b[2]))||String(a[3]).localeCompare(String(b[3])));
  const activas=tarifas.filter(t=>cobroActivo(t[10]));
  const canales=new Set(activas.map(t=>`${t[2]}|${t[3]}`));
  const procesadores=new Set(activas.map(t=>String(t[2])).filter(Boolean));
  const resumen=document.getElementById('cobros-resumen-tarifas');
  if(resumen)resumen.innerHTML=`
    <div class="stat-card"><div class="stat-label">Tarifas activas</div><div class="stat-value">${activas.length}</div></div>
    <div class="stat-card"><div class="stat-label">Canales configurados</div><div class="stat-value">${canales.size}</div></div>
    <div class="stat-card"><div class="stat-label">Procesadores activos</div><div class="stat-value">${procesadores.size}</div></div>`;
  const bodyTarifas=document.getElementById('cobros-tarifas-body');
  if(bodyTarifas)bodyTarifas.innerHTML=tarifas.length?tarifas.map(t=>{
    const costo=Number(t[6])||0,iva=Number(t[7])||0,costoIva=costo*(1+iva/100),estaActiva=cobroActivo(t[10]);
    return `<tr style="${estaActiva?'':'opacity:.58'}"><td>${nombreCuenta(t[1])}</td><td>${nombreProcesador(t[2])}</td><td><strong>${t[3]||'—'}</strong></td><td>${t[4]||'—'}</td><td>${Number(t[5])===0?'Inmediata':`${t[5]} días`}</td><td>${costo.toLocaleString('es-AR',{maximumFractionDigits:2})}%</td><td><strong>${costoIva.toLocaleString('es-AR',{maximumFractionDigits:2})}%</strong></td><td><span class="badge ${estaActiva?'badge-ok':'badge-zero'}">${estaActiva?'Activa':'Inactiva'}</span></td></tr>`;
  }).join(''):'<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-light)">Todavía no hay tarifas configuradas.</td></tr>';

  const planes=[...planesCuotasData].sort((a,b)=>Number(cobroActivo(b[13]))-Number(cobroActivo(a[13]))||(Number(a[4])||0)-(Number(b[4])||0));
  const bodyPlanes=document.getElementById('cobros-planes-body');
  if(bodyPlanes)bodyPlanes.innerHTML=planes.length?planes.map(p=>{
    const estaActivo=cobroActivo(p[13]);
    const absorbe=String(p[7]||'').toLowerCase()==='negocio'?'Negocio':String(p[7]||'').toLowerCase()==='cliente'?'Cliente':p[7]||'—';
    return `<tr style="${estaActivo?'':'opacity:.58'}"><td>${nombreProcesador(p[1])}</td><td>${p[2]||'—'}</td><td><strong>${p[4]||1}</strong></td><td>${absorbe}</td><td>${(Number(p[5])||0).toLocaleString('es-AR',{maximumFractionDigits:2})}%</td><td>${Number(p[8])>0?formatPeso(p[8]):'Sin mínimo'}</td><td>${Number(p[15])>0?`${p[15]}%`:'—'}</td><td><span class="badge ${estaActivo?'badge-ok':'badge-zero'}">${estaActivo?'Activo':'Inactivo'}</span></td></tr>`;
  }).join(''):'<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-light)">Todavía no hay planes configurados.</td></tr>';
}

function renderTablaMediosPago(){
  const cuentaNombre=id=>{ const c=cuentasData.find(x=>String(x[0])===String(id));return c?c[1]:id||'—' };
  const estaActivo=m=>m[7]===true||m[7]==='TRUE';
  const ordenados=[...mediosPagoData].sort((a,b)=>Number(estaActivo(b))-Number(estaActivo(a)));
  document.getElementById('mp-body').innerHTML=mediosPagoData.length===0
    ?'<tr><td colspan="8" style="text-align:center;color:var(--text-mid);padding:20px">No hay medios de pago</td></tr>'
    :ordenados.map(m=>`<tr style="${estaActivo(m)?'':'opacity:.62'}">
      <td><strong>${m[2]}</strong></td>
      <td>${cuentaNombre(m[1])}</td>
      <td>${Number(m[4])>0?`<span class="pct-badge comision">${m[4]}%</span>`:'<span style="color:var(--text-light)">—</span>'}</td>
      <td>${Number(m[5])>0?`<span class="pct-badge">${m[5]}%</span>`:'<span style="color:var(--text-light)">—</span>'}</td>
      <td><strong>${Math.round(((Number(m[4])||0)+(Number(m[5])||0))*10)/10}%</strong></td>
      <td>${m[6]?m[6]+' días':'—'}</td>
      <td><button class="toggle ${estaActivo(m)?'on':''}" onclick="toggleActivoMP('${m[0]}',this)" title="${estaActivo(m)?'Activo':'Inactivo'}"></button></td>
      <td><button class="btn-warning" onclick="abrirEditarMP('${m[0]}')">✏️</button></td>
    </tr>`).join('');
}

async function agregarMedioPago(){
  const id_cuenta=document.getElementById('mp-cuenta').value,nombre=document.getElementById('mp-nombre').value.trim();
  if(!id_cuenta){showToast('Seleccioná una cuenta','error');return}
  if(!nombre){showToast('Ingresá el nombre','error');return}
  try{
    await apiPost('agregarMedioPago',{id_cuenta,nombre,descuento_cliente_pct:0,comision_pct:Number(document.getElementById('mp-comision').value)||0,costo_financiero_pct:Number(document.getElementById('mp-cf').value)||0,dias_acreditacion:Number(document.getElementById('mp-dias').value)||0});
    showToast('Medio de pago guardado');
    ['mp-nombre','mp-comision','mp-cf','mp-dias'].forEach(id=>{document.getElementById(id).value='0'});document.getElementById('mp-cuenta').value='';document.getElementById('mp-nombre').value='';
    cache.invalidar('getMediosPago');mediosPagoData=[];await iniciarMediosPago();
  }catch(e){showToast('Error','error')}
}

function abrirEditarMP(id){
  const m=mediosPagoData.find(x=>String(x[0])===String(id));if(!m)return;
  document.getElementById('edit-mp-id').value=m[0];
  document.getElementById('edit-mp-cuenta').value=m[1];
  document.getElementById('edit-mp-nombre').value=m[2];
  document.getElementById('edit-mp-comision').value=m[4]||0;
  document.getElementById('edit-mp-cf').value=m[5]||0;
  document.getElementById('edit-mp-dias').value=m[6]||0;
  document.getElementById('modal-editar-mp').classList.add('open');
}

async function guardarEdicionMP(){
  const id=document.getElementById('edit-mp-id').value;
  const idCuenta=document.getElementById('edit-mp-cuenta').value;
  const nombre=document.getElementById('edit-mp-nombre').value.trim();
  const medioActual=mediosPagoData.find(x=>String(x[0])===String(id));
  if(!idCuenta){showToast('Seleccioná una cuenta','error');return;}
  if(!nombre){showToast('Ingresá el nombre','error');return;}
  try{
    await apiPost('editarMedioPago',{id,id_cuenta:idCuenta,nombre,descuento_cliente_pct:0,comision_pct:Number(document.getElementById('edit-mp-comision').value)||0,costo_financiero_pct:Number(document.getElementById('edit-mp-cf').value)||0,dias_acreditacion:Number(document.getElementById('edit-mp-dias').value)||0,activo:medioActual?(medioActual[7]===true||medioActual[7]==='TRUE'):true});
    showToast('Medio de pago actualizado');cerrarModal('modal-editar-mp');cache.invalidar('getMediosPago');mediosPagoData=[];await iniciarMediosPago();
  }catch(e){showToast('Error','error')}
}

async function toggleActivoMP(id,btn){
  const m=mediosPagoData.find(x=>String(x[0])===String(id));if(!m)return;
  const nuevoActivo=!(m[7]===true||m[7]==='TRUE');
  try{
    await apiPost('editarMedioPago',{id,id_cuenta:m[1],nombre:m[2],descuento_cliente_pct:0,comision_pct:m[4],costo_financiero_pct:m[5],dias_acreditacion:m[6],activo:nuevoActivo});
    m[7]=nuevoActivo;renderTablaMediosPago();
    showToast(nuevoActivo?'Medio activado':'Medio desactivado');
  }catch(e){showToast('Error','error')}
}
