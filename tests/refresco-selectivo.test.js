const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('async function refrescarDatos(');
const end=html.indexOf('// ── DEBOUNCE',start);
assert.ok(start>0&&end>start);
const pedidos=[];
const context={
  cacheGet:async key=>{pedidos.push(key);return [['cabecera'],[key]]},
  console,
  productosData:[],stockData:[],prodTablaData:[],ventasHistData:[],ventasData:[],movimientosData:[],cuentasData:[],cuentasPorCobrarData:[]
};
vm.createContext(context);
vm.runInContext(html.slice(start,end),context);
(async()=>{
  await context.refrescarDatos('getProductos','getVentas','getProductos');
  assert.deepEqual(pedidos,['getProductos','getVentas']);
  assert.equal(context.productosData[0][0],'getProductos');
  assert.equal(context.ventasHistData[0][0],'getVentas');
  assert.equal(context.cuentasData.length,0);
  console.log('Refresco selectivo OK');
})().catch(e=>{console.error(e);process.exitCode=1});
