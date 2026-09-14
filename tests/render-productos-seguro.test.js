const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const body={innerHTML:''};
const table={classList:{toggle(){}},style:{}};
const header={innerHTML:''};
const context={
  esVendedor(){return false},
  document:{getElementById(id){return id==='prod-table'?table:body},querySelector(){return header}},
  textoSeguro(x){return String(x??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))},
  formatPeso(x){return '$'+Number(x)},
  nombreProveedor(){return 'Proveedor'},
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','js','productos.js'),'utf8'),context);
context.renderTablaProductos([['X" onclick="alert(1)','<img src=x onerror=alert(1)>','','100','50','2','1','Mesa']]);
assert.doesNotMatch(body.innerHTML,/<img/);
assert.doesNotMatch(body.innerHTML,/data-codigo="X" onclick/);
assert.match(body.innerHTML,/&lt;img/);
console.log('Producto mostrado como texto seguro OK');
