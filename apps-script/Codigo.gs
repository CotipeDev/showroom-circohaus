function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }
 
function handleRequest(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const action = String(e.parameter.action || '').trim();

  let body = {};

  if (e.postData && e.postData.contents) {
    try {
      body = JSON.parse(e.postData.contents);
    } catch (error) {
      body = {};
    }
  }

  try {
    if (action === 'login') {
      return jsonResponse(
        iniciarSesionSegura_(
          ss,
          body.usuario,
          body.password
        )
      );
    }

    const token = String(
      body.token ||
      e.parameter.token ||
      ''
    ).trim();

    if (action === 'logout') {
      return jsonResponse(
        cerrarSesionSegura_(token)
      );
    }

    const sesion =
      obtenerSesionSegura_(token);

    autorizarAccionSegura_(
      sesion,
      action
    );

    if (action === 'getUsuarios') {
      return jsonResponse(usuariosListarSeguro_(ss, sesion));
    }
    if (action === 'crearUsuario') {
      return jsonResponse(usuariosCrearSeguro_(ss, sesion, body));
    }
    if (action === 'cambiarEstadoUsuario') {
      return jsonResponse(usuariosCambiarEstadoSeguro_(ss, sesion, body));
    }
    if (action === 'restablecerClaveUsuario') {
      return jsonResponse(usuariosRestablecerClaveSeguro_(ss, sesion, body));
    }

    if (action === 'editarUsuario') {
      return jsonResponse(usuariosEditarSeguro_(ss, sesion, body));
    }
    if (action === 'cambiarClavePropia') {
      return jsonResponse(usuariosCambiarClavePropiaSeguro_(ss, sesion, body));
    }

    if (
  String(sesion.rol || '')
    .trim()
    .toLowerCase() === 'vendedor'
) {
  const respuestaVendedor =
    respuestaSeguraVendedor_(
      ss,
      action
    );

  if (respuestaVendedor.atendida) {
    return jsonResponse(
      respuestaVendedor.datos
    );
  }
}
 
    if (action === 'getProductos') { return jsonResponse(ss.getSheetByName('Productos').getDataRange().getValues()); }
    if (action === 'getProveedores') { return jsonResponse(ss.getSheetByName('Proveedores').getDataRange().getValues()); }
    if (action === 'getIngresos') { return jsonResponse(ss.getSheetByName('Ingresos').getDataRange().getValues()); }
    if (action === 'getDetalleIngresos') {
      const sheet = ss.getSheetByName('Detalle_Ingresos');
      return jsonResponse(sheet ? sheet.getDataRange().getValues() : []);
    }
    if (action === 'getCategorias') { return jsonResponse(ss.getSheetByName('Categorias').getDataRange().getValues()); }
    if (action === 'getHistorialCostos') { return jsonResponse(ss.getSheetByName('Historial_Costos').getDataRange().getValues()); }
    if (action === 'getCuentas') { return jsonResponse(ss.getSheetByName('Cuentas').getDataRange().getValues()); }

    if (action === 'getProcesadoresCobro') {
      const sheet = ss.getSheetByName('Procesadores_Cobro');

      return jsonResponse(
        sheet
        ? sheet.getDataRange().getValues()
        : []
      );
    }

    if (action === 'getTarifasCobro') {
      const sheet = ss.getSheetByName('Tarifas_Cobro');

      return jsonResponse(
        sheet
        ? sheet.getDataRange().getValues()
        : []
      );
    }

    if (action === 'eliminarTarifaCobro') {
      return jsonResponse(
        eliminarTarifaCobroSegura_(
        ss,
        body.id_tarifa
        )
      );
    }

    if (action === 'getPlanesCuotas') {
      const sheet = ss.getSheetByName('Planes_Cuotas');

      return jsonResponse(
      sheet
        ? sheet.getDataRange().getValues()
        : []
      );
    }

    if (action === 'getHistorialTarifasCobro') {
      const sheet =
        ss.getSheetByName('Historial_Tarifas_Cobro');

      return jsonResponse(
        sheet
        ? sheet.getDataRange().getValues()
        : []
      );
    }

    if (action === 'getHistorialPlanesCuotas') {
      const sheet =
        ss.getSheetByName('Historial_Planes_Cuotas');

      return jsonResponse(
        sheet
        ? sheet.getDataRange().getValues()
        : []
      );
    }
   
    if (action === 'getClientes') { return jsonResponse(ss.getSheetByName('Clientes').getDataRange().getValues()); }
    if (action === 'getVentas') { return jsonResponse(ss.getSheetByName('Ventas').getDataRange().getValues()); }
    if (action === 'getDetalleVentas') { return jsonResponse(ss.getSheetByName('Detalle_Ventas').getDataRange().getValues()); }
    if (action === 'getPagosVenta') { return jsonResponse(ss.getSheetByName('Pagos_Venta').getDataRange().getValues()); }
    if (action === 'getCuentasPorCobrar') { return jsonResponse(ss.getSheetByName('Cuentas_Por_Cobrar').getDataRange().getValues()); }
    if (action === 'getMovimientos') { return jsonResponse(ss.getSheetByName('Movimientos').getDataRange().getValues()); }
    if (action === 'getCategoriasMovimientos') { return jsonResponse(ss.getSheetByName('Categorias_Movimientos').getDataRange().getValues()); }
    if (action === 'getFacturas') {
      const sheet = ss.getSheetByName('Facturas');
      return jsonResponse(sheet ? sheet.getDataRange().getValues() : []);
    }
 
    if (action === 'getDatosCompletos') {
      const hojas = [
      'Productos',
      'Proveedores',
      'Categorias',
      'Procesadores_Cobro',
      'Tarifas_Cobro',
      'Planes_Cuotas',
      'Historial_Tarifas_Cobro',
      'Historial_Planes_Cuotas',
      'Cuentas',
      'Clientes',
      'Ventas',
      'Detalle_Ventas',
      'Pagos_Venta',
      'Cuentas_Por_Cobrar',
      'Movimientos',
      'Categorias_Movimientos',
      'Ingresos',
      'Detalle_Ingresos',
      'Historial_Costos'
    ];
      const resultado = {};
      hojas.forEach(function(nombre) {
        try {
          const sheet = ss.getSheetByName(nombre);
          resultado[nombre] = sheet ? sheet.getDataRange().getValues() : [];
        } catch(e) { resultado[nombre] = []; }
      });
      return jsonResponse(resultado);
    }
 
    if (action === 'agregarProveedor') {
      const b = JSON.parse(e.postData.contents);
      ss.getSheetByName('Proveedores').appendRow([b.codigo, b.nombre, b.contacto]);
      return jsonResponse({ ok: true });
    }

    if (action === 'editarProveedor') {
  const codigo = String(body.codigo || '').trim();
  const nombre = String(body.nombre || '').trim();
  const contacto = String(body.contacto || '').trim();

  if (!codigo || !nombre) {
    throw new Error('Código y nombre son obligatorios');
  }

  const sh = ss.getSheetByName('Proveedores');

  if (!sh) {
    throw new Error('No existe la hoja Proveedores');
  }

  const datos = sh.getDataRange().getValues();
  let filaProveedor = -1;

  for (let i = 1; i < datos.length; i++) {
    const codigoFila = String(datos[i][0] || '').trim();

    if (codigoFila.toLowerCase() === codigo.toLowerCase()) {
      filaProveedor = i + 1;
      break;
    }
  }

  if (filaProveedor === -1) {
    throw new Error('No se encontró el proveedor');
  }

  sh.getRange(filaProveedor, 2, 1, 2).setValues([
    [nombre, contacto]
  ]);

  SpreadsheetApp.flush();

  return jsonResponse({
    ok: true,
    codigo: codigo,
    nombre: nombre,
    contacto: contacto
  });
}
 
    if (action === 'agregarCategoria') {
      const b = JSON.parse(e.postData.contents);
      ss.getSheetByName('Categorias').appendRow([b.nombre]);
      return jsonResponse({ ok: true });
    }

    if (action === 'editarCategoria') {
  const nombreAnterior = String(
    body.nombre_anterior || ''
  ).trim();

  const nombreNuevo = String(
    body.nombre_nuevo || ''
  ).trim();

  if (!nombreAnterior || !nombreNuevo) {
    throw new Error(
      'Completá el nombre anterior y el nuevo.'
    );
  }

  const normalizar = function(valor) {
    return String(valor || '')
      .trim()
      .toLowerCase();
  };

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const shCategorias =
      ss.getSheetByName('Categorias');

    const shProductos =
      ss.getSheetByName('Productos');

    if (!shCategorias || !shProductos) {
      throw new Error(
        'No se encontraron las hojas necesarias.'
      );
    }

    const categorias =
      shCategorias.getDataRange().getValues();

    let filaCategoria = -1;

    for (let i = 1; i < categorias.length; i++) {
      if (
        normalizar(categorias[i][0]) ===
        normalizar(nombreAnterior)
      ) {
        filaCategoria = i + 1;
        break;
      }
    }

    if (filaCategoria < 0) {
      throw new Error(
        'No se encontró la categoría original.'
      );
    }

    for (let i = 1; i < categorias.length; i++) {
      if (
        i + 1 !== filaCategoria &&
        normalizar(categorias[i][0]) ===
          normalizar(nombreNuevo)
      ) {
        throw new Error(
          'Ya existe una categoría con ese nombre.'
        );
      }
    }

    let productosActualizados = 0;
    const ultimaFilaProductos =
      shProductos.getLastRow();

    if (ultimaFilaProductos > 1) {
      const rangoCategorias =
        shProductos.getRange(
          2,
          8,
          ultimaFilaProductos - 1,
          1
        );

      const categoriasProductos =
        rangoCategorias.getValues();

      categoriasProductos.forEach(function(fila) {
        if (
          normalizar(fila[0]) ===
          normalizar(nombreAnterior)
        ) {
          fila[0] = nombreNuevo;
          productosActualizados++;
        }
      });

      rangoCategorias.setValues(
        categoriasProductos
      );
    }

    shCategorias
      .getRange(filaCategoria, 1)
      .setValue(nombreNuevo);

    SpreadsheetApp.flush();

    return jsonResponse({
      ok: true,
      nombre_anterior: nombreAnterior,
      nombre_nuevo: nombreNuevo,
      productos_actualizados:
        productosActualizados
    });

  } finally {
    lock.releaseLock();
  }
}
 
if (action === 'importarProductos') {
  return jsonResponse(
    importarProductosSeguros_(ss, body, sesion)
  );
}

if (action === 'agregarProducto') {
  const b =
    JSON.parse(
      e.postData.contents
    );

  const sheetProductos =
    ss.getSheetByName(
      'Productos'
    );

  const sheetHist =
    ss.getSheetByName(
      'Historial_Costos'
    );

  const recargo =
    Number(b.margen_pct) || 0;

  const precioCosto =
    Math.round(
      (
        Number(
          b.precio_costo
        ) || 0
      ) *
      100
    ) / 100;

  const precioVenta =
    b.precio_venta &&
    Number(b.precio_venta) > 0
      ? Math.round(
          Number(
            b.precio_venta
          )
        )
      : precioCosto > 0
        ? Math.round(
            precioCosto *
            (
              1 +
              recargo / 100
            )
          )
        : 0;

  const margenBruto =
    precioVenta > 0
      ? Math.round(
          (
            (
              precioVenta -
              precioCosto
            ) /
            precioVenta
          ) *
          1000
        ) / 10
      : 0;

sheetProductos.appendRow([
  b.codigo,
  b.descripcion,
  b.proveedor || '',
  precioVenta,
  precioCosto,
  Number(b.stock) || 0,
  Number(b.stock_minimo) || 0,
  b.categoria || '',
  recargo,
  String(
    b.estado_comercial ||
    'activo'
  )
    .trim()
    .toLowerCase()
]);

  sheetHist.appendRow([
    new Date().toISOString(),
    b.codigo,
    b.descripcion,
    0,
    precioCosto,
    0,
    recargo,
    0,
    precioVenta,
    0,
    margenBruto,
    'alta_producto'
  ]);

  return jsonResponse({
    ok: true
  });
}
 
if (action === 'editarProducto') {
  const b = JSON.parse(e.postData.contents);
  const sheet = ss.getSheetByName('Productos');
  const sheetHist = ss.getSheetByName('Historial_Costos');
  const datos = sheet.getDataRange().getValues();

  for (let i = 1; i < datos.length; i++) {
    if (
      String(datos[i][0]).trim() ===
      String(b.codigo).trim()
    ) {
      const costoAnterior =
        Number(datos[i][4]) || 0;

      const precioAnterior =
        Number(datos[i][3]) || 0;

      const recargoAnterior =
        Number(datos[i][8]) ||
        (
          costoAnterior > 0 &&
          precioAnterior > 0
            ? Math.round(
                (
                  (
                    precioAnterior /
                    costoAnterior
                  ) -
                  1
                ) *
                1000
              ) / 10
            : 0
        );

      const costoNuevo =
        Math.round(
          (Number(b.precio_costo) || 0) *
          100
        ) / 100;

      const recargoNuevo =
        Number(b.margen_pct) || 0;

      const precioNuevo =
        b.precio_venta &&
        Number(b.precio_venta) > 0
          ? Math.round(
              Number(b.precio_venta)
            )
          : costoNuevo > 0
            ? Math.round(
                costoNuevo *
                (
                  1 +
                  recargoNuevo / 100
                )
              )
            : 0;

      const margenBrutoAnterior =
        precioAnterior > 0
          ? Math.round(
              (
                (
                  precioAnterior -
                  costoAnterior
                ) /
                precioAnterior
              ) *
              1000
            ) / 10
          : 0;

      const margenBrutoNuevo =
        precioNuevo > 0
          ? Math.round(
              (
                (
                  precioNuevo -
                  costoNuevo
                ) /
                precioNuevo
              ) *
              1000
            ) / 10
          : 0;

      const cambioEconomico =
        costoAnterior !== costoNuevo ||
        precioAnterior !== precioNuevo ||
        recargoAnterior !== recargoNuevo;

      if (cambioEconomico) {
        sheetHist.appendRow([
          new Date().toISOString(),
          b.codigo,
          b.descripcion,
          costoAnterior,
          costoNuevo,
          recargoAnterior,
          recargoNuevo,
          precioAnterior,
          precioNuevo,
          margenBrutoAnterior,
          margenBrutoNuevo,
          'edicion_manual'
        ]);
      }

      sheet
        .getRange(i + 1, 2)
        .setValue(b.descripcion);

      sheet
        .getRange(i + 1, 3)
        .setValue(b.proveedor || '');

      sheet
        .getRange(i + 1, 4)
        .setValue(precioNuevo);

      sheet
        .getRange(i + 1, 5)
        .setValue(costoNuevo);

      sheet
        .getRange(i + 1, 7)
        .setValue(b.stock_minimo || 0);

      sheet
        .getRange(i + 1, 8)
        .setValue(b.categoria || '');

      sheet
        .getRange(i + 1, 9)
        .setValue(recargoNuevo);

      const estadosPermitidos = [
        'activo',
        'no_reponer',
        'discontinuado',
        'estacional',
        'liquidacion'
      ];

      const estadoComercial =
        String(
          b.estado_comercial ||
          datos[i][9] ||
          'activo'
        )
        .trim()
        .toLowerCase();

      sheet
        .getRange(i + 1, 10)
        .setValue(
          estadosPermitidos.indexOf(
            estadoComercial
          ) !== -1
            ? estadoComercial
            : 'activo'
      ); 

      break;
    }
  }

  return jsonResponse({
    ok: true
  });
}


 
    if (action === 'eliminarProducto') {
      const b = JSON.parse(e.postData.contents);
      const sheet = ss.getSheetByName('Productos');
      const datos = sheet.getDataRange().getValues();
      for (let i = 1; i < datos.length; i++) {
        if (String(datos[i][0]).trim() === String(b.codigo).trim()) {
          sheet.deleteRow(i + 1); break;
        }
      }
      return jsonResponse({ ok: true });
    }
 

if (action === 'actualizarCosto') {
  const b = JSON.parse(e.postData.contents);
  const sheetProd =
    ss.getSheetByName('Productos');

  const sheetHist =
    ss.getSheetByName(
      'Historial_Costos'
    );

  const datos =
    sheetProd
      .getDataRange()
      .getValues();

  for (
    let i = 1;
    i < datos.length;
    i++
  ) {
    if (
      String(datos[i][0]).trim() ===
      String(b.codigo).trim()
    ) {
      const costoAnterior =
        Number(datos[i][4]) || 0;

      const precioAnterior =
        Number(datos[i][3]) || 0;

      const recargoAnterior =
        Number(datos[i][8]) ||
        (
          costoAnterior > 0 &&
          precioAnterior > 0
            ? Math.round(
                (
                  (
                    precioAnterior /
                    costoAnterior
                  ) -
                  1
                ) *
                1000
              ) / 10
            : 0
        );

      const costoNuevo =
        Math.round(
          (
            Number(
              b.nuevo_costo
            ) || 0
          ) *
          100
        ) / 100;

      const precioNuevo =
        Math.round(
          Number(
            b.nuevo_precio_venta
          ) || 0
        );

      const recargoNuevo =
        Number(
          b.nuevo_margen
        ) || 0;

      const margenBrutoAnterior =
        precioAnterior > 0
          ? Math.round(
              (
                (
                  precioAnterior -
                  costoAnterior
                ) /
                precioAnterior
              ) *
              1000
            ) / 10
          : 0;

      const margenBrutoNuevo =
        precioNuevo > 0
          ? Math.round(
              (
                (
                  precioNuevo -
                  costoNuevo
                ) /
                precioNuevo
              ) *
              1000
            ) / 10
          : 0;

      const cambioEconomico =
        costoAnterior !== costoNuevo ||
        precioAnterior !== precioNuevo ||
        recargoAnterior !==
          recargoNuevo;

      if (cambioEconomico) {
        sheetHist.appendRow([
          b.fecha ||
            new Date()
              .toISOString(),
          b.codigo,
          datos[i][1],
          costoAnterior,
          costoNuevo,
          recargoAnterior,
          recargoNuevo,
          precioAnterior,
          precioNuevo,
          margenBrutoAnterior,
          margenBrutoNuevo,
          'ingreso_mercaderia'
        ]);
      }

      sheetProd
        .getRange(i + 1, 5)
        .setValue(costoNuevo);

      sheetProd
        .getRange(i + 1, 4)
        .setValue(precioNuevo);

      sheetProd
        .getRange(i + 1, 9)
        .setValue(recargoNuevo);

      break;
    }
  }

  return jsonResponse({
    ok: true
  });
}

 
    // ── NUEVO: eliminar ingreso ──
if (action === 'cancelarIngreso') {
  const b =
    JSON.parse(
      e.postData.contents
    );

  const idIngreso =
    String(
      b.id_ingreso || ''
    ).trim();

  if (!idIngreso) {
    throw new Error(
      'Falta el ID del ingreso.'
    );
  }

  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const sheetIng =
      ss.getSheetByName(
        'Ingresos'
      );

    const sheetDet =
      ss.getSheetByName(
        'Detalle_Ingresos'
      );

    const sheetProd =
      ss.getSheetByName(
        'Productos'
      );

    const datosIng =
      sheetIng
        .getDataRange()
        .getValues();

    let filaIngreso = -1;

    for (
      let i = 1;
      i < datosIng.length;
      i++
    ) {
      if (
        String(
          datosIng[i][0]
        ).trim() === idIngreso
      ) {
        filaIngreso = i + 1;

        const estadoActual =
          String(
            datosIng[i][4] || ''
          )
            .trim()
            .toLowerCase();

        if (
          estadoActual ===
          'cancelada'
        ) {
          throw new Error(
            'Este ingreso ya está cancelado.'
          );
        }

        break;
      }
    }

    if (filaIngreso < 0) {
      throw new Error(
        'No se encontró el ingreso.'
      );
    }

    const datosDet =
      sheetDet
        .getDataRange()
        .getValues();

    const cantidades = {};

    for (
      let i = 1;
      i < datosDet.length;
      i++
    ) {
      if (
        String(
          datosDet[i][0]
        ).trim() === idIngreso
      ) {
        const codigo =
          String(
            datosDet[i][1]
          ).trim();

        const cantidad =
          Number(
            datosDet[i][2]
          ) || 0;

        cantidades[codigo] =
          (
            cantidades[codigo] ||
            0
          ) +
          cantidad;
      }
    }

    const codigos =
      Object.keys(cantidades);

    if (!codigos.length) {
      throw new Error(
        'El ingreso no tiene productos asociados.'
      );
    }

    const datosProd =
      sheetProd
        .getDataRange()
        .getValues();

    const filasProducto = {};

    codigos.forEach(
      function(codigo) {
        for (
          let i = 1;
          i < datosProd.length;
          i++
        ) {
          if (
            String(
              datosProd[i][0]
            ).trim() === codigo
          ) {
            const stockActual =
              Number(
                datosProd[i][5]
              ) || 0;

            const cantidad =
              cantidades[codigo];

            if (
              stockActual <
              cantidad
            ) {
              throw new Error(
                'No se puede cancelar: ' +
                codigo +
                ' tiene stock ' +
                stockActual +
                ' y deberían retirarse ' +
                cantidad +
                '.'
              );
            }

            filasProducto[codigo] = {
              fila: i + 1,
              stockActual:
                stockActual
            };

            break;
          }
        }

        if (
          !filasProducto[codigo]
        ) {
          throw new Error(
            'No se encontró el producto ' +
            codigo +
            '.'
          );
        }
      }
    );

    codigos.forEach(
      function(codigo) {
        const producto =
          filasProducto[codigo];

        sheetProd
          .getRange(
            producto.fila,
            6
          )
          .setValue(
            producto.stockActual -
            cantidades[codigo]
          );
      }
    );

    sheetIng
      .getRange(
        filaIngreso,
        5
      )
      .setValue('cancelada');

    sheetIng
      .getRange(
        filaIngreso,
        6
      )
      .setValue(
        new Date()
          .toISOString()
      );

    sheetIng
      .getRange(
        filaIngreso,
        7
      )
      .setValue(
        b.motivo ||
        'Cancelación de ingreso'
      );

    return jsonResponse({
      ok: true,
      id_ingreso: idIngreso,
      estado: 'cancelada',
      stock_revertido:
        cantidades
    });

  } finally {
    lock.releaseLock();
  }
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
 
    if (action === 'agregarCuenta') {
      const b = JSON.parse(e.postData.contents);
      const id = 'CTA-' + new Date().getTime();
      ss.getSheetByName('Cuentas').appendRow([id, b.nombre, b.tipo, b.saldo_inicial || 0, true]);
      return jsonResponse({ ok: true, id: id });
    }
 
    if (action === 'editarCuenta') {
      const b = JSON.parse(e.postData.contents);
      const sheet = ss.getSheetByName('Cuentas');
      const datos = sheet.getDataRange().getValues();
      for (let i = 1; i < datos.length; i++) {
        if (String(datos[i][0]).trim() === String(b.id).trim()) {
          sheet.getRange(i + 1, 2).setValue(b.nombre);
          sheet.getRange(i + 1, 3).setValue(b.tipo);
          sheet.getRange(i + 1, 4).setValue(b.saldo_inicial || 0);
          sheet.getRange(i + 1, 5).setValue(b.activa !== undefined ? b.activa : true);
          break;
        }
      }
      return jsonResponse({ ok: true });
    }
 
if (action === 'eliminarCuenta') {
  return jsonResponse(
    eliminarCuentaSegura_(ss, body.id_cuenta)
  );
}

if (action === 'eliminarPlanCuotas') {
  return jsonResponse(
    eliminarPlanCuotasSeguro_(ss, body.id_plan)
  );
}

 
    if (action === 'agregarCliente') {
      const b = JSON.parse(e.postData.contents);
      const id = 'CLI-' + new Date().getTime();
      ss.getSheetByName('Clientes').appendRow([id, b.nombre, b.contacto || '', b.notas || '']);
      return jsonResponse({ ok: true, id: id });
    }
 
    if (action === 'editarCliente') {
      const b = JSON.parse(e.postData.contents);
      const sheet = ss.getSheetByName('Clientes');
      const datos = sheet.getDataRange().getValues();
      for (let i = 1; i < datos.length; i++) {
        if (String(datos[i][0]).trim() === String(b.id).trim()) {
          sheet.getRange(i + 1, 2).setValue(b.nombre);
          sheet.getRange(i + 1, 3).setValue(b.contacto || '');
          sheet.getRange(i + 1, 4).setValue(b.notas || '');
          break;
        }
      }
      return jsonResponse({ ok: true });
    }
 

 
    if (action === 'cancelarVenta') {
      const b = JSON.parse(e.postData.contents);
      const sheetVentas = ss.getSheetByName('Ventas');
      const sheetDetalle = ss.getSheetByName('Detalle_Ventas');
      const sheetProductos = ss.getSheetByName('Productos');
      const sheetMovs = ss.getSheetByName('Movimientos');
      const datosVentas = sheetVentas.getDataRange().getValues();
      for (let i = 1; i < datosVentas.length; i++) {
        if (String(datosVentas[i][0]).trim() === String(b.id_venta).trim()) {
          sheetVentas.getRange(i + 1, 8).setValue('cancelada'); break;
        }
      }
      const datosDetalle = sheetDetalle.getDataRange().getValues();
      const datosProductos = sheetProductos.getDataRange().getValues();
      for (let i = 1; i < datosDetalle.length; i++) {
        if (String(datosDetalle[i][0]).trim() === String(b.id_venta).trim()) {
          const codigo = datosDetalle[i][1], cantidad = Number(datosDetalle[i][2]);
          for (let j = 1; j < datosProductos.length; j++) {
            if (String(datosProductos[j][0]).trim() === String(codigo).trim()) {
              sheetProductos.getRange(j + 1, 6).setValue((Number(datosProductos[j][5]) || 0) + cantidad); break;
            }
          }
        }
      }
      const datosMovs = sheetMovs.getDataRange().getValues();
      for (let i = 1; i < datosMovs.length; i++) {
        if (String(datosMovs[i][7]).trim() === String(b.id_venta).trim()) {
          sheetMovs.getRange(i + 1, 6).setValue(0);
          sheetMovs.getRange(i + 1, 7).setValue('[CANCELADA] ' + datosMovs[i][6]);
        }
      }
      return jsonResponse({ ok: true });
    }
 
    if (action === 'registrarFacturaVenta') {
      return jsonResponse(
        registrarFacturaVentaSegura_(ss, body, sesion)
      );
    }

    if (action === 'marcarFacturada') {
      const b = JSON.parse(e.postData.contents);
      const sheet = ss.getSheetByName('Ventas');
      const datos = sheet.getDataRange().getValues();
      for (let i = 1; i < datos.length; i++) {
        if (String(datos[i][0]).trim() === String(b.id_venta).trim()) {
          sheet.getRange(i + 1, 10).setValue(true); break;
        }
      }
      return jsonResponse({ ok: true });
    }
 
    if (action === 'registrarFactura') {
      const b = JSON.parse(e.postData.contents);
      const sheet = ss.getSheetByName('Facturas');
      const id = 'FCT-' + new Date().getTime();
      sheet.appendRow([id, b.nro_factura, b.fecha, b.id_venta, b.monto, 'emitida']);
      return jsonResponse({ ok: true, id: id });
    }
 
    if (action === 'registrarCobroCPC') {
      const b = JSON.parse(e.postData.contents);
      const sheetCPC = ss.getSheetByName('Cuentas_Por_Cobrar');
      const sheetMovs = ss.getSheetByName('Movimientos');
      const datos = sheetCPC.getDataRange().getValues();
      for (let i = 1; i < datos.length; i++) {
        if (String(datos[i][0]).trim() === String(b.id_cpc).trim()) {
          const nuevoCobrado = (Number(datos[i][4]) || 0) + Number(b.monto);
          const nuevoSaldo = (Number(datos[i][3]) || 0) - nuevoCobrado;
          const nuevoEstado = nuevoSaldo > 0 ? 'cobrada_parcial' : nuevoSaldo < 0 ? 'a_favor' : 'cobrada';
          sheetCPC.getRange(i + 1, 5).setValue(nuevoCobrado);
          sheetCPC.getRange(i + 1, 6).setValue(nuevoSaldo);
          sheetCPC.getRange(i + 1, 7).setValue(nuevoEstado);
          const sheetClientes = ss.getSheetByName('Clientes');
          const datosClientes = sheetClientes.getDataRange().getValues();
          let nombreCliente = String(datos[i][2]);
          for (let j = 1; j < datosClientes.length; j++) {
            if (String(datosClientes[j][0]).trim() === nombreCliente) { nombreCliente = datosClientes[j][1]; break; }
          }
          sheetMovs.appendRow(['MOV-' + new Date().getTime(), b.fecha, b.id_cuenta,
            'ingreso', 'Cobro cuenta por cobrar', b.monto,
            'Cobro — ' + nombreCliente, b.id_cpc, 'cobro_cpc', b.fecha]);
          break;
        }
      }
      return jsonResponse({ ok: true });
    }
 
    if (action === 'registrarMovimiento') {
      const b = JSON.parse(e.postData.contents);
      ss.getSheetByName('Movimientos').appendRow([
        'MOV-' + new Date().getTime(), b.fecha, b.id_cuenta,
        b.tipo, b.categoria, b.monto, b.descripcion || '', '', 'manual', b.fecha]);
      return jsonResponse({ ok: true });
    }
 
    if (action === 'conciliarMovimiento') {
      return jsonResponse(
        conciliarMovimientoSeguro_(
          ss,
          body,
          sesion
        )
      );
    }

    if (action === 'agregarCategoriaMovimiento') {
      const b = JSON.parse(e.postData.contents);
      ss.getSheetByName('Categorias_Movimientos').appendRow([b.nombre, b.tipo]);
      return jsonResponse({ ok: true });
    }
 
   if (action === 'registrarVentaV2') {
      const b = JSON.parse(e.postData.contents);

      b.rol_sesion =
        String(sesion.rol || '')
          .trim()
          .toLowerCase();

      b.usuario_sesion =
        String(sesion.usuario || '')
          .trim();

      const resultado =
        registrarVentaV2_(ss, b);

      if (b.solo_validar_margen === true) {
  return jsonResponse({
    ok: true,
    requiere_autorizacion:
      resultado.requiere_autorizacion === true
  });
}  

  if (
    String(sesion.rol || '')
      .trim()
      .toLowerCase() === 'vendedor'
    ) {
    return jsonResponse({
      ok: true,
      id:
        resultado.id ||
        resultado.id_venta ||
        '',
      id_venta:
        resultado.id_venta ||
        resultado.id ||
        '',
      estado:
        resultado.estado ||
        'registrada'
    });
  }

  return jsonResponse(resultado);
}

    if (action === 'cancelarVentaV2') {
      const b = JSON.parse(e.postData.contents);
      return jsonResponse(cancelarVentaV2_(ss, b));
    }

if (action === 'crearProcesadorCobro') {
  return jsonResponse(
    crearProcesadorCobroV2_(
      ss,
      body.nombre,
      sesion
    )
  );
}

if (action === 'editarProcesadorCobro') {
  return jsonResponse(
    editarProcesadorCobroV2_(
      ss,
      body.id_procesador,
      body.cambios || {},
      sesion
    )
  );
}

if (action === 'eliminarProcesadorCobro') {
  return jsonResponse(
    eliminarProcesadorCobroV2_(
      ss,
      body.id_procesador,
      sesion
    )
  );
}


if (action === 'crearTarifaCobro') {
  return jsonResponse(
    crearTarifaCobroV2_(
      ss,
      body.datos || {},
      sesion
    )
  );
}


    if (action === 'editarTarifaCobro') {
  return jsonResponse(
    actualizarConfiguracionCobroV2_(
      ss,
      {
        hoja: 'Tarifas_Cobro',
        hoja_historial: 'Historial_Tarifas_Cobro',
        encabezado_id: 'ID_Tarifa',
        id: body.id_tarifa,
        cambios: body.cambios || {},
        campos_permitidos: [
          'ID_Cuenta',
          'ID_Procesador',
          'Canal',
          'Tipo_Pago',
          'Dias_Acreditacion',
          'Comision_Base_Pct',
          'IVA_Pct',
          'Vigencia_Desde',
          'Vigencia_Hasta',
          'Activo',
          'Notas'
        ],
        motivo: body.motivo,
        usuario: sesion.usuario
      }
    )
  );
}

if (action === 'editarPlanCuotas') {
  return jsonResponse(
    actualizarConfiguracionCobroV2_(
      ss,
      {
        hoja: 'Planes_Cuotas',
        hoja_historial: 'Historial_Planes_Cuotas',
        encabezado_id: 'ID_Plan',
        id: body.id_plan,
        cambios: body.cambios || {},
        campos_permitidos: [
          'ID_Procesador',
          'Canal',
          'Tipo_Pago',
          'Cuotas',
          'Costo_Negocio_Pct',
          'Recargo_Cliente_Pct',
          'Quien_Absorbe',
          'Monto_Minimo',
          'Monto_Maximo',
          'Vigencia_Desde',
          'Vigencia_Hasta',
          'Tarjetas_Aplicables',
          'Activo',
          'Notas',
          'Margen_Minimo_Pct'
        ],
        motivo: body.motivo,
        usuario: sesion.usuario
      }
    )
  );
}

if (action === 'crearPlanCuotas') {
  const b =
    JSON.parse(e.postData.contents);

  return jsonResponse(
    crearPlanCuotasV2_(
      ss,
      b.datos || {},
      sesion
    )
  );
}

    return jsonResponse({ error: 'Accion no reconocida' });
 
  } catch(err) {
    return jsonResponse({ error: err.message });
  }
}
 
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function hashPassword_(
  password,
  salt
) {
  const bytes =
    Utilities.computeDigest(
      Utilities.DigestAlgorithm
        .SHA_256,
      salt + ':' + password,
      Utilities.Charset.UTF_8
    );

  return bytes
    .map(function(byte) {
      const value =
        byte < 0
          ? byte + 256
          : byte;

      return value
        .toString(16)
        .padStart(2, '0');
    })
    .join('');
}

function crearUsuarioSeguro_(
  ss,
  usuario,
  nombre,
  password,
  rol
) {
  const sheet =
    ss.getSheetByName(
      'Usuarios'
    );

  if (!sheet) {
    throw new Error(
      'No existe la hoja Usuarios.'
    );
  }

  const usuarioNormalizado =
    String(usuario)
      .trim()
      .toLowerCase();

  const rolNormalizado =
    String(rol)
      .trim()
      .toLowerCase();

  if (
    rolNormalizado !==
      'administrador' &&
    rolNormalizado !==
      'vendedor'
  ) {
    throw new Error(
      'El rol debe ser administrador o vendedor.'
    );
  }

  const datos =
    sheet
      .getDataRange()
      .getValues();

  for (
    let i = 1;
    i < datos.length;
    i++
  ) {
    if (
      String(datos[i][1])
        .trim()
        .toLowerCase() ===
      usuarioNormalizado
    ) {
      throw new Error(
        'El usuario ya existe: ' +
        usuarioNormalizado
      );
    }
  }

  const salt =
    Utilities.getUuid();

  const passwordHash =
    hashPassword_(
      password,
      salt
    );

  const idUsuario =
    'USR-' +
    new Date().getTime() +
    '-' +
    Math.random()
      .toString(36)
      .slice(2, 6);

  sheet.appendRow([
    idUsuario,
    usuarioNormalizado,
    nombre,
    passwordHash,
    salt,
    rolNormalizado,
    true,
    new Date().toISOString(),
    ''
  ]);

  return idUsuario;
}

// ============================================================
// AUTENTICACIÓN Y SESIONES
// ============================================================

function iniciarSesionSegura_(ss, usuario, password) {
  const nombreUsuario = String(usuario || '').trim().toLowerCase();
  const clave = String(password || '');

  if (!nombreUsuario || !clave) {
    throw new Error('Completá usuario y contraseña.');
  }

  const sh = ss.getSheetByName('Usuarios');

  if (!sh) {
    throw new Error('No existe la hoja Usuarios.');
  }

  const datos = sh.getDataRange().getValues();

  for (let i = 1; i < datos.length; i++) {
    const usuarioGuardado = String(datos[i][1] || '')
      .trim()
      .toLowerCase();

    if (usuarioGuardado !== nombreUsuario) {
      continue;
    }

    const activo =
      datos[i][6] === true ||
      String(datos[i][6]).toUpperCase() === 'TRUE';

    if (!activo) {
      throw new Error('El usuario está desactivado.');
    }

    const hashGuardado = String(datos[i][3] || '');
    const salt = String(datos[i][4] || '');
    const hashIngresado = hashPassword_(clave, salt);

    if (hashIngresado !== hashGuardado) {
      throw new Error('Usuario o contraseña incorrectos.');
    }

    const token =
      Utilities.getUuid().replace(/-/g, '') +
      Utilities.getUuid().replace(/-/g, '');

    const sesion = {
      id_usuario: String(datos[i][0] || ''),
      usuario: String(datos[i][1] || ''),
      nombre: String(datos[i][2] || ''),
      rol: String(datos[i][5] || '').trim().toLowerCase()
    };

  sesion.expira_en =
    Date.now() + (21600 * 1000);

  const claveSesion =
    'SESION_' + token;

  const contenidoSesion =
    JSON.stringify(sesion);

  CacheService
    .getScriptCache()
    .put(
    claveSesion,
    contenidoSesion,
    21600
  );

  PropertiesService
    .getScriptProperties()
    .setProperty(
    claveSesion,
    contenidoSesion
  );

    sh.getRange(i + 1, 9).setValue(new Date());

    return {
      ok: true,
      token: token,
      usuario: sesion,
      expires_in: 21600
    };
  }

  throw new Error('Usuario o contraseña incorrectos.');
}


function obtenerSesionSegura_(token) {
  const tokenLimpio =
    String(token || '').trim();

  if (!tokenLimpio) {
    throw new Error('Sesión requerida.');
  }

  const clave = 'SESION_' + tokenLimpio;
  const cache =
    CacheService.getScriptCache();
  const propiedades =
    PropertiesService.getScriptProperties();

  let contenido =
    cache.get(clave) ||
    propiedades.getProperty(clave);

  if (!contenido) {
    throw new Error(
      'La sesión venció. Ingresá nuevamente.'
    );
  }

  const sesion = JSON.parse(contenido);
  const ahora = Date.now();

  if (
    sesion.expira_en &&
    ahora > Number(sesion.expira_en)
  ) {
    cache.remove(clave);
    propiedades.deleteProperty(clave);

    throw new Error(
      'La sesión venció. Ingresá nuevamente.'
    );
  }

  // Renueva la sesión durante 6 horas.
  sesion.expira_en =
    ahora + (21600 * 1000);

  contenido = JSON.stringify(sesion);

  cache.put(
    clave,
    contenido,
    21600
  );

  propiedades.setProperty(
    clave,
    contenido
  );

  return sesion;
}


function cerrarSesionSegura_(token) {
  const tokenLimpio =
    String(token || '').trim();

  if (tokenLimpio) {
    const clave =
      'SESION_' + tokenLimpio;

    CacheService
      .getScriptCache()
      .remove(clave);

    PropertiesService
      .getScriptProperties()
      .deleteProperty(clave);
  }

  return { ok: true };
}

function autorizarAccionSegura_(sesion, action) {
  if (!sesion) {
    throw new Error('Sesión requerida.');
  }

  const rol =
    String(sesion.rol || '')
      .trim()
      .toLowerCase();

  if (rol === 'administrador') {
    return true;
  }

  if (rol !== 'vendedor') {
    throw new Error(
      'El usuario no tiene un rol válido.'
    );
  }

  const accionesVendedor = [
    'getDatosCompletos',
    'getProductos',
    'getCuentas',
    'getClientes',
    'getVentas',
    'getDetalleVentas',
    'getPagosVenta',
    'getCuentasPorCobrar',
    'getMovimientos',
    'registrarVentaV2',
    'registrarCobroCPC',
    'agregarCliente',
    'editarCliente',
    'cambiarClavePropia'
  ];

  if (accionesVendedor.indexOf(action) === -1) {
    throw new Error(
      'Tu perfil no tiene permiso para realizar esta operación.'
    );
  }

  return true;
}


// ============================================================
// DATOS VISIBLES PARA EL PERFIL VENDEDOR
// ============================================================

function datosHojaSegura_(ss, nombre) {
  const sh = ss.getSheetByName(nombre);

  if (!sh) {
    return [];
  }

  return sh
    .getDataRange()
    .getValues();
}


function normalizarEncabezadoSeguro_(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}


function ocultarColumnasSeguras_(
  datos,
  columnasOcultas
) {
  if (
    !Array.isArray(datos) ||
    datos.length === 0
  ) {
    return [];
  }

  const bloqueadas =
    columnasOcultas.map(
      normalizarEncabezadoSeguro_
    );

  const indices = [];

  datos[0].forEach(function(encabezado, indice) {
    if (
      bloqueadas.indexOf(
        normalizarEncabezadoSeguro_(encabezado)
      ) !== -1
    ) {
      indices.push(indice);
    }
  });

  return datos.map(function(fila, numeroFila) {
    const copia = fila.slice();

    if (numeroFila > 0) {
      indices.forEach(function(indice) {
        copia[indice] = '';
      });
    }

    return copia;
  });
}


function productosParaVendedor_(ss) {
  const datos =
    datosHojaSegura_(ss, 'Productos');

  return datos.map(function(fila, indice) {
    if (indice === 0) {
      return fila.slice();
    }

    const copia = fila.slice();

    // Proveedor
    if (copia.length > 2) copia[2] = '';

    // Precio de costo
    if (copia.length > 4) copia[4] = '';

    // Recargo
    if (copia.length > 8) copia[8] = '';

    return copia;
  });
}


function cuentasParaVendedor_(ss) {
  const datos =
    datosHojaSegura_(ss, 'Cuentas');

  return datos.map(function(fila, indice) {
    if (indice === 0) {
      return fila.slice();
    }

    const copia = fila.slice();

    // Conservamos ID, nombre, tipo y estado,
    // pero no mostramos el saldo inicial.
    if (copia.length > 3) copia[3] = '';

    return copia;
  });
}


function ventasParaVendedor_(ss) {
  return ocultarColumnasSeguras_(
    datosHojaSegura_(ss, 'Ventas'),
    [
      'Total_Neto',
      'Costo_Cobranza',
      'Neto_Esperado',
      'Costo_Mercaderia',
      'Margen_Comercial',
      'Margen_Estimado'
    ]
  );
}


function detalleVentasParaVendedor_(ss) {
  return ocultarColumnasSeguras_(
    datosHojaSegura_(ss, 'Detalle_Ventas'),
    [
      'Costo_Unitario',
      'Costo_Total',
      'Margen_Item',
      'Margen'
    ]
  );
}


function pagosVentaParaVendedor_(ss) {
  return ocultarColumnasSeguras_(
    datosHojaSegura_(ss, 'Pagos_Venta'),
    [
      'Comision_Pct',
      'Costo_Financiero_Pct',
      'Comision_Aplicada',
      'CF_Aplicado',
      'Comision_Monto',
      'Costo_Financiero_Monto',
      'Monto_Neto',
      'Neto_Recibido',
      'Neto_Esperado'
    ]
  );
}

function movimientosCpcParaVendedor_(ss) {
  const movimientos =
    datosHojaSegura_(ss, 'Movimientos');

  return movimientos
    .filter(function(fila, indice) {
      return (
        indice === 0 ||
        String(fila[8] || '').trim() === 'cobro_cpc'
      );
    })
    .map(function(fila, indice) {
      const copia = fila.slice();

      if (indice > 0) {
        copia[2] = ''; // Oculta la cuenta
        copia[6] = ''; // Oculta la descripción interna
      }

      return copia;
    });
}

function respuestaSeguraVendedor_(ss, action) {
  if (action === 'getProductos') {
    return {
      atendida: true,
      datos: productosParaVendedor_(ss)
    };
  }


  if (action === 'getCuentas') {
    return {
      atendida: true,
      datos: cuentasParaVendedor_(ss)
    };
  }

  if (action === 'getClientes') {
    return {
      atendida: true,
      datos: datosHojaSegura_(ss, 'Clientes')
    };
  }

  if (action === 'getVentas') {
    return {
      atendida: true,
      datos: ventasParaVendedor_(ss)
    };
  }

  if (action === 'getDetalleVentas') {
    return {
      atendida: true,
      datos: detalleVentasParaVendedor_(ss)
    };
  }

  if (action === 'getPagosVenta') {
    return {
      atendida: true,
      datos: pagosVentaParaVendedor_(ss)
    };
  }

  if (action === 'getCuentasPorCobrar') {
    return {
      atendida: true,
      datos: datosHojaSegura_(
        ss,
        'Cuentas_Por_Cobrar'
      )
    };
  }

  if (action === 'getMovimientos') {
    return {
      atendida: true,
      datos: movimientosCpcParaVendedor_(ss)
    };
  }

  if (action === 'getDatosCompletos') {
    return {
      atendida: true,
      datos: {
        Productos:
          productosParaVendedor_(ss),

        Proveedores: [],
        Categorias: [],

        Procesadores_Cobro:
          datosHojaSegura_(
         ss,
        'Procesadores_Cobro'
        ),

        Tarifas_Cobro:
          ocultarColumnasSeguras_(
          datosHojaSegura_(
          ss,
          'Tarifas_Cobro'
          ),
          [
            'Comision_Base_Pct',
            'IVA_Pct',
            'Notas'
          ]
        ),

        Planes_Cuotas:
          ocultarColumnasSeguras_(
            datosHojaSegura_(
              ss,
              'Planes_Cuotas'
            ),
            [
              'Costo_Negocio_Pct',
              'Margen_Minimo_Pct',
              'Notas'
            ]
          ),

        Cuentas:
          cuentasParaVendedor_(ss),

        Clientes:
          datosHojaSegura_(ss, 'Clientes'),

        Ventas:
          ventasParaVendedor_(ss),

        Detalle_Ventas:
          detalleVentasParaVendedor_(ss),

        Pagos_Venta:
          pagosVentaParaVendedor_(ss),

        Cuentas_Por_Cobrar:
          datosHojaSegura_(
            ss,
            'Cuentas_Por_Cobrar'
          ),
        
        Movimientos:
          movimientosCpcParaVendedor_(ss),

      
        Categorias_Movimientos: [],
        Ingresos: [],
        Detalle_Ingresos: [],
        Historial_Costos: []
      }
    };
  }

  return {
    atendida: false,
    datos: null
  };
}

function conciliarMovimientoSeguro_(
  ss,
  datos,
  sesion
) {
  const lock =
    LockService.getDocumentLock();

  lock.waitLock(30000);

  try {
    const sh =
      ss.getSheetByName('Movimientos');

    if (!sh) {
      throw new Error(
        'No existe la hoja Movimientos.'
      );
    }

    const idMovimiento =
      String(
        datos.id_movimiento || ''
      ).trim();

    const importeReal =
      Number(datos.importe_real);

    const nota =
      String(datos.nota || '').trim();

    if (!idMovimiento) {
      throw new Error(
        'Falta el ID del movimiento.'
      );
    }

    if (
      !isFinite(importeReal) ||
      importeReal < 0
    ) {
      throw new Error(
        'El importe real no es válido.'
      );
    }

    const encabezados =
      sh
        .getRange(
          1,
          1,
          1,
          Math.max(1, sh.getLastColumn())
        )
        .getValues()[0];

    const asegurarColumna =
      function(nombre) {
        let indice =
          encabezados.indexOf(nombre);

        if (indice === -1) {
          indice = encabezados.length;

          sh
            .getRange(1, indice + 1)
            .setValue(nombre);

          encabezados.push(nombre);
        }

        return indice + 1;
      };

    const colEstado =
      asegurarColumna(
        'Estado_Conciliacion'
      );

    const colFecha =
      asegurarColumna(
        'Fecha_Conciliacion'
      );

    const colReal =
      asegurarColumna(
        'Importe_Real'
      );

    const colDiferencia =
      asegurarColumna(
        'Diferencia_Conciliacion'
      );

    const colNota =
      asegurarColumna(
        'Nota_Conciliacion'
      );

    const colUsuario =
      asegurarColumna(
        'Usuario_Conciliacion'
      );

    const ultimaFila =
      sh.getLastRow();

    if (ultimaFila < 2) {
      throw new Error(
        'No hay movimientos registrados.'
      );
    }

    const ids =
      sh
        .getRange(
          2,
          1,
          ultimaFila - 1,
          1
        )
        .getValues();

    let fila = 0;

    for (
      let i = 0;
      i < ids.length;
      i++
    ) {
      if (
        String(ids[i][0]).trim() ===
        idMovimiento
      ) {
        fila = i + 2;
        break;
      }
    }

    if (!fila) {
      throw new Error(
        'No se encontró el movimiento.'
      );
    }

    const estadoActual =
      String(
        sh
          .getRange(
            fila,
            colEstado
          )
          .getValue() || ''
      )
        .trim()
        .toLowerCase();

    if (
      estadoActual === 'conciliado'
    ) {
      throw new Error(
        'Este movimiento ya fue conciliado.'
      );
    }

    // Monto original de Movimientos:
    // columna F.
    const importeEsperado =
      Number(
        sh
          .getRange(fila, 6)
          .getValue()
      ) || 0;

    const diferencia =
      importeReal -
      importeEsperado;

    sh
      .getRange(fila, colEstado)
      .setValue('conciliado');

    sh
      .getRange(fila, colFecha)
      .setValue(new Date());

    sh
      .getRange(fila, colReal)
      .setValue(importeReal);

    sh
      .getRange(
        fila,
        colDiferencia
      )
      .setValue(diferencia);

    sh
      .getRange(fila, colNota)
      .setValue(nota);

    sh
      .getRange(fila, colUsuario)
      .setValue(
        String(
          sesion.nombre ||
          sesion.usuario ||
          ''
        )
      );

    return {
      ok: true,
      id_movimiento: idMovimiento,
      estado: 'conciliado',
      importe_esperado:
        importeEsperado,
      importe_real: importeReal,
      diferencia: diferencia
    };

  } finally {
    lock.releaseLock();
  }
}


function TEST_conciliarMovimientoSeguro() {
  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  const sh =
    ss.getSheetByName(
      'Movimientos'
    );

  const datos =
    sh
      .getDataRange()
      .getValues();

  let movimiento = null;

  for (
    let i = datos.length - 1;
    i >= 1;
    i--
  ) {
    const origen =
      String(
        datos[i][8] || ''
      )
        .trim()
        .toLowerCase();

    const estado =
      String(
        datos[i][10] || ''
      )
        .trim()
        .toLowerCase();

    if (
      !origen.startsWith(
        'cancelacion_venta'
      ) &&
      estado !== 'conciliado'
    ) {
      movimiento = datos[i];
      break;
    }
  }

  if (!movimiento) {
    throw new Error(
      'No hay movimientos pendientes para probar.'
    );
  }

  const resultado =
    conciliarMovimientoSeguro_(
      ss,
      {
        id_movimiento:
          movimiento[0],

        // Usamos el mismo importe:
        // la diferencia debería ser cero.
        importe_real:
          Number(
            movimiento[5]
          ) || 0,

        nota:
          'Prueba conciliación DEV'
      },
      {
        usuario:
          'TEST_DEV',

        nombre:
          'Prueba DEV'
      }
    );

  Logger.log(
    JSON.stringify(
      resultado,
      null,
      2
    )
  );
}


function TEST_normalizarCategoriasHistoricas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shProductos = ss.getSheetByName('Productos');
  const shCategorias = ss.getSheetByName('Categorias');

  if (!shProductos || !shCategorias) {
    throw new Error(
      'No se encontraron Productos o Categorias.'
    );
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const categoriaCopasOficial =
      'Copas, Vasos, Jarras, Botellas';

    const variantesCopas = [
      'Copas\\',
      'Copas, Vasos y Jarras'
    ];

    const categoriasParaAgregar = [
      'Navidad',
      'Baño',
      'Mantelería'
    ];

    const normalizar = function(valor) {
      return String(valor || '')
        .trim()
        .toLowerCase();
    };

    const ultimaFilaProductos =
      shProductos.getLastRow();

    let copasActualizadas = 0;
    const productosSinCategoria = [];

    if (ultimaFilaProductos > 1) {
      const cantidadFilas =
        ultimaFilaProductos - 1;

      const codigos =
        shProductos
          .getRange(2, 1, cantidadFilas, 1)
          .getValues();

      const rangoCategorias =
        shProductos
          .getRange(2, 8, cantidadFilas, 1);

      const categoriasProductos =
        rangoCategorias.getValues();

      categoriasProductos.forEach(
        function(fila, indice) {
          const categoria =
            String(fila[0] || '').trim();

          if (!categoria) {
            productosSinCategoria.push(
              String(codigos[indice][0] || '')
            );
            return;
          }

          const coincide =
            variantesCopas.some(
              function(variante) {
                return (
                  normalizar(categoria) ===
                  normalizar(variante)
                );
              }
            );

          if (coincide) {
            fila[0] = categoriaCopasOficial;
            copasActualizadas++;
          }
        }
      );

      rangoCategorias.setValues(
        categoriasProductos
      );
    }

    const categoriasExistentes =
      shCategorias
        .getDataRange()
        .getValues()
        .slice(1)
        .map(function(fila) {
          return normalizar(fila[0]);
        });

    const agregadas = [];

    categoriasParaAgregar.forEach(
      function(categoria) {
        if (
          categoriasExistentes.indexOf(
            normalizar(categoria)
          ) === -1
        ) {
          shCategorias.appendRow([categoria]);
          categoriasExistentes.push(
            normalizar(categoria)
          );
          agregadas.push(categoria);
        }
      }
    );

    SpreadsheetApp.flush();

    const resultado = {
      ok: true,
      copas_actualizadas: copasActualizadas,
      categoria_final: categoriaCopasOficial,
      categorias_agregadas: agregadas,
      productos_sin_categoria:
        productosSinCategoria
    };

    Logger.log(
      JSON.stringify(resultado, null, 2)
    );

    return resultado;

  } finally {
    lock.releaseLock();
  }
}


function TEST_normalizarProveedoresHistoricos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shProductos = ss.getSheetByName('Productos');
  const shProveedores = ss.getSheetByName('Proveedores');

  if (!shProductos || !shProveedores) {
    throw new Error(
      'No se encontraron Productos o Proveedores.'
    );
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const normalizar = function(valor) {
      return String(valor || '')
        .trim()
        .toLowerCase();
    };

    const datosProveedores =
      shProveedores.getDataRange().getValues();

    const equivalencias = {};

    for (let i = 1; i < datosProveedores.length; i++) {
      const codigo =
        String(datosProveedores[i][0] || '').trim();

      const nombre =
        String(datosProveedores[i][1] || '').trim();

      if (codigo) {
        equivalencias[normalizar(codigo)] = codigo;
      }

      if (codigo && nombre) {
        equivalencias[normalizar(nombre)] = codigo;
      }
    }

    // Variante histórica encontrada en la Sheet.
    equivalencias[normalizar('Paké&Cocó')] = 'P&C';

    const ultimaFila =
      shProductos.getLastRow();

    if (ultimaFila <= 1) {
      throw new Error('No hay productos para revisar.');
    }

    const cantidadFilas = ultimaFila - 1;

    const codigosProducto =
      shProductos
        .getRange(2, 1, cantidadFilas, 1)
        .getValues();

    const rangoProveedores =
      shProductos
        .getRange(2, 3, cantidadFilas, 1);

    const proveedoresProducto =
      rangoProveedores.getValues();

    let actualizados = 0;
    let inferidosPorCodigo = 0;
    const pendientes = [];

    proveedoresProducto.forEach(
      function(fila, indice) {
        const valorActual =
          String(fila[0] || '').trim();

        const codigoProducto =
          String(
            codigosProducto[indice][0] || ''
          ).trim();

        let codigoProveedor = '';

        if (valorActual) {
          codigoProveedor =
            equivalencias[
              normalizar(valorActual)
            ] || '';
        } else if (
          codigoProducto.indexOf('-') > 0
        ) {
          const prefijo =
            codigoProducto
              .split('-')[0]
              .trim();

          codigoProveedor =
            equivalencias[
              normalizar(prefijo)
            ] || '';

          if (codigoProveedor) {
            inferidosPorCodigo++;
          }
        }

        if (
          codigoProveedor &&
          valorActual !== codigoProveedor
        ) {
          fila[0] = codigoProveedor;
          actualizados++;
        }

        if (!fila[0]) {
          pendientes.push(codigoProducto);
        }
      }
    );

    rangoProveedores.setValues(
      proveedoresProducto
    );

    SpreadsheetApp.flush();

    const resultado = {
      ok: true,
      productos_actualizados: actualizados,
      inferidos_por_codigo:
        inferidosPorCodigo,
      productos_sin_proveedor:
        pendientes.length,
      ejemplos_pendientes:
        pendientes.slice(0, 20)
    };

    Logger.log(
      JSON.stringify(resultado, null, 2)
    );

    return resultado;

  } finally {
    lock.releaseLock();
  }
}

function SETUP_mediosYPlanesCobroV2() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const hojas = {
    Procesadores_Cobro: [
      'ID_Procesador',
      'Nombre',
      'Activo'
    ],

    Tarifas_Cobro: [
      'ID_Tarifa',
      'ID_Cuenta',
      'ID_Procesador',
      'Canal',
      'Tipo_Pago',
      'Dias_Acreditacion',
      'Comision_Base_Pct',
      'IVA_Pct',
      'Vigencia_Desde',
      'Vigencia_Hasta',
      'Activo',
      'Notas'
    ],

    Planes_Cuotas: [
      'ID_Plan',
      'ID_Procesador',
      'Canal',
      'Tipo_Pago',
      'Cuotas',
      'Costo_Negocio_Pct',
      'Recargo_Cliente_Pct',
      'Quien_Absorbe',
      'Monto_Minimo',
      'Monto_Maximo',
      'Vigencia_Desde',
      'Vigencia_Hasta',
      'Tarjetas_Aplicables',
      'Activo',
      'Notas'
    ]
  };

  Object.entries(hojas).forEach(([nombre, encabezados]) => {
    let sh = ss.getSheetByName(nombre);

    if (!sh) {
      sh = ss.insertSheet(nombre);
    }

    sh.getRange(1, 1, 1, encabezados.length)
      .setValues([encabezados]);

    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, encabezados.length);
  });

  const shProcesadores =
    ss.getSheetByName('Procesadores_Cobro');

  if (shProcesadores.getLastRow() === 1) {
    shProcesadores.getRange(2, 1, 4, 3)
      .setValues([
        ['MP', 'Mercado Pago', true],
        ['BPROV', 'Banco Provincia', true],
        ['DIRECTO', 'Cobro directo', true],
        ['NINGUNO', 'Sin procesador', true]
      ]);
  }

  Logger.log(JSON.stringify({
    ok: true,
    hojas_creadas: Object.keys(hojas)
  }, null, 2));
}


function SETUP_cargarConfiguracionCobrosInicial() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const shCuentas = ss.getSheetByName('Cuentas');
  const shTarifas = ss.getSheetByName('Tarifas_Cobro');
  const shPlanes = ss.getSheetByName('Planes_Cuotas');

  if (!shCuentas || !shTarifas || !shPlanes) {
    throw new Error('Faltan hojas necesarias');
  }

  function buscarCuenta(nombre) {
    const datos = shCuentas.getDataRange().getValues();
    const encabezados = datos[0].map(String);
    const idxId = encabezados.indexOf('ID_Cuenta');
    const idxNombre = encabezados.indexOf('Nombre');

    const buscado = nombre.toLowerCase();

    const fila = datos.slice(1).find(r =>
      String(r[idxNombre] || '')
        .trim()
        .toLowerCase() === buscado
    );

    if (!fila) {
      throw new Error(`No se encontró la cuenta: ${nombre}`);
    }

    return String(fila[idxId]);
  }

  function upsertFilas(sh, filas) {
    const datos = sh.getDataRange().getValues();
    const existentes = new Map();

    for (let i = 1; i < datos.length; i++) {
      const id = String(datos[i][0] || '').trim();
      if (id) existentes.set(id, i + 1);
    }

    filas.forEach(fila => {
      const id = String(fila[0]);

      if (existentes.has(id)) {
        sh.getRange(
          existentes.get(id),
          1,
          1,
          fila.length
        ).setValues([fila]);
      } else {
        sh.appendRow(fila);
      }
    });
  }

  const idMercadoPago = buscarCuenta('Mercado Pago');
  const idMacro = buscarCuenta('Macro');
  const idEfectivo = buscarCuenta('Efectivo');

  const desde = '2026-08-24';

  const tarifas = [
    // POINT
    ['TAR-MP-POINT-DEB-0', idMercadoPago, 'MP', 'Point', 'Débito', 0, 3.14, 21, desde, '', true, 'Acreditación inmediata'],
    ['TAR-MP-POINT-DEB-2', idMercadoPago, 'MP', 'Point', 'Débito', 2, 2.89, 21, desde, '', true, ''],
    ['TAR-MP-POINT-CRE-0', idMercadoPago, 'MP', 'Point', 'Crédito', 0, 6.29, 21, desde, '', true, 'Acreditación inmediata'],
    ['TAR-MP-POINT-CRE-5', idMercadoPago, 'MP', 'Point', 'Crédito', 5, 5.45, 21, desde, '', true, ''],
    ['TAR-MP-POINT-CRE-10', idMercadoPago, 'MP', 'Point', 'Crédito', 10, 4.40, 21, desde, '', true, ''],
    ['TAR-MP-POINT-PIX-0', idMercadoPago, 'MP', 'Point', 'Pix', 0, 3.41, 21, desde, '', true, ''],
    ['TAR-MP-POINT-PRE-0', idMercadoPago, 'MP', 'Point', 'Prepaga', 0, 3.94, 21, desde, '', true, ''],
    ['TAR-MP-POINT-PRE-3', idMercadoPago, 'MP', 'Point', 'Prepaga', 3, 3.67, 21, desde, '', true, ''],

    // QR
    ['TAR-MP-QR-DIN-0', idMercadoPago, 'MP', 'QR', 'Dinero en cuenta', 0, 0.80, 21, desde, '', true, ''],
    ['TAR-MP-QR-DEB-0', idMercadoPago, 'MP', 'QR', 'Débito', 0, 1.42, 21, desde, '', true, ''],
    ['TAR-MP-QR-DEB-2', idMercadoPago, 'MP', 'QR', 'Débito', 2, 0.89, 21, desde, '', true, ''],
    ['TAR-MP-QR-CRE-0', idMercadoPago, 'MP', 'QR', 'Crédito', 0, 6.29, 21, desde, '', true, ''],
    ['TAR-MP-QR-CRE-10', idMercadoPago, 'MP', 'QR', 'Crédito', 10, 4.40, 21, desde, '', true, ''],
    ['TAR-MP-QR-CST-0', idMercadoPago, 'MP', 'QR', 'Cuotas sin tarjeta', 0, 1.42, 21, desde, '', true, ''],
    ['TAR-MP-QR-PIX-0', idMercadoPago, 'MP', 'QR', 'Pix', 0, 3.41, 21, desde, '', true, ''],
    ['TAR-MP-QR-PRE-0', idMercadoPago, 'MP', 'QR', 'Prepaga', 0, 3.94, 21, desde, '', true, ''],

    // LINK DE PAGO
    ['TAR-MP-LINK-0', idMercadoPago, 'MP', 'Link de pago', 'Todos', 0, 6.60, 21, desde, '', true, ''],
    ['TAR-MP-LINK-10', idMercadoPago, 'MP', 'Link de pago', 'Todos', 10, 4.61, 21, desde, '', true, ''],
    ['TAR-MP-LINK-18', idMercadoPago, 'MP', 'Link de pago', 'Todos', 18, 3.56, 21, desde, '', true, ''],
    ['TAR-MP-LINK-35', idMercadoPago, 'MP', 'Link de pago', 'Todos', 35, 1.56, 21, desde, '', true, ''],

    // COBROS DIRECTOS
    ['TAR-DIR-MP-TRANSF', idMercadoPago, 'DIRECTO', 'Transferencia', 'Transferencia', 0, 0, 0, desde, '', true, ''],
    ['TAR-DIR-MACRO-TRANSF', idMacro, 'DIRECTO', 'Transferencia', 'Transferencia', 0, 0, 0, desde, '', true, ''],
    ['TAR-DIR-EFECTIVO', idEfectivo, 'NINGUNO', 'Efectivo', 'Efectivo', 0, 0, 0, desde, '', true, '']
  ];

  upsertFilas(shTarifas, tarifas);

  const encabezadosPlanes =
    shPlanes.getRange(1, 1, 1, shPlanes.getLastColumn())
      .getValues()[0]
      .map(String);

  if (!encabezadosPlanes.includes('Margen_Minimo_Pct')) {
    shPlanes.getRange(
      1,
      shPlanes.getLastColumn() + 1
    ).setValue('Margen_Minimo_Pct');
  }

  const planes = [
    ['PLAN-MP-1', 'MP', '*', 'Crédito', 1, 0, 0, 'ninguno', 0, '', desde, '', '', true, 'Una cuota', 20],
    ['PLAN-MP-2-SI', 'MP', '*', 'Crédito', 2, 7.79, 0, 'negocio', 80000, '', desde, '', '', true, 'Sin interés desde $80.000', 20],
    ['PLAN-MP-3-SI', 'MP', '*', 'Crédito', 3, 10.49, 0, 'negocio', 80000, '', desde, '', 'Incluye Plan Z de Naranja X', true, 'Sin interés desde $80.000', 20],

    ['PLAN-MP-6-CLI', 'MP', '*', 'Crédito', 6, 0, 0, 'cliente', 0, '', desde, '', '', true, 'Total del cliente se ingresa manualmente', 20],
    ['PLAN-MP-9-CLI', 'MP', '*', 'Crédito', 9, 0, 0, 'cliente', 0, '', desde, '', '', true, 'Total del cliente se ingresa manualmente', 20],
    ['PLAN-MP-12-CLI', 'MP', '*', 'Crédito', 12, 0, 0, 'cliente', 0, '', desde, '', '', true, 'Total del cliente se ingresa manualmente', 20],
    ['PLAN-MP-18-CLI', 'MP', '*', 'Crédito', 18, 0, 0, 'cliente', 0, '', desde, '', '', true, 'Total del cliente se ingresa manualmente', 20]
  ];

  upsertFilas(shPlanes, planes);

  SpreadsheetApp.flush();

  Logger.log(JSON.stringify({
    ok: true,
    tarifas_cargadas: tarifas.length,
    planes_cargados: planes.length,
    monto_minimo_3_cuotas: 80000,
    margen_minimo_pct: 20
  }, null, 2));
}

function SETUP_historialConfiguracionCobrosV2() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const configuracion = [
    {
      nombre: 'Historial_Tarifas_Cobro',
      encabezados: [
        'Fecha',
        'ID_Tarifa',
        'Campo',
        'Valor_Anterior',
        'Valor_Nuevo',
        'Motivo',
        'Usuario'
      ]
    },
    {
      nombre: 'Historial_Planes_Cuotas',
      encabezados: [
        'Fecha',
        'ID_Plan',
        'Campo',
        'Valor_Anterior',
        'Valor_Nuevo',
        'Motivo',
        'Usuario'
      ]
    }
  ];

  const creadas = [];

  configuracion.forEach(function(item) {
    let hoja = ss.getSheetByName(item.nombre);

    if (!hoja) {
      hoja = ss.insertSheet(item.nombre);
      creadas.push(item.nombre);
    }

    hoja
      .getRange(1, 1, 1, item.encabezados.length)
      .setValues([item.encabezados]);

    hoja.setFrozenRows(1);
  });

  Logger.log(JSON.stringify({
    ok: true,
    hojas_creadas: creadas
  }, null, 2));
}

function actualizarConfiguracionCobroV2_(ss, config) {
  const id = String(config.id || '').trim();

  if (!id) {
    throw new Error('Falta identificar el registro.');
  }

  const lock = LockService.getScriptLock();

  if (!lock.tryLock(30000)) {
    throw new Error(
      'El sistema está procesando otro cambio. Intentá nuevamente.'
    );
  }

  try {
    const hoja = ss.getSheetByName(config.hoja);
    const hojaHistorial =
      ss.getSheetByName(config.hoja_historial);

    if (!hoja) {
      throw new Error(
        'No existe la hoja ' + config.hoja + '.'
      );
    }

    if (!hojaHistorial) {
      throw new Error(
        'No existe la hoja ' +
        config.hoja_historial +
        '.'
      );
    }

    const datos = hoja.getDataRange().getValues();

    if (datos.length < 2) {
      throw new Error('No hay registros para modificar.');
    }

    const encabezados = datos[0].map(function(valor) {
      return String(valor || '').trim();
    });

    const indiceId =
      encabezados.indexOf(config.encabezado_id);

    if (indiceId === -1) {
      throw new Error(
        'No se encontró la columna ' +
        config.encabezado_id +
        '.'
      );
    }

    let numeroFila = -1;

    for (let i = 1; i < datos.length; i++) {
      if (
        String(datos[i][indiceId] || '').trim() === id
      ) {
        numeroFila = i + 1;
        break;
      }
    }

    if (numeroFila === -1) {
      throw new Error(
        'No se encontró el registro ' + id + '.'
      );
    }

    const camposNumericos = [
      'Dias_Acreditacion',
      'Comision_Base_Pct',
      'IVA_Pct',
      'Cuotas',
      'Costo_Negocio_Pct',
      'Recargo_Cliente_Pct',
      'Monto_Minimo',
      'Monto_Maximo',
      'Margen_Minimo_Pct'
    ];

    const filasHistorial = [];
    const cambiosRealizados = [];

    config.campos_permitidos.forEach(function(campo) {
      if (
        !Object.prototype.hasOwnProperty.call(
          config.cambios,
          campo
        )
      ) {
        return;
      }

      const indiceCampo = encabezados.indexOf(campo);

      if (indiceCampo === -1) {
        return;
      }

      const valorAnterior =
        datos[numeroFila - 1][indiceCampo];

      let valorNuevo = config.cambios[campo];

      if (campo === 'Activo') {
        valorNuevo =
          valorNuevo === true ||
          String(valorNuevo).toUpperCase() === 'TRUE' ||
          Number(valorNuevo) === 1;
      }

      if (camposNumericos.indexOf(campo) !== -1) {
        valorNuevo = Number(valorNuevo) || 0;
      }

      if (
        String(valorAnterior) === String(valorNuevo)
      ) {
        return;
      }

      hoja
        .getRange(numeroFila, indiceCampo + 1)
        .setValue(valorNuevo);

      filasHistorial.push([
        new Date(),
        id,
        campo,
        valorAnterior,
        valorNuevo,
        String(
          config.motivo ||
          'Actualización manual'
        ).trim(),
        String(config.usuario || '').trim()
      ]);

      cambiosRealizados.push(campo);
    });

    if (filasHistorial.length) {
      hojaHistorial
        .getRange(
          hojaHistorial.getLastRow() + 1,
          1,
          filasHistorial.length,
          filasHistorial[0].length
        )
        .setValues(filasHistorial);
    }

    return {
      ok: true,
      id: id,
      cambios_realizados: cambiosRealizados,
      historial_generado: filasHistorial.length
    };
  } finally {
    lock.releaseLock();
  }
}

function TEST_editarTarifaCobroSinCambios() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('Tarifas_Cobro');
  const datos = hoja.getDataRange().getValues();

  const encabezados = datos[0];
  const indiceId = encabezados.indexOf('ID_Tarifa');
  const indiceActivo = encabezados.indexOf('Activo');

  const idTarifa = datos[1][indiceId];
  const activoActual = datos[1][indiceActivo];

  const resultado =
    actualizarConfiguracionCobroV2_(
      ss,
      {
        hoja: 'Tarifas_Cobro',
        hoja_historial:
          'Historial_Tarifas_Cobro',
        encabezado_id: 'ID_Tarifa',
        id: idTarifa,
        cambios: {
          Activo: activoActual
        },
        campos_permitidos: [
          'Activo'
        ],
        motivo:
          'Prueba técnica sin cambios',
        usuario:
          'TEST'
      }
    );

  Logger.log(
    JSON.stringify(resultado, null, 2)
  );
}

function TEST_cambiarMinimoPlan2Cuotas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('Planes_Cuotas');
  const datos = hoja.getDataRange().getValues();

  const encabezados = datos[0];
  const indiceId = encabezados.indexOf('ID_Plan');
  const indiceCuotas = encabezados.indexOf('Cuotas');

  let idPlan = '';

  for (let i = 1; i < datos.length; i++) {
    if (Number(datos[i][indiceCuotas]) === 2) {
      idPlan = String(datos[i][indiceId] || '');
      break;
    }
  }

  if (!idPlan) {
    throw new Error(
      'No se encontró el plan de 2 cuotas.'
    );
  }

  const resultado =
    actualizarConfiguracionCobroV2_(
      ss,
      {
        hoja: 'Planes_Cuotas',
        hoja_historial:
          'Historial_Planes_Cuotas',
        encabezado_id: 'ID_Plan',
        id: idPlan,
        cambios: {
          Monto_Minimo: 70000
        },
        campos_permitidos: [
          'Monto_Minimo'
        ],
        motivo:
          'Cambio de mínimo a $70.000',
        usuario:
          'TEST'
      }
    );

  Logger.log(
    JSON.stringify(resultado, null, 2)
  );
}

function SETUP_ampliarPagosVentaCobrosV2() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('Pagos_Venta');

  if (!hoja) {
    throw new Error(
      'No existe la hoja Pagos_Venta.'
    );
  }

  const ultimaColumna =
    Math.max(1, hoja.getLastColumn());

  const encabezadosActuales =
    hoja
      .getRange(1, 1, 1, ultimaColumna)
      .getValues()[0]
      .map(function(valor) {
        return String(valor || '').trim();
      });

  const encabezadosNuevos = [
    'ID_Tarifa',
    'ID_Plan',
    'ID_Procesador',
    'Canal_Cobro',
    'Tipo_Pago_Cobro',
    'Cuotas',
    'Tarifa_Base_Pct',
    'IVA_Tarifa_Pct',
    'Costo_Plan_Pct',
    'Recargo_Cliente_Pct',
    'Quien_Absorbe',
    'Monto_Cliente_Cobrado',
    'Costo_Cobranza_Total'
  ];

  const agregados = [];

  encabezadosNuevos.forEach(function(nombre) {
    if (encabezadosActuales.indexOf(nombre) === -1) {
      hoja
        .getRange(
          1,
          hoja.getLastColumn() + 1
        )
        .setValue(nombre);

      encabezadosActuales.push(nombre);
      agregados.push(nombre);
    }
  });

  Logger.log(
    JSON.stringify(
      {
        ok: true,
        encabezados_agregados: agregados,
        total_agregados: agregados.length
      },
      null,
      2
    )
  );
}
