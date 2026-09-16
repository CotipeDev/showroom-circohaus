const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert.ok(html.includes('class="vta-hist-scroll"'), 'El historial debe tener su propio desplazamiento horizontal');
assert.ok(html.includes('#vta-hist-table th:last-child,#vta-hist-table td:last-child{position:sticky;right:0'), 'Las acciones deben quedar visibles al desplazar la tabla');
assert.ok(html.includes('<th>Acciones</th>'), 'La columna de botones debe estar identificada');
assert.ok(html.includes('aria-label="Cancelar venta ${v[0]}"'), 'El botón de cancelación debe indicar qué venta afecta');

console.log('Historial: columna de acciones visible y etiquetada');
