// ============================================================
// CIRCO HAUS — Módulo de proveedores
// Usa el caché, proveedoresData y productosData de la aplicación.
// ============================================================

function normalizarProveedor(valor){return String(valor||'').trim().toLowerCase();}

function buscarProveedor(valor){
  const buscado=normalizarProveedor(valor);
  return proveedoresData.find(p=>normalizarProveedor(p[0])===buscado||normalizarProveedor(p[1])===buscado)||null;
}

function nombreProveedor(valor){
  const proveedor=buscarProveedor(valor);
  return proveedor?String(proveedor[1]||proveedor[0]):String(valor||'');
}

function cantidadProductosProveedor(proveedor){
  const codigo=normalizarProveedor(proveedor?.[0]);
  const nombre=normalizarProveedor(proveedor?.[1]);
  return productosData.filter(p=>{
    const valor=normalizarProveedor(p[2]);
    return valor&&(valor===codigo||valor===nombre);
  }).length;
}

function productosSinProveedor(){return productosData.filter(p=>!String(p[2]||'').trim()).length;}

function completarSelectProveedores(){
  ['ing-proveedor','prod-proveedor','edit-proveedor'].forEach(id=>{
    const sel=document.getElementById(id);
    if(!sel)return;
    const valorAnterior=sel.value;
    sel.innerHTML='<option value="">Seleccioná proveedor...</option>';
    proveedoresData.forEach(p=>sel.innerHTML+=`<option value="${textoSeguro(p[0])}">${textoSeguro(p[1])}</option>`);
    if(proveedoresData.some(p=>String(p[0])===String(valorAnterior)))sel.value=valorAnterior;
  });
  const filtro=document.getElementById('prod-filtro-prov');
  if(filtro){
    const valorAnterior=filtro.value;
    filtro.innerHTML='<option value="">Todos los proveedores</option><option value="__sin_proveedor__">Sin proveedor</option>'+proveedoresData.map(p=>`<option value="${textoSeguro(p[0])}">${textoSeguro(p[1])}</option>`).join('');
    if([...filtro.options].some(o=>o.value===valorAnterior))filtro.value=valorAnterior;
  }
}

async function cargarProveedores(){
  try{
    const data=await cacheGet('getProveedores');
    proveedoresData=data.slice(1);
    completarSelectProveedores();
  }catch(e){}
}

function renderResumenProveedores(){
  const asignados=productosData.filter(p=>String(p[2]||'').trim()).length;
  const sinProveedor=productosSinProveedor();
  document.getElementById('prov-resumen').innerHTML=[
    ['Proveedores registrados',proveedoresData.length],
    ['Productos con proveedor',asignados],
    ['Productos sin proveedor',sinProveedor]
  ].map(([titulo,valor])=>`<div style="background:var(--off-white);border-radius:8px;padding:11px"><div style="font-size:10px;text-transform:uppercase;color:var(--text-light)">${titulo}</div><div style="font-size:20px;font-weight:700;color:var(--navy);margin-top:3px">${valor}</div></div>`).join('');
}

function renderTablaProveedores(){
  document.getElementById('prov-body').innerHTML=proveedoresData.length===0
    ?'<tr><td colspan="5" style="text-align:center;color:var(--text-mid);padding:20px">No hay proveedores</td></tr>'
    :proveedoresData.map(p=>`<tr><td><code style="color:var(--teal);font-size:12px">${textoSeguro(p[0])}</code></td><td>${textoSeguro(p[1])}</td><td>${textoSeguro(p[2]||'—')}</td><td>${cantidadProductosProveedor(p)}</td><td style="text-align:right"><button class="btn-warning" data-codigo="${textoSeguro(p[0])}" onclick="abrirEditarProveedor(this)">✏️ Editar</button></td></tr>`).join('');
  renderResumenProveedores();
}

async function iniciarProveedores(){
  if(proveedoresData.length){
    renderTablaProveedores();
    document.getElementById('prov-loading').style.display='none';
    document.getElementById('prov-table').style.display='table';
    return;
  }
  document.getElementById('prov-loading').style.display='flex';
  document.getElementById('prov-table').style.display='none';
  try{
    const data=await cacheGet('getProveedores');
    proveedoresData=data.slice(1);
    completarSelectProveedores();
    renderTablaProveedores();
    document.getElementById('prov-loading').style.display='none';
    document.getElementById('prov-table').style.display='table';
  }catch(e){showToast('Error al cargar proveedores','error');}
}

async function agregarProveedor(){
  const codigo=document.getElementById('prov-codigo').value.trim();
  const nombre=document.getElementById('prov-nombre').value.trim();
  const contacto=document.getElementById('prov-contacto').value.trim();
  if(!codigo||!nombre){showToast('Completá código y nombre','error');return;}
  if(proveedoresData.some(p=>normalizarProveedor(p[0])===normalizarProveedor(codigo))){showToast('Ese código de proveedor ya existe','error');return;}
  try{
    await apiPost('agregarProveedor',{codigo,nombre,contacto});
    cache.invalidar('getProveedores');
    await cargarProveedores();
    renderTablaProveedores();
    ['prov-codigo','prov-nombre','prov-contacto'].forEach(id=>document.getElementById(id).value='');
    showToast('Proveedor guardado');
  }catch(e){showToast(e?.message||'No se pudo guardar el proveedor','error');}
}

function abrirEditarProveedor(btn){
  const proveedor=proveedoresData.find(p=>String(p[0])===String(btn.dataset.codigo));
  if(!proveedor)return;
  document.getElementById('prov-edit-codigo').value=proveedor[0]||'';
  document.getElementById('prov-edit-nombre').value=proveedor[1]||'';
  document.getElementById('prov-edit-contacto').value=proveedor[2]||'';
  document.getElementById('modal-editar-proveedor').classList.add('open');
  setTimeout(()=>document.getElementById('prov-edit-nombre').focus(),100);
}

async function confirmarEditarProveedor(){
  const codigo=document.getElementById('prov-edit-codigo').value.trim();
  const nombre=document.getElementById('prov-edit-nombre').value.trim();
  const contacto=document.getElementById('prov-edit-contacto').value.trim();
  if(!codigo||!nombre){showToast('Completá el nombre','error');return;}
  try{
    await apiPost('editarProveedor',{codigo,nombre,contacto});
    cache.invalidar('getProveedores');
    await cargarProveedores();
    renderTablaProveedores();
    cerrarModal('modal-editar-proveedor');
    showToast('Proveedor actualizado');
  }catch(e){showToast(e?.message||'No se pudo actualizar el proveedor','error');}
}
