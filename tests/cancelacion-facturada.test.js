const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = ['Codigo-produccion.gs', 'VentasV2-produccion.gs']
  .map(name => fs.readFileSync(path.join(__dirname, '..', 'apps-script', name), 'utf8'))
  .join('\n');

let writes = 0;
const tables = {
  Ventas: [
    ['ID_Venta', '', '', '', '', '', '', 'Estado', '', 'Facturada', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Origen_Modelo'],
    ['VTA-1', '', '', '', '', '', '', 'cobrada', '', false, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'V2']
  ],
  Facturas: [['ID', 'Numero', 'Fecha', 'ID_Venta', 'Monto', 'Estado']],
  Detalle_Ventas: [['ID_Venta', 'Codigo_Producto', 'Cantidad']],
  Productos: [['Codigo', '', '', '', '', 'Stock']],
  Pagos_Venta: [['ID_Venta']],
  Movimientos: [['ID_Movimiento']],
  Cuentas_Por_Cobrar: [['ID_CPC']]
};
const sheets = Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, {
  getName() { return name; },
  getLastColumn() { return rows[0].length; },
  getDataRange() { return {getValues() { return rows.map(row => [...row]); }}; },
  getRange() { return {getValues() { return [rows[0].slice()]; }, setValue() { writes++; }}; }
}]));
const spreadsheet = {getSheetByName(name) { return sheets[name] || null; }};
const context = {
  SpreadsheetApp: {getActiveSpreadsheet() { return spreadsheet; }},
  LockService: {getScriptLock() { return {waitLock() {}, releaseLock() {}}; }}
};
vm.createContext(context);
vm.runInContext(source, context);
context.obtenerSesionSegura_ = () => ({rol: 'administrador'});
context.autorizarAccionSegura_ = () => true;
context.jsonResponse = value => value;

function probarAmbasRutas(mensaje) {
  assert.throws(() => context.cancelarVentaV2_(spreadsheet, {id_venta: 'VTA-1', fecha: '2026-09-14'}), mensaje);
  const result = context.handleRequest({
    parameter: {action: 'cancelarVenta'},
    postData: {contents: JSON.stringify({id_venta: 'VTA-1', token: 'test'})}
  });
  assert.match(result.error, mensaje);
  assert.equal(writes, 0, 'Una venta facturada no debe modificar ninguna hoja');
}

tables.Ventas[1][9] = true;
probarAmbasRutas(/facturada/);
tables.Ventas[1][9] = false;
tables.Facturas.push(['FCT-1', '0001-00001', '2026-09-14', 'VTA-1', 100, 'emitida']);
probarAmbasRutas(/factura registrada/);
tables.Facturas.pop();
tables.Ventas[1][7] = 'cancelada';
assert.throws(() => context.cancelarVentaV2_(spreadsheet, {id_venta: 'VTA-1', fecha: '2026-09-14'}), /ya se encuentra cancelada/);
assert.match(context.handleRequest({
  parameter: {action: 'cancelarVenta'},
  postData: {contents: JSON.stringify({id_venta: 'VTA-1', token: 'test'})}
}).error, /ya se encuentra cancelada/);
assert.equal(writes, 0);

console.log('Cancelación facturada y doble cancelación: rutas V2 y legacy OK');
