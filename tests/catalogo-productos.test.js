const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const raiz = path.join(__dirname, '..');
const encabezado = ['Codigo','Descripcion','Proveedor','Precio_Venta','Precio_Costo','Stock','Stock_Minimo','Categoria','Recargo','Estado'];
let hojas;
function hoja(nombre) {
  return {
    getDataRange() { return {getValues() { return hojas[nombre].map(f => [...f]); }}; },
    getRange(fila, columna, alto=1, ancho=1) { return {
      setValues(datos) { for (let i=0; i<alto; i++) { hojas[nombre][fila-1+i] ||= []; for (let j=0; j<ancho; j++) hojas[nombre][fila-1+i][columna-1+j] = datos[i][j]; } },
      setValue(valor) { hojas[nombre][fila-1][columna-1] = valor; }
    }; },
    appendRow(fila) { hojas[nombre].push([...fila]); },
    getLastRow() { return hojas[nombre].length; }
  };
}
const ss={getSheetByName:nombre=>hojas[nombre]?hoja(nombre):null};
const server={SpreadsheetApp:{getActiveSpreadsheet:()=>ss,flush(){}},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})}};
vm.createContext(server);
vm.runInContext(fs.readFileSync(path.join(raiz,'apps-script/Codigo-produccion.gs'),'utf8'),server);
vm.runInContext(fs.readFileSync(path.join(raiz,'apps-script/ImportarProductosAPI.gs'),'utf8'),server);
server.obtenerSesionSegura_=()=>({rol:'administrador'});
server.jsonResponse=x=>x;
const base={codigo:'A',descripcion:'Copa',proveedor:'',categoria:'Mesa',precio_venta:1000,precio_costo:500,margen_pct:100,stock:4,stock_minimo:1};
const llamar=(action,body)=>server.handleRequest({parameter:{action,token:'TEST'},postData:{contents:JSON.stringify(body)}});
function reiniciar(){hojas={Productos:[[...encabezado]],Historial_Costos:[['Fecha']],Proveedores:[['Codigo']],Categorias:[['Nombre'],['Mesa']]};}
reiniciar();
assert.equal(llamar('agregarProducto',{...base,foto_principal:'https://ejemplo.com/copa.jpg',descripcion_publica:'Vidrio, 250 ml',visible_catalogo:true}).ok,true);
assert.deepEqual(hojas.Productos[1].slice(0,10),['A','Copa','',1000,500,4,1,'Mesa',100,'activo']);
assert.deepEqual(hojas.Productos[0].slice(10),['Foto_Principal','Descripcion_Publica','Visible_Catalogo']);
assert.deepEqual(hojas.Productos[1].slice(10),['https://ejemplo.com/copa.jpg','Vidrio, 250 ml',true]);
const historialAntes=hojas.Historial_Costos.length;
assert.equal(llamar('editarProducto',{...base,stock:999,foto_principal:'https://ejemplo.com/nueva.jpg',descripcion_publica:'Nueva descripción',visible_catalogo:false}).ok,true);
assert.equal(hojas.Productos[1][5],4,'Editar catálogo conserva el stock');
assert.equal(hojas.Historial_Costos.length,historialAntes,'Editar catálogo no agrega costos ficticios');
assert.equal(llamar('editarProducto',base).ok,true);
assert.deepEqual(hojas.Productos[1].slice(10),['https://ejemplo.com/nueva.jpg','Nueva descripción',false],'Un cliente anterior no borra los nuevos campos');
let antes=JSON.stringify(hojas);
assert.match(llamar('editarProducto',{...base,foto_principal:'javascript:alert(1)'}).error,/HTTPS/);
assert.equal(JSON.stringify(hojas),antes);
assert.match(llamar('editarProducto',{...base,descripcion_publica:'=IMPORTXML("url")'}).error,/descripción/);
assert.equal(JSON.stringify(hojas),antes);
assert.match(llamar('editarProducto',{...base,visible_catalogo:'false'}).error,/visibilidad/);
assert.equal(JSON.stringify(hojas),antes);
server.obtenerSesionSegura_=()=>({rol:'vendedor'});
assert.match(llamar('editarProducto',{...base,visible_catalogo:true}).error,/permiso/);
assert.equal(JSON.stringify(hojas),antes);
server.obtenerSesionSegura_=()=>({rol:'administrador'});
server.importarProductosSeguros_(ss,{productos:[{...base,codigo:'B'}]},{rol:'administrador'});
assert.equal(hojas.Productos[2][5],4);
assert.equal(hojas.Productos[2][12],undefined,'Una importación anterior deja el producto oculto');
assert.deepEqual(hojas.Productos[1].slice(10),['https://ejemplo.com/nueva.jpg','Nueva descripción',false]);
reiniciar();hojas.Productos[0][10]='Otro_Campo';antes=JSON.stringify(hojas);
assert.match(llamar('agregarProducto',{...base,visible_catalogo:true}).error,/ocupada/);
assert.equal(JSON.stringify(hojas),antes,'Un esquema distinto se rechaza antes de escribir');
const ui={URL};vm.createContext(ui);vm.runInContext(fs.readFileSync(path.join(raiz,'js/productos.js'),'utf8'),ui);
assert.equal(ui.productoVisibleCatalogo(['A']),false);
assert.equal(ui.productoDisponibleCatalogo(['A','','','','',0,'','','','','','',true]),false);
assert.equal(ui.productoDisponibleCatalogo(['A','','','','',2,'','','','','','','TRUE']),true);
for(const foto of ['javascript:alert(1)','http://ejemplo.com/a.jpg','https://user:pass@ejemplo.com/a.jpg','https://ejemplo.com/" onclick="x'])assert.throws(()=>ui.validarFotoCatalogoProducto(foto));
console.log('Catálogo: compatibilidad, stock, permisos, importación y validación de campos OK');

(async()=>{ui.apiGet=async()=>({version:1});await ui.comprobarApiCatalogoProductos();ui.apiGet=async()=>({});await assert.rejects(()=>ui.comprobarApiCatalogoProductos(),/todavía no está disponible/);console.log('Una API anterior bloquea el guardado antes de perder los campos nuevos');})().catch(e=>{console.error(e);process.exitCode=1});
