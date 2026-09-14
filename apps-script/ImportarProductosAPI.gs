// Alta masiva de productos nuevos. No modifica productos existentes.
function importarProductosSeguros_(ss, body, sesion) {
  if (String(sesion && sesion.rol || '').trim().toLowerCase() !== 'administrador') {
    throw new Error('Solo una administradora puede importar productos.');
  }
  const entrada = body && body.productos;
  if (!Array.isArray(entrada) || !entrada.length || entrada.length > 500) {
    throw new Error('Seleccioná entre 1 y 500 productos.');
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const hoja = ss.getSheetByName('Productos');
    const historial = ss.getSheetByName('Historial_Costos');
    const proveedores = ss.getSheetByName('Proveedores');
    const categorias = ss.getSheetByName('Categorias');
    if (!hoja || !historial || !proveedores || !categorias) throw new Error('Falta una hoja necesaria para importar.');
    const codigos = new Set(hoja.getDataRange().getValues().slice(1).map(function(r) { return String(r[0] || '').trim().toLowerCase(); }));
    const proveedoresValidos = new Set(proveedores.getDataRange().getValues().slice(1).map(function(r) { return String(r[0] || '').trim().toLowerCase(); }));
    const categoriasValidas = new Set(categorias.getDataRange().getValues().slice(1).map(function(r) { return String(r[0] || '').trim().toLowerCase(); }));
    const nuevos = [], filasHistorial = [];
    let omitidos = 0;
    const fecha = new Date().toISOString();
    const estados = ['activo', 'no_reponer', 'discontinuado', 'estacional', 'liquidacion'];
    entrada.forEach(function(p, i) {
      const numeroFila = i + 2;
      const codigo = String(p.codigo || '').trim();
      const descripcion = String(p.descripcion || '').trim();
      const proveedor = String(p.proveedor || '').trim();
      const categoria = String(p.categoria || '').trim();
      const estado = String(p.estado_comercial || 'activo').trim().toLowerCase();
      const costo = Number(p.precio_costo);
      const precio = Number(p.precio_venta);
      const stock = Number(p.stock);
      const minimo = Number(p.stock_minimo || 0);
      if (!codigo || codigo.length > 80 || !descripcion || descripcion.length > 250 || /^[=+@-]/.test(codigo) || /^[=+@]/.test(descripcion)) {
        throw new Error('Fila ' + numeroFila + ': código o descripción inválidos.');
      }
      if (!isFinite(costo) || costo <= 0 || costo > 1000000000000 || !isFinite(precio) || precio <= 0 || precio > 1000000000000) throw new Error('Fila ' + numeroFila + ': costo o precio inválido.');
      if (p.stock === null || p.stock === '' || !Number.isInteger(stock) || stock < 0 || stock > 1000000000 || !Number.isInteger(minimo) || minimo < 0 || minimo > 1000000000) throw new Error('Fila ' + numeroFila + ': stock inválido.');
      if (proveedor && !proveedoresValidos.has(proveedor.toLowerCase())) throw new Error('Fila ' + numeroFila + ': proveedor no registrado.');
      if (categoria && !categoriasValidas.has(categoria.toLowerCase())) throw new Error('Fila ' + numeroFila + ': categoría no registrada.');
      if (estados.indexOf(estado) < 0) throw new Error('Fila ' + numeroFila + ': estado comercial inválido.');
      const clave = codigo.toLowerCase();
      if (codigos.has(clave)) { omitidos++; return; }
      codigos.add(clave);
      const recargo = Math.round(((precio / costo) - 1) * 1000) / 10;
      const margenBruto = Math.round(((precio - costo) / precio) * 1000) / 10;
      nuevos.push([codigo, descripcion, proveedor, precio, costo, stock, minimo, categoria, recargo, estado]);
      filasHistorial.push([fecha, codigo, descripcion, 0, costo, 0, recargo, 0, precio, 0, margenBruto, 'alta_masiva']);
    });
    if (nuevos.length) {
      hoja.getRange(hoja.getLastRow() + 1, 1, nuevos.length, 10).setValues(nuevos);
      SpreadsheetApp.flush();
      historial.getRange(historial.getLastRow() + 1, 1, filasHistorial.length, 12).setValues(filasHistorial);
      SpreadsheetApp.flush();
    }
    return {ok: true, creados: nuevos.length, omitidos: omitidos};
  } finally {
    lock.releaseLock();
  }
}
