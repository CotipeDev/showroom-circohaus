/**
 * @OnlyCurrentDoc
 */
// Sólo para el proyecto Apps Script de pruebas. No escribe en la planilla.
function probarLogicaSinEscritura() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss || !/pruebas de producci[oó]n/i.test(ss.getName())) {
    throw new Error('Detenido: no es la planilla de pruebas.');
  }

  const nombres = [
    'Ventas', 'Detalle_Ventas', 'Pagos_Venta',
    'Cuentas_Por_Cobrar', 'Movimientos', 'Productos'
  ];
  const filasAntes = nombres.map(function(nombre) {
    return ss.getSheetByName(nombre).getLastRow();
  });

  const productos = ss.getSheetByName('Productos').getDataRange().getValues();
  let producto = null;
  for (let i = 1; i < productos.length; i++) {
    const fila = productos[i];
    if (String(fila[0] || '').trim() && Number(fila[3]) > 0 &&
        Number(fila[4]) >= 0 && Number(fila[5]) >= 1) {
      producto = {fila: i + 1, codigo: String(fila[0]).trim(), stock: Number(fila[5])};
      break;
    }
  }
  if (!producto) throw new Error('No hay un producto apto para validar la venta.');

  const clientes = ss.getSheetByName('Clientes').getDataRange().getValues();
  const cliente = clientes.slice(1).find(function(fila) {
    return String(fila[0] || '').trim();
  });
  if (!cliente) throw new Error('No hay un cliente para validar la venta a cuenta.');

  const base = {
    fecha: new Date().toISOString().slice(0, 10),
    tipo: 'cuenta_por_cobrar',
    id_cliente: String(cliente[0]).trim(),
    items: [{codigo: producto.codigo, cantidad: 1}],
    pagos: [],
    rol_sesion: 'administrador',
    solo_validar_margen: true
  };
  const valido = registrarVentaV2_(ss, base);
  if (!valido || valido.ok !== true || typeof valido.requiere_autorizacion !== 'boolean') {
    throw new Error('La validación de venta no devolvió el resultado esperado.');
  }

  let rechazoStock = false;
  try {
    registrarVentaV2_(ss, Object.assign({}, base, {
      items: [{codigo: producto.codigo, cantidad: producto.stock + 1}]
    }));
  } catch (error) {
    rechazoStock = /Stock insuficiente/.test(String(error.message || error));
  }
  if (!rechazoStock) throw new Error('No se rechazó la venta sin stock suficiente.');

  const filasDespues = nombres.map(function(nombre) {
    return ss.getSheetByName(nombre).getLastRow();
  });
  const stockDespues = Number(ss.getSheetByName('Productos').getRange(producto.fila, 6).getValue());
  if (filasAntes.some(function(valor, i) { return valor !== filasDespues[i]; }) ||
      stockDespues !== producto.stock) {
    throw new Error('La validación modificó datos: no continuar con las pruebas.');
  }

  Logger.log('OK: venta válida y falta de stock verificadas sin modificar hojas.');
}
