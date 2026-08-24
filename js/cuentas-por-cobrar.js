// ============================================================
// CIRCO HAUS — Módulo de cuentas por cobrar
// Saldos, fichas de clientes, alertas y registro de pagos.
// ============================================================

let cxcDataGlobal=[];

async function iniciarCxc(){
  document.getElementById('cxc-fichas').innerHTML='<p style="color:var(--text-light);text-align:center;padding:32px;grid-column:span 2">Cargando...</p>';
  try{
    // Usar variables globales si ya están cargadas, si no pedir al API
    const cpcsTodas=cuentasPorCobrarData.length?cuentasPorCobrarData:(await cacheGet('getCuentasPorCobrar')).slice(1);
    const cpcs=cpcsTodas.filter(c=>String(c[6]||'').toLowerCase()!=='cancelada');
    const ventas=ventasData.length?ventasData:(await cacheGet('getVentas')).slice(1);
    const clientes=clientesData.length?clientesData:(await cacheGet('getClientes')).slice(1);
    const pagos=pagosVentaData.length?pagosVentaData:(await cacheGet('getPagosVenta')).slice(1);
    const medios=mediosPagoData.length?mediosPagoData:(await cacheGet('getMediosPago')).slice(1);
    const cuentas=cuentasData.length?cuentasData:(await cacheGet('getCuentas')).slice(1);

    // Actualizar variables globales
    if(!cuentasPorCobrarData.length)cuentasPorCobrarData=cpcsTodas;
    if(!ventasData.length)ventasData=ventas;
    if(!pagosVentaData.length)pagosVentaData=pagos;

    // Cargar selects del modal de cobro
    const selMedio=document.getElementById('cxc-cobro-medio');
    const selCuenta=document.getElementById('cxc-cobro-cuenta');
    selMedio.innerHTML='<option value="">Seleccioná...</option>'+medios.filter(m=>(m[7]===true||m[7]==='TRUE')&&(String(m[2]).toLowerCase().includes('efectivo')||String(m[2]).toLowerCase().includes('transfer'))).map(m=>`<option value="${m[0]}" data-cuenta="${m[1]}">${m[2]}</option>`).join('');
    selCuenta.innerHTML='<option value="">Seleccioná...</option>'+cuentas.filter(c=>c[4]===true||c[4]==='TRUE').map(c=>`<option value="${c[0]}">${c[1]}</option>`).join('');
    selMedio.onchange=()=>{const op=selMedio.selectedOptions[0];if(op&&op.dataset.cuenta)selCuenta.value=op.dataset.cuenta;};

    const pendientes=cpcs.filter(c=>c[6]==='pendiente'||c[6]==='cobrada_parcial');
    const nombreCliente=id=>{const c=clientes.find(x=>String(x[0])===String(id));return c?c[1]:id||'Sin nombre'};
    const nombreMedio=id=>{const m=medios.find(x=>String(x[0])===String(id));return m?m[2]:id||'—'};

    // KPIs
    const hoy=new Date();
    document.getElementById('cxc-kpi-clientes').textContent=new Set(pendientes.map(c=>String(c[2]))).size;
    document.getElementById('cxc-kpi-total').textContent=formatPeso(pendientes.reduce((s,c)=>s+Number(c[5]),0));
    const alertas=pendientes.filter(c=>{
      const v=ventas.find(x=>String(x[0])===String(c[1]));
      const f=fechaStr(v?v[1]:c[7]||'');
      return f&&Math.floor((hoy-new Date(f))/(1000*60*60*24))>37;
    });
    document.getElementById('cxc-kpi-alertas').textContent=alertas.length;
    actualizarNotifCxc(alertas.length);

    // Agrupar por cliente — TODOS los que tienen alguna CxC
    const porCliente={};
    cpcs.forEach(cpc=>{
      const idCli=String(cpc[2]);
      if(!porCliente[idCli])porCliente[idCli]={nombre:nombreCliente(idCli),cpcs:[],saldoTotal:0};
      porCliente[idCli].cpcs.push(cpc);
      porCliente[idCli].saldoTotal+=Number(cpc[5]);
    });
    Object.values(porCliente).forEach(d=>d.totalDeuda=d.saldoTotal);

    cxcDataGlobal={porCliente,ventas,pagos,nombreCliente,nombreMedio,hoy};
    renderCxcFichas(Object.entries(porCliente));

  }catch(e){document.getElementById('cxc-fichas').innerHTML='<p style="color:#C44F4F;text-align:center;padding:32px;grid-column:span 2">Error al cargar datos</p>';}
}

function filtrarCxc(){
  const q=document.getElementById('cxc-buscar').value.toLowerCase().trim();
  if(!cxcDataGlobal.porCliente)return;
  const filtrados=Object.entries(cxcDataGlobal.porCliente).filter(([id,datos])=>{
    if(!q)return true;
    if(datos.nombre.toLowerCase().includes(q))return true;
    return datos.cpcs.some(c=>String(c[1]).toLowerCase().includes(q));
  });
  renderCxcFichas(filtrados);
}

function renderCxcFichas(entradas){
  const {ventas,hoy}=cxcDataGlobal;
  if(!entradas.length){
    document.getElementById('cxc-fichas').innerHTML='<p style="color:var(--text-light);text-align:center;padding:32px;grid-column:span 2">No hay resultados</p>';
    return;
  }
  document.getElementById('cxc-fichas').innerHTML=entradas.map(([idCli,datos])=>{
    const fechas=datos.cpcs.map(c=>{const v=ventas.find(x=>String(x[0])===String(c[1]));return v?new Date(fechaStr(v[1])):null;}).filter(Boolean);
    const ultimaFecha=fechas.length?new Date(Math.max(...fechas)):null;
    const diasDesde=ultimaFecha?Math.floor((hoy-ultimaFecha)/(1000*60*60*24)):null;
    const hayAlerta=diasDesde!==null&&diasDesde>37;
    const cantVentas=datos.cpcs.length;
    const saldo=datos.saldoTotal;
    const saldoColor=saldo>0?'#C44F4F':saldo<0?'var(--teal)':'var(--text-mid)';
    const saldoLabel=saldo>0?formatPeso(saldo):saldo<0?`${formatPeso(Math.abs(saldo))} a favor`:'Sin saldo pendiente';
    return`<div class="card" style="border-left:3px solid ${hayAlerta?'#C44F4F':saldo<0?'var(--teal)':'var(--border)'}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <div style="font-family:'Playfair Display',serif;font-size:17px;color:var(--navy);font-weight:600">${datos.nombre}</div>
        ${hayAlerta?`<span style="background:#FDE8E8;color:#C44F4F;font-size:11px;font-weight:700;padding:3px 10px;border-radius:12px">⚠️ ${diasDesde} días</span>`:''}
      </div>
      <div style="font-size:24px;font-weight:700;color:${saldoColor};margin-bottom:8px">${saldoLabel}</div>
      <div style="font-size:12px;color:var(--text-light);margin-bottom:12px">${cantVentas} venta${cantVentas!==1?'s':''}${ultimaFecha?' · Última: '+ultimaFecha.toLocaleDateString('es-AR'):''}</div>
      <div style="display:flex;gap:8px">
        ${saldo>0?`<button class="btn btn-primary" style="font-size:12px;flex:1" onclick="abrirFichaCliente('${idCli}',true)">+ Registrar pago</button>`:''}
        <button class="btn btn-secondary" style="font-size:12px;flex:1" onclick="abrirFichaCliente('${idCli}',false)">Ver historial →</button>
      </div>
    </div>`;
  }).join('');
}

async function abrirFichaCliente(idCli, abrirPago=false){
  const {porCliente,ventas,hoy}=cxcDataGlobal;
  const datos=porCliente[idCli];
  if(!datos)return;
  // Guardar idCli en el modal para usarlo desde el botón
  document.getElementById('modal-ficha-cliente').dataset.idCli=idCli;
  document.getElementById('ficha-cliente-nombre').textContent=datos.nombre;
  const saldoModal=datos.saldoTotal||datos.totalDeuda||0;
  const deudaEl=document.getElementById('ficha-cliente-deuda');
  if(saldoModal>0){deudaEl.style.color='#C44F4F';deudaEl.textContent='Total pendiente: '+formatPeso(saldoModal);}
  else if(saldoModal<0){deudaEl.style.color='var(--teal)';deudaEl.textContent='Saldo a favor: '+formatPeso(Math.abs(saldoModal));}
  else{deudaEl.style.color='var(--text-mid)';deudaEl.textContent='Sin saldo pendiente';}
  document.getElementById('ficha-cliente-contenido').innerHTML='<p style="color:var(--text-light);text-align:center;padding:16px">Cargando...</p>';
  document.getElementById('modal-ficha-cliente').classList.add('open');

  const dataMovs=await cacheGet('getMovimientos');
  const movs=Array.isArray(dataMovs)?dataMovs.slice(1):[];

  let lineas=[];
  datos.cpcs.forEach(cpc=>{
    const idVenta=String(cpc[1]);
    const v=ventas.find(x=>String(x[0])===idVenta);
    const fechaVenta=v?fechaStr(v[1]):'';
    const montoTotal=Number(cpc[3]);
    lineas.push({fecha:fechaVenta,tipo:'venta',detalle:'Venta',debe:montoTotal,haber:0,idVenta,idCpc:String(cpc[0])});

    const cobrosCpc=movs.filter(m=>String(m[8])==='cobro_cpc'&&String(m[7])===String(cpc[0]));
    const totalCobrosPoster=cobrosCpc.reduce((s,m)=>s+Number(m[5]),0);
    const pagoInicialReal=Number(cpc[4])-totalCobrosPoster;
    if(pagoInicialReal>0){
      lineas.push({fecha:fechaVenta,tipo:'pago',detalle:'Pago inicial',debe:0,haber:pagoInicialReal,idCpc:String(cpc[0])});
    }
    cobrosCpc.forEach(m=>{
      lineas.push({fecha:fechaStr(m[1]),tipo:'pago',detalle:'Pago parcial',debe:0,haber:Number(m[5]),idCpc:String(cpc[0])});
    });
  });

  lineas.sort((a,b)=>a.fecha.localeCompare(b.fecha));

  let saldoAcum=0;
  const filas=lineas.map(l=>{
    saldoAcum+=l.debe-l.haber;
    return`<tr style="border-bottom:1px solid var(--border)">
      <td style="padding:9px 8px;font-size:12px;color:var(--text-light);white-space:nowrap">${l.fecha||'—'}</td>
      <td style="padding:9px 8px;font-size:12px">
        ${l.tipo==='venta'
          ?`<span style="color:var(--teal);cursor:pointer;text-decoration:underline;font-size:11px" onclick="verDetalleVenta('${l.idVenta}')">${l.idVenta}</span><span style="color:var(--text-mid);margin-left:6px">${l.detalle}</span>`
          :`<span style="color:var(--text-mid)">${l.detalle}</span>`}
      </td>
      <td style="padding:9px 8px;text-align:right;font-size:13px;font-weight:600;color:${l.debe>0?'#C44F4F':'var(--text-light)'}">${l.debe>0?formatPeso(l.debe):'—'}</td>
      <td style="padding:9px 8px;text-align:right;font-size:13px;font-weight:600;color:${l.haber>0?'var(--teal)':'var(--text-light)'}">${l.haber>0?formatPeso(l.haber):'—'}</td>
      <td style="padding:9px 8px;text-align:right;font-size:13px;font-weight:700;color:${saldoAcum>0?'#C44F4F':'var(--teal)'}">${formatPeso(Math.abs(saldoAcum))}</td>
    </tr>`;
  }).join('');

  document.getElementById('ficha-cliente-contenido').innerHTML=`
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr>
        <th style="text-align:left;padding:6px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-light);border-bottom:2px solid var(--border)">Fecha</th>
        <th style="text-align:left;padding:6px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-light);border-bottom:2px solid var(--border)">Detalle</th>
        <th style="text-align:right;padding:6px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#C44F4F;border-bottom:2px solid var(--border)">Debe</th>
        <th style="text-align:right;padding:6px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--teal);border-bottom:2px solid var(--border)">Haber</th>
        <th style="text-align:right;padding:6px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-light);border-bottom:2px solid var(--border)">Saldo</th>
      </tr></thead>
      <tbody>${filas}</tbody>
    </table>`;

  // Si vino desde el botón pago, abrir el cobro de la primera CxC pendiente
  if(abrirPago){
    const primerCpc=datos.cpcs.find(c=>Number(c[5])>0);
    if(primerCpc){
      setTimeout(()=>{
        cerrarModal('modal-ficha-cliente');
        abrirCobroCxc(String(primerCpc[0]),datos.nombre,Number(primerCpc[5]));
      },100);
    }
  }
}

async function abrirFichaClientePorCpc(idCpc){
  try{
    const[dataCpc,dataVentas,dataClientes,dataPagos,dataMedios,dataCuentas]=await Promise.all([
      cacheGet('getCuentasPorCobrar'),cacheGet('getVentas'),cacheGet('getClientes'),
      cacheGet('getPagosVenta'),cacheGet('getMediosPago'),cacheGet('getCuentas')
    ]);
    const cpcs=Array.isArray(dataCpc)?dataCpc.slice(1):[];
    const ventas=Array.isArray(dataVentas)?dataVentas.slice(1):[];
    const clientes=Array.isArray(dataClientes)?dataClientes.slice(1):[];
    const pagos=Array.isArray(dataPagos)?dataPagos.slice(1):[];
    const medios=Array.isArray(dataMedios)?dataMedios.slice(1):[];
    const nombreCliente=id=>{const c=clientes.find(x=>String(x[0])===String(id));return c?c[1]:id||'Sin nombre'};
    const nombreMedio=id=>{const m=medios.find(x=>String(x[0])===String(id));return m?m[2]:id||'—'};
    // Encontrar la CxC y su cliente
    const cpc=cpcs.find(c=>String(c[0])===String(idCpc));
    if(!cpc)return;
    const idCli=String(cpc[2]);
    // Armar datos del cliente igual que iniciarCxc
    const cpcsCli=cpcs.filter(c=>String(c[2])===idCli);
    const saldoTotal=cpcsCli.reduce((s,c)=>s+Number(c[5]),0);
    const porCliente={[idCli]:{nombre:nombreCliente(idCli),cpcs:cpcsCli,saldoTotal,totalDeuda:saldoTotal}};
    const hoy=new Date();
    cxcDataGlobal={porCliente,ventas,pagos,nombreCliente,nombreMedio,hoy};
    abrirFichaCliente(idCli,false);
  }catch(e){showToast('Error al abrir ficha','error');}
}

function abrirCobrosDesdeModal(){
  const idCli=document.getElementById('modal-ficha-cliente').dataset.idCli;
  const datos=cxcDataGlobal.porCliente[idCli];
  if(!datos)return;
  // Buscar la CxC con mayor saldo pendiente, o la primera si todas son <= 0
  const cpcPendiente=datos.cpcs.find(c=>Number(c[5])>0)||datos.cpcs[0];
  if(cpcPendiente){
    cerrarModal('modal-ficha-cliente');
    abrirCobroCxc(String(cpcPendiente[0]),datos.nombre,Number(cpcPendiente[5]));
  }
}

function actualizarNotifCxc(cantidad){
  // La campana general muestra sólo alertas de stock sin revisar.
}

function abrirCobroCxc(idCpc,nombreCliente,saldo){
  const modal=document.getElementById('modal-cobro-cxc');
  document.getElementById('cxc-cobro-id').value=idCpc;
  modal.dataset.saldo=String(Math.max(0,Number(saldo)||0));
  document.getElementById('cxc-cobro-info').textContent=`${nombreCliente} — Saldo pendiente: ${formatPeso(saldo)}`;
  document.getElementById('cxc-cobro-monto').value='';
  setFechaHoy('cxc-cobro-fecha');
  document.getElementById('cxc-cobro-medio').value='';
  document.getElementById('cxc-cobro-cuenta').value='';
  modal.classList.add('open');
}

async function confirmarCobroCxc(){
  const idCpc=document.getElementById('cxc-cobro-id').value;
  const fecha=document.getElementById('cxc-cobro-fecha').value;
  const monto=Number(document.getElementById('cxc-cobro-monto').value);
  const idMedio=document.getElementById('cxc-cobro-medio').value;
  const idCuenta=document.getElementById('cxc-cobro-cuenta').value;
  const saldo=Number(document.getElementById('modal-cobro-cxc').dataset.saldo)||0;
  if(!fecha){showToast('Seleccioná la fecha del pago','error');return;}
  if(!monto||monto<=0){showToast('Ingresá un monto válido','error');return;}
  if(monto>saldo){showToast(`El pago no puede superar el saldo de ${formatPeso(saldo)}`,'error');return;}
  if(!idMedio){showToast('Seleccioná un medio de pago','error');return;}
  if(!idCuenta){showToast('Seleccioná una cuenta','error');return;}
  const btnConfirmar=document.querySelector('#modal-cobro-cxc .btn-primary');
  if(btnConfirmar?.disabled)return;
  if(btnConfirmar){btnConfirmar.disabled=true;btnConfirmar.textContent='Guardando...';}
  try{
    await apiPost('registrarCobroCPC',{id_cpc:idCpc,fecha,monto,id_medio:idMedio,id_cuenta:idCuenta});
    showToast('✅ Pago registrado');
    cerrarModal('modal-cobro-cxc');
    cache.invalidar('getCuentasPorCobrar','getMovimientos','getVentas');
    cuentasPorCobrarData=[];movimientosData=[];ventasData=[];
    await iniciarCxc();
  }catch(e){
    showToast(e?.message||'Error al registrar el pago','error');
  }finally{if(btnConfirmar){btnConfirmar.disabled=false;btnConfirmar.textContent='✓ Registrar pago';}}
}
