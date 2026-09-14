/**
 * @OnlyCurrentDoc
 */
// Sólo para la planilla de pruebas. Registra y cancela una venta real en la copia.
function probarVentaYCancelacionEnCopia() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss || !/pruebas de producci[oó]n/i.test(ss.getName())) {
    throw new Error('Detenido: no es la planilla de pruebas.');
  }

  const hojaProductos = ss.getSheetByName('Productos');
  const hojaVentas = ss.getSheetByName('Ventas');
  const hojaDetalle = ss.getSheetByName('Detalle_Ventas');
  const hojaCpc = ss.getSheetByName('Cuentas_Por_Cobrar');
  const hojaClientes = ss.getSheetByName('Clientes');
  if (!hojaProductos || !hojaVentas || !hojaDetalle || !hojaCpc || !hojaClientes) {
    throw new Error('Falta una hoja necesaria para la prueba.');
  }

  const productos = hojaProductos.getDataRange().getValues();
  let producto = null;
  for (let i = 1; i < productos.length; i++) {
    const fila = productos[i];
    if (String(fila[0] || '').trim() && Number(fila[3]) > 0 &&
        Number(fila[4]) >= 0 && Number(fila[5]) >= 1) {
      producto = {fila: i + 1, codigo: String(fila[0]).trim(), stock: Number(fila[5])};
      break;
    }
  }
  if (!producto) throw new Error('No hay un producto con stock y precio válidos.');

  const clientes = hojaClientes.getDataRange().getValues();
  const cliente = clientes.slice(1).find(function(fila) {
    return String(fila[0] || '').trim();
  });
  if (!cliente) throw new Error('No hay un cliente para la venta a cuenta.');

  const fecha = new Date().toISOString().slice(0, 10);
  let idVenta = '';
  try {
    const venta = registrarVentaV2_(ss, {
      fecha: fecha,
      tipo: 'cuenta_por_cobrar',
      id_cliente: String(cliente[0]).trim(),
      notas: 'PRUEBA EN COPIA - cancelar',
      items: [{codigo: producto.codigo, cantidad: 1}],
      pagos: [],
      rol_sesion: 'administrador',
      usuario_sesion: 'PRUEBA_COPIA',
      confirmar_margen_bajo: true,
      canal_venta: 'Local / presencial'
    });
    idVenta = String(venta && (venta.id || venta.id_venta) || '').trim();
    if (!idVenta) throw new Error('La venta no devolvió ID.');

    const stockVendido = Number(hojaProductos.getRange(producto.fila, 6).getValue());
    if (stockVendido !== producto.stock - 1) {
      throw new Error('La venta no descontó exactamente una unidad de stock.');
    }

    const detalles = hojaDetalle.getDataRange().getValues().slice(1);
    if (detalles.filter(function(fila) { return String(fila[0]).trim() === idVenta; }).length !== 1) {
      throw new Error('La venta no generó exactamente un detalle.');
    }
    const cuentasPorCobrar = hojaCpc.getDataRange().getValues().slice(1);
    if (cuentasPorCobrar.filter(function(fila) { return String(fila[1]).trim() === idVenta; }).length !== 1) {
      throw new Error('La venta no generó exactamente una cuenta por cobrar.');
    }

    const cancelacion = cancelarVentaV2_(ss, {
      id_venta: idVenta,
      fecha: fecha,
      motivo: 'Prueba de cancelación en copia'
    });
    if (!cancelacion || cancelacion.ok !== true) {
      throw new Error('La cancelación no respondió correctamente.');
    }

    const stockFinal = Number(hojaProductos.getRange(producto.fila, 6).getValue());
    if (stockFinal !== producto.stock) {
      throw new Error('El stock no volvió a su valor original.');
    }

    const ventas = hojaVentas.getDataRange().getValues();
    const colEstado = ventas[0].indexOf('Estado');
    const ventaFinal = ventas.slice(1).find(function(fila) { return String(fila[0]).trim() === idVenta; });
    if (!ventaFinal || String(ventaFinal[colEstado]).toLowerCase() !== 'cancelada') {
      throw new Error('La venta no quedó cancelada.');
    }

    let dobleCancelacionRechazada = false;
    try {
      cancelarVentaV2_(ss, {id_venta: idVenta, fecha: fecha, motivo: 'Reintento de prueba'});
    } catch (error) {
      dobleCancelacionRechazada = /ya se encuentra cancelada/i.test(String(error.message || error));
    }
    if (!dobleCancelacionRechazada) {
      throw new Error('La segunda cancelación no fue rechazada.');
    }

    Logger.log('OK: venta, cuenta por cobrar y cancelación; stock restaurado una sola vez.');
  } catch (error) {
    Logger.log('FALLÓ la prueba. ID de venta para revisar en la COPIA: ' + (idVenta || 'sin ID'));
    throw error;
  }
}
