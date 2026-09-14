const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const codigo = fs.readFileSync(
  path.join(__dirname, '../apps-script/Codigo-produccion.gs'),
  'utf8'
);

assert.doesNotThrow(() => new Function(codigo));

for (const accion of [
  'login',
  'logout',
  'registrarVentaV2',
  'cancelarVenta',
  'cancelarVentaV2',
  'registrarFacturaVenta',
  'importarProductos',
  'conciliarMovimiento'
]) {
  assert.ok(codigo.includes(`action === '${accion}'`), `Falta ${accion}`);
}

for (const accion of ['marcarFacturada', 'registrarFactura']) {
  assert.ok(!codigo.includes(`action === '${accion}'`), `Ruta obsoleta: ${accion}`);
}

assert.ok(!/^function (TEST_|SETUP_)/m.test(codigo));

console.log('Backend candidato: sintaxis y rutas OK');
