function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const action = e.parameter.action;
  try {

    if (action === 'getProductos') {
      return jsonResponse(ss.getSheetByName('Productos').getDataRange().getValues());
    }
    if (action === 'getProveedores') {
      return jsonResponse(ss.getSheetByName('Proveedores').getDataRange().getValues());
    }
    if (action === 'getIngresos') {
      return jsonResponse(ss.getSheetByName('Ingresos').getDataRange().getValues());
    }
    if (action === 'getCategorias') {
      return jsonResponse(ss.getSheetByName('Categorias').getDataRange().getValues());
    }

    if (action === 'agregarProveedor') {
      const b = JSON.parse(e.postData.contents);
      ss.getSheetByName('Proveedores').appendRow([b.codigo, b.nombre, b.contacto]);
      return jsonResponse({ ok: true });
    }

    if (action === 'agregarCategoria') {
      const b = JSON.parse(e.postData.contents);
      ss.getSheetByName('Categorias').appendRow([b.nombre]);
      return jsonResponse({ ok: true });
    }

    if (action === 'agregarProducto') {
      const b = JSON.parse(e.postData.contents);
      ss.getSheetByName('Productos').appendRow([
        b.codigo, b.descripcion, b.proveedor, b.precio_venta,
        b.precio_costo, b.stock, b.stock_minimo || 0, b.categoria || ''
      ]);
      return jsonResponse({ ok: true });
    }

    if (action === 'editarProducto') {
      const b = JSON.parse(e.postData.contents);
      const sheet = ss.getSheetByName('Productos');
      const datos = sheet.getDataRange().getValues();
      for (let i = 1; i < datos.length; i++) {
        if (String(datos[i][0]).trim() === String(b.codigo).trim()) {
          sheet.getRange(i + 1, 2).setValue(b.descripcion);
          sheet.getRange(i + 1, 3).setValue(b.proveedor || '');
          sheet.getRange(i + 1, 4).setValue(b.precio_venta);
          sheet.getRange(i + 1, 5).setValue(b.precio_costo);
          sheet.getRange(i + 1, 7).setValue(b.stock_minimo || 0);
          sheet.getRange(i + 1, 8).setValue(b.categoria || '');
          break;
        }
      }
      return jsonResponse({ ok: true });
    }

    if (action === 'eliminarProducto') {
      const b = JSON.parse(e.postData.contents);
      const sheet = ss.getSheetByName('Productos');
      const datos = sheet.getDataRange().getValues();
      for (let i = 1; i < datos.length; i++) {
        if (String(datos[i][0]).trim() === String(b.codigo).trim()) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
      return jsonResponse({ ok: true });
    }

    if (action === 'registrarIngreso') {
      const b = JSON.parse(e.postData.contents);
      const ssIngresos = ss.getSheetByName('Ingresos');
      const ssDetalle = ss.getSheetByName('Detalle_Ingresos');
      const ssProductos = ss.getSheetByName('Productos');
      const id = 'ING-' + new Date().getTime();
      ssIngresos.appendRow([id, b.fecha, b.proveedor, b.nro_remito || '']);
      b.items.forEach(function(item) {
        ssDetalle.appendRow([id, item.codigo, item.cantidad, item.precio_costo]);
        const datos = ssProductos.getDataRange().getValues();
        for (let i = 1; i < datos.length; i++) {
          if (String(datos[i][0]).trim() === String(item.codigo).trim()) {
            ssProductos.getRange(i + 1, 6).setValue((Number(datos[i][5]) || 0) + Number(item.cantidad));
            break;
          }
        }
      });
      return jsonResponse({ ok: true, id: id });
    }

    return jsonResponse({ error: 'Accion no reconocida' });

  } catch(err) {
    return jsonResponse({ error: err.message });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
