// ============================================================
// CIRCO HAUS — Módulo de ingresos
// Alta, productos del pedido, historial, cancelación y análisis.
// ============================================================

// ── INGRESOS ──
function filtrarProductosIngreso(){
  const q=document.getElementById('ing-buscar').value.toLowerCase(),lista=document.getElementById('ing-autocomplete');
  ingProductoSel=null;document.getElementById('ing-producto-seleccionado').style.display='none';
  if(!q){lista.style.display='none';return}
  const f=productosData.filter(p=>p[0].toString().toLowerCase().includes(q)||p[1].toString().toLowerCase().includes(q)).slice(0,8);
  if(!f.length){lista.style.display='none';return}
  lista.innerHTML=f.map(p=>`<div class="autocomplete-item" onclick="selProd('${p[0]}','${p[1].replace(/'/g,"\\'")}')" ><code>${p[0]}</code> — ${p[1]}</div>`).join('');
  lista.style.display='block';
}
function selProd(codigo,desc){
  const producto=productosData.find(p=>String(p[0])===String(codigo));
  ingProductoSel={codigo,desc};
  document.getElementById('ing-buscar').value=`${codigo} — ${desc}`;
  document.getElementById('ing-autocomplete').style.display='none';
  document.getElementById('ing-prod-nombre').textContent=`${codigo} — ${desc}`;
  if(producto){
    const costo=Number(producto[4])||0;
    document.getElementById('ing-costo').value=costo||'';
    actualizarPreviewCostoIngreso();
  }else document.getElementById('ing-prod-datos').textContent='';
  document.getElementById('ing-producto-seleccionado').style.display='block';
}
function actualizarPreviewCostoIngreso(){
  if(!ingProductoSel)return;
  const producto=productosData.find(p=>String(p[0])===String(ingProductoSel.codigo));
  if(!producto)return;
  const costoActual=Number(producto[4])||0,venta=Number(producto[3])||0,margen=getMargen(producto),margenBruto=calcMargenBruto(costoActual,venta);
  const costoNuevo=Number(document.getElementById('ing-costo').value)||0;
  const proyeccion=costoNuevo>0&&costoNuevo!==costoActual?` · Con el costo nuevo: ${formatPeso(Math.round(costoNuevo*(1+margen/100)))} manteniendo ${margen}% de recargo`:'';
  document.getElementById('ing-prod-datos').textContent=`Costo actual: ${formatPeso(costoActual)} · Recargo: ${margen}% · Margen bruto: ${margenBruto}% · Precio de venta: ${formatPeso(venta)}${proyeccion}`;
}
function prefijoSugeridoProveedor(nombre){
  const palabra=String(nombre||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9 ]/g,' ').trim().split(/\s+/)[0]||'PROD';
  const consonantes=palabra.slice(1).replace(/[AEIOU]/g,'');
  return (palabra[0]+consonantes+palabra.slice(1)).slice(0,3).padEnd(3,'X');
}
function sugerirCodigoNuevoIngreso(forzar=false){
  const modal=document.getElementById('modal-nuevo-producto-ingreso');
  const idProveedor=modal.dataset.proveedor||'';
  const proveedor=proveedoresData.find(p=>String(p[0])===String(idProveedor));
  const relacionados=productosData.filter(p=>String(p[2])===String(idProveedor));
  const separar=codigo=>{
    const match=String(codigo||'').trim().match(/^(.*?)(\d+)$/);
    return match?{codigo:String(codigo).trim(),prefijo:match[1],numero:Number(match[2]),digitos:match[2].length}:null;
  };
  const codigosRelacionados=relacionados.map(p=>separar(p[0])).filter(Boolean);
  let prefijo='';
  if(codigosRelacionados.length){
    const conteo={};codigosRelacionados.forEach(c=>conteo[c.prefijo]=(conteo[c.prefijo]||0)+1);
    prefijo=Object.keys(conteo).sort((a,b)=>conteo[b]-conteo[a])[0];
  }else prefijo=prefijoSugeridoProveedor(proveedor?.[1])+'-';
  let candidatos=productosData.map(p=>separar(p[0])).filter(c=>c&&c.prefijo.toUpperCase()===prefijo.toUpperCase());
  if(!candidatos.length&&codigosRelacionados.length)candidatos=codigosRelacionados.filter(c=>c.prefijo===prefijo);
  const ultimo=candidatos.sort((a,b)=>b.numero-a.numero)[0];
  const siguiente=(ultimo?.numero||0)+1;
  const digitos=Math.max(4,ultimo?.digitos||0);
  const sugerido=`${prefijo}${String(siguiente).padStart(digitos,'0')}`;
  const campo=document.getElementById('ing-nuevo-codigo');
  if(forzar||!campo.value.trim())campo.value=sugerido;
  document.getElementById('ing-nuevo-codigo-ayuda').textContent=ultimo?`Último código con este prefijo: ${ultimo.codigo} · Siguiente sugerido: ${sugerido}`:`No encontré códigos anteriores · Sugerido inicial: ${sugerido}`;
}
function abrirNuevoProductoIngreso(){
  const idProveedor=document.getElementById('ing-proveedor').value;
  if(!idProveedor){showToast('Primero seleccioná el proveedor del ingreso','error');return}
  const proveedor=proveedoresData.find(p=>String(p[0])===String(idProveedor));
  const busqueda=document.getElementById('ing-buscar').value.trim();
  document.getElementById('ing-nuevo-codigo').value=/^[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*$/.test(busqueda)&&!busqueda.includes(' — ')?busqueda:'';
  ['ing-nuevo-desc','ing-nuevo-cantidad','ing-nuevo-costo','ing-nuevo-margen','ing-nuevo-pventa','ing-nuevo-margen-bruto','ing-nuevo-stock-min'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('ing-nuevo-proveedor').value=proveedor?proveedor[1]:idProveedor;
  const categoria=document.getElementById('ing-nuevo-categoria');
  categoria.innerHTML='<option value="">Seleccioná...</option>'+categoriasData.map(c=>`<option value="${c}">${c}</option>`).join('');
  document.getElementById('modal-nuevo-producto-ingreso').dataset.proveedor=idProveedor;
  sugerirCodigoNuevoIngreso(false);
  document.getElementById('modal-nuevo-producto-ingreso').classList.add('open');
}
function calcularPrecioNuevoIngreso(){
  const costo=Number(document.getElementById('ing-nuevo-costo').value);
  const margenValor=document.getElementById('ing-nuevo-margen').value;
  const margen=Number(margenValor);
  document.getElementById('ing-nuevo-pventa').value=costo>0&&margenValor!==''&&margen>=0?Math.round(costo*(1+margen/100)):'';
  actualizarMargenBrutoCampo('ing-nuevo-costo','ing-nuevo-pventa','ing-nuevo-margen-bruto');
}
function calcularMargenNuevoIngreso(){
  const costo=Number(document.getElementById('ing-nuevo-costo').value);
  const venta=Number(document.getElementById('ing-nuevo-pventa').value);
  document.getElementById('ing-nuevo-margen').value=costo>0&&venta>0?Math.round(((venta/costo)-1)*1000)/10:'';
  actualizarMargenBrutoCampo('ing-nuevo-costo','ing-nuevo-pventa','ing-nuevo-margen-bruto');
}
async function guardarNuevoProductoIngreso(){
  const codigo=document.getElementById('ing-nuevo-codigo').value.trim();
  const descripcion=document.getElementById('ing-nuevo-desc').value.trim();
  const proveedor=document.getElementById('modal-nuevo-producto-ingreso').dataset.proveedor||'';
  const categoria=document.getElementById('ing-nuevo-categoria').value;
  const cantidad=Number(document.getElementById('ing-nuevo-cantidad').value);
  const precio_costo=Number(document.getElementById('ing-nuevo-costo').value);
  const margenValor=document.getElementById('ing-nuevo-margen').value;
  const margen_pct=Number(margenValor);
  const precio_venta=Number(document.getElementById('ing-nuevo-pventa').value);
  const stock_minimo=Number(document.getElementById('ing-nuevo-stock-min').value)||0;
  if(!codigo||!descripcion){showToast('Completá código y descripción','error');return}
  if(!Number.isInteger(cantidad)||cantidad<1){showToast('Ingresá una cantidad entera mayor a cero','error');return}
  if(!Number.isFinite(precio_costo)||precio_costo<=0){showToast('Ingresá el precio de costo unitario','error');return}
  if(margenValor===''||!Number.isFinite(margen_pct)||margen_pct<0||!precio_venta){showToast('Ingresá un recargo válido','error');return}
  if(productosData.some(p=>String(p[0]).trim().toLowerCase()===codigo.toLowerCase())){showToast(`El código ${codigo} ya existe`,'error');return}
  const normalizar=s=>String(s||'').trim().toLowerCase();
  const parecido=productosData.find(p=>{
    const existente=normalizar(p[1]),nuevo=normalizar(descripcion);
    return existente===nuevo||(nuevo.length>=5&&existente.includes(nuevo))||(existente.length>=5&&nuevo.includes(existente));
  });
  if(parecido&&!confirm(`Ya existe “${parecido[1]}” (${parecido[0]}). ¿Crear igualmente el producto ${codigo}?`))return;
  try{
    await apiPost('agregarProducto',{codigo,descripcion,proveedor,precio_venta,precio_costo,margen_pct,stock:0,stock_minimo,categoria,estado_comercial:'activo'});
    productosData.push([codigo,descripcion,proveedor,precio_venta,precio_costo,0,stock_minimo,categoria,margen_pct,'activo']);
    const existente=itemsIngreso.find(item=>String(item.codigo)===String(codigo));
    if(existente){existente.cantidad+=cantidad;existente.precio_costo=precio_costo;}
    else itemsIngreso.push({codigo,desc:descripcion,cantidad,precio_costo});
    renderItemsIngreso();
    document.getElementById('ing-buscar').value='';
    cerrarModal('modal-nuevo-producto-ingreso');
    cacheInvalidar('getProductos','getHistorialCostos');
    showToast('Producto creado y agregado al pedido');
  }catch(e){showToast(e?.message||'No se pudo crear el producto','error')}
}
function agregarItemIngreso(){
  if(!ingProductoSel){showToast('Seleccioná un producto','error');return}
  const cantidad=Number(document.getElementById('ing-cantidad').value),costo=Number(document.getElementById('ing-costo').value);
  if(!Number.isInteger(cantidad)||cantidad<1){showToast('Ingresá una cantidad entera mayor a cero','error');return}
  if(!Number.isFinite(costo)||costo<=0){showToast('Ingresá el precio de costo unitario','error');return}
  const existente=itemsIngreso.find(item=>String(item.codigo)===String(ingProductoSel.codigo));
  if(existente){
    existente.cantidad+=cantidad;
    existente.precio_costo=costo;
  }else{
    itemsIngreso.push({codigo:ingProductoSel.codigo,desc:ingProductoSel.desc,cantidad,precio_costo:costo});
  }
  renderItemsIngreso();document.getElementById('ing-cantidad').value='';document.getElementById('ing-costo').value='';document.getElementById('ing-buscar').value='';document.getElementById('ing-producto-seleccionado').style.display='none';ingProductoSel=null;
}
function renderItemsIngreso(){
  const l=document.getElementById('items-lista');
  if(!itemsIngreso.length){l.innerHTML='<div class="items-empty">Todavía no agregaste productos</div>';return}
  const unidades=itemsIngreso.reduce((s,item)=>s+item.cantidad,0);
  const total=itemsIngreso.reduce((s,item)=>s+item.cantidad*item.precio_costo,0);
  l.innerHTML=itemsIngreso.map((item,i)=>`<div class="item-row"><span><code style="color:var(--teal);font-size:11px">${item.codigo}</code> ${item.desc}</span><span>${item.cantidad} unid.</span><span>${formatPeso(item.precio_costo)} c/u · ${formatPeso(item.cantidad*item.precio_costo)}</span><button class="btn-danger" onclick="quitarItemIngreso(${i})">✕</button></div>`).join('')+
    `<div style="display:flex;justify-content:flex-end;gap:24px;padding:14px 4px 2px;font-size:13px;color:var(--text-mid)"><span>${unidades} unidad${unidades!==1?'es':''}</span><strong style="color:var(--navy)">Total del ingreso: ${formatPeso(total)}</strong></div>`;
}
function quitarItemIngreso(i){itemsIngreso.splice(i,1);renderItemsIngreso()}

async function confirmarIngreso(){
  const fecha=document.getElementById('ing-fecha').value,proveedor=document.getElementById('ing-proveedor').value,nro_remito=document.getElementById('ing-remito').value.trim();
  if(!fecha){showToast('Seleccioná una fecha','error');return}
  if(!proveedor){showToast('Seleccioná un proveedor','error');return}
  if(!itemsIngreso.length){showToast('Agregá al menos un producto','error');return}
  const unidades=itemsIngreso.reduce((s,item)=>s+item.cantidad,0);
  const total=itemsIngreso.reduce((s,item)=>s+item.cantidad*item.precio_costo,0);
  if(!confirm(`¿Confirmar el ingreso de ${unidades} unidad${unidades!==1?'es':''} por ${formatPeso(total)}?`))return;

  // Registrar ingreso
  try{
    await apiPost('registrarIngreso',{fecha,proveedor,nro_remito,items:itemsIngreso});
    showToast('Ingreso registrado. Stock actualizado.');

    // Detectar cambios de costo
    const dataProductos=await cacheGet('getProductos');
    const productosActuales=dataProductos.slice(1);
    colaActualizaciones=[];
    fechaIngreso=fecha;

    itemsIngreso.forEach(item=>{
      if(!item.precio_costo||item.precio_costo===0)return;
      const prod=productosActuales.find(p=>String(p[0]).trim()===String(item.codigo).trim());
      if(!prod)return;
      const costoActual=Number(prod[4])||0;
      if(item.precio_costo!==costoActual){
        colaActualizaciones.push({
          codigo:item.codigo,
          descripcion:prod[1],
          costoAnterior:costoActual,
          costoNuevo:item.precio_costo,
          precioVentaActual:Number(prod[3])||0,
          margenActual:calcMargen(costoActual,Number(prod[3])||0)
        });
      }
    });

    limpiarIngreso();
    cacheInvalidar('getIngresos','getDetalleIngresos','getProductos');
    await Promise.all([cargarProductos(),cargarHistorialIngresos()]);

    if(colaActualizaciones.length>0){
      indexActual=0;
      mostrarPopupCosto();
    }
  }catch(e){showToast(e?.message||'Error al registrar el ingreso','error')}
}

function mostrarPopupCosto(){
  if(indexActual>=colaActualizaciones.length){
    showToast(`✅ Todos los cambios de costo procesados`);
    return;
  }
  const item=colaActualizaciones[indexActual];
  const margenActual=item.margenActual;
  const pvConMargenActual=Math.round(item.costoNuevo*(1+margenActual/100));
  const nuevoMargenSiMantienePV=calcMargen(item.costoNuevo,item.precioVentaActual);

  document.getElementById('costo-popup-sub').textContent=`Producto: ${item.descripcion} (${item.codigo}) — ${indexActual+1} de ${colaActualizaciones.length}`;
  document.getElementById('costo-info').innerHTML=`
    <div class="costo-info-item"><label>Costo anterior</label><span>${formatPeso(item.costoAnterior)}</span></div>
    <div class="costo-info-item"><label>Costo nuevo</label><span style="color:var(--teal)">${formatPeso(item.costoNuevo)}</span></div>
    <div class="costo-info-item"><label>Recargo actual</label><span>${margenActual}%</span></div>
    <div class="costo-info-item"><label>Margen bruto real</label><span>${calcMargenBruto(item.costoAnterior,item.precioVentaActual)}%</span></div>
    <div class="costo-info-item"><label>Precio venta actual</label><span>${formatPeso(item.precioVentaActual)}</span></div>
  `;

  document.getElementById('op1-title').textContent=`Mantener recargo (${margenActual}%)`;
  document.getElementById('op1-desc').textContent=`Precio ${formatPeso(pvConMargenActual)} · Margen bruto ${calcMargenBruto(item.costoNuevo,pvConMargenActual)}%`;
  document.getElementById('op1').dataset.pv=pvConMargenActual;document.getElementById('op1').dataset.margen=margenActual;

  document.getElementById('op2-title').textContent=`Mantener precio de venta (${formatPeso(item.precioVentaActual)})`;
  document.getElementById('op2-desc').textContent=`Recargo ${nuevoMargenSiMantienePV}% · Margen bruto ${calcMargenBruto(item.costoNuevo,item.precioVentaActual)}%`;
  document.getElementById('op2').dataset.pv=item.precioVentaActual;document.getElementById('op2').dataset.margen=nuevoMargenSiMantienePV;

  document.getElementById('costo-margen-custom').style.display='none';
  document.getElementById('costo-margen-input').value='';
  document.getElementById('costo-pventa-preview').textContent='—';
  document.querySelectorAll('.costo-opcion').forEach(o=>o.classList.remove('selected'));

  document.getElementById('modal-costo').classList.add('open');
}

let opcionSeleccionada=null;
function seleccionarOpcion(n){
  opcionSeleccionada=n;
  document.querySelectorAll('.costo-opcion').forEach(o=>o.classList.remove('selected'));
  document.getElementById(`op${n}`).classList.add('selected');
  document.getElementById('costo-margen-custom').style.display=n===3?'block':'none';
}

function calcularCostoCustom(){
  const m=Number(document.getElementById('costo-margen-input').value);
  const item=colaActualizaciones[indexActual];
  const pv=m>0?Math.round(item.costoNuevo*(1+m/100)):0;
  document.getElementById('costo-pventa-preview').textContent=pv>0?formatPeso(pv):'—';
}

async function confirmarCambioSiguiente(){
  if(!opcionSeleccionada){showToast('Seleccioná una opción','error');return}
  const item=colaActualizaciones[indexActual];
  let nuevoPV,nuevoMargen;
  if(opcionSeleccionada===1){nuevoPV=Number(document.getElementById('op1').dataset.pv);nuevoMargen=Number(document.getElementById('op1').dataset.margen)}
  else if(opcionSeleccionada===2){nuevoPV=Number(document.getElementById('op2').dataset.pv);nuevoMargen=Number(document.getElementById('op2').dataset.margen)}
  else{nuevoMargen=Number(document.getElementById('costo-margen-input').value);if(!nuevoMargen){showToast('Ingresá el recargo','error');return}nuevoPV=Math.round(item.costoNuevo*(1+nuevoMargen/100))}

  try{
    await apiPost('actualizarCosto',{codigo:item.codigo,nuevo_costo:item.costoNuevo,nuevo_precio_venta:nuevoPV,nuevo_margen:nuevoMargen,fecha:fechaIngreso});
    cacheInvalidar('getProductos','getHistorialCostos');
    showToast(`${item.codigo} actualizado correctamente`);
  }catch(e){showToast('Error al actualizar costo','error')}

  cerrarModal('modal-costo');
  opcionSeleccionada=null;
  indexActual++;
  setTimeout(()=>mostrarPopupCosto(),400);
}

function saltarCambio(){
  cerrarModal('modal-costo');
  opcionSeleccionada=null;
  indexActual++;
  setTimeout(()=>mostrarPopupCosto(),400);
}

function limpiarIngreso(){
  itemsIngreso=[];renderItemsIngreso();
  document.getElementById('ing-remito').value='';document.getElementById('ing-proveedor').value='';document.getElementById('ing-buscar').value='';document.getElementById('ing-producto-seleccionado').style.display='none';ingProductoSel=null;setFechaHoy('ing-fecha');
}

async function cancelarIngreso(idIngreso){
  if(!confirm(`¿Cancelar el ingreso ${idIngreso}?\nEl stock incorporado será retirado y el registro quedará visible como cancelado.`))return;
  const motivo=prompt('Motivo de la cancelación (opcional):','Ingreso cargado por error');
  if(motivo===null)return;
  const btn=document.getElementById('btn-cancelar-ingreso');
  if(btn){btn.disabled=true;btn.textContent='Cancelando...';}
  try{
    await apiPost('cancelarIngreso',{id_ingreso:idIngreso,motivo:motivo.trim()||'Cancelación de ingreso'});
    cache.invalidar('getIngresos','getDetalleIngresos');
    await Promise.all([refrescarProductosUI(),cargarHistorialIngresos()]);
    cerrarModal('modal-detalle-ingreso');
    showToast('Ingreso cancelado. Stock revertido.');
  }catch(e){showToast(e?.message||'Error al cancelar el ingreso','error');}
  finally{if(btn){btn.disabled=false;btn.textContent='Cancelar ingreso';}}
}

let ingresosData=[], detalleIngresosData=[];

async function cargarHistorialIngresos(){
  document.getElementById('ing-hist-loading').style.display='flex';
  document.getElementById('ing-hist-table').style.display='none';
  try{
    const[dataIng,dataDet]=await Promise.all([cacheGet('getIngresos'),cacheGet('getDetalleIngresos')]);
    ingresosData=Array.isArray(dataIng)?dataIng.slice(1):[];
    detalleIngresosData=Array.isArray(dataDet)?dataDet.slice(1):[];
    renderHistorialIngresos();
  }catch(e){
    document.getElementById('ing-hist-loading').style.display='none';
  }
}

function renderHistorialIngresos(){
  document.getElementById('ing-hist-loading').style.display='none';
  document.getElementById('ing-hist-table').style.display='table';
  const sorted=[...ingresosData].reverse().slice(0,50);
  const provNombre=id=>{const p=proveedoresData.find(x=>String(x[0])===String(id));return p?p[1]:id||'—'};
  document.getElementById('ing-hist-body').innerHTML=sorted.length===0
    ?'<tr><td colspan="5" style="text-align:center;color:var(--text-light);padding:20px">No hay ingresos registrados</td></tr>'
    :sorted.map(ing=>{
      const idEscapado=String(ing[0]).replace(/'/g,"\\'");
      const provNombreVal=provNombre(ing[2]);
      const cancelada=String(ing[4]||'').toLowerCase()==='cancelada';
      return`<tr style="border-bottom:1px solid var(--border);cursor:pointer;${cancelada?'opacity:.65':''}" onclick="verDetalleIngreso('${idEscapado}')" onmouseover="this.style.background='var(--off-white)'" onmouseout="this.style.background=''">
        <td style="padding:9px 0"><code style="color:var(--teal);font-size:11px">${ing[0]}</code></td>
        <td style="padding:9px 0;color:var(--text-mid)">${fechaStr(ing[1])||'—'}</td>
        <td style="padding:9px 0;font-weight:500">${provNombreVal}</td>
        <td style="padding:9px 0;color:var(--text-light)">${ing[3]||'—'}</td>
        <td style="padding:9px 0"><span class="badge ${cancelada?'badge-zero':'badge-ok'}">${cancelada?'Cancelado':'Activo'}</span></td>
      </tr>`;
    }).join('');
}

function verDetalleIngreso(idIngreso){
  const ing=ingresosData.find(x=>String(x[0])===String(idIngreso));
  const items=detalleIngresosData.filter(d=>String(d[0]).trim()===String(idIngreso).trim());
  console.log('ID buscado:', idIngreso, '| Items encontrados:', items.length, '| Total detalle:', detalleIngresosData.length, '| Primer item:', detalleIngresosData[0]);
  const provNombre=id=>{const p=proveedoresData.find(x=>String(x[0])===String(id));return p?p[1]:id||'—'};
  const prodNombre=cod=>{const p=productosData.find(x=>String(x[0])===String(cod));return p?p[1]:cod};
  const cancelada=String(ing?.[4]||'').toLowerCase()==='cancelada';
  document.getElementById('ing-det-titulo').textContent=`Ingreso — ${idIngreso}`;
  document.getElementById('ing-det-titulo').dataset.id=idIngreso;
  document.getElementById('ing-det-body').innerHTML=`
    <div style="font-size:13px;color:var(--text-mid);margin-bottom:16px">
      <strong>Fecha:</strong> ${ing?fechaStr(ing[1]):'—'} &nbsp;|&nbsp;
      <strong>Proveedor:</strong> ${ing?provNombre(ing[2]):'—'} &nbsp;|&nbsp;
      <strong>Estado:</strong> ${cancelada?'Cancelado':'Activo'}
      ${ing&&ing[3]?`&nbsp;|&nbsp; <strong>Remito:</strong> ${ing[3]}`:''}
      ${cancelada&&ing[6]?`<div style="margin-top:5px"><strong>Motivo:</strong> ${ing[6]}</div>`:''}
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr>
        <th style="text-align:left;padding:7px 0;color:var(--text-light);font-size:11px;text-transform:uppercase;border-bottom:1px solid var(--border)">Código</th>
        <th style="text-align:left;padding:7px 0;color:var(--text-light);font-size:11px;text-transform:uppercase;border-bottom:1px solid var(--border)">Descripción</th>
        <th style="text-align:right;padding:7px 0;color:var(--text-light);font-size:11px;text-transform:uppercase;border-bottom:1px solid var(--border)">Cantidad</th>
        <th style="text-align:right;padding:7px 0;color:var(--text-light);font-size:11px;text-transform:uppercase;border-bottom:1px solid var(--border)">Costo unit.</th>
        <th style="text-align:right;padding:7px 0;color:var(--text-light);font-size:11px;text-transform:uppercase;border-bottom:1px solid var(--border)">Subtotal</th>
      </tr></thead>
      <tbody>
        ${items.map(d=>`<tr style="border-bottom:1px solid var(--border)">
          <td style="padding:8px 0"><code style="color:var(--teal);font-size:11px">${d[1]}</code></td>
          <td style="padding:8px 0">${prodNombre(d[1])}</td>
          <td style="text-align:right;padding:8px 0">${d[2]}</td>
          <td style="text-align:right;padding:8px 0">${formatPeso(d[3])}</td>
          <td style="text-align:right;padding:8px 0;font-weight:600">${formatPeso(Number(d[2])*Number(d[3]))}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div style="text-align:right;margin-top:12px;font-size:14px;font-weight:700;color:var(--navy)">
      Total: ${formatPeso(items.reduce((s,d)=>s+Number(d[2])*Number(d[3]),0))}
    </div>`;
  document.getElementById('btn-cancelar-ingreso').style.display=cancelada?'none':'';
  document.getElementById('btn-analizar-ingreso').style.display=cancelada?'none':'';
  document.getElementById('modal-detalle-ingreso').classList.add('open');
}

async function prepararAnalisisIngresos(){
  try{
    const[dataIng,dataDet,dataProv]=await Promise.all([
      cacheGet('getIngresos'),cacheGet('getDetalleIngresos'),cacheGet('getProveedores')
    ]);
    ingresosData=Array.isArray(dataIng)?dataIng.slice(1):[];
    detalleIngresosData=Array.isArray(dataDet)?dataDet.slice(1):[];
    if(!proveedoresData.length)proveedoresData=Array.isArray(dataProv)?dataProv.slice(1):[];
    const idsConIngresos=new Set(ingresosData.filter(i=>String(i[4]||'').toLowerCase()!=='cancelada').map(i=>resolverIdProveedorIngreso(i[2])).filter(Boolean));
    const sel=document.getElementById('rep-ing-proveedor');
    const anterior=sel.value;
    sel.innerHTML='<option value="">Seleccioná...</option>'+proveedoresData
      .filter(p=>idsConIngresos.has(String(p[0])))
      .sort((a,b)=>String(a[1]).localeCompare(String(b[1])))
      .map(p=>`<option value="${p[0]}">${p[1]}</option>`).join('');
    if(anterior&&idsConIngresos.has(anterior)){sel.value=anterior;actualizarIngresosAnalisis();}
  }catch(e){
    document.getElementById('rep-ing-resultado').innerHTML='<div class="items-empty">No se pudieron cargar los ingresos.</div>';
  }
}

function resolverIdProveedorIngreso(valor){
  const buscado=String(valor||'').trim().toLowerCase();
  if(!buscado)return'';
  const proveedor=proveedoresData.find(p=>String(p[0]||'').trim().toLowerCase()===buscado||String(p[1]||'').trim().toLowerCase()===buscado);
  return proveedor?String(proveedor[0]):String(valor||'').trim();
}

function actualizarIngresosAnalisis(idSeleccionado=''){
  const idProveedor=String(document.getElementById('rep-ing-proveedor').value||'');
  const sel=document.getElementById('rep-ing-ingreso');
  if(!idProveedor){sel.innerHTML='<option value="">Elegí un proveedor</option>';return;}
  const lista=ingresosData.filter(i=>resolverIdProveedorIngreso(i[2])===idProveedor&&String(i[4]||'').toLowerCase()!=='cancelada').reverse();
  sel.innerHTML='<option value="__TODOS__">Todos los ingresos del proveedor</option>'+lista.map(i=>{
    const total=detalleIngresosData.filter(d=>String(d[0])===String(i[0])).reduce((s,d)=>s+(Number(d[2])||0)*(Number(d[3])||0),0);
    return`<option value="${i[0]}">${fechaStr(i[1])} · ${i[0]} · ${formatPeso(total)}</option>`;
  }).join('');
  if(idSeleccionado&&lista.some(i=>String(i[0])===String(idSeleccionado)))sel.value=idSeleccionado;
}

async function abrirAnalisisIngreso(idIngreso){
  const ing=ingresosData.find(i=>String(i[0])===String(idIngreso));
  if(!ing)return;
  cerrarModal('modal-detalle-ingreso');
  irA('reportes');
  await prepararAnalisisIngresos();
  document.getElementById('rep-ing-proveedor').value=resolverIdProveedorIngreso(ing[2]);
  actualizarIngresosAnalisis(idIngreso);
  await generarAnalisisIngreso();
  document.getElementById('rep-ing-resultado').scrollIntoView({behavior:'smooth',block:'start'});
}

async function generarAnalisisIngreso(){
  const idProveedor=String(document.getElementById('rep-ing-proveedor').value||'');
  const idElegido=String(document.getElementById('rep-ing-ingreso').value||'');
  const salida=document.getElementById('rep-ing-resultado');
  if(!idProveedor||!idElegido){showToast('Elegí un proveedor y un ingreso','error');return;}
  salida.innerHTML='<div class="spinner-wrap"><div class="spinner"></div> Calculando inversión...</div>';

  const[rawVentas,rawDetalle,rawPagos,rawProductos]=await Promise.all([
    cacheGet('getVentas'),cacheGet('getDetalleVentas'),cacheGet('getPagosVenta'),cacheGet('getProductos')
  ]);
  const ventas=(rawVentas||[]).slice(1).filter(v=>String(v[7]||'').toLowerCase()!=='cancelada');
  const detalles=(rawDetalle||[]).slice(1);
  const pagos=(rawPagos||[]).slice(1).filter(p=>String(p[21]||'').toUpperCase()!=='CANCELADO');
  const productos=(rawProductos||[]).slice(1);
  const ventasPorId=new Map(ventas.map(v=>[String(v[0]),v]));
  const detallesPorVenta={};
  detalles.forEach(d=>{const id=String(d[0]);if(ventasPorId.has(id))(detallesPorVenta[id]||(detallesPorVenta[id]=[])).push(d);});

  // Reconstrucción FIFO: las ventas consumen primero las unidades de los ingresos más antiguos.
  const ingresosActivos=ingresosData.filter(i=>String(i[4]||'').toLowerCase()!=='cancelada');
  const lotes=[];
  ingresosActivos.forEach((ing,orden)=>{
    detalleIngresosData.filter(d=>String(d[0])===String(ing[0])).forEach(d=>lotes.push({
      idIngreso:String(ing[0]),idProveedor:resolverIdProveedorIngreso(ing[2]),fecha:fechaStr(ing[1]),orden,codigo:String(d[1]),
      cantidad:Number(d[2])||0,costo:Number(d[3])||0,vendido:0,facturado:0,cobrado:0,neto:0
    }));
  });
  const lotesPorProducto={};
  lotes.forEach(l=>(lotesPorProducto[l.codigo]||(lotesPorProducto[l.codigo]=[])).push(l));
  Object.values(lotesPorProducto).forEach(ls=>ls.sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.orden-b.orden));

  Object.entries(detallesPorVenta).sort((a,b)=>fechaStr(ventasPorId.get(a[0])?.[1]).localeCompare(fechaStr(ventasPorId.get(b[0])?.[1]))).forEach(([idVenta,lineas])=>{
    const venta=ventasPorId.get(idVenta),fechaVenta=fechaStr(venta?.[1]);
    const subtotalVenta=lineas.reduce((s,d)=>s+(Number(d[6])||0),0);
    const esV2=String(venta?.[25]||'').trim()==='V2';
    const total=esV2?(Number(venta?.[16])||0):(Number(venta?.[5])||subtotalVenta);
    const pagosVenta=pagos.filter(p=>String(p[0])===idVenta);
    const pagado=esV2?(Number(venta?.[17])||0):pagosVenta.reduce((s,p)=>s+(Number(p[2])||0),0);
    const neto=esV2?(Number(venta?.[20])||0):(Number(venta?.[6])||total);
    lineas.forEach(d=>{
      let restante=Number(d[2])||0;
      const subtotal=Number(d[6])||0;
      const parteTotal=subtotalVenta>0?total*(subtotal/subtotalVenta):subtotal;
      const partePagada=total>0?pagado*(parteTotal/total):0;
      const parteNeta=total>0?neto*(parteTotal/total):0;
      const porUnidad=restante>0?{facturado:parteTotal/restante,cobrado:partePagada/restante,neto:parteNeta/restante}:{facturado:0,cobrado:0,neto:0};
      const candidatos=(lotesPorProducto[String(d[1])]||[]).filter(l=>l.fecha<=fechaVenta&&l.vendido<l.cantidad);
      for(const lote of candidatos){
        if(restante<=0)break;
        const asignadas=Math.min(restante,lote.cantidad-lote.vendido);
        lote.vendido+=asignadas;lote.facturado+=asignadas*porUnidad.facturado;lote.cobrado+=asignadas*porUnidad.cobrado;lote.neto+=asignadas*porUnidad.neto;
        restante-=asignadas;
      }
    });
  });

  const seleccionados=lotes.filter(l=>l.idProveedor===idProveedor&&(idElegido==='__TODOS__'||l.idIngreso===idElegido));
  if(!seleccionados.length){salida.innerHTML='<div class="items-empty">El ingreso seleccionado no tiene productos activos.</div>';return;}
  const agrupados={};
  seleccionados.forEach(l=>{
    const k=l.codigo;
    if(!agrupados[k])agrupados[k]={codigo:k,cantidad:0,costoTotal:0,vendido:0,facturado:0,cobrado:0,neto:0};
    const a=agrupados[k];a.cantidad+=l.cantidad;a.costoTotal+=l.cantidad*l.costo;a.vendido+=l.vendido;a.facturado+=l.facturado;a.cobrado+=l.cobrado;a.neto+=l.neto;
  });
  const filas=Object.values(agrupados);
  const inversion=filas.reduce((s,x)=>s+x.costoTotal,0),compradas=filas.reduce((s,x)=>s+x.cantidad,0),vendidas=filas.reduce((s,x)=>s+x.vendido,0);
  const facturado=filas.reduce((s,x)=>s+x.facturado,0),cobrado=filas.reduce((s,x)=>s+x.cobrado,0),neto=filas.reduce((s,x)=>s+x.neto,0);
  const costoVendido=filas.reduce((s,x)=>s+x.costoTotal*(x.cantidad?x.vendido/x.cantidad:0),0);
  const stockCosto=Math.max(0,inversion-costoVendido),ganancia=neto-costoVendido,recupero=inversion>0?facturado/inversion*100:0;
  const nombreProducto=cod=>productos.find(p=>String(p[0])===cod)?.[1]||cod;
  const proveedor=proveedoresData.find(p=>String(p[0])===idProveedor)?.[1]||idProveedor;
  const titulo=idElegido==='__TODOS__'?`Todos los ingresos de ${proveedor}`:`${proveedor} · ${idElegido}`;
  salida.innerHTML=`
    <div style="font-weight:600;color:var(--navy);margin-bottom:12px">${titulo}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:10px;margin-bottom:16px">
      ${[['Inversión',formatPeso(inversion)],['Unidades compradas',compradas],['Unidades vendidas',vendidas],['Stock restante',compradas-vendidas],['Stock restante al costo',formatPeso(stockCosto)],['Facturación generada',formatPeso(facturado)],['Ganancia estimada',formatPeso(ganancia)],['Inversión recuperada',Math.round(recupero*10)/10+'%']].map(([k,v])=>`<div style="background:var(--off-white);border-radius:8px;padding:12px"><div style="font-size:10px;text-transform:uppercase;color:var(--text-light);margin-bottom:4px">${k}</div><div style="font-size:18px;font-weight:700;color:var(--navy)">${v}</div></div>`).join('')}
    </div>
    <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px;min-width:900px">
      <thead><tr><th>Producto</th><th style="text-align:right">Comprado</th><th style="text-align:right">Vendido</th><th style="text-align:right">Stock</th><th style="text-align:right">Inversión</th><th style="text-align:right">Facturación</th><th style="text-align:right">Ganancia est.</th><th style="text-align:right">Recupero</th></tr></thead>
      <tbody>${filas.sort((a,b)=>b.costoTotal-a.costoTotal).map(x=>{
        const costoAsignado=x.cantidad?x.costoTotal*(x.vendido/x.cantidad):0,gananciaItem=x.neto-costoAsignado,rec=x.costoTotal>0?x.facturado/x.costoTotal*100:0;
        return`<tr style="border-bottom:1px solid var(--border)"><td style="padding:9px 6px"><strong>${nombreProducto(x.codigo)}</strong><div style="font-size:10px;color:var(--text-light)">${x.codigo}</div></td><td style="text-align:right">${x.cantidad}</td><td style="text-align:right">${x.vendido}</td><td style="text-align:right">${x.cantidad-x.vendido}</td><td style="text-align:right">${formatPeso(x.costoTotal)}</td><td style="text-align:right">${formatPeso(x.facturado)}</td><td style="text-align:right;color:${gananciaItem<0?'#C44F4F':'var(--teal)'};font-weight:600">${formatPeso(gananciaItem)}</td><td style="text-align:right;font-weight:600">${Math.round(rec*10)/10}%</td></tr>`;
      }).join('')}</tbody>
    </table></div>
    <div style="font-size:10px;color:var(--text-light);margin-top:10px">Las ventas se atribuyen por orden de ingreso (primero se vende el stock más antiguo). La ganancia se calcula con el neto esperado menos el costo vendido. Cuando hubo stock previo del mismo producto, el recupero por pedido es una estimación.</div>`;
}
