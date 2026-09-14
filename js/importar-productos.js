// Importación de productos nuevos desde CSV exportado por Excel.
let productosImportables=[];
const columnasImportacion=['codigo','descripcion','proveedor','categoria','precio_costo','precio_venta','stock','stock_minimo','estado_comercial'];
function descargarPlantillaProductos(){
  const url=URL.createObjectURL(new Blob(['\uFEFF'+columnasImportacion.join(';')+'\r\n'],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='plantilla-productos-circohaus.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function abrirImportacionProductos(){
  if(esVendedor())return showToast('Tu perfil no puede importar productos','error');
  productosImportables=[];
  document.getElementById('import-prod-archivo').value='';
  document.getElementById('import-prod-resumen').textContent='';
  document.getElementById('import-prod-tabla').style.display='none';
  document.getElementById('import-prod-confirmar').style.display='none';
  document.getElementById('modal-importar-productos').classList.add('open');
}
function parsearCsvProductos(texto){
  const primera=texto.replace(/^\uFEFF/,'').split(/\r?\n/,1)[0]||'';
  const sep=(primera.match(/;/g)||[]).length>=(primera.match(/,/g)||[]).length?';':',';
  const filas=[];let fila=[],valor='',comillas=false;
  for(let i=0;i<texto.length;i++){
    const c=texto[i];
    if(c==='"'){if(comillas&&texto[i+1]==='"'){valor+='"';i++;}else comillas=!comillas;}
    else if(c===sep&&!comillas){fila.push(valor);valor='';}
    else if((c==='\n'||c==='\r')&&!comillas){if(c==='\r'&&texto[i+1]==='\n')i++;fila.push(valor);valor='';if(fila.some(x=>x.trim()))filas.push(fila);fila=[];}
    else valor+=c;
  }
  if(comillas)throw new Error('Hay comillas sin cerrar en el archivo.');
  fila.push(valor);if(fila.some(x=>x.trim()))filas.push(fila);
  return filas;
}
function numeroImportado(valor){
  let s=String(valor||'').trim().replace(/\s/g,'');if(!s)return NaN;
  if(s.includes(',')&&s.includes('.'))s=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');
  else if(s.includes(','))s=s.replace(',','.');
  else if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');
  return Number(s);
}
async function previsualizarImportacionProductos(archivo){
  productosImportables=[];
  document.getElementById('import-prod-confirmar').style.display='none';
  document.getElementById('import-prod-tabla').style.display='none';
  const resumen=document.getElementById('import-prod-resumen');
  if(!archivo)return;
  if(!/\.csv$/i.test(archivo.name)){resumen.textContent='Guardá el archivo de Excel como CSV UTF-8 para importarlo.';return;}
  if(archivo.size>1024*1024){resumen.textContent='El archivo supera 1 MB. Dividilo en archivos de hasta 500 productos.';return;}
  resumen.textContent='Revisando archivo...';
  try{
    const [texto,productos,proveedores,categorias]=await Promise.all([archivo.text(),cacheGet('getProductos'),cacheGet('getProveedores'),cacheGet('getCategorias')]);
    const filas=parsearCsvProductos(texto);
    const cabeceras=(filas.shift()||[]).map(x=>x.replace(/^\uFEFF/,'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\s-]+/g,'_'));
    const faltantes=['codigo','descripcion','precio_costo','precio_venta','stock'].filter(x=>!cabeceras.includes(x));
    if(faltantes.length)throw new Error('Faltan columnas: '+faltantes.join(', ')+'. Usá la plantilla.');
    if(!filas.length)throw new Error('El archivo no tiene productos.');
    if(filas.length>500)throw new Error('Importá hasta 500 productos por archivo.');
    const existentes=new Set(productos.slice(1).map(p=>String(p[0]).trim().toLowerCase()));
    const vistos=new Set();
    const proveedoresValidos=new Set(proveedores.slice(1).map(p=>String(p[0]).trim().toLowerCase()));
    const categoriasValidas=new Set(categorias.slice(1).map(c=>String(c[0]).trim().toLowerCase()));
    let omitidos=0,errores=0;
    const vistas=filas.map((fila,i)=>{
      const valor=n=>String(fila[cabeceras.indexOf(n)]||'').trim();
      const p={codigo:valor('codigo'),descripcion:valor('descripcion'),proveedor:valor('proveedor'),categoria:valor('categoria'),precio_costo:numeroImportado(valor('precio_costo')),precio_venta:numeroImportado(valor('precio_venta')),stock:numeroImportado(valor('stock')),stock_minimo:valor('stock_minimo')?numeroImportado(valor('stock_minimo')):0,estado_comercial:valor('estado_comercial')||'activo'};
      const clave=p.codigo.toLowerCase();let estado='Listo';
      if(!p.codigo||!p.descripcion||p.codigo.length>80||p.descripcion.length>250)estado='Código o descripción inválidos';
      else if(vistos.has(clave))estado='Código repetido en el archivo';
      else if(existentes.has(clave))estado='Ya existe: se omite';
      else if(!Number.isFinite(p.precio_costo)||p.precio_costo<=0||!Number.isFinite(p.precio_venta)||p.precio_venta<=0)estado='Costo o precio inválido';
      else if(!Number.isInteger(p.stock)||p.stock<0||!Number.isInteger(p.stock_minimo)||p.stock_minimo<0)estado='Stock inválido';
      else if(p.proveedor&&!proveedoresValidos.has(p.proveedor.toLowerCase()))estado='Proveedor no registrado';
      else if(p.categoria&&!categoriasValidas.has(p.categoria.toLowerCase()))estado='Categoría no registrada';
      else if(!['activo','no_reponer','discontinuado','estacional','liquidacion'].includes(p.estado_comercial.toLowerCase()))estado='Estado comercial inválido';
      vistos.add(clave);
      if(estado==='Listo')productosImportables.push(p);else if(estado==='Ya existe: se omite')omitidos++;else errores++;
      return '<tr><td>'+(i+2)+'</td><td>'+textoSeguro(p.codigo)+'</td><td>'+textoSeguro(p.descripcion)+'</td><td>'+(Number.isFinite(p.precio_costo)?formatPeso(p.precio_costo):'—')+'</td><td>'+(Number.isFinite(p.precio_venta)?formatPeso(p.precio_venta):'—')+'</td><td>'+(Number.isFinite(p.stock)?p.stock:'—')+'</td><td>'+textoSeguro(estado)+'</td></tr>';
    });
    resumen.textContent=productosImportables.length+' listos · '+omitidos+' existentes omitidos · '+errores+' con errores. Revisá la vista previa antes de confirmar.';
    document.getElementById('import-prod-cuerpo').innerHTML=vistas.join('');
    document.getElementById('import-prod-tabla').style.display='table';
    document.getElementById('import-prod-confirmar').style.display=productosImportables.length?'':'none';
  }catch(e){resumen.textContent=e.message||'No pudimos leer el archivo.';}
}
async function confirmarImportacionProductos(){
  if(!productosImportables.length)return;
  if(!confirm('¿Agregar '+productosImportables.length+' productos nuevos? Los existentes no se modificarán.'))return;
  try{
    const resultado=await apiPost('importarProductos',{productos:productosImportables});
    productosImportables=[];
    cacheInvalidar('getProductos','getHistorialCostos');
    await refrescarProductosUI();
    document.getElementById('import-prod-confirmar').style.display='none';
    document.getElementById('import-prod-resumen').textContent='Importación terminada: '+resultado.creados+' creados y '+resultado.omitidos+' omitidos.';
    showToast(resultado.creados+' productos importados');
  }catch(e){showToast(e?.message||'No se pudo importar. Revisá el archivo y volvé a intentar.','error');}
}
