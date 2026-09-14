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

const ventasV2 = fs.readFileSync(
  path.join(__dirname, '../apps-script/VentasV2-produccion.gs'),
  'utf8'
);

assert.doesNotThrow(() => new Function(ventasV2));
for (const funcion of ['registrarVentaV2_', 'cancelarVentaV2_', 'crearTarifaCobroV2_']) {
  assert.ok(ventasV2.includes(`function ${funcion}(`), `Falta ${funcion}`);
}
assert.ok(!/^function (TEST_|PREPARAR_)/m.test(ventasV2));

console.log('Backend candidato: sintaxis y rutas OK');
