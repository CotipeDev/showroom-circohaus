// Ventas V2: implementación única que reemplaza los handlers legacy del HTML.
(function () {
  const n = value => Math.max(0, Number(value) || 0);
  const redondear = value => Math.round(n(value));
  const activo = medio => medio && (medio[7] === true || String(medio[7]).toUpperCase() === 'TRUE' || Number(medio[7]) === 1);
  const activoCobro = valor => valor === true || String(valor).toUpperCase() === 'TRUE' || Number(valor) === 1;
  const medioPorId = id => mediosPagoData.find(m => String(m[0]) === String(id));
  const esEfectivo = medio => String(medio?.[2] || '').toLowerCase().includes('efectivo');
  const usaCobrosV2 = () => tarifasCobroData.some(t => activoCobro(t[10]));
  const tarifaPorId = id => tarifasCobroData.find(t => String(t[0]) === String(id));
  const planPorId = id => planesCuotasData.find(p => String(p[0]) === String(id));
  const procesadorNombre = id => procesadoresCobroData.find(p => String(p[0]) === String(id))?.[1] || id || '';
  const cuentaNombre = id => cuentasData.find(c => String(c[0]) === String(id))?.[1] || id || '';
  const esEfectivoTarifa = tarifa => String(tarifa?.[3] || '').toLowerCase() === 'efectivo';
  const fechaLocal = () => {
    const d = new Date(), pad = value => String(value).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  };

  function descuento(bruto, tipo, valor) {
    const limite = redondear(bruto);
    const importe = tipo === 'importe' ? redondear(valor) : redondear(limite * Math.min(100, n(valor)) / 100);
    return Math.min(limite, importe);
  }

  function calcularVentaV2() {
    let precioLista = 0, costoMercaderia = 0;
    vtaItemsCarrito.forEach(item => {
      const bruto = redondear(item.precio_unitario * item.cantidad);
      precioLista += bruto;
      costoMercaderia += redondear(item.costo_unitario * item.cantidad);
    });
    const subtotalItems = precioLista;
    const tipoGeneral = document.getElementById('vta-descuento-tipo')?.value || 'pct';
    const valorGeneral = n(document.getElementById('vta-descuento-general')?.value);
    const descuentoGeneral = descuento(subtotalItems, tipoGeneral, valorGeneral);
    const baseComercial = subtotalItems - descuentoGeneral;
    const esCuenta = document.getElementById('vta-tipo')?.value === 'cuenta_por_cobrar';
    const filas = esCuenta ? pagoInicialCuenta() : vtaPagosFila;
    let totalBase = 0, montoPagado = 0, costoCobranza = 0, netoPagos = 0, recargoCliente = 0;
    const pagos = filas.filter(f => (f.id_tarifa || f.id_medio) && n(f.base_asignada) > 0).map(f => {
      if (f.id_tarifa) {
        const tarifa=tarifaPorId(f.id_tarifa),plan=planPorId(f.id_plan),base=redondear(f.base_asignada);
        const quien=String(plan?.[7]||'ninguno').toLowerCase();
        const costoPlan=(quien==='negocio'||quien==='compartido')?n(plan?.[5]):0;
        const recargoPct=(quien==='cliente'||quien==='compartido')?n(plan?.[6]):0;
        const montoCliente=redondear(base*(1+recargoPct/100));
        const costoPct=(n(tarifa?.[6])+costoPlan)*(1+n(tarifa?.[7])/100);
        const costo=redondear(montoCliente*costoPct/100),neto=montoCliente-costo;
        totalBase+=base;montoPagado+=montoCliente;costoCobranza+=costo;netoPagos+=neto;recargoCliente+=montoCliente-base;
        return {id_tarifa:f.id_tarifa,id_plan:f.id_plan||'',base_asignada:base,tarifa,plan,montoCliente,comision:costo,costoFinanciero:0,neto,costoPct};
      }
      const medio = medioPorId(f.id_medio);
      const base = redondear(f.base_asignada);
      const comisionPct = n(medio?.[4]), cfPct = n(medio?.[5]);
      const montoCliente = base;
      const comision = redondear(montoCliente * comisionPct / 100);
      const costoFinanciero = redondear(montoCliente * cfPct / 100);
      const neto = montoCliente - comision - costoFinanciero;
      totalBase += base; montoPagado += montoCliente;
      costoCobranza += comision + costoFinanciero; netoPagos += neto;
      return { id_medio:f.id_medio, base_asignada:base, medio, montoCliente, comision, costoFinanciero, neto };
    });
    const saldoPendiente = esCuenta ? Math.max(0, baseComercial - totalBase) : 0;
    const netoEsperado = netoPagos + saldoPendiente;
    return { precioLista, descuentoGeneral, baseComercial, totalBase,
      totalFinal:baseComercial+recargoCliente, montoPagado, costoCobranza, netoEsperado,
      costoMercaderia, margenComercial:baseComercial-costoMercaderia,
      margenEstimado:netoEsperado-costoMercaderia, saldoPendiente, pagos, esCuenta };
  }

  function pagoInicialCuenta() {
    const base = n(document.getElementById('vta-fiado-monto-inicial')?.value);
    const id = document.getElementById('vta-fiado-medio-inicial')?.value || '';
    return base > 0 || id ? [usaCobrosV2()?{ id_tarifa:id, id_plan:'', base_asignada:base }:{ id_medio:id, base_asignada:base }] : [];
  }

  function tarjetaResumen(label, valor, fuerte) {
    return `<div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-light)">${label}</div><div style="font-size:${fuerte?'18':'14'}px;font-weight:${fuerte?'700':'600'};color:${fuerte?'var(--teal)':'var(--navy)'}">${formatPeso(valor)}</div></div>`;
  }

  window.iniciarVentas = async function () {
    setFechaHoy('vta-fecha');
    try {
      const [dataMp, dataCuentas, dataCli] = await Promise.all([cacheGet('getMediosPago'), cacheGet('getCuentas'), cacheGet('getClientes')]);
      mediosPagoData = dataMp.slice(1); cuentasData = dataCuentas.slice(1); clientesData = dataCli.slice(1);
      llenarSelectClientes();
      if (!vtaPagosFila.length) vtaPagosFila = [{ id_medio:'', id_tarifa:'', id_plan:'', base_asignada:0, entregado:0 }];
      renderFilasPago(); toggleTipoVenta(); actualizarTotalesVenta();
    } catch (e) { showToast(e.message || 'Error al cargar datos de ventas', 'error'); }
  };

  window.selProductoVenta = function (codigo) {
    const p = productosData.find(x => String(x[0]) === String(codigo)); if (!p) return;
    vtaProductoSel = p;
    document.getElementById('vta-buscar').value = `${p[0]} — ${p[1]}`;
    document.getElementById('vta-autocomplete').style.display = 'none';
    document.getElementById('vta-precio-lista').textContent = formatPeso(p[3]);
    const stock = n(p[5]);
    document.getElementById('vta-prod-nombre').innerHTML = `${p[0]} — ${p[1]} <span style="margin-left:8px;font-size:11px;font-weight:400;color:${stock===0?'var(--error)':'var(--text-light)'}">${stock===0?'⚠️ Sin stock':`Stock: ${stock} unid.`}</span>`;
    document.getElementById('vta-producto-preview').style.display = 'block';
  };

  window.agregarItemVenta = function () {
    if (!vtaProductoSel) return showToast('Seleccioná un producto', 'error');
    const cantidad = n(document.getElementById('vta-cantidad').value);
    if (!Number.isInteger(cantidad) || cantidad < 1) return showToast('Ingresá una cantidad entera válida', 'error');
    const p = vtaProductoSel, codigo = String(p[0]), stock = n(p[5]);
    const existente = vtaItemsCarrito.find(i => String(i.codigo) === codigo);
    const totalPedido = cantidad + (existente?.cantidad || 0);
    if (totalPedido > stock) return showToast(`Stock insuficiente — disponible: ${stock}`, 'error');
    if (existente) existente.cantidad = totalPedido;
    else vtaItemsCarrito.push({ codigo, desc:p[1], cantidad, precio_unitario:n(p[3]), costo_unitario:n(p[4]) });
    document.getElementById('vta-buscar').value = ''; document.getElementById('vta-cantidad').value = '1';
    document.getElementById('vta-producto-preview').style.display = 'none'; vtaProductoSel = null;
    renderCarritoVenta();
  };

  window.renderCarritoVenta = function () {
    const lista = document.getElementById('vta-items-lista');
    if (!vtaItemsCarrito.length) {
      lista.innerHTML = '<div class="items-empty">Todavía no agregaste productos</div>';
      document.getElementById('vta-totales').style.display = 'none'; document.getElementById('vta-card-pagos').style.display = 'none'; return;
    }
    lista.innerHTML = vtaItemsCarrito.map((item,i) => `<div class="item-row" style="grid-template-columns:2fr .7fr 1fr auto">
      <span><code style="color:var(--teal);font-size:11px">${item.codigo}</code> ${item.desc}</span><span>${item.cantidad} unid.</span><span>${formatPeso(item.precio_unitario)}</span>
      <button class="btn-danger" onclick="quitarItemVenta(${i})">✕</button></div>`).join('');
    document.getElementById('vta-totales').style.display = 'block'; document.getElementById('vta-card-pagos').style.display = 'block'; actualizarTotalesVenta();
  };

  window.quitarItemVenta = i => { vtaItemsCarrito.splice(i,1); renderCarritoVenta(); };
  window.agregarPagoVenta = () => { vtaPagosFila.push({id_medio:'',id_tarifa:'',id_plan:'',base_asignada:0,entregado:0}); renderFilasPago(); };
  window.cambiarMedioPago = (i,val) => {
    vtaPagosFila[i].id_medio=val;
    if(vtaPagosFila.length===1)vtaPagosFila[i].base_asignada=calcularVentaV2().baseComercial;
    renderFilasPago(); actualizarTotalesVenta();
  };
  window.cambiarTarifaPago = (i,val) => {
    vtaPagosFila[i].id_tarifa=val;vtaPagosFila[i].id_plan='';
    if(vtaPagosFila.length===1)vtaPagosFila[i].base_asignada=calcularVentaV2().baseComercial;
    renderFilasPago();actualizarTotalesVenta();
  };
  window.cambiarPlanPago = (i,val) => { vtaPagosFila[i].id_plan=val;actualizarTotalesVenta();renderFilasPago(); };
  window.cambiarBasePago = (i,val) => { vtaPagosFila[i].base_asignada=n(val); actualizarTotalesVenta(); };
  window.cambiarEntregado = (i,val) => { vtaPagosFila[i].entregado=n(val); actualizarTotalesVenta(); };
  window.quitarFilaPago = i => { vtaPagosFila.splice(i,1); renderFilasPago(); actualizarTotalesVenta(); };

  window.renderFilasPago = function () {
    const lista = document.getElementById('vta-pagos-lista'); if (!lista) return;
    if(usaCobrosV2()){
      const prioridad=t=>esEfectivoTarifa(t)?0:String(t[3]||'').toLowerCase()==='transferencia'?1:2;
      const tarifas=tarifasCobroData.filter(t=>activoCobro(t[10])).sort((a,b)=>prioridad(a)-prioridad(b)||String(a[3]).localeCompare(String(b[3]))||n(a[5])-n(b[5]));
      lista.innerHTML=vtaPagosFila.map((fila,i)=>{
        const tarifa=tarifaPorId(fila.id_tarifa),efectivo=esEfectivoTarifa(tarifa),base=n(fila.base_asignada)||calcularVentaV2().baseComercial;
        const planes=planesCuotasData.filter(p=>activoCobro(p[13])&&String(p[1])===String(tarifa?.[2])&&(p[2]==='*'||String(p[2])===String(tarifa?.[3]))&&base>=n(p[8])&&(!n(p[9])||base<=n(p[9]))&&!(String(p[7]).toLowerCase()==='cliente'&&n(p[6])<=0));
        const etiqueta=t=>`${cuentaNombre(t[1])} · ${t[3]} · ${t[4]} · ${n(t[5])?`${t[5]} días`:'inmediata'}`;
        const planLabel=p=>`${n(p[4])||1} cuota${n(p[4])===1?'':'s'}${String(p[7]).toLowerCase()==='negocio'?' sin interés':''}${!esVendedor()&&n(p[5])?` · costo ${p[5]}%`:''}`;
        return `<div style="display:grid;grid-template-columns:1.35fr .8fr .8fr 1.15fr auto;gap:10px;align-items:end;margin-bottom:12px;padding:10px;background:var(--off-white);border-radius:8px">
          <div class="field" style="margin:0"><label>Forma de cobro</label><select onchange="cambiarTarifaPago(${i},this.value)"><option value="">Seleccioná...</option>${tarifas.map(t=>`<option value="${t[0]}" ${String(t[0])===String(fila.id_tarifa)?'selected':''}>${etiqueta(t)}</option>`).join('')}</select></div>
          <div class="field" style="margin:0"><label>Plan</label><select onchange="cambiarPlanPago(${i},this.value)" ${!tarifa?'disabled':''}><option value="">1 cuota</option>${planes.filter(p=>n(p[4])>1).map(p=>`<option value="${p[0]}" ${String(p[0])===String(fila.id_plan)?'selected':''}>${planLabel(p)}</option>`).join('')}</select></div>
          <div class="field" style="margin:0;${vtaPagosFila.length===1?'display:none':''}"><label>Parte de la venta</label><input type="number" min="0" value="${fila.base_asignada||''}" oninput="cambiarBasePago(${i},this.value)"></div>
          <div class="field" style="margin:0"><label>${efectivo?'Efectivo recibido':esVendedor()?'Información':'Costo del cobro'}</label>${efectivo?`<input type="number" min="0" value="${fila.entregado||''}" placeholder="Ingresá lo que entrega" oninput="cambiarEntregado(${i},this.value)">`:esVendedor()?'<div style="font-size:11px;padding:9px 0">Cobro electrónico</div>':`<div style="font-size:11px;padding:9px 0">${tarifa?`Tarifa ${n(tarifa[6])}% + IVA${fila.id_plan?` · plan ${n(planPorId(fila.id_plan)?.[5])}%`:''}`:'Seleccioná una forma'}</div>`}</div>
          ${vtaPagosFila.length>1?`<button class="btn-danger" onclick="quitarFilaPago(${i})" style="height:40px">✕</button>`:'<div></div>'}
          <div id="vta-pago-info-${i}" style="grid-column:1/-1;font-size:11px;color:var(--text-mid)"></div></div>`;
      }).join('');return;
    }
    const medios = mediosPagoData.filter(activo);
    lista.innerHTML = vtaPagosFila.map((fila,i) => {
      const mp = medioPorId(fila.id_medio), efectivo = esEfectivo(mp);
      return `<div style="display:grid;grid-template-columns:1.2fr .8fr 1.2fr auto;gap:10px;align-items:end;margin-bottom:12px;padding:10px;background:var(--off-white);border-radius:8px">
        <div class="field" style="margin:0"><label>Medio de pago</label><select onchange="cambiarMedioPago(${i},this.value)"><option value="">Seleccioná...</option>${medios.map(m=>`<option value="${m[0]}" ${String(m[0])===String(fila.id_medio)?'selected':''}>${m[2]}</option>`).join('')}</select></div>
        <div class="field" style="margin:0;${vtaPagosFila.length===1?'display:none':''}"><label>Parte de la venta</label><input type="number" min="0" value="${fila.base_asignada||''}" oninput="cambiarBasePago(${i},this.value)"></div>
        <div class="field" style="margin:0"><label>${efectivo?'Efectivo recibido':esVendedor()?'Información':'Costos del medio'}</label>${efectivo?`<input type="number" min="0" value="${fila.entregado||''}" placeholder="Ingresá lo que entrega" oninput="cambiarEntregado(${i},this.value)">`:esVendedor()?'<div style="font-size:11px;padding:9px 0">Cobro electrónico</div>':`<div style="font-size:11px;padding:9px 0">Comisión ${n(mp?.[4])}% · Costo financiero ${n(mp?.[5])}%</div>`}</div>
        ${vtaPagosFila.length>1?`<button class="btn-danger" onclick="quitarFilaPago(${i})" style="height:40px">✕</button>`:'<div></div>'}
        <div id="vta-pago-info-${i}" style="grid-column:1/-1;font-size:11px;color:var(--text-mid)"></div></div>`;
    }).join('');
  };

  window.actualizarTotalesVenta = function () {
    let c = calcularVentaV2();
    if(!c.esCuenta&&vtaPagosFila.length===1&&(vtaPagosFila[0].id_tarifa||vtaPagosFila[0].id_medio)&&vtaPagosFila[0].base_asignada!==c.baseComercial){
      vtaPagosFila[0].base_asignada=c.baseComercial;
      if(usaCobrosV2())renderFilasPago();
      c=calcularVentaV2();
    }
    document.getElementById('vta-lista-bruto').textContent = formatPeso(c.precioLista);
    document.getElementById('vta-resumen').innerHTML = [
      ['Precio Lista',c.precioLista],['Descuento General',c.descuentoGeneral],['Subtotal después del descuento',c.baseComercial],
      ['Total Final',c.totalFinal,true],
      ...(!esVendedor()?[['Costo Cobranza',c.costoCobranza],['Neto Esperado',c.netoEsperado,true],['Costo Mercadería',c.costoMercaderia],['Margen antes de cobranza',c.margenComercial],['Margen final estimado',c.margenEstimado,true]]:[]),
      ...(c.esCuenta?[['Saldo pendiente',c.saldoPendiente]]:[])
    ].map(x=>tarjetaResumen(...x)).join('');
    c.pagos.forEach((p,i) => {
      const el=document.getElementById(`vta-pago-info-${i}`); if(!el)return;
      const fila=vtaPagosFila[i], recibido=n(fila?.entregado), diferencia=recibido-p.montoCliente;
      const pagoEfectivo=p.tarifa?esEfectivoTarifa(p.tarifa):esEfectivo(p.medio);
      const efectivoInfo=pagoEfectivo?(recibido<=0?'':diferencia>=0?` · Vuelto ${formatPeso(diferencia)}`:` · Falta recibir ${formatPeso(Math.abs(diferencia))}`):'';
      el.textContent=esVendedor()?`Cliente paga ${formatPeso(p.montoCliente)}${efectivoInfo}`:`Cliente paga ${formatPeso(p.montoCliente)} · Comisión ${formatPeso(p.comision)} · Costo financiero ${formatPeso(p.costoFinanciero)} · Neto ${formatPeso(p.neto)}${efectivoInfo}`;
    });
    return c;
  };

  window.toggleTipoVenta = function () {
    const cuenta=document.getElementById('vta-tipo').value==='cuenta_por_cobrar';
    document.getElementById('vta-seccion-pagos').style.display=cuenta?'none':'block';
    document.getElementById('vta-cliente-wrap').style.display=cuenta?'block':'none';
    const sel=document.getElementById('vta-fiado-medio-inicial');
    sel.innerHTML='<option value="">Sin pago inicial</option>'+(usaCobrosV2()?tarifasCobroData.filter(t=>activoCobro(t[10])).map(t=>`<option value="${t[0]}">${cuentaNombre(t[1])} · ${t[3]} · ${t[4]} · ${n(t[5])?`${t[5]} días`:'inmediata'}</option>`).join(''):mediosPagoData.filter(activo).map(m=>`<option value="${m[0]}">${m[2]}</option>`).join(''));
    sel.onchange=actualizarTotalesVenta; actualizarTotalesVenta();
  };

  window.confirmarVenta = async function (confirmarMargenBajo=false) {
    const btn=document.querySelector('#panel-ventas .btn-primary'); if(btn?.disabled)return;
    try {
      if(!vtaItemsCarrito.length)throw new Error('Agregá al menos un producto.');
      const fecha=document.getElementById('vta-fecha').value, tipo=document.getElementById('vta-tipo').value;
      const idCliente=document.getElementById('vta-cliente').value;
      if(!fecha)throw new Error('Seleccioná una fecha.'); if(tipo==='cuenta_por_cobrar'&&!idCliente)throw new Error('Seleccioná un cliente.');
      const c=calcularVentaV2();
      const pagosEntrada=tipo==='cuenta_por_cobrar'?pagoInicialCuenta():vtaPagosFila;
      if(pagosEntrada.some(p=>{const id=p.id_tarifa||p.id_medio;return(id&&!n(p.base_asignada))||(!id&&n(p.base_asignada));}))throw new Error('Completá la forma de cobro y el importe en cada pago.');
      if(tipo!=='cuenta_por_cobrar'&&redondear(c.totalBase)!==redondear(c.baseComercial))throw new Error(`La suma de bases (${formatPeso(c.totalBase)}) debe igualar la Base Comercial (${formatPeso(c.baseComercial)}).`);
      if(tipo==='cuenta_por_cobrar'&&c.totalBase>c.baseComercial)throw new Error('El pago inicial no puede superar la Base Comercial.');
      for(const item of vtaItemsCarrito){const p=productosData.find(x=>String(x[0])===String(item.codigo));if(!p||item.cantidad>n(p[5]))throw new Error(`Stock insuficiente para ${item.codigo}.`);}
      btn.disabled=true;btn.textContent='Procesando...';
      const tipoDesc=document.getElementById('vta-descuento-tipo').value, valorDesc=n(document.getElementById('vta-descuento-general').value);
      const payload={fecha,tipo,id_cliente:idCliente||'',notas:document.getElementById('vta-notas').value,aplicar_descuento_medios:false,confirmar_margen_bajo:confirmarMargenBajo,
        descuento_general_pct:tipoDesc==='pct'?valorDesc:0,descuento_general_importe:tipoDesc==='importe'?valorDesc:0,
        items:vtaItemsCarrito.map(i=>({codigo:i.codigo,cantidad:i.cantidad,descuento_item_pct:0,descuento_item_importe:0})),
        pagos:pagosEntrada.filter(p=>(p.id_tarifa||p.id_medio)&&n(p.base_asignada)>0).map(p=>p.id_tarifa?({id_tarifa:p.id_tarifa,id_plan:p.id_plan||'',base_asignada:redondear(p.base_asignada)}):({id_medio:p.id_medio,base_asignada:redondear(p.base_asignada)}))};
      const res=await apiPost('registrarVentaV2',payload);
      showToast(`✅ Venta ${res.id||res.id_venta||''} registrada`); cacheInvalidar('getVentas','getDetalleVentas','getPagosVenta','getProductos','getCuentasPorCobrar','getMovimientos');
      ventasData=[];detalleVentasData=[];pagosVentaData=[];cuentasPorCobrarData=[];cxcDataGlobal={};
      ventasHistData=[]; limpiarVenta(); setTimeout(()=>cargarProductos(),1500);
    } catch(e) {
      const mensaje=String(e.message||'Error al registrar la venta');
      if(mensaje.startsWith('MARGEN_BAJO|')&&!esVendedor()&&!confirmarMargenBajo&&confirm(mensaje.split('|').slice(1).join('|')+'\n\n¿Confirmar igualmente como administradora?')){if(btn){btn.disabled=false;btn.textContent='✓ Confirmar venta';}return confirmarVenta(true);}
      showToast(mensaje.replace(/^MARGEN_BAJO\|/,''),'error');
    }
    finally { if(btn){btn.disabled=false;btn.textContent='✓ Confirmar venta';} }
  };

  window.limpiarVenta = function () {
    vtaItemsCarrito=[];vtaPagosFila=[{id_medio:'',id_tarifa:'',id_plan:'',base_asignada:0,entregado:0}];vtaProductoSel=null;
    ['vta-buscar','vta-notas','vta-fiado-monto-inicial'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    document.getElementById('vta-tipo').value='venta';document.getElementById('vta-descuento-tipo').value='pct';document.getElementById('vta-descuento-general').value='0';
    setFechaHoy('vta-fecha');renderCarritoVenta();renderFilasPago();toggleTipoVenta();
  };

  window.cancelarVenta = async function (idVenta) {
    if(esVendedor())return showToast('Tu perfil no puede cancelar ventas','error');
    if(!confirm(`¿Cancelar la venta ${idVenta}? Esto reintegrará el stock.`))return;
    showToast('Cancelando venta...');
    try {
      let venta=ventasHistData.find(v=>String(v[0])===String(idVenta));
      if(!venta){const data=await cacheGet('getVentas');venta=data.slice(1).find(v=>String(v[0])===String(idVenta));}
      const action=String(venta?.[25]||'').trim()==='V2'?'cancelarVentaV2':'cancelarVenta';
      await apiPost(action,{id_venta:idVenta,fecha:fechaLocal(),motivo:'Cancelación desde showroom'});
      if(venta){
        venta[7]='cancelada';
        if(venta.length>24){venta[6]=0;venta[17]=0;venta[18]=0;venta[19]=0;venta[20]=0;venta[24]='CANCELADA';}
      }
      const ventaVisible=ventasHistData.find(v=>String(v[0])===String(idVenta));
      if(ventaVisible){
        ventaVisible[7]='cancelada';
        if(ventaVisible.length>24){ventaVisible[6]=0;ventaVisible[17]=0;ventaVisible[18]=0;ventaVisible[19]=0;ventaVisible[20]=0;ventaVisible[24]='CANCELADA';}
      }
      renderHistorialVentas(ventasHistData);
      showToast('✅ Venta cancelada. Stock reintegrado.');
      ventasData=[];detalleVentasData=[];pagosVentaData=[];cuentasPorCobrarData=[];cxcDataGlobal={};
      cacheInvalidar('getProductos','getVentas','getDetalleVentas','getPagosVenta','getMovimientos','getCuentasPorCobrar');setTimeout(()=>cargarProductos(),1500);
    } catch(e){showToast(e.message||'Error al cancelar la venta','error');}
  };
})();
