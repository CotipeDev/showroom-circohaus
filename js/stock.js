// ============================================================
// CIRCO HAUS — Módulo de stock e inventario
// Existencias, valorización, rotación y reposición.
// ============================================================

async function iniciarStock(){
  const analisis=document.getElementById('stock-analisis-admin');
  const tabAnalisis=document.getElementById('stock-tab-analisis');
  if(tabAnalisis)tabAnalisis.style.display=esVendedor()?'none':'';
  cambiarVistaStock('listado');
  if(!esVendedor())prepararReporteInventario();
  if(productosData.length){
    stockData=productosData;
    renderStock(stockData);
    document.getElementById('stock-loading').style.display='none';
    document.getElementById('stock-table').style.display='table';
    return;
  }
  document.getElementById('stock-loading').style.display='flex';
  document.getElementById('stock-table').style.display='none';
  try{
    const data=await cacheGet('getProductos');
    stockData=data.slice(1);
    productosData=stockData;
    renderStock(stockData);
    document.getElementById('stock-loading').style.display='none';
    document.getElementById('stock-table').style.display='table';
  }catch(e){showToast('Error','error')}
}
function cambiarVistaStock(vista){
  const mostrarAnalisis=vista==='analisis'&&!esVendedor();
  const listado=document.getElementById('stock-vista-listado'),analisis=document.getElementById('stock-analisis-admin');
  const tabListado=document.getElementById('stock-tab-listado'),tabAnalisis=document.getElementById('stock-tab-analisis');
  if(listado)listado.style.display=mostrarAnalisis?'none':'';
  if(analisis)analisis.style.display=mostrarAnalisis?'':'none';
  if(tabListado)tabListado.className=`btn ${mostrarAnalisis?'btn-secondary':'btn-primary'}`;
  if(tabAnalisis)tabAnalisis.className=`btn ${mostrarAnalisis?'btn-primary':'btn-secondary'}`;
}
function renderStock(rows){
  const vendedor=esVendedor(),encabezado=document.querySelector('#stock-table thead tr');
  if(encabezado)encabezado.innerHTML=vendedor?'<th>Código</th><th>Descripción</th><th>Categoría</th><th>Estado comercial</th><th>P. Venta</th><th>Stock</th><th>Mínimo</th>':'<th>Código</th><th>Descripción</th><th>Categoría</th><th>Estado comercial</th><th>P. Costo</th><th>Recargo</th><th>Margen bruto</th><th>P. Venta</th><th>Stock</th><th>Mínimo</th>';
  document.getElementById('stock-body').innerHTML=rows.length===0?`<tr><td colspan="${vendedor?7:10}" style="text-align:center;color:var(--text-mid);padding:20px">No hay productos</td></tr>`:rows.map(p=>{
    const s=Number(p[5])||0,m=Number(p[6])||0,margen=getMargen(p),margenBruto=calcMargenBruto(Number(p[4]),Number(p[3]));
    const badge=s===0?`<span class="badge badge-zero">Sin stock</span>`:(m>0&&s<=m)?`<span class="badge badge-low">${s} ⚠️</span>`:`<span class="badge badge-ok">${s}</span>`;
    if(vendedor)return`<tr><td><code style="color:var(--teal);font-size:12px">${p[0]}</code></td><td>${p[1]}</td><td>${p[7]||'—'}</td><td>${badgeEstadoComercial(p)}</td><td>${formatPeso(p[3])}</td><td>${badge}</td><td style="color:var(--text-mid);font-size:12px">${m>0?'Mín: '+m:'—'}</td></tr>`;
    return`<tr><td><code style="color:var(--teal);font-size:12px">${p[0]}</code></td><td>${p[1]}</td><td>${p[7]||'—'}</td><td>${badgeEstadoComercial(p)}</td><td>${formatPeso(p[4])}</td><td><span class="badge badge-margen">${margen}%</span></td><td>${margenBruto}%</td><td>${formatPeso(p[3])}</td><td>${badge}</td><td style="color:var(--text-mid);font-size:12px">${m>0?'Mín: '+m:'—'}</td></tr>`;
  }).join('');
}
function filtrarStock(){const q=document.getElementById('stock-buscar').value.toLowerCase(),cat=document.getElementById('stock-filtro-cat').value;renderStock(stockData.filter(p=>(p[0].toString().toLowerCase().includes(q)||p[1].toString().toLowerCase().includes(q))&&(!cat||p[7]===cat)))}

let reporteInventarioData=[];

function iniciarReportes(){
  prepararAnalisisIngresos();
  repSetPeriodo('mes');
}

async function prepararReporteInventario(){
  try{
    const[dataProd,dataVentas,dataDetalle,dataProv,dataIngresos,dataDetalleIngresos]=await Promise.all([
      cacheGet('getProductos'),cacheGet('getVentas'),cacheGet('getDetalleVentas'),cacheGet('getProveedores'),cacheGet('getIngresos'),cacheGet('getDetalleIngresos')
    ]);
    const productos=(dataProd||[]).slice(1),ventas=(dataVentas||[]).slice(1).filter(v=>String(v[7]||'').toLowerCase()!=='cancelada');
    const detalles=(dataDetalle||[]).slice(1),proveedores=(dataProv||[]).slice(1);
    const ingresos=(dataIngresos||[]).slice(1).filter(i=>String(i[4]||'').toLowerCase()!=='cancelada'),detalleIngresos=(dataDetalleIngresos||[]).slice(1);
    const ventasPorId=new Map(ventas.map(v=>[String(v[0]),fechaStr(v[1])]));
    const fechaIngresoPorId=new Map(ingresos.map(i=>[String(i[0]),fechaStr(i[1])]));
    const primeraEntrada={};detalleIngresos.forEach(d=>{const fecha=fechaIngresoPorId.get(String(d[0])),codigo=String(d[1]);if(fecha&&(!primeraEntrada[codigo]||fecha<primeraEntrada[codigo]))primeraEntrada[codigo]=fecha;});
    const hoy=new Date(),limite30=new Date(hoy),limite90=new Date(hoy);limite30.setDate(limite30.getDate()-30);limite90.setDate(limite90.getDate()-90);
    const fechaLimite30=limite30.toISOString().split('T')[0],fechaLimite90=limite90.toISOString().split('T')[0];
    const ventasProducto={};
    detalles.forEach(d=>{
      const fecha=ventasPorId.get(String(d[0]));if(!fecha)return;
      const codigo=String(d[1]),cantidad=Number(d[2])||0;
      if(!ventasProducto[codigo])ventasProducto[codigo]={v30:0,v90:0,ultima:''};
      if(fecha>=fechaLimite30)ventasProducto[codigo].v30+=cantidad;
      if(fecha>=fechaLimite90)ventasProducto[codigo].v90+=cantidad;
      if(!ventasProducto[codigo].ultima||fecha>ventasProducto[codigo].ultima)ventasProducto[codigo].ultima=fecha;
    });
    const proveedorNombre=valor=>{const q=String(valor||'').trim().toLowerCase();const p=proveedores.find(x=>String(x[0]||'').trim().toLowerCase()===q||String(x[1]||'').trim().toLowerCase()===q);return p?p[1]:String(valor||'Sin proveedor');};
    reporteInventarioData=productos.map(p=>{
      const codigo=String(p[0]),stock=Number(p[5])||0,minimo=Number(p[6])||0,costo=Number(p[4])||0,precio=Number(p[3])||0,v=ventasProducto[codigo]||{v30:0,v90:0,ultima:''};
      const primera=primeraEntrada[codigo]||'',estadoComercial=estadoComercialProducto(p),bajoMinimo=minimo>0&&stock>0&&stock<=minimo,reposicionSugerida=estadoComercial==='activo'&&(stock<=0||bajoMinimo)&&v.v90>0;
      let estado='rotacion';
      if(stock<=0)estado='sin_stock';
      else if(costo<=0)estado='sin_costo';
      else if(bajoMinimo)estado='reponer';
      else if(!v.ultima&&primera&&primera<fechaLimite90)estado='sin_ventas_90';
      else if(!v.ultima)estado='sin_ventas';
      else if(v.ultima<fechaLimite90)estado='sin_ventas_90';
      return{codigo,descripcion:String(p[1]||codigo),proveedor:proveedorNombre(p[2]),categoria:String(p[7]||'Sin categoría'),stock,minimo,costo,precio,valorCosto:stock*costo,valorVenta:stock*precio,v30:v.v30,v90:v.v90,ultima:v.ultima,primeraEntrada:primera,bajoMinimo,reposicionSugerida,estadoComercial,estado};
    });
    const selProv=document.getElementById('rep-inv-proveedor'),selCat=document.getElementById('rep-inv-categoria');
    const provAnterior=selProv.value,catAnterior=selCat.value;
    const valoresProv=[...new Set(reporteInventarioData.map(x=>x.proveedor))].sort(),valoresCat=[...new Set(reporteInventarioData.map(x=>x.categoria))].sort();
    selProv.innerHTML='<option value="">Todos</option>'+valoresProv.map(x=>`<option value="${textoSeguro(x)}">${textoSeguro(x)}</option>`).join('');
    selCat.innerHTML='<option value="">Todas</option>'+valoresCat.map(x=>`<option value="${textoSeguro(x)}">${textoSeguro(x)}</option>`).join('');
    if(valoresProv.includes(provAnterior))selProv.value=provAnterior;if(valoresCat.includes(catAnterior))selCat.value=catAnterior;
    renderReporteInventario();
  }catch(e){document.getElementById('rep-inv-body').innerHTML='<tr><td colspan="9" style="text-align:center;color:#C44F4F;padding:22px">No se pudo cargar el inventario.</td></tr>';}
}

function renderReporteInventario(){
  const proveedor=document.getElementById('rep-inv-proveedor')?.value||'',categoria=document.getElementById('rep-inv-categoria')?.value||'',estado=document.getElementById('rep-inv-estado')?.value||'',comercial=document.getElementById('rep-inv-comercial')?.value||'';
  const base=reporteInventarioData;
  const unidades=base.reduce((s,x)=>s+x.stock,0),valorCosto=base.reduce((s,x)=>s+x.valorCosto,0),valorVenta=base.reduce((s,x)=>s+x.valorVenta,0);
  const gananciaPotencial=base.reduce((s,x)=>s+(x.costo>0?x.valorVenta-x.valorCosto:0),0);
  const inmovilizado=base.filter(x=>x.estado==='sin_ventas_90').reduce((s,x)=>s+x.valorCosto,0);
  const sinStock=base.filter(x=>x.stock<=0).length,bajoMinimo=base.filter(x=>x.bajoMinimo).length,paraReponer=base.filter(x=>x.reposicionSugerida).length,sinCosto=base.filter(x=>x.costo<=0&&x.stock>0).length;
  document.getElementById('rep-inv-kpis').innerHTML=[['Unidades en stock',unidades],['Stock valorizado al costo',formatPeso(valorCosto)],['Venta potencial',formatPeso(valorVenta)],['Ganancia potencial calculable',formatPeso(gananciaPotencial)],['Stock inmovilizado',formatPeso(inmovilizado)],['Sin stock',sinStock],['Bajo mínimo',bajoMinimo],['Reposición sugerida',paraReponer],['Sin costo informado',sinCosto]].map(([k,v])=>`<div style="background:var(--off-white);border-radius:8px;padding:11px"><div style="font-size:10px;text-transform:uppercase;color:var(--text-light)">${k}</div><div style="font-size:19px;font-weight:700;color:var(--navy);margin-top:3px">${v}</div></div>`).join('');
  const aviso=document.getElementById('rep-inv-aviso');aviso.style.display=sinCosto?'':'none';aviso.textContent=sinCosto?`La valoración y la ganancia son parciales: hay ${sinCosto} productos con stock sin costo informado.`:'';
  let filas=base;if(proveedor)filas=filas.filter(x=>x.proveedor===proveedor);if(categoria)filas=filas.filter(x=>x.categoria===categoria);if(estado)filas=estado==='reposicion_sugerida'?filas.filter(x=>x.reposicionSugerida):filas.filter(x=>x.estado===estado);if(comercial)filas=filas.filter(x=>x.estadoComercial===comercial);
  const etiquetas={reponer:['Bajo mínimo','badge-low'],sin_ventas_90:['Sin ventas +90d','badge-zero'],sin_ventas:['Nuevo / nunca vendido','badge-zero'],rotacion:['Con rotación','badge-ok'],sin_stock:['Sin stock','badge-zero'],sin_costo:['Sin costo','badge-low']};
  document.getElementById('rep-inv-body').innerHTML=filas.length?filas.map(x=>{
    const et=etiquetas[x.estado]||[x.estado,''];
    const estadoVisual=x.reposicionSugerida?'<span class="badge badge-low" style="margin-left:4px">Reponer</span>':'';
    return`<tr><td><strong>${textoSeguro(x.descripcion)}</strong><div style="font-size:10px;color:var(--text-light)">${textoSeguro(x.codigo)}</div></td><td>${textoSeguro(x.proveedor)}</td><td>${textoSeguro(x.categoria)}</td><td>${badgeEstadoComercialValor(x.estadoComercial)}</td><td style="text-align:right;font-weight:600">${x.stock}${x.minimo?` <span style="font-size:9px;color:var(--text-light)">(mín. ${x.minimo})</span>`:''}</td><td style="text-align:right">${x.costo>0?formatPeso(x.valorCosto):'—'}</td><td style="text-align:right">${x.v30}</td><td style="text-align:right">${x.v90}</td><td>${x.ultima||'—'}</td><td><span class="badge ${et[1]}">${et[0]}</span>${estadoVisual}</td></tr>`;
  }).join(''):'<tr><td colspan="10" style="text-align:center;color:var(--text-light);padding:22px">No hay productos para este filtro.</td></tr>';
}
