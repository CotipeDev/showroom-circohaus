// ============================================================
// CIRCO HAUS — Módulo de medios de pago
// Configuración de cuentas, costos, acreditación y vigencia.
// ============================================================

// ── MEDIOS DE PAGO ──
async function iniciarMediosPago(){
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

function renderTablaMediosPago(){
  const cuentaNombre=id=>{ const c=cuentasData.find(x=>String(x[0])===String(id));return c?c[1]:id||'—' };
  document.getElementById('mp-body').innerHTML=mediosPagoData.length===0
    ?'<tr><td colspan="8" style="text-align:center;color:var(--text-mid);padding:20px">No hay medios de pago</td></tr>'
    :mediosPagoData.map(m=>`<tr>
      <td><strong>${m[2]}</strong></td>
      <td>${cuentaNombre(m[1])}</td>
      <td>${Number(m[3])>0?`<span class="pct-badge descuento">−${m[3]}%</span>`:'<span style="color:var(--text-light)">—</span>'}</td>
      <td>${Number(m[4])>0?`<span class="pct-badge comision">${m[4]}%</span>`:'<span style="color:var(--text-light)">—</span>'}</td>
      <td>${Number(m[5])>0?`<span class="pct-badge">${m[5]}%</span>`:'<span style="color:var(--text-light)">—</span>'}</td>
      <td>${m[6]?m[6]+' días':'—'}</td>
      <td><button class="toggle ${m[7]===true||m[7]==='TRUE'?'on':''}" onclick="toggleActivoMP('${m[0]}',this)" title="${m[7]?'Activo':'Inactivo'}"></button></td>
      <td><button class="btn-warning" onclick="abrirEditarMP('${m[0]}')">✏️</button></td>
    </tr>`).join('');
}

async function agregarMedioPago(){
  const id_cuenta=document.getElementById('mp-cuenta').value,nombre=document.getElementById('mp-nombre').value.trim();
  if(!id_cuenta){showToast('Seleccioná una cuenta','error');return}
  if(!nombre){showToast('Ingresá el nombre','error');return}
  try{
    await apiPost('agregarMedioPago',{id_cuenta,nombre,descuento_cliente_pct:Number(document.getElementById('mp-descuento').value)||0,comision_pct:Number(document.getElementById('mp-comision').value)||0,costo_financiero_pct:Number(document.getElementById('mp-cf').value)||0,dias_acreditacion:Number(document.getElementById('mp-dias').value)||0});
    showToast('Medio de pago guardado');
    ['mp-nombre','mp-descuento','mp-comision','mp-cf','mp-dias'].forEach(id=>{document.getElementById(id).value='0'});document.getElementById('mp-cuenta').value='';document.getElementById('mp-nombre').value='';
    cache.invalidar('getMediosPago');mediosPagoData=[];await iniciarMediosPago();
  }catch(e){showToast('Error','error')}
}

function abrirEditarMP(id){
  const m=mediosPagoData.find(x=>String(x[0])===String(id));if(!m)return;
  document.getElementById('edit-mp-id').value=m[0];
  document.getElementById('edit-mp-cuenta').value=m[1];
  document.getElementById('edit-mp-nombre').value=m[2];
  document.getElementById('edit-mp-descuento').value=m[3]||0;
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
    await apiPost('editarMedioPago',{id,id_cuenta:idCuenta,nombre,descuento_cliente_pct:Number(document.getElementById('edit-mp-descuento').value)||0,comision_pct:Number(document.getElementById('edit-mp-comision').value)||0,costo_financiero_pct:Number(document.getElementById('edit-mp-cf').value)||0,dias_acreditacion:Number(document.getElementById('edit-mp-dias').value)||0,activo:medioActual?(medioActual[7]===true||medioActual[7]==='TRUE'):true});
    showToast('Medio de pago actualizado');cerrarModal('modal-editar-mp');cache.invalidar('getMediosPago');mediosPagoData=[];await iniciarMediosPago();
  }catch(e){showToast('Error','error')}
}

async function toggleActivoMP(id,btn){
  const m=mediosPagoData.find(x=>String(x[0])===String(id));if(!m)return;
  const nuevoActivo=!(m[7]===true||m[7]==='TRUE');
  try{
    await apiPost('editarMedioPago',{id,id_cuenta:m[1],nombre:m[2],descuento_cliente_pct:m[3],comision_pct:m[4],costo_financiero_pct:m[5],dias_acreditacion:m[6],activo:nuevoActivo});
    m[7]=nuevoActivo;btn.classList.toggle('on',nuevoActivo);
    showToast(nuevoActivo?'Medio activado':'Medio desactivado');
  }catch(e){showToast('Error','error')}
}
