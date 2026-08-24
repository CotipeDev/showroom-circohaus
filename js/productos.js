// ============================================================
// CIRCO HAUS — Módulo de productos
// Catálogo, precios, edición e historial por producto.
// ============================================================

async function cargarProductos(){try{const data=await cacheGet('getProductos');productosData=data.slice(1)}catch(e){}}
async function refrescarProductosUI(){
  const data=await apiGet('getProductos');
  cache.set('getProductos',data);
  productosData=data.slice(1);
  prodTablaData=[...productosData];
  stockData=[...productosData];
  renderTablaProductos(prodTablaData);
  renderStock(stockData);
}
function calcMargen(costo,venta){return(costo>0&&venta>0)?Math.round(((venta/costo)-1)*1000)/10:0}
function calcMargenBruto(costo,venta){return(costo>0&&venta>0)?Math.round(((venta-costo)/venta)*1000)/10:0}
function getMargen(p){return p[8]&&Number(p[8])>0?Number(p[8]):calcMargen(Number(p[4]),Number(p[3]))}
function estadoComercialProducto(p){const e=String(p?.[9]||'activo').trim().toLowerCase();return['activo','no_reponer','discontinuado','estacional','liquidacion'].includes(e)?e:'activo'}
function badgeEstadoComercialValor(e){const labels={activo:'Activo',no_reponer:'No reponer',discontinuado:'Discontinuado',estacional:'Estacional',liquidacion:'Liquidación'},clases={activo:'badge-ok',estacional:'badge-low',liquidacion:'badge-low',no_reponer:'badge-zero',discontinuado:'badge-zero'};return`<span class="badge ${clases[e]||'badge-ok'}">${labels[e]||'Activo'}</span>`}
function badgeEstadoComercial(p){return badgeEstadoComercialValor(estadoComercialProducto(p))}

async function iniciarProductos(){
  if(prodTablaData.length||productosData.length){
    prodTablaData=prodTablaData.length?prodTablaData:productosData;
    renderTablaProductos(prodTablaData);
    document.getElementById('prod-loading').style.display='none';
    document.getElementById('prod-table').style.display='table';
    return;
  }
  document.getElementById('prod-loading').style.display='flex';document.getElementById('prod-table').style.display='none';
  try{const data=await cacheGet('getProductos');prodTablaData=data.slice(1);renderTablaProductos(prodTablaData);document.getElementById('prod-loading').style.display='none';document.getElementById('prod-table').style.display='table'}catch(e){showToast('Error','error')}
}
function renderTablaProductos(rows){
  const vendedor=esVendedor();
  const tabla=document.getElementById('prod-table');
  tabla.classList.toggle('vista-vendedor',vendedor);
  tabla.style.minWidth=vendedor?'760px':'1200px';
  const encabezado=document.querySelector('#prod-table thead tr');
  if(encabezado)encabezado.innerHTML=vendedor?'<th>Código</th><th>Descripción</th><th>Categoría</th><th>Estado</th><th>P. Venta</th><th>Stock</th>':'<th>Código</th><th>Descripción</th><th>Proveedor</th><th>Categoría</th><th>Estado</th><th>P. Costo</th><th>Recargo</th><th>Margen bruto</th><th>P. Venta</th><th>Stock</th><th></th>';
  document.getElementById('prod-body').innerHTML=rows.length===0?`<tr><td colspan="${vendedor?6:11}" style="text-align:center;color:var(--text-mid);padding:20px">No hay productos</td></tr>`:rows.map(p=>{
    if(vendedor)return`<tr><td><code style="color:var(--teal);font-size:12px">${p[0]}</code></td><td>${p[1]}</td><td>${p[7]||'—'}</td><td>${badgeEstadoComercial(p)}</td><td>${formatPeso(p[3])}</td><td>${p[5]||0}</td></tr>`;
    const margen=getMargen(p),margenBruto=calcMargenBruto(Number(p[4]),Number(p[3]));
    return`<tr><td><code style="color:var(--teal);font-size:12px">${p[0]}</code></td><td>${p[1]}</td><td>${textoSeguro(nombreProveedor(p[2])||'Sin proveedor')}</td><td>${p[7]||'—'}</td><td>${badgeEstadoComercial(p)}</td><td>${formatPeso(p[4])}</td><td><span class="badge badge-margen">${margen}%</span></td><td>${margenBruto}%</td><td>${formatPeso(p[3])}</td><td>${p[5]||0}</td><td style="display:flex;gap:6px"><button class="btn-warning" onclick="abrirEditar('${p[0]}')">✏️</button><button class="btn-danger" onclick="eliminarProducto('${p[0]}')">🗑️</button></td></tr>`;
  }).join('');
}
function filtrarTablaProductos(){
  const q=document.getElementById('prod-buscar').value.toLowerCase(),cat=document.getElementById('prod-filtro-cat').value,prov=document.getElementById('prod-filtro-prov')?.value||'';
  renderTablaProductos(prodTablaData.filter(p=>{
    const proveedor=nombreProveedor(p[2]).toLowerCase();
    const coincideTexto=p[0].toString().toLowerCase().includes(q)||p[1].toString().toLowerCase().includes(q)||proveedor.includes(q);
    const coincideCategoria=!cat||p[7]===cat;
    const coincideProveedor=!prov||(prov==='__sin_proveedor__'?!String(p[2]||'').trim():String(buscarProveedor(p[2])?.[0]||p[2])===prov);
    return coincideTexto&&coincideCategoria&&coincideProveedor;
  }));
}
function actualizarMargenBrutoCampo(costoId,ventaId,salidaId){const c=Number(document.getElementById(costoId).value),v=Number(document.getElementById(ventaId).value);document.getElementById(salidaId).value=(c>0&&v>0)?calcMargenBruto(c,v):''}
function calcularPrecioVenta(){const c=Number(document.getElementById('prod-pcosto').value),mv=document.getElementById('prod-margen').value,m=Number(mv);document.getElementById('prod-pventa').value=(c>0&&mv!==''&&m>=0)?Math.round(c*(1+m/100)):'';actualizarMargenBrutoCampo('prod-pcosto','prod-pventa','prod-margen-bruto')}
function calcularMargenProducto(){const c=Number(document.getElementById('prod-pcosto').value),v=Number(document.getElementById('prod-pventa').value);document.getElementById('prod-margen').value=(c>0&&v>0)?Math.round(((v/c)-1)*1000)/10:'';actualizarMargenBrutoCampo('prod-pcosto','prod-pventa','prod-margen-bruto')}

async function agregarProducto(){
  const codigo=document.getElementById('prod-codigo').value.trim(),descripcion=document.getElementById('prod-desc').value.trim(),proveedor=document.getElementById('prod-proveedor').value,categoria=document.getElementById('prod-categoria').value,estado_comercial=document.getElementById('prod-estado-comercial').value,precio_costo=Number(document.getElementById('prod-pcosto').value),margen_pct=Number(document.getElementById('prod-margen').value)||0,precio_venta=Number(document.getElementById('prod-pventa').value),stock=Number(document.getElementById('prod-stock').value)||0,stock_minimo=Number(document.getElementById('prod-stock-min').value)||0;
  if(!codigo||!descripcion){showToast('Completá código y descripción','error');return}
  if(!precio_costo){showToast('Ingresá el precio de costo','error');return}
  if(!precio_venta){showToast('Ingresá el recargo o el precio de venta','error');return}
  try{const data=await cacheGet('getProductos');if(data.slice(1).some(p=>p[0].toString().trim().toLowerCase()===codigo.toLowerCase())){showToast(`El código ${codigo} ya existe`,'error');return}}catch(e){showToast('No se pudo verificar el código','error');return}
  try{await apiPost('agregarProducto',{codigo,descripcion,proveedor,precio_venta,precio_costo,margen_pct,stock,stock_minimo,categoria,estado_comercial});cache.invalidar('getHistorialCostos');await refrescarProductosUI();showToast('Producto guardado');['prod-codigo','prod-desc','prod-pcosto','prod-margen','prod-pventa','prod-margen-bruto','prod-stock','prod-stock-min'].forEach(id=>document.getElementById(id).value='');document.getElementById('prod-proveedor').value='';document.getElementById('prod-categoria').value='';document.getElementById('prod-estado-comercial').value='activo'}catch(e){showToast(e?.message||'Error al guardar el producto','error')}
}
async function eliminarProducto(codigo){
  if(!confirm(`¿Seguro que querés eliminar ${codigo}?`))return;
  try{await apiPost('eliminarProducto',{codigo});await refrescarProductosUI();showToast('Producto eliminado')}catch(e){showToast(e?.message||'Error al eliminar el producto','error')}
}
function abrirEditar(codigo){
  const p=prodTablaData.find(x=>x[0].toString()===codigo.toString());if(!p)return;
  document.getElementById('edit-codigo').value=p[0];document.getElementById('edit-desc').value=p[1];document.getElementById('edit-proveedor').value=buscarProveedor(p[2])?.[0]||'';document.getElementById('edit-pcosto').value=p[4]||'';
  // Si precio venta está vacío, calcularlo desde margen
  const margenGuardado=p[8]?Number(p[8]):calcMargen(Number(p[4]),Number(p[3]));
  const pvCalculado=(!p[3]||Number(p[3])===0)&&margenGuardado>0&&Number(p[4])>0
    ?Math.round(Number(p[4])*(1+margenGuardado/100))
    :Number(p[3])||'';
  document.getElementById('edit-pventa').value=pvCalculado;
  document.getElementById('edit-stock-min').value=p[6]||'';document.getElementById('edit-categoria').value=p[7]||'';
  document.getElementById('edit-estado-comercial').value=estadoComercialProducto(p);
  document.getElementById('edit-margen').value=margenGuardado||'';
  document.getElementById('edit-margen-bruto').value=calcMargenBruto(Number(p[4]),Number(p[3]));
  document.getElementById('modal-editar').classList.add('open');
}
function calcularPrecioVentaEdit(){const c=Number(document.getElementById('edit-pcosto').value),mv=document.getElementById('edit-margen').value,m=Number(mv);document.getElementById('edit-pventa').value=(c>0&&mv!==''&&m>=0)?Math.round(c*(1+m/100)):'';actualizarMargenBrutoCampo('edit-pcosto','edit-pventa','edit-margen-bruto')}
function calcularMargenProductoEdit(){const c=Number(document.getElementById('edit-pcosto').value),v=Number(document.getElementById('edit-pventa').value);document.getElementById('edit-margen').value=(c>0&&v>0)?Math.round(((v/c)-1)*1000)/10:'';actualizarMargenBrutoCampo('edit-pcosto','edit-pventa','edit-margen-bruto')}
async function guardarEdicion(){
  const codigo=document.getElementById('edit-codigo').value.trim(),descripcion=document.getElementById('edit-desc').value.trim(),proveedor=document.getElementById('edit-proveedor').value,categoria=document.getElementById('edit-categoria').value,estado_comercial=document.getElementById('edit-estado-comercial').value,precio_costo=Number(document.getElementById('edit-pcosto').value),margen_pct=Number(document.getElementById('edit-margen').value)||0,precio_venta=Number(document.getElementById('edit-pventa').value),stock_minimo=Number(document.getElementById('edit-stock-min').value)||0;
  if(!descripcion){showToast('Completá la descripción','error');return}
  if(!precio_costo||!precio_venta){showToast('Completá costo y precio de venta','error');return}
  try{await apiPost('editarProducto',{codigo,descripcion,proveedor,precio_venta,precio_costo,margen_pct,stock_minimo,categoria,estado_comercial});cache.invalidar('getHistorialCostos');await refrescarProductosUI();showToast('Producto actualizado');cerrarModal('modal-editar')}catch(e){showToast(e?.message||'Error al actualizar el producto','error')}
}
async function verHistorialProducto(codigo){
  const producto=productosData.find(p=>String(p[0])===String(codigo))||prodTablaData.find(p=>String(p[0])===String(codigo));
  if(!producto){showToast('No se encontró el producto','error');return}
  document.getElementById('hist-prod-titulo').textContent=`Historial — ${producto[0]} · ${producto[1]}`;
  document.getElementById('hist-prod-body').innerHTML='<div class="spinner-wrap"><div class="spinner"></div> Cargando...</div>';
  document.getElementById('modal-historial-producto').classList.add('open');
  try{
    const[dataIng,dataDetIng,dataVentas,dataDetVentas,dataHistCostos]=await Promise.all([
      cacheGet('getIngresos'),cacheGet('getDetalleIngresos'),cacheGet('getVentas'),cacheGet('getDetalleVentas'),cacheGet('getHistorialCostos')
    ]);
    const ingresos=(Array.isArray(dataIng)?dataIng.slice(1):[]);
    const detIngresos=(Array.isArray(dataDetIng)?dataDetIng.slice(1):[]).filter(d=>String(d[1]).trim()===String(codigo).trim());
    const ventas=(Array.isArray(dataVentas)?dataVentas.slice(1):[]);
    const detVentas=(Array.isArray(dataDetVentas)?dataDetVentas.slice(1):[]).filter(d=>String(d[1]).trim()===String(codigo).trim());
    const historialCostos=(Array.isArray(dataHistCostos)?dataHistCostos.slice(1):[]).filter(h=>String(h[1]).trim()===String(codigo).trim()).map(h=>{
      const costoAnterior=Number(h[3])||0,costoNuevo=Number(h[4])||0,recargoAnterior=Number(h[5])||0,recargoNuevo=Number(h[6])||0;
      const precioAnterior=Number(h[7])||Math.round(costoAnterior*(1+recargoAnterior/100));
      const precioNuevo=Number(h[8])||Math.round(costoNuevo*(1+recargoNuevo/100));
      return{fecha:fechaStr(h[0])||String(h[0]||'').slice(0,10),costoAnterior,costoNuevo,recargoAnterior,recargoNuevo,precioAnterior,precioNuevo,margenBrutoAnterior:Number(h[9])||calcMargenBruto(costoAnterior,precioAnterior),margenBrutoNuevo:Number(h[10])||calcMargenBruto(costoNuevo,precioNuevo),motivo:h[11]||'cambio_costo'};
    }).sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
    const movimientos=[];
    detIngresos.forEach(d=>{
      const ingreso=ingresos.find(i=>String(i[0]).trim()===String(d[0]).trim());
      const proveedor=ingreso?proveedoresData.find(p=>String(p[0])===String(ingreso[2])):null;
      movimientos.push({fecha:ingreso?fechaStr(ingreso[1]):'',tipo:'Ingreso',cantidad:Number(d[2])||0,importe:Number(d[3])||0,estado:'Registrado',detalle:proveedor?proveedor[1]:(ingreso?.[2]||'—'),referencia:d[0]});
    });
    detVentas.forEach(d=>{
      const venta=ventas.find(v=>String(v[0]).trim()===String(d[0]).trim());
      const cancelada=String(venta?.[7]||'').toLowerCase()==='cancelada';
      movimientos.push({fecha:venta?fechaStr(venta[1]):'',tipo:'Venta',cantidad:Number(d[2])||0,importe:Number(d[3])||0,estado:cancelada?'Cancelada':'Registrada',detalle:cancelada?'Stock reintegrado':'Stock descontado',referencia:d[0]});
    });
    movimientos.sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))||String(b.referencia).localeCompare(String(a.referencia)));
    const unidadesIngresadas=detIngresos.reduce((s,d)=>s+(Number(d[2])||0),0);
    const unidadesVendidas=detVentas.reduce((s,d)=>{
      const venta=ventas.find(v=>String(v[0]).trim()===String(d[0]).trim());
      return String(venta?.[7]||'').toLowerCase()==='cancelada'?s:s+(Number(d[2])||0);
    },0);
    const costo=Number(producto[4])||0,precio=Number(producto[3])||0,margen=getMargen(producto),margenBruto=calcMargenBruto(costo,precio),stock=Number(producto[5])||0;
    document.getElementById('hist-prod-body').innerHTML=`
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:10px;background:var(--pearl);border-radius:9px;padding:14px;margin-bottom:16px">
        <div><div style="font-size:10px;text-transform:uppercase;color:var(--text-light)">Stock actual</div><strong>${stock}</strong></div>
        <div><div style="font-size:10px;text-transform:uppercase;color:var(--text-light)">Ingresadas</div><strong>${unidadesIngresadas}</strong></div>
        <div><div style="font-size:10px;text-transform:uppercase;color:var(--text-light)">Vendidas vigentes</div><strong>${unidadesVendidas}</strong></div>
        <div><div style="font-size:10px;text-transform:uppercase;color:var(--text-light)">Costo actual</div><strong>${formatPeso(costo)}</strong></div>
        <div><div style="font-size:10px;text-transform:uppercase;color:var(--text-light)">Recargo actual</div><strong>${margen}%</strong></div>
        <div><div style="font-size:10px;text-transform:uppercase;color:var(--text-light)">Margen bruto real</div><strong>${margenBruto}%</strong></div>
        <div><div style="font-size:10px;text-transform:uppercase;color:var(--text-light)">Precio actual</div><strong>${formatPeso(precio)}</strong></div>
      </div>
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-mid);margin:4px 0 8px">Evolución de costos y precios</div>
      <table style="width:100%;margin-bottom:18px"><thead><tr><th>Fecha</th><th>Motivo</th><th>Costo</th><th>Recargo</th><th>Precio venta</th><th>Margen bruto</th></tr></thead><tbody>
        ${historialCostos.length?historialCostos.map(h=>`<tr><td>${h.fecha||'—'}</td><td>${String(h.motivo).replace(/_/g,' ')}</td><td>${formatPeso(h.costoAnterior)} → <strong>${formatPeso(h.costoNuevo)}</strong></td><td>${h.recargoAnterior}% → <strong>${h.recargoNuevo}%</strong></td><td>${formatPeso(h.precioAnterior)} → <strong>${formatPeso(h.precioNuevo)}</strong></td><td>${h.margenBrutoAnterior}% → <strong>${h.margenBrutoNuevo}%</strong></td></tr>`).join(''):'<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:18px">No hay cambios económicos auditados todavía.</td></tr>'}
      </tbody></table>
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-mid);margin-bottom:8px">Movimientos de stock</div>
      <table style="width:100%"><thead><tr><th>Fecha</th><th>Movimiento</th><th>Detalle</th><th>Cantidad</th><th>Valor unit.</th><th>Estado</th></tr></thead><tbody>
        ${movimientos.length?movimientos.map(m=>`<tr><td>${m.fecha||'—'}</td><td><strong style="color:${m.tipo==='Ingreso'?'var(--teal)':'var(--navy)'}">${m.tipo}</strong><div style="font-size:10px;color:var(--text-light)">${m.referencia}</div></td><td>${m.detalle}</td><td>${m.tipo==='Ingreso'?'+':'−'}${m.cantidad}</td><td>${formatPeso(m.importe)}</td><td><span class="badge ${m.estado==='Cancelada'?'badge-zero':'badge-ok'}">${m.estado}</span></td></tr>`).join(''):'<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:24px">Todavía no hay ingresos ni ventas registrados para este producto.</td></tr>'}
      </tbody></table>`;
  }catch(e){document.getElementById('hist-prod-body').innerHTML=`<div style="color:var(--error);padding:20px;text-align:center">${e?.message||'No se pudo cargar el historial'}</div>`;}
}
