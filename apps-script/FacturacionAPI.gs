// Registro seguro e idempotente de una factura ya emitida en ARCA.
// Este código NO emite comprobantes ante ARCA.

function registrarFacturaVentaSegura_(ss, body, sesion) {
  if (String(sesion && sesion.rol || '').trim().toLowerCase() !== 'administrador') {
    throw new Error('Solo una administradora puede registrar facturas.');
  }
  const idVenta = String(body.id_venta || '').trim();
  const numero = String(body.nro_factura || '').trim();
  const fecha = String(body.fecha || '').trim();
  if (!idVenta || !numero || numero.length > 80) throw new Error('Ingresá una venta y un número de factura válidos.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error('Ingresá la fecha de emisión.');
  const fechaObjeto = new Date(fecha + 'T00:00:00Z');
  if (isNaN(fechaObjeto.getTime()) || fechaObjeto.toISOString().slice(0, 10) !== fecha) throw new Error('Fecha de emisión inválida.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const hojaVentas = ss.getSheetByName('Ventas');
    const hojaFacturas = ss.getSheetByName('Facturas');
    if (!hojaVentas || !hojaFacturas) throw new Error('Falta la hoja Ventas o Facturas.');
    const ventas = hojaVentas.getDataRange().getValues();
    const facturas = hojaFacturas.getDataRange().getValues();
    const encabezados = (ventas[0] || []).map(function(h) { return String(h || '').trim(); });
    const colEstado = encabezados.indexOf('Estado') >= 0 ? encabezados.indexOf('Estado') : 7;
    const colFacturada = encabezados.indexOf('Facturada') >= 0 ? encabezados.indexOf('Facturada') : 9;
    const colTotalFinal = encabezados.indexOf('Total_Final');
    let iVenta = -1;
    for (let i = 1; i < ventas.length; i++) {
      if (String(ventas[i][0] || '').trim() === idVenta) { iVenta = i; break; }
    }
    if (iVenta < 0) throw new Error('No se encontró la venta.');
    const venta = ventas[iVenta];
    if (String(venta[colEstado] || '').trim().toLowerCase() === 'cancelada') throw new Error('No se puede facturar una venta cancelada.');
    const monto = colTotalFinal >= 0 && Number(venta[colTotalFinal]) > 0 ? Number(venta[colTotalFinal]) : Number(venta[5]);
    if (!isFinite(monto) || monto <= 0) throw new Error('La venta no tiene un total válido para facturar.');

    let existente = null;
    for (let i = 1; i < facturas.length; i++) {
      const f = facturas[i];
      if (String(f[3] || '').trim() === idVenta) existente = f;
      if (String(f[1] || '').trim().toLowerCase() === numero.toLowerCase() && String(f[3] || '').trim() !== idVenta) {
        throw new Error('Ese número de factura ya está asociado a otra venta.');
      }
    }
    if (existente) {
      if (String(existente[1] || '').trim().toLowerCase() !== numero.toLowerCase()) {
        throw new Error('Esta venta ya tiene otra factura registrada. Revisá el historial.');
      }
      // Reintento seguro: si una ejecución anterior guardó la factura pero no
      // llegó a marcar la venta, completa únicamente el paso pendiente.
      if (venta[colFacturada] !== true && String(venta[colFacturada]).toUpperCase() !== 'TRUE') {
        hojaVentas.getRange(iVenta + 1, colFacturada + 1).setValue(true);
        SpreadsheetApp.flush();
      }
      return {ok: true, id: String(existente[0]), existente: true, monto: Number(existente[4]) || monto};
    }

    const idFactura = 'FCT-' + new Date().getTime() + '-' + Utilities.getUuid().slice(0, 6);
    hojaFacturas.appendRow([idFactura, numero, fecha, idVenta, monto, 'emitida']);
    SpreadsheetApp.flush();
    // Si este paso falla, la factura ya guardada permite reintentar con el
    // mismo número sin duplicarla; no borramos un comprobante registrado.
    hojaVentas.getRange(iVenta + 1, colFacturada + 1).setValue(true);
    SpreadsheetApp.flush();
    return {ok: true, id: idFactura, existente: false, monto: monto};
  } finally {
    lock.releaseLock();
  }
}
