const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'FacturacionAPI.gs'), 'utf8');
let failFlag = false;
function sheet(rows, name) {
  return {
    getDataRange() { return {getValues() { return rows.map(r => [...r]); }}; },
    getRange(row, col) { return {setValue(value) { if (name === 'Ventas' && failFlag) { failFlag = false; throw Error('fallo simulado'); } rows[row - 1][col - 1] = value; }}; },
    appendRow(row) { rows.push(row); },
  };
}
const ventas = [['ID', '', '', '', '', '', '', 'Estado', '', 'Facturada', '', '', '', '', '', '', 'Total_Final'],
  ['VTA-1', '', '', '', '', 100, '', 'cobrada', '', false, '', '', '', '', '', '', 120],
  ['VTA-2', '', '', '', '', 80, '', 'cancelada', '', false, '', '', '', '', '', '', 80],
  ['VTA-3', '', '', '', '', 90, '', 'cobrada', '', false, '', '', '', '', '', '', 90]];
const facturas = [['ID', 'Numero', 'Fecha', 'Venta', 'Monto', 'Estado']];
const context = {
  LockService: {getScriptLock() { return {waitLock() {}, releaseLock() {}}; }},
  SpreadsheetApp: {flush() {}},
  Utilities: {getUuid() { return 'abc123456'; }},
};
vm.createContext(context);
vm.runInContext(source, context);
const ss = {getSheetByName(name) { return name === 'Ventas' ? sheet(ventas, name) : name === 'Facturas' ? sheet(facturas, name) : null; }};
const call = body => context.registrarFacturaVentaSegura_(ss, body, {rol: 'administrador'});
const body = {id_venta: 'VTA-1', nro_factura: '0001-00001', fecha: '2026-09-13'};
const first = call(body);
assert.equal(first.monto, 120);
assert.equal(ventas[1][9], true);
assert.equal(facturas.length, 2);
assert.equal(call(body).existente, true);
assert.equal(facturas.length, 2);
assert.throws(() => call({...body, nro_factura: '0001-00002'}), /otra factura/);
assert.throws(() => call({...body, id_venta: 'VTA-2'}), /cancelada/);
assert.throws(() => call({...body, id_venta: 'VTA-3'}), /otra venta/);
assert.throws(() => context.registrarFacturaVentaSegura_(ss, body, {rol: 'vendedor'}), /administradora/);
failFlag = true;
const recovery = {...body, id_venta: 'VTA-3', nro_factura: '0001-00003'};
assert.throws(() => call(recovery), /fallo simulado/);
assert.equal(facturas.length, 3);
assert.equal(ventas[3][9], false);
assert.equal(call(recovery).existente, true);
assert.equal(facturas.length, 3);
assert.equal(ventas[3][9], true);
console.log('Facturación API OK');
