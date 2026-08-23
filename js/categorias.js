// ============================================================
// CIRCO HAUS — Módulo de categorías
// Usa las utilidades, el caché y categoriasData definidos por la aplicación.
// ============================================================

async function cargarCategorias(){
  try{
    const data=await cacheGet('getCategorias');
    categoriasData=data.slice(1).map(c=>c[0]).filter(Boolean);
    ['prod-categoria','edit-categoria','stock-filtro-cat','prod-filtro-cat'].forEach(id=>{
      const sel=document.getElementById(id);
      if(!sel)return;
      const primera=sel.options[0]?.text||'Todas';
      sel.innerHTML=`<option value="">${primera}</option>`;
      categoriasData.forEach(c=>sel.innerHTML+=`<option value="${c}">${c}</option>`);
    });
  }catch(e){}
}

async function iniciarCategorias(){
  if(categoriasData.length){
    renderTablaCategorias();
    document.getElementById('cat-loading').style.display='none';
    document.getElementById('cat-table').style.display='table';
    return;
  }
  document.getElementById('cat-loading').style.display='flex';
  document.getElementById('cat-table').style.display='none';
  try{
    const data=await cacheGet('getCategorias');
    const rows=data.slice(1).filter(r=>r[0]);
    categoriasData=rows.map(c=>c[0]);
    renderTablaCategorias();
    document.getElementById('cat-loading').style.display='none';
    document.getElementById('cat-table').style.display='table';
  }catch(e){}
}

function cantidadProductosCategoria(nombre){
  const buscada=String(nombre||'').trim().toLowerCase();
  return productosData.filter(p=>String(p[7]||'').trim().toLowerCase()===buscada).length;
}

function renderTablaCategorias(){
  document.getElementById('cat-body').innerHTML=categoriasData.length===0
    ?'<tr><td colspan="3" style="text-align:center;color:var(--text-mid);padding:20px">No hay categorías</td></tr>'
    :categoriasData.map(c=>`<tr><td>${textoSeguro(c)}</td><td>${cantidadProductosCategoria(c)}</td><td style="text-align:right"><button class="btn-warning" data-categoria="${textoSeguro(c)}" onclick="abrirEditarCategoria(this)">✏️ Editar</button></td></tr>`).join('');
}

function abrirEditarCategoria(btn){
  const nombre=btn.dataset.categoria||'';
  const cantidad=cantidadProductosCategoria(nombre);
  document.getElementById('cat-edit-anterior').value=nombre;
  document.getElementById('cat-edit-nombre').value=nombre;
  document.getElementById('cat-edit-info').textContent=cantidad
    ?`Se actualizarán también ${cantidad} producto${cantidad===1?'':'s'} asociado${cantidad===1?'':'s'}.`
    :'Esta categoría todavía no tiene productos asociados.';
  document.getElementById('modal-editar-categoria').classList.add('open');
  setTimeout(()=>document.getElementById('cat-edit-nombre').focus(),100);
}

async function confirmarEditarCategoria(){
  const nombre_anterior=document.getElementById('cat-edit-anterior').value.trim();
  const nombre_nuevo=document.getElementById('cat-edit-nombre').value.trim();
  if(!nombre_nuevo){showToast('Ingresá el nuevo nombre','error');return;}
  if(nombre_anterior===nombre_nuevo){cerrarModal('modal-editar-categoria');return;}
  if(categoriasData.some(c=>c.toLowerCase()===nombre_nuevo.toLowerCase()&&c.toLowerCase()!==nombre_anterior.toLowerCase())){showToast('Esa categoría ya existe','error');return;}
  try{
    const resultado=await apiPost('editarCategoria',{nombre_anterior,nombre_nuevo});
    cache.invalidar('getCategorias','getProductos');
    const[categorias,productos]=await Promise.all([cacheGet('getCategorias'),cacheGet('getProductos')]);
    categoriasData=categorias.slice(1).map(c=>c[0]).filter(Boolean);
    productosData=productos.slice(1);
    prodTablaData=[...productosData];
    stockData=[...productosData];
    await cargarCategorias();
    renderTablaCategorias();
    cerrarModal('modal-editar-categoria');
    const actualizados=Number(resultado.productos_actualizados)||0;
    showToast(`Categoría actualizada en ${actualizados} producto${actualizados===1?'':'s'}`);
  }catch(e){showToast(e?.message||'No se pudo actualizar la categoría','error');}
}

async function agregarCategoria(){
  const n=document.getElementById('cat-nombre').value.trim();
  if(!n){showToast('Ingresá el nombre','error');return;}
  if(categoriasData.map(c=>c.toLowerCase()).includes(n.toLowerCase())){showToast('Esa categoría ya existe','error');return;}
  try{
    await apiPost('agregarCategoria',{nombre:n});
    showToast('Categoría guardada');
    document.getElementById('cat-nombre').value='';
    setTimeout(()=>{cargarCategorias();iniciarCategorias();},1500);
  }catch(e){showToast('Error','error');}
}
