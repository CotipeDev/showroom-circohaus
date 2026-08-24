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
  const prioridadTarifa=t=>String(t[3]||'').toLowerCase()==='efectivo'?0:String(t[3]||'').toLowerCase()==='transferencia'?1:2;
  const tarifas=[...tarifasCobroData].sort((a,b)=>Number(cobroActivo(b[10]))-Number(cobroActivo(a[10]))||prioridadTarifa(a)-prioridadTarifa(b)||String(a[2]).localeCompare(String(b[2]))||String(a[3]).localeCompare(String(b[3])));
  const activas=tarifas.filter(t=>cobroActivo(t[10]));
  const canales=new Set(activas.map(t=>`${t[2]}|${t[3]}`));
  const procesadores=new Set(activas.map(t=>String(t[2])).filter(Boolean));
  const resumen=document.getElementById('cobros-resumen-tarifas');
  if(resumen){const estilo='background:var(--off-white);border-radius:9px;padding:14px';const etiqueta='font-size:10px;text-transform:uppercase;color:var(--text-light);margin-bottom:5px';const valor='font-size:22px;font-weight:700;color:var(--navy)';resumen.style.cssText='display:grid;grid-template-columns:repeat(3,minmax(150px,1fr));gap:12px;margin-bottom:18px';resumen.innerHTML=`
    <div style="${estilo}"><div style="${etiqueta}">Tarifas activas</div><div style="${valor}">${activas.length}</div></div>
    <div style="${estilo}"><div style="${etiqueta}">Canales configurados</div><div style="${valor}">${canales.size}</div></div>
    <div style="${estilo}"><div style="${etiqueta}">Procesadores activos</div><div style="${valor}">${procesadores.size}</div></div>`;}
  const bodyTarifas=document.getElementById('cobros-tarifas-body');
  if(bodyTarifas)bodyTarifas.innerHTML=tarifas.length?tarifas.map(t=>{
    const costo=Number(t[6])||0,iva=Number(t[7])||0,costoIva=costo*(1+iva/100),estaActiva=cobroActivo(t[10]);
    return `<tr style="${estaActiva?'':'opacity:.58'}"><td>${nombreCuenta(t[1])}</td><td>${nombreProcesador(t[2])}</td><td><strong>${t[3]||'—'}</strong></td><td>${t[4]||'—'}</td><td>${Number(t[5])===0?'Inmediata':`${t[5]} días`}</td><td>${costo.toLocaleString('es-AR',{maximumFractionDigits:2})}%</td><td><strong>${costoIva.toLocaleString('es-AR',{maximumFractionDigits:2})}%</strong></td><td><button class="toggle ${estaActiva?'on':''}" onclick="toggleTarifaCobroV2('${t[0]}')" title="${estaActiva?'Desactivar':'Activar'}"></button></td><td><button class="btn-warning" onclick="abrirEditarTarifaCobroV2('${t[0]}')">✏️</button></td></tr>`;
  }).join(''):'<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text-light)">Todavía no hay tarifas configuradas.</td></tr>';

  const planes=[...planesCuotasData].sort((a,b)=>Number(cobroActivo(b[13]))-Number(cobroActivo(a[13]))||(Number(a[4])||0)-(Number(b[4])||0));
  const bodyPlanes=document.getElementById('cobros-planes-body');
  if(bodyPlanes)bodyPlanes.innerHTML=planes.length?planes.map(p=>{
    const estaActivo=cobroActivo(p[13]);
    const quien=String(p[7]||'').toLowerCase();const absorbe=quien==='negocio'?'Negocio':quien==='cliente'?'Cliente':quien==='ninguno'?'Ninguno':quien==='compartido'?'Compartido':p[7]||'—';
    const canal=p[2]==='*'?'Todos los canales':p[2]||'—';
    const costo=absorbe==='Cliente'&&Number(p[5])===0?'A definir':`${(Number(p[5])||0).toLocaleString('es-AR',{maximumFractionDigits:2})}%`;
    return `<tr style="${estaActivo?'':'opacity:.58'}"><td>${nombreProcesador(p[1])}</td><td>${canal}</td><td><strong>${p[4]||1}</strong></td><td>${absorbe}</td><td>${costo}</td><td>${Number(p[8])>0?formatPeso(p[8]):'Sin mínimo'}</td><td>${Number(p[15])>0?`${p[15]}%`:'—'}</td><td><button class="toggle ${estaActivo?'on':''}" onclick="togglePlanCobroV2('${p[0]}')" title="${estaActivo?'Desactivar':'Activar'}"></button></td><td><button class="btn-warning" onclick="abrirEditarPlanCobroV2('${p[0]}')">✏️</button></td></tr>`;
  }).join(''):'<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text-light)">Todavía no hay planes configurados.</td></tr>';
}

function opcionesCobro(datos,valor){return datos.map(x=>`<option value="${x[0]}" ${String(x[0])===String(valor)?'selected':''}>${x[1]}</option>`).join('');}

function abrirEditarTarifaCobroV2(id){
  const t=tarifasCobroData.find(x=>String(x[0])===String(id));if(!t)return;
  document.getElementById('cobro-edit-tarifa-id').value=t[0];
  document.getElementById('cobro-edit-tarifa-cuenta').innerHTML=opcionesCobro(cuentasData,t[1]);
  document.getElementById('cobro-edit-tarifa-procesador').innerHTML=opcionesCobro(procesadoresCobroData,t[2]);
  document.getElementById('cobro-edit-tarifa-canal').value=t[3]||'';
  document.getElementById('cobro-edit-tarifa-tipo').value=t[4]||'';
  document.getElementById('cobro-edit-tarifa-dias').value=Number(t[5])||0;
  document.getElementById('cobro-edit-tarifa-comision').value=Number(t[6])||0;
  document.getElementById('cobro-edit-tarifa-iva').value=Number(t[7])||0;
  document.getElementById('cobro-edit-tarifa-activa').value=String(cobroActivo(t[10]));
  document.getElementById('cobro-edit-tarifa-notas').value=t[11]||'';
  document.getElementById('cobro-edit-tarifa-motivo').value='';
  document.getElementById('modal-editar-tarifa-cobro').classList.add('open');
}

async function guardarTarifaCobroV2(){
  try{const id=document.getElementById('cobro-edit-tarifa-id').value,motivo=document.getElementById('cobro-edit-tarifa-motivo').value.trim();
  if(!motivo)throw new Error('Indicá brevemente el motivo del cambio.');
  await apiPost('editarTarifaCobro',{id_tarifa:id,motivo,cambios:{ID_Cuenta:document.getElementById('cobro-edit-tarifa-cuenta').value,ID_Procesador:document.getElementById('cobro-edit-tarifa-procesador').value,Canal:document.getElementById('cobro-edit-tarifa-canal').value.trim(),Tipo_Pago:document.getElementById('cobro-edit-tarifa-tipo').value.trim(),Dias_Acreditacion:Number(document.getElementById('cobro-edit-tarifa-dias').value)||0,Comision_Base_Pct:Number(document.getElementById('cobro-edit-tarifa-comision').value)||0,IVA_Pct:Number(document.getElementById('cobro-edit-tarifa-iva').value)||0,Activo:document.getElementById('cobro-edit-tarifa-activa').value==='true',Notas:document.getElementById('cobro-edit-tarifa-notas').value.trim()}});
  cerrarModal('modal-editar-tarifa-cobro');showToast('Tarifa actualizada');await recargarConfiguracionCobrosV2();}catch(e){showToast(e.message||'No se pudo guardar la tarifa','error');}
}

async function toggleTarifaCobroV2(id){
  const t=tarifasCobroData.find(x=>String(x[0])===String(id));if(!t)return;
  try{await apiPost('editarTarifaCobro',{id_tarifa:id,motivo:cobroActivo(t[10])?'Tarifa desactivada':'Tarifa activada',cambios:{Activo:!cobroActivo(t[10])}});showToast(cobroActivo(t[10])?'Tarifa desactivada':'Tarifa activada');await recargarConfiguracionCobrosV2();}catch(e){showToast(e.message||'No se pudo cambiar el estado','error');}
}

function abrirEditarPlanCobroV2(id){
  const p=planesCuotasData.find(x=>String(x[0])===String(id));if(!p)return;
  document.getElementById('cobro-edit-plan-id').value=p[0];document.getElementById('cobro-edit-plan-canal').value=p[2]||'*';document.getElementById('cobro-edit-plan-cuotas').value=Number(p[4])||1;document.getElementById('cobro-edit-plan-absorbe').value=String(p[7]||'ninguno').toLowerCase();document.getElementById('cobro-edit-plan-costo').value=Number(p[5])||0;document.getElementById('cobro-edit-plan-recargo').value=Number(p[6])||0;document.getElementById('cobro-edit-plan-minimo').value=Number(p[8])||0;document.getElementById('cobro-edit-plan-margen').value=Number(p[15])||0;document.getElementById('cobro-edit-plan-activo').value=String(cobroActivo(p[13]));document.getElementById('cobro-edit-plan-notas').value=p[14]||'';document.getElementById('cobro-edit-plan-motivo').value='';document.getElementById('modal-editar-plan-cobro').classList.add('open');
}

async function guardarPlanCobroV2(){
  try{const id=document.getElementById('cobro-edit-plan-id').value,motivo=document.getElementById('cobro-edit-plan-motivo').value.trim();if(!motivo)throw new Error('Indicá brevemente el motivo del cambio.');
  await apiPost('editarPlanCuotas',{id_plan:id,motivo,cambios:{Canal:document.getElementById('cobro-edit-plan-canal').value.trim()||'*',Cuotas:Number(document.getElementById('cobro-edit-plan-cuotas').value)||1,Quien_Absorbe:document.getElementById('cobro-edit-plan-absorbe').value,Costo_Negocio_Pct:Number(document.getElementById('cobro-edit-plan-costo').value)||0,Recargo_Cliente_Pct:Number(document.getElementById('cobro-edit-plan-recargo').value)||0,Monto_Minimo:Number(document.getElementById('cobro-edit-plan-minimo').value)||0,Margen_Minimo_Pct:Number(document.getElementById('cobro-edit-plan-margen').value)||0,Activo:document.getElementById('cobro-edit-plan-activo').value==='true',Notas:document.getElementById('cobro-edit-plan-notas').value.trim()}});cerrarModal('modal-editar-plan-cobro');showToast('Plan actualizado');await recargarConfiguracionCobrosV2();}catch(e){showToast(e.message||'No se pudo guardar el plan','error');}
}

async function togglePlanCobroV2(id){const p=planesCuotasData.find(x=>String(x[0])===String(id));if(!p)return;try{await apiPost('editarPlanCuotas',{id_plan:id,motivo:cobroActivo(p[13])?'Plan desactivado':'Plan activado',cambios:{Activo:!cobroActivo(p[13])}});showToast(cobroActivo(p[13])?'Plan desactivado':'Plan activado');await recargarConfiguracionCobrosV2();}catch(e){showToast(e.message||'No se pudo cambiar el estado','error');}}

async function recargarConfiguracionCobrosV2(){cache.invalidar('getTarifasCobro','getPlanesCuotas','getHistorialTarifasCobro','getHistorialPlanesCuotas');const[t,p]=await Promise.all([cacheGet('getTarifasCobro'),cacheGet('getPlanesCuotas')]);tarifasCobroData=t.slice(1);planesCuotasData=p.slice(1);renderConfiguracionCobrosV2();}

async function mostrarHistorialCobro(tipo,id){
  const accion=tipo==='tarifa'?'getHistorialTarifasCobro':'getHistorialPlanesCuotas';const data=await cacheGet(accion),filas=data.slice(1).filter(x=>String(x[1])===String(id)).reverse();document.getElementById('cobro-historial-titulo').textContent=`Historial — ${id}`;document.getElementById('cobro-historial-body').innerHTML=filas.length?`<table><thead><tr><th>Fecha</th><th>Campo</th><th>Anterior</th><th>Nuevo</th><th>Motivo</th><th>Usuario</th></tr></thead><tbody>${filas.map(f=>`<tr><td>${fechaStr(f[0])}</td><td>${String(f[2]||'').replaceAll('_',' ')}</td><td>${f[3]??'—'}</td><td><strong>${f[4]??'—'}</strong></td><td>${f[5]||'—'}</td><td>${f[6]||'—'}</td></tr>`).join('')}</tbody></table>`:'<div class="items-empty">Todavía no hay cambios registrados.</div>';document.getElementById('modal-historial-cobro').classList.add('open');
}
function verHistorialTarifaCobro(){mostrarHistorialCobro('tarifa',document.getElementById('cobro-edit-tarifa-id').value);}
function verHistorialPlanCobro(){mostrarHistorialCobro('plan',document.getElementById('cobro-edit-plan-id').value);}

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
