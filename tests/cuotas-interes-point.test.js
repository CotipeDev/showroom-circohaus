const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const fuente = fs.readFileSync(path.join(__dirname, '../apps-script/CobrosVentaV2-produccion.gs'), 'utf8');
const contexto = vm.createContext({});
vm.runInContext(fuente, contexto);

const tarifa = [
  ['ID_Tarifa', 'ID_Procesador', 'Canal', 'Tipo_Pago', 'Comision_Base_Pct', 'IVA_Pct', 'Dias_Acreditacion', 'Activo'],
  ['TAR-CREDITO', 'MP', 'Point', 'Crédito', 4.4, 21, 10, true]
];
const planes = [
  ['ID_Plan', 'ID_Procesador', 'Canal', 'Tipo_Pago', 'Cuotas', 'Costo_Negocio_Pct', 'Recargo_Cliente_Pct', 'Quien_Absorbe', 'Monto_Minimo', 'Monto_Maximo', 'Activo', 'Margen_Minimo_Pct'],
  ['PLAN-2', 'MP', '*', 'Crédito', 2, 7.79, 0, 'negocio', 70000, '', true, 20],
  ['PLAN-3', 'MP', '*', 'Crédito', 3, 10.49, 0, 'negocio', 90000, '', true, 20],
  ['PLAN-6', 'MP', '*', 'Crédito', 6, 0, 0, 'cliente', 0, '', true, 20]
];
const hoja = filas => ({ getDataRange: () => ({ getValues: () => filas }) });
const ss = {
  getSheetByName: nombre => nombre === 'Tarifas_Cobro' ? hoja(tarifa) : nombre === 'Planes_Cuotas' ? hoja(planes) : null
};
const resolver = plan => contexto.resolverCobroVentaV2_(ss, {
  id_tarifa: 'TAR-CREDITO', id_plan: plan, base_asignada: 100000
});

const seis = resolver('PLAN-6');
assert.equal(seis.base_asignada, 100000);
assert.equal(seis.monto_cliente, 100000);
assert.equal(seis.costo_plan_pct, 0);
assert.equal(seis.recargo_cliente_pct, 0);
assert.equal(seis.costo_cobranza_total, 5324);
assert.equal(seis.neto_esperado, 94676);

for (const [id, costo] of [['PLAN-2', 7.79], ['PLAN-3', 10.49]]) {
  const resultado = resolver(id);
  assert.equal(resultado.costo_plan_pct, costo);
  assert.equal(resultado.monto_cliente, 100000);
  assert.ok(resultado.neto_esperado < seis.neto_esperado);
}

const interfaz = fs.readFileSync(path.join(__dirname, '../js/ventas-v2.js'), 'utf8');
assert.ok(!interfaz.includes("normalizarCobro(p[7])==='cliente'&&n(p[6])<=0"));
assert.ok(interfaz.includes('interés calculado por Point'));
assert.ok(interfaz.includes('Importe de la venta (sin interés del Point)'));

console.log('Cuotas: financiación del cliente fuera de la venta y costos del negocio OK');
