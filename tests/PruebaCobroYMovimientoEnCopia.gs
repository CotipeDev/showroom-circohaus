/**
 * @OnlyCurrentDoc
 */
// Sólo para la planilla de pruebas. Crea una venta en efectivo y la cancela.
function probarCobroYMovimientoEnCopia() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss || !/pruebas de producci[oó]n/i.test(ss.getName())) {
    throw new Error('Detenido: no es la planilla de pruebas.');
  }

  const shProductos = ss.getSheetByName('Productos');
  const shTarifas = ss.getSheetByName('Tarifas_Cobro');
  const shPagos = ss.getSheetByName('Pagos_Venta');
  const shMovimientos = ss.getSheetByName('Movimientos');
  if (!shProductos || !shTarifas || !shPagos || !shMovimientos) {
    throw new Error('Falta una hoja necesaria para la prueba.');
  }

  const productos = shProductos.getDataRange().getValues();
  let producto = null;
  for (let i = 1; i < productos.length; i++) {
    const fila = productos[i];
    if (String(fila[0] || '').trim() && Number(fila[3]) > 0 &&
        Number(fila[4]) >= 0 && Number(fila[5]) >= 1) {
      producto = {
        fila: i + 1,
        codigo: String(fila[0]).trim(),
        precio: Math.round(Number(fila[3])),
        stock: Number(fila[5])
      };
      break;
    }
  }
  if (!producto) throw new Error('No hay un producto apto para la prueba.');

  const tarifas = datosPorEncabezadoCobroV2_(shTarifas).filas;
  const tarifa = tarifas.find(function(item) {
    return activoCobroV2_(item.Activo) &&
      String(item.Canal || '').trim().toLowerCase() === 'efectivo' &&
      String(item.ID_Tarifa || '').trim() &&
      String(item.ID_Cuenta || '').trim();
  });
  if (!tarifa) throw new Error('No hay una tarifa activa de efectivo.');

  const fecha = new Date().toISOString().slice(0, 10);
  let idVenta = '';
  try {
    const venta = registrarVentaV2_(ss, {
      fecha: fecha,
      tipo: 'venta',
      notas: 'PRUEBA EN COPIA - cobro y movimiento',
      items: [{codigo: producto.codigo, cantidad: 1}],
      pagos: [{id_tarifa: String(tarifa.ID_Tarifa).trim(), base_asignada: producto.precio}],
      rol_sesion: 'administrador',
      usuario_sesion: 'PRUEBA_COPIA',
      confirmar_margen_bajo: true,
      canal_venta: 'Local / presencial'
    });
    idVenta = String(venta && (venta.id || venta.id_venta) || '').trim();
    if (!idVenta) throw new Error('La venta no devolvió ID.');

    const stockVendido = Number(shProductos.getRange(producto.fila, 6).getValue());
    if (stockVendido !== producto.stock - 1) {
      throw new Error('La venta no descontó una unidad de stock.');
    }

    const pagos = shPagos.getDataRange().getValues();
    const pagoVenta = pagos.slice(1).filter(function(fila) {
      return String(fila[0] || '').trim() === idVenta;
    });
    if (pagoVenta.length !== 1) throw new Error('La venta no generó exactamente un pago.');

    const movimientos = shMovimientos.getDataRange().getValues();
    const movimientoVenta = movimientos.slice(1).filter(function(fila) {
      return String(fila[7] || '').trim() === idVenta &&
        String(fila[8] || '').trim() === 'venta_v2';
    });
    if (movimientoVenta.length !== 1 ||
        String(movimientoVenta[0][2] || '').trim() !== String(tarifa.ID_Cuenta).trim() ||
        Number(movimientoVenta[0][5]) !== Number(venta.neto_esperado)) {
      throw new Error('El movimiento no coincide con la cuenta y el neto esperado.');
    }

    const cancelacion = cancelarVentaV2_(ss, {
      id_venta: idVenta,
      fecha: fecha,
      motivo: 'Prueba de cobro y cancelación en copia'
    });
    if (!cancelacion || cancelacion.ok !== true) {
      throw new Error('La cancelación no respondió correctamente.');
    }
    if (Number(shProductos.getRange(producto.fila, 6).getValue()) !== producto.stock) {
      throw new Error('El stock no fue restaurado.');
    }

    const movimientosFinales = shMovimientos.getDataRange().getValues().slice(1);
    const original = movimientosFinales.filter(function(fila) {
      return String(fila[7] || '').trim() === idVenta &&
        String(fila[8] || '').trim() === 'venta_v2';
    });
    const reversion = movimientosFinales.filter(function(fila) {
      return String(fila[7] || '').trim() === idVenta &&
        String(fila[8] || '').trim() === 'cancelacion_venta_v2';
    });
    if (original.length !== 1 || Number(original[0][5]) !== 0 || reversion.length !== 1) {
      throw new Error('El movimiento no quedó neutralizado con su reversión de auditoría.');
    }

    Logger.log('OK: cobro, pago y movimiento registrados; cancelación y stock correctos.');
  } catch (error) {
    Logger.log('FALLÓ la prueba. ID de venta para revisar en la COPIA: ' + (idVenta || 'sin ID'));
    throw error;
  }
}
