/**
 * @OnlyCurrentDoc
 */
// SÓLO en la planilla de pruebas. Deja un producto de prueba en la copia.
function probarImportacionEnCopia() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss || !/pruebas de producci[oó]n/i.test(ss.getName())) {
    throw new Error('Detenido: no es la planilla de pruebas.');
  }

  const productos = ss.getSheetByName('Productos');
  const historial = ss.getSheetByName('Historial_Costos');
  if (!productos || !historial || !ss.getSheetByName('Proveedores') ||
      !ss.getSheetByName('Categorias')) {
    throw new Error('Falta una hoja necesaria para la prueba.');
  }

  const codigo = 'PRUEBA-MASIVA-' + Date.now();
  const nuevo = {
    codigo: codigo,
    descripcion: 'PRUEBA EN COPIA - producto importado',
    proveedor: '',
    categoria: '',
    precio_costo: 100,
    precio_venta: 200,
    stock: 2,
    stock_minimo: 1,
    estado_comercial: 'activo'
  };
  const sesion = {rol: 'administrador'};
  const contar = function(hoja) { return hoja.getDataRange().getValues().length; };
  const antesProductos = contar(productos);
  const antesHistorial = contar(historial);

  // Una fila inválida debe rechazar todo el lote antes de escribir.
  let rechazo = false;
  try {
    importarProductosSeguros_(ss, {productos: [nuevo, Object.assign({}, nuevo, {
      codigo: codigo + '-INVALIDO', precio_venta: -1
    })]}, sesion);
  } catch (error) {
    rechazo = /precio inv[aá]lido/i.test(String(error.message || ''));
    if (!rechazo) throw error;
  }
  if (!rechazo || contar(productos) !== antesProductos ||
      contar(historial) !== antesHistorial) {
    throw new Error('El lote inválido modificó las hojas.');
  }

  let resultado = null;
  try {
    resultado = importarProductosSeguros_(ss, {productos: [nuevo]}, sesion);
    if (!resultado.ok || resultado.creados !== 1 || resultado.omitidos !== 0) {
      throw new Error('El producto nuevo no se creó exactamente una vez.');
    }
    const repetido = importarProductosSeguros_(ss, {productos: [nuevo]}, sesion);
    if (!repetido.ok || repetido.creados !== 0 || repetido.omitidos !== 1) {
      throw new Error('El código repetido no fue omitido.');
    }

    const filas = productos.getDataRange().getValues().slice(1)
      .filter(function(fila) { return String(fila[0]).trim() === codigo; });
    const costos = historial.getDataRange().getValues().slice(1)
      .filter(function(fila) { return String(fila[1]).trim() === codigo; });
    if (filas.length !== 1 || Number(filas[0][5]) !== 2 ||
        costos.length !== 1 || String(costos[0][11]) !== 'alta_masiva') {
      throw new Error('Producto, stock o historial de costos incorrectos.');
    }
    if (contar(productos) !== antesProductos + 1 ||
        contar(historial) !== antesHistorial + 1) {
      throw new Error('Se escribieron filas adicionales inesperadas.');
    }

    let permisoDenegado = false;
    try {
      importarProductosSeguros_(ss, {productos: [Object.assign({}, nuevo, {
        codigo: codigo + '-VENDEDOR'
      })]}, {rol: 'vendedor'});
    } catch (error) {
      permisoDenegado = /administradora/i.test(String(error.message || ''));
      if (!permisoDenegado) throw error;
    }
    if (!permisoDenegado || contar(productos) !== antesProductos + 1) {
      throw new Error('La importación no respetó el permiso de administrador.');
    }

    Logger.log('OK: lote inválido sin cambios; producto creado una vez, duplicado omitido y vendedor sin permiso.');
    Logger.log('El producto ' + codigo + ' queda sólo en la COPIA con stock 2.');
  } catch (error) {
    Logger.log('FALLÓ la prueba. Revisar en la COPIA el código ' + codigo + '.');
    throw error;
  }
}
