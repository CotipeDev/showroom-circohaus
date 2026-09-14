/**
 * @OnlyCurrentDoc
 */
// SÓLO en la planilla de pruebas. No emite ninguna factura en ARCA.
// Deja una venta de prueba facturada y activa en la copia para auditoría.
function probarFacturacionEnCopia() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss || !/pruebas de producci[oó]n/i.test(ss.getName())) {
    throw new Error('Detenido: no es la planilla de pruebas.');
  }

  const shProductos = ss.getSheetByName('Productos');
  const shClientes = ss.getSheetByName('Clientes');
  const shVentas = ss.getSheetByName('Ventas');
  const shFacturas = ss.getSheetByName('Facturas');
  if (!shProductos || !shClientes || !shVentas || !shFacturas) {
    throw new Error('Falta una hoja necesaria para la prueba.');
  }

  const productos = shProductos.getDataRange().getValues();
  const producto = productos.slice(1).find(function(fila) {
    return String(fila[0] || '').trim() && Number(fila[3]) > 0 &&
      Number(fila[4]) >= 0 && Number(fila[5]) >= 1;
  });
  const clientes = shClientes.getDataRange().getValues();
  const cliente = clientes.slice(1).find(function(fila) {
    return String(fila[0] || '').trim();
  });
  if (!producto || !cliente) {
    throw new Error('Se necesita un producto con stock y un cliente en la copia.');
  }

  const codigo = String(producto[0]).trim();
  const stockInicial = Number(producto[5]);
  const fecha = new Date().toISOString().slice(0, 10);
  const numero = 'PRUEBA-' + Date.now();
  let idVenta = '';

  try {
    const venta = registrarVentaV2_(ss, {
      fecha: fecha,
      tipo: 'cuenta_por_cobrar',
      id_cliente: String(cliente[0]).trim(),
      notas: 'PRUEBA EN COPIA - factura ficticia, NO ARCA',
      items: [{codigo: codigo, cantidad: 1}],
      pagos: [],
      rol_sesion: 'administrador',
      usuario_sesion: 'PRUEBA_COPIA',
      confirmar_margen_bajo: true,
      canal_venta: 'Local / presencial'
    });
    idVenta = String(venta && (venta.id || venta.id_venta) || '').trim();
    if (!idVenta) throw new Error('La venta no devolvió ID.');

    const sesion = {rol: 'administrador', usuario: 'PRUEBA_COPIA'};
    const body = {id_venta: idVenta, nro_factura: numero, fecha: fecha};
    const primera = registrarFacturaVentaSegura_(ss, body, sesion);
    const reintento = registrarFacturaVentaSegura_(ss, body, sesion);
    if (!primera.ok || primera.existente || !reintento.ok || !reintento.existente ||
        String(primera.id) !== String(reintento.id)) {
      throw new Error('El reintento no conservó la misma factura.');
    }

    let bloqueo = false;
    try {
      cancelarVentaV2_(ss, {id_venta: idVenta, fecha: fecha});
    } catch (error) {
      bloqueo = /facturad|factura registrada/i.test(String(error.message || ''));
      if (!bloqueo) throw error;
    }
    if (!bloqueo) throw new Error('La app permitió cancelar una venta facturada.');

    const stockFinal = Number(shProductos.getDataRange().getValues()
      .slice(1).find(function(fila) { return String(fila[0]).trim() === codigo; })[5]);
    if (stockFinal !== stockInicial - 1) {
      throw new Error('El intento de cancelación modificó el stock.');
    }
    const ventas = shVentas.getDataRange().getValues();
    const filaVenta = ventas.slice(1).find(function(fila) {
      return String(fila[0]).trim() === idVenta;
    });
    if (!filaVenta || String(filaVenta[7]).toLowerCase() === 'cancelada') {
      throw new Error('La venta facturada quedó cancelada.');
    }
    const cantidadFacturas = shFacturas.getDataRange().getValues().slice(1)
      .filter(function(fila) { return String(fila[3]).trim() === idVenta; }).length;
    if (cantidadFacturas !== 1) throw new Error('La factura se duplicó.');

    Logger.log('OK: factura ficticia registrada una vez; venta facturada no cancelable y stock intacto.');
    Logger.log('Venta de prueba ' + idVenta + ' y número ' + numero + ' quedan en la COPIA; NO se emitió nada en ARCA.');
  } catch (error) {
    Logger.log('FALLÓ la prueba. Revisar en la COPIA la venta ' + (idVenta || 'sin ID') + '.');
    throw error;
  }
}
