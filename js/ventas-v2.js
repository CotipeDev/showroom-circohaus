// Ventas V2: implementación única que reemplaza los handlers legacy del HTML.
(function () {
  const n = value => Math.max(0, Number(value) || 0);
  const redondear = value => Math.round(n(value));
  const activo = medio => medio && (medio[7] === true || String(medio[7]).toUpperCase() === 'TRUE' || Number(medio[7]) === 1);
  const medioPorId = id => mediosPagoData.find(m => String(m[0]) === String(id));
  const esEfectivo = medio => String(medio?.[2] || '').toLowerCase().includes('efectivo');
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
    let totalBase = 0, montoPagado = 0, costoCobranza = 0, netoPagos = 0;
    const pagos = filas.filter(f => f.id_medio && n(f.base_asignada) > 0).map(f => {
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
    const saldoPendiente = esCuenta ? Math.max(0, baseComercial - montoPagado) : 0;
    const netoEsperado = netoPagos + saldoPendiente;
    return { precioLista, descuentoGeneral, baseComercial, totalBase,
      totalFinal:baseComercial, montoPagado, costoCobranza, netoEsperado,
      costoMercaderia, margenComercial:baseComercial-costoMercaderia,
      margenEstimado:netoEsperado-costoMercaderia, saldoPendiente, pagos, esCuenta };
  }

  function pagoInicialCuenta() {
    const base = n(document.getElementById('vta-fiado-monto-inicial')?.value);
    const id = document.getElementById('vta-fiado-medio-inicial')?.value || '';
    return base > 0 || id ? [{ id_medio:id, base_asignada:base }] : [];
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
      if (!vtaPagosFila.length) vtaPagosFila = [{ id_medio:'', base_asignada:0, entregado:0 }];
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
  window.agregarPagoVenta = () => { vtaPagosFila.push({id_medio:'',base_asignada:0,entregado:0}); renderFilasPago(); };
  window.cambiarMedioPago = (i,val) => {
    vtaPagosFila[i].id_medio=val;
    if(vtaPagosFila.length===1)vtaPagosFila[i].base_asignada=calcularVentaV2().baseComercial;
    renderFilasPago(); actualizarTotalesVenta();
  };
  window.cambiarBasePago = (i,val) => { vtaPagosFila[i].base_asignada=n(val); actualizarTotalesVenta(); };
  window.cambiarEntregado = (i,val) => { vtaPagosFila[i].entregado=n(val); actualizarTotalesVenta(); };
  window.quitarFilaPago = i => { vtaPagosFila.splice(i,1); renderFilasPago(); actualizarTotalesVenta(); };

  window.renderFilasPago = function () {
    const lista = document.getElementById('vta-pagos-lista'); if (!lista) return;
    const medios = mediosPagoData.filter(activo);
    lista.innerHTML = vtaPagosFila.map((fila,i) => {
      const mp = medioPorId(fila.id_medio), efectivo = esEfectivo(mp);
      return `<div style="display:grid;grid-template-columns:1.2fr .8fr 1.2fr auto;gap:10px;align-items:end;margin-bottom:12px;padding:10px;background:var(--off-white);border-radius:8px">
        <div class="field" style="margin:0"><label>Medio de pago</label><select onchange="cambiarMedioPago(${i},this.value)"><option value="">Seleccioná...</option>${medios.map(m=>`<option value="${m[0]}" ${String(m[0])===String(fila.id_medio)?'selected':''}>${m[2]}</option>`).join('')}</select></div>
        <div class="field" style="margin:0;${vtaPagosFila.length===1?'display:none':''}"><label>Parte de la venta</label><input type="number" min="0" value="${fila.base_asignada||''}" oninput="cambiarBasePago(${i},this.value)"></div>
        <div class="field" style="margin:0"><label>${efectivo?'Efectivo recibido':'Costos del medio'}</label>${efectivo?`<input type="number" min="0" value="${fila.entregado||''}" placeholder="Ingresá lo que entrega" oninput="cambiarEntregado(${i},this.value)">`:`<div style="font-size:11px;padding:9px 0">Comisión ${n(mp?.[4])}% · Costo financiero ${n(mp?.[5])}%</div>`}</div>
        ${vtaPagosFila.length>1?`<button class="btn-danger" onclick="quitarFilaPago(${i})" style="height:40px">✕</button>`:'<div></div>'}
        <div id="vta-pago-info-${i}" style="grid-column:1/-1;font-size:11px;color:var(--text-mid)"></div></div>`;
    }).join('');
  };

  window.actualizarTotalesVenta = function () {
    let c = calcularVentaV2();
    if(!c.esCuenta&&vtaPagosFila.length===1&&vtaPagosFila[0].id_medio&&vtaPagosFila[0].base_asignada!==c.baseComercial){
      vtaPagosFila[0].base_asignada=c.baseComercial;
      c=calcularVentaV2();
    }
    document.getElementById('vta-lista-bruto').textContent = formatPeso(c.precioLista);
    document.getElementById('vta-resumen').innerHTML = [
      ['Precio Lista',c.precioLista],['Descuento General',c.descuentoGeneral],['Subtotal después del descuento',c.baseComercial],
      ['Total Final',c.totalFinal,true],['Costo Cobranza',c.costoCobranza],['Neto Esperado',c.netoEsperado,true],
      ['Costo Mercadería',c.costoMercaderia],['Margen antes de cobranza',c.margenComercial],['Margen final estimado',c.margenEstimado,true],
      ...(c.esCuenta?[['Saldo pendiente',c.saldoPendiente]]:[])
    ].map(x=>tarjetaResumen(...x)).join('');
    c.pagos.forEach((p,i) => {
      const el=document.getElementById(`vta-pago-info-${i}`); if(!el)return;
      const fila=vtaPagosFila[i], recibido=n(fila?.entregado), diferencia=recibido-p.montoCliente;
      const efectivoInfo=esEfectivo(p.medio)?(recibido<=0?'':diferencia>=0?` · Vuelto ${formatPeso(diferencia)}`:` · Falta recibir ${formatPeso(Math.abs(diferencia))}`):'';
      el.textContent=`Cliente paga ${formatPeso(p.montoCliente)} · Comisión ${formatPeso(p.comision)} · Costo financiero ${formatPeso(p.costoFinanciero)} · Neto ${formatPeso(p.neto)}${efectivoInfo}`;
    });
    return c;
  };

  window.toggleTipoVenta = function () {
    const cuenta=document.getElementById('vta-tipo').value==='cuenta_por_cobrar';
    document.getElementById('vta-seccion-pagos').style.display=cuenta?'none':'block';
    document.getElementById('vta-cliente-wrap').style.display=cuenta?'block':'none';
    const sel=document.getElementById('vta-fiado-medio-inicial');
    sel.innerHTML='<option value="">Sin pago inicial</option>'+mediosPagoData.filter(activo).map(m=>`<option value="${m[0]}">${m[2]}</option>`).join('');
    sel.onchange=actualizarTotalesVenta; actualizarTotalesVenta();
  };

  window.confirmarVenta = async function () {
    const btn=document.querySelector('#panel-ventas .btn-primary'); if(btn?.disabled)return;
    try {
      if(!vtaItemsCarrito.length)throw new Error('Agregá al menos un producto.');
      const fecha=document.getElementById('vta-fecha').value, tipo=document.getElementById('vta-tipo').value;
      const idCliente=document.getElementById('vta-cliente').value;
      if(!fecha)throw new Error('Seleccioná una fecha.'); if(tipo==='cuenta_por_cobrar'&&!idCliente)throw new Error('Seleccioná un cliente.');
      const c=calcularVentaV2();
      const pagosEntrada=tipo==='cuenta_por_cobrar'?pagoInicialCuenta():vtaPagosFila;
      if(pagosEntrada.some(p=>(p.id_medio&&!n(p.base_asignada))||(!p.id_medio&&n(p.base_asignada))))throw new Error('Completá medio y Base Asignada en cada pago.');
      if(tipo!=='cuenta_por_cobrar'&&redondear(c.totalBase)!==redondear(c.baseComercial))throw new Error(`La suma de bases (${formatPeso(c.totalBase)}) debe igualar la Base Comercial (${formatPeso(c.baseComercial)}).`);
      if(tipo==='cuenta_por_cobrar'&&c.totalBase>c.baseComercial)throw new Error('El pago inicial no puede superar la Base Comercial.');
      for(const item of vtaItemsCarrito){const p=productosData.find(x=>String(x[0])===String(item.codigo));if(!p||item.cantidad>n(p[5]))throw new Error(`Stock insuficiente para ${item.codigo}.`);}
      btn.disabled=true;btn.textContent='Procesando...';
      const tipoDesc=document.getElementById('vta-descuento-tipo').value, valorDesc=n(document.getElementById('vta-descuento-general').value);
      const payload={fecha,tipo,id_cliente:idCliente||'',notas:document.getElementById('vta-notas').value,aplicar_descuento_medios:false,
        descuento_general_pct:tipoDesc==='pct'?valorDesc:0,descuento_general_importe:tipoDesc==='importe'?valorDesc:0,
        items:vtaItemsCarrito.map(i=>({codigo:i.codigo,cantidad:i.cantidad,descuento_item_pct:0,descuento_item_importe:0})),
        pagos:pagosEntrada.filter(p=>p.id_medio&&n(p.base_asignada)>0).map(p=>({id_medio:p.id_medio,base_asignada:redondear(p.base_asignada)}))};
      const res=await apiPost('registrarVentaV2',payload);
      showToast(`✅ Venta ${res.id||res.id_venta||''} registrada`); cacheInvalidar('getVentas','getDetalleVentas','getPagosVenta','getProductos','getCuentasPorCobrar','getMovimientos');
      ventasHistData=[]; limpiarVenta(); setTimeout(()=>cargarProductos(),1500);
    } catch(e) { showToast(e.message||'Error al registrar la venta','error'); }
    finally { if(btn){btn.disabled=false;btn.textContent='✓ Confirmar venta';} }
  };

  window.limpiarVenta = function () {
    vtaItemsCarrito=[];vtaPagosFila=[{id_medio:'',base_asignada:0,entregado:0}];vtaProductoSel=null;
    ['vta-buscar','vta-notas','vta-fiado-monto-inicial'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    document.getElementById('vta-tipo').value='venta';document.getElementById('vta-descuento-tipo').value='pct';document.getElementById('vta-descuento-general').value='0';
    setFechaHoy('vta-fecha');renderCarritoVenta();renderFilasPago();toggleTipoVenta();
  };

  window.cancelarVenta = async function (idVenta) {
    if(!confirm(`¿Cancelar la venta ${idVenta}? Esto reintegrará el stock.`))return;
    showToast('Cancelando venta...');
    try {
      let venta=ventasHistData.find(v=>String(v[0])===String(idVenta));
      if(!venta){const data=await cacheGet('getVentas');venta=data.slice(1).find(v=>String(v[0])===String(idVenta));}
      const action=String(venta?.[25]||'').trim()==='V2'?'cancelarVentaV2':'cancelarVenta';
      await apiPost(action,{id_venta:idVenta,fecha:fechaLocal(),motivo:'Cancelación desde showroom'});
      if(venta){venta[7]='cancelada';if(venta.length>24)venta[24]='CANCELADA';}
      const ventaVisible=ventasHistData.find(v=>String(v[0])===String(idVenta));
      if(ventaVisible){ventaVisible[7]='cancelada';if(ventaVisible.length>24)ventaVisible[24]='CANCELADA';}
      renderHistorialVentas(ventasHistData);
      showToast('✅ Venta cancelada. Stock reintegrado.');
      cacheInvalidar('getProductos','getVentas','getDetalleVentas','getPagosVenta','getMovimientos','getCuentasPorCobrar');setTimeout(()=>cargarProductos(),1500);
    } catch(e){showToast(e.message||'Error al cancelar la venta','error');}
  };
})();
