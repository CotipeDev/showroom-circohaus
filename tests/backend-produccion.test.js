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

const cobrosV2 = fs.readFileSync(
  path.join(__dirname, '../apps-script/CobrosVentaV2-produccion.gs'),
  'utf8'
);

assert.doesNotThrow(() => new Function(cobrosV2));
for (const funcion of ['resolverCobroVentaV2_', 'crearPlanCuotasV2_']) {
  assert.ok(cobrosV2.includes(`function ${funcion}(`), `Falta ${funcion}`);
}
assert.ok(!/^function (TEST_|SETUP_)/m.test(cobrosV2));

const auxiliares = ['UsuariosAPI.gs', 'FacturacionAPI.gs', 'ImportarProductosAPI.gs'].map((archivo) =>
  fs.readFileSync(path.join(__dirname, '../apps-script', archivo), 'utf8')
);
for (const auxiliar of auxiliares) {
  assert.doesNotThrow(() => new Function(auxiliar));
}

const funciones = [codigo, ventasV2, cobrosV2, ...auxiliares].flatMap((texto) =>
  [...texto.matchAll(/^function ([\w]+)\(/gm)].map((coincidencia) => coincidencia[1])
);
assert.equal(new Set(funciones).size, funciones.length, 'Hay funciones duplicadas');

console.log('Backend candidato: sintaxis y rutas OK');
