// ============================================================
// CIRCO HAUS — VENTAS V2
// Funciones auxiliares
// ============================================================

function hojaV2_(ss, nombre) {
  const hoja = ss.getSheetByName(nombre);

  if (!hoja) {
    throw new Error('No existe la hoja requerida: ' + nombre);
  }

  return hoja;
}


function encabezadosV2_(sheet) {
  const ultimaColumna = sheet.getLastColumn();

  if (ultimaColumna === 0) {
    throw new Error(
      'La hoja ' + sheet.getName() + ' no tiene encabezados.'
    );
  }

  const headers = sheet
    .getRange(1, 1, 1, ultimaColumna)
    .getValues()[0];

  const mapa = {};

  headers.forEach(function(header, index) {
    const nombre = String(header || '').trim();

    if (nombre) {
      mapa[nombre] = index;
    }
  });

  return {
    headers: headers,
    mapa: mapa
  };
}



function appendPorEncabezadoV2_(sheet, valores) {
  const info = encabezadosV2_(sheet);
  const fila = new Array(info.headers.length).fill('');

  Object.keys(valores).forEach(function(nombreColumna) {
    if (
      Object.prototype.hasOwnProperty.call(
        info.mapa,
        nombreColumna
      )
    ) {
      fila[info.mapa[nombreColumna]] =
        valores[nombreColumna];
    }
  });

  sheet
    .getRange(
      sheet.getLastRow() + 1,
      1,
      1,
      fila.length
    )
    .setValues([fila]);
}


function fechaMasDiasV2_(fecha, dias) {
  const textoFecha =
    String(fecha).slice(0, 10);

  const d =
    new Date(textoFecha + 'T12:00:00');

  d.setDate(
    d.getDate() +
    Number(dias || 0)
  );

  return Utilities.formatDate(
    d,
    Session.getScriptTimeZone(),
    'yyyy-MM-dd'
  );
}


function verdaderoV2_(valor) {
  return (
    valor === true ||
    String(valor).toUpperCase() === 'TRUE' ||
    Number(valor) === 1
  );
}


function idV2_(prefijo) {
  return (
    prefijo +
    '-' +
    new Date().getTime() +
    '-' +
    Utilities.getUuid().slice(0, 6)
  );
}


// ============================================================
// REGISTRAR VENTA V2
// ============================================================

function registrarVentaV2_(ss, b) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    // ----------------------------------------------------------
    // 1. VALIDACIONES BÁSICAS
    // ----------------------------------------------------------

    if (!b) {
      throw new Error('No se recibieron datos de la venta.');
    }

    if (!Array.isArray(b.items) || b.items.length === 0) {
      throw new Error('La venta debe tener al menos un producto.');
    }

    const fecha =
      b.fecha ||
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        'yyyy-MM-dd'
      );

    const tipo = b.tipo || 'venta';

    const esCuenta =
      tipo === 'cuenta_por_cobrar';

    if (esCuenta && !b.id_cliente) {
      throw new Error(
        'Las ventas a cuenta requieren un cliente.'
      );
    }

    // ----------------------------------------------------------
    // 2. HOJAS
    // ----------------------------------------------------------

    const shVentas =
      hojaV2_(ss, 'Ventas');

    const shDetalle =
      hojaV2_(ss, 'Detalle_Ventas');

    const shPagos =
      hojaV2_(ss, 'Pagos_Venta');

    const shProductos =
      hojaV2_(ss, 'Productos');

    const shMovimientos =
      hojaV2_(ss, 'Movimientos');

    const shCPC =
      hojaV2_(ss, 'Cuentas_Por_Cobrar');

    // ----------------------------------------------------------
    // 3. PRODUCTOS Y STOCK
    // ----------------------------------------------------------

    const productosData =
      shProductos
        .getDataRange()
        .getValues();

    const productosMap = {};

    for (
      let i = 1;
      i < productosData.length;
      i++
    ) {
      const codigo =
        String(
          productosData[i][0] || ''
        ).trim();

      if (!codigo) continue;

      productosMap[codigo] = {
        fila: i + 1,
        datos: productosData[i]
      };
    }

    const cantidadesPorCodigo = {};

    b.items.forEach(function(item) {
      const codigo =
        String(item.codigo || '').trim();

      const cantidad =
        Number(item.cantidad) || 0;

      if (!codigo) {
        throw new Error(
          'Hay un producto sin código.'
        );
      }

      if (cantidad <= 0) {
        throw new Error(
          'Cantidad inválida para ' + codigo
        );
      }

      if (!productosMap[codigo]) {
        throw new Error(
          'No existe el producto ' + codigo
        );
      }

      cantidadesPorCodigo[codigo] =
        (cantidadesPorCodigo[codigo] || 0) +
        cantidad;
    });

    // Validar el stock TOTAL solicitado,
    // incluso si el mismo producto aparece dos veces.

    Object.keys(
      cantidadesPorCodigo
    ).forEach(function(codigo) {
      const producto =
        productosMap[codigo];

      const stockActual =
        Number(
          producto.datos[5]
        ) || 0;

      const cantidadPedida =
        cantidadesPorCodigo[codigo];

      if (
        cantidadPedida >
        stockActual
      ) {
        throw new Error(
          'Stock insuficiente para ' +
          codigo +
          '. Disponible: ' +
          stockActual
        );
      }
    });

    // ----------------------------------------------------------
    // 4. CALCULAR ÍTEMS
    // ----------------------------------------------------------

    let precioLista = 0;
    let descuentoItems = 0;
    let costoMercaderia = 0;

    const detalleCalculado = [];

    b.items.forEach(function(item) {
      const codigo =
        String(item.codigo).trim();

      const cantidad =
        Number(item.cantidad);

      const prod =
        productosMap[codigo].datos;

      // Columnas actuales de Productos:
      // 0 código
      // 3 precio venta
      // 4 costo
      // 5 stock

      const precioUnitario =
        Math.round(
          Number(prod[3]) || 0
        );

      const costoUnitario =
        Math.round(
          Number(prod[4]) || 0
        );

      const brutoLinea =
        Math.round(
          precioUnitario *
          cantidad
        );

      const descuentoPctIngresado =
        Math.max(
          0,
          Number(
            item.descuento_item_pct
          ) || 0
        );

      const descuentoImporteIngresado =
        Math.max(
          0,
          Number(
            item.descuento_item_importe
          ) || 0
        );

      // Si viene importe fijo,
      // tiene prioridad sobre porcentaje.

      const descuentoPctUsado =
        descuentoImporteIngresado > 0
          ? 0
          : descuentoPctIngresado;

      let descuentoImporte = 0;

      if (
        descuentoImporteIngresado > 0
      ) {
        descuentoImporte =
          Math.round(
            descuentoImporteIngresado
          );
      } else {
        descuentoImporte =
          Math.round(
            brutoLinea *
            descuentoPctUsado /
            100
          );
      }

      // Nunca permitir descuento mayor
      // que el valor del producto.

      descuentoImporte =
        Math.min(
          descuentoImporte,
          brutoLinea
        );

      const subtotalCobrado =
        brutoLinea -
        descuentoImporte;

      const precioFinalUnitario =
        cantidad > 0
          ? Math.round(
              subtotalCobrado /
              cantidad
            )
          : 0;

      const costoTotal =
        Math.round(
          costoUnitario *
          cantidad
        );

      precioLista +=
        brutoLinea;

      descuentoItems +=
        descuentoImporte;

      costoMercaderia +=
        costoTotal;

      detalleCalculado.push({
        codigo:
          codigo,

        cantidad:
          cantidad,

        precioUnitario:
          precioUnitario,

        costoUnitario:
          costoUnitario,

        subtotalCobrado:
          subtotalCobrado,

        precioFinalUnitario:
          precioFinalUnitario,

        descuentoPct:
          descuentoPctUsado,

        descuentoImporte:
          descuentoImporte,

        costoTotal:
          costoTotal,

        margenItem:
          subtotalCobrado -
          costoTotal
      });
    });

    // ----------------------------------------------------------
    // 5. DESCUENTO GENERAL
    // ----------------------------------------------------------

    const subtotalDespuesItems =
      precioLista -
      descuentoItems;

    const descuentoGeneralPctIngresado =
      Math.max(
        0,
        Number(
          b.descuento_general_pct
        ) || 0
      );

    const descuentoGeneralImporteIngresado =
      Math.max(
        0,
        Number(
          b.descuento_general_importe
        ) || 0
      );

    // Importe fijo tiene prioridad.

    const descuentoGeneralPctUsado =
      descuentoGeneralImporteIngresado > 0
        ? 0
        : descuentoGeneralPctIngresado;

    let descuentoGeneral = 0;

    if (
      descuentoGeneralImporteIngresado > 0
    ) {
      descuentoGeneral =
        Math.round(
          descuentoGeneralImporteIngresado
        );
    } else {
      descuentoGeneral =
        Math.round(
          subtotalDespuesItems *
          descuentoGeneralPctUsado /
          100
        );
    }

    descuentoGeneral =
      Math.min(
        descuentoGeneral,
        subtotalDespuesItems
      );

    const baseComercial =
      subtotalDespuesItems -
      descuentoGeneral;

    // ----------------------------------------------------------
    // 6. MEDIOS DE PAGO
    // ----------------------------------------------------------

    const pagosEntrada =
      Array.isArray(b.pagos)
        ? b.pagos
        : [];

    const pagosCalculados = [];

    let totalBaseAsignada = 0;
    let montoPagado = 0;
    let costoCobranza = 0;
    let netoPagos = 0;
    let recargoClienteTotal = 0;
    let margenMinimoRequerido = 20;

    pagosEntrada.forEach(
      function(pago) {
        const idTarifa =
          String(
            pago.id_tarifa || ''
          ).trim();

        const baseAsignada =
          Math.round(
            Number(
              pago.base_asignada
            ) || 0
          );

        if (String(pago.id_medio || '').trim()) {
          throw new Error(
            'El medio de pago anterior ya no está disponible. Seleccioná una tarifa de cobro.'
          );
        }

        // Filas vacías se ignoran.
        if (!idTarifa && baseAsignada === 0) {
          return;
        }

        if (!idTarifa) {
          throw new Error(
            'Hay un pago sin forma de cobro.'
          );
        }

        if (baseAsignada <= 0) {
          throw new Error(
            'La base asignada debe ser mayor a cero.'
          );
        }

  const cobro =
    resolverCobroVentaV2_(
      ss,
      {
        id_tarifa: idTarifa,
        id_plan:
          String(
            pago.id_plan || ''
          ).trim(),
        base_asignada:
          baseAsignada
      }
    );

  const fechaAcreditacion =
    fechaMasDiasV2_(
      fecha,
      cobro.dias_acreditacion
    );

  totalBaseAsignada +=
    baseAsignada;

  montoPagado +=
    cobro.monto_cliente;

  costoCobranza +=
    cobro.costo_cobranza_total;

  netoPagos +=
    cobro.neto_esperado;

  recargoClienteTotal +=
    Math.max(
      0,
      cobro.monto_cliente -
      baseAsignada
    );

  margenMinimoRequerido =
    Math.max(
      margenMinimoRequerido,
      cobro.margen_minimo_pct
    );

  pagosCalculados.push({
    // Se conserva ID_Medio para compatibilidad,
    // pero el identificador real queda también
    // guardado como ID_Tarifa.
    idMedio:
      cobro.id_tarifa,

    idCuenta:
      cobro.id_cuenta,

    baseAsignada:
      baseAsignada,

    descuentoPct:
      0,

    descuentoImporte:
      0,

    montoCobrado:
      cobro.monto_cliente,

    comisionPct:
      cobro.costo_total_pct,

    comisionImporte:
      cobro.costo_cobranza_total,

    cfPct:
      0,

    cfImporte:
      0,

    netoEsperado:
      cobro.neto_esperado,

    diasAcreditacion:
      cobro.dias_acreditacion,

    fechaAcreditacion:
      fechaAcreditacion,

    idTarifa:
      cobro.id_tarifa,

    idPlan:
      cobro.id_plan,

    idProcesador:
      cobro.id_procesador,

    canalCobro:
      cobro.canal,

    tipoPagoCobro:
      cobro.tipo_pago,

    cuotas:
      cobro.cuotas,

    tarifaBasePct:
      cobro.tarifa_base_pct,

    ivaTarifaPct:
      cobro.iva_tarifa_pct,

    costoPlanPct:
      cobro.costo_plan_pct,

    recargoClientePct:
      cobro.recargo_cliente_pct,

    quienAbsorbe:
      cobro.quien_absorbe,

    montoClienteCobrado:
      cobro.monto_cliente,

    costoCobranzaTotal:
      cobro.costo_cobranza_total
  });

      }
    );

    // ----------------------------------------------------------
    // 7. VALIDAR DISTRIBUCIÓN DEL PAGO
    // ----------------------------------------------------------

    if (!esCuenta) {
      if (
        totalBaseAsignada !==
        baseComercial
      ) {
        throw new Error(
          'La suma de Base Asignada (' +
          totalBaseAsignada +
          ') debe ser igual a la Base Comercial (' +
          baseComercial +
          ').'
        );
      }
    } else {
      if (
        totalBaseAsignada >
        baseComercial
      ) {
        throw new Error(
          'El pago inicial no puede superar la Base Comercial.'
        );
      }
    }

    // ----------------------------------------------------------
    // 8. TOTALES FINALES
    // ----------------------------------------------------------

    const totalFinal =
      baseComercial +
      recargoClienteTotal;

    const saldoPendiente =
      Math.max(
        0,
        totalFinal -
        montoPagado
      );

    /*
      En cuenta corriente todavía no conocemos
      el costo del medio de pago que se usará
      para cobrar el saldo futuro.

      Por eso el Neto Esperado actual es:

      neto ya cobrado
      +
      saldo pendiente nominal.
    */

    const netoEsperado =
      netoPagos +
      saldoPendiente;

    const margenComercial =
      totalFinal -
      costoMercaderia;

    const margenEstimado =
      netoEsperado -
      costoMercaderia;

    const margenEstimadoPct =
  totalFinal > 0
    ? (
        margenEstimado /
        totalFinal *
        100
      )
    : 0;

const esAdministradorVenta =
  String(
    b.rol_sesion || ''
  )
    .trim()
    .toLowerCase() ===
  'administrador';

const confirmoMargenBajo =
  esAdministradorVenta &&
  b.confirmar_margen_bajo === true;

const margenBajo =
  margenMinimoRequerido > 0 &&
  margenEstimadoPct < margenMinimoRequerido;

if (b.solo_validar_margen === true) {
  return {
    ok: true,
    requiere_autorizacion: margenBajo
  };
}

if (
  margenBajo &&
  !confirmoMargenBajo
) {
  throw new Error(
    'MARGEN_BAJO|' +
    'El margen final sería ' +
    margenEstimadoPct.toFixed(1) +
    '% y el mínimo configurado es ' +
    margenMinimoRequerido.toFixed(1) +
    '%.'
  );
}

    let estadoPago = 'PENDIENTE';

    if (saldoPendiente <= 0) {
      estadoPago =
        'PAGADA';
    } else if (montoPagado > 0) {
      estadoPago =
        'PARCIAL';
    }

    const estadoLegacy =
      saldoPendiente > 0
        ? 'pendiente'
        : 'cobrada';

    const idVenta =
      'VTA-' +
      new Date().getTime();

    // ----------------------------------------------------------
    // 9. ESCRIBIR VENTA
    // ----------------------------------------------------------
    const pagoResumen =
      pagosCalculados.length === 1
      ? pagosCalculados[0]
      : {};

    appendPorEncabezadoV2_(
      shVentas,
      {
        ID_Venta:
          idVenta,

        Fecha:
          fecha,

        Tipo:
          tipo,

        ID_Cliente:
          b.id_cliente || '',

        // Campos históricos:
        Total_Bruto:
          precioLista,

        /*
          Mantenemos Total_Cobrado como
          valor final de la venta para no romper
          la lógica histórica de la pantalla V1.
        */
        Total_Cobrado:
          totalFinal,

        Total_Neto:
          netoEsperado,

        Estado:
          estadoLegacy,

        Notas:
          b.notas || '',

        Usuario_Registro:
          b.usuario_sesion || '',

        Canal_Venta:
          b.canal_venta || 'Local / presencial',

        Facturada:
          false,

        // Campos V2:
        Precio_Lista:
          precioLista,

        Descuento_Items:
          descuentoItems,

        Descuento_General_Pct:
          descuentoGeneralPctUsado,

        Descuento_General_Importe:
          descuentoGeneral,

        Base_Comercial:
          baseComercial,

        Descuento_Medios:
          0,

        Total_Final:
          totalFinal,

        Monto_Pagado:
          montoPagado,

        Saldo_Pendiente:
          saldoPendiente,

        Costo_Cobranza:
          costoCobranza,

        Neto_Esperado:
          netoEsperado,

        Costo_Mercaderia:
          costoMercaderia,

        Margen_Comercial:
          margenComercial,

        Margen_Estimado:
          margenEstimado,

        Estado_Pago:
          estadoPago,

        Origen_Modelo:
          'V2',

        ID_Tarifa:
          pagoResumen.idTarifa || '',

        ID_Plan:
          pagoResumen.idPlan || '',

        ID_Procesador:
          pagoResumen.idProcesador || '',

        Canal_Cobro:
          pagoResumen.canalCobro || '',

        Tipo_Pago_Cobro:
          pagoResumen.tipoPagoCobro || '',

        Cuotas:
          pagoResumen.cuotas || 1,

        Tarifa_Base_Pct:
          pagoResumen.tarifaBasePct || 0,

        IVA_Tarifa_Pct:
          pagoResumen.ivaTarifaPct || 0,

        Costo_Plan_Pct:
          pagoResumen.costoPlanPct || 0,

        Recargo_Cliente_Pct:
          pagoResumen.recargoClientePct || 0,

        Quien_Absorbe:
          pagoResumen.quienAbsorbe || 'ninguno',

        Monto_Cliente_Cobrado:
          pagoResumen.montoClienteCobrado ||
          pagoResumen.montoCobrado,

        Costo_Cobranza_Total:
          pagoResumen.costoCobranzaTotal ||
          (
            (Number(pagoResumen.comisionImporte) || 0) +
            (Number(pagoResumen.cfImporte) || 0)
          )
      }
    );

    // ----------------------------------------------------------
    // 10. DETALLE
    // ----------------------------------------------------------

    detalleCalculado.forEach(
      function(item) {
        appendPorEncabezadoV2_(
          shDetalle,
          {
            ID_Venta:
              idVenta,

            Codigo_Producto:
              item.codigo,

            Cantidad:
              item.cantidad,

            Precio_Unitario:
              item.precioUnitario,

            Precio_Cobrado:
              item.precioFinalUnitario,

            Costo_Unitario:
              item.costoUnitario,

            Subtotal_Cobrado:
              item.subtotalCobrado,

            Precio_Lista_Unitario:
              item.precioUnitario,

            Descuento_Item_Pct:
              item.descuentoPct,

            Descuento_Item_Importe:
              item.descuentoImporte,

            Precio_Final_Unitario:
              item.precioFinalUnitario,

            Costo_Total:
              item.costoTotal,

            Margen_Item:
              item.margenItem,

            Origen_Modelo:
              'V2'
          }
        );
      }
    );

    // ----------------------------------------------------------
    // 11. PAGOS
    // ----------------------------------------------------------

    pagosCalculados.forEach(
      function(pago) {
        const idPago =
          idV2_('PAG');

        const acreditadoYa =
          pago.diasAcreditacion === 0;

        appendPorEncabezadoV2_(
          shPagos,
          {
            ID_Venta:
              idVenta,

            ID_Medio:
              pago.idMedio,

            // Campos V1
            Monto_Bruto:
              pago.montoCobrado,

            Descuento_Aplicado:
              pago.descuentoPct,

            Comision_Aplicada:
              pago.comisionPct,

            CF_Aplicado:
              pago.cfPct,

            Monto_Neto:
              pago.netoEsperado,

            // Campos V2
            ID_Pago:
              idPago,

            ID_Cuenta:
              pago.idCuenta,

            Base_Asignada:
              pago.baseAsignada,

            Descuento_Pct:
              pago.descuentoPct,

            Descuento_Importe:
              pago.descuentoImporte,

            Monto_Cobrado:
              pago.montoCobrado,

            Comision_Pct:
              pago.comisionPct,

            Comision_Importe:
              pago.comisionImporte,

            CF_Pct:
              pago.cfPct,

            CF_Importe:
              pago.cfImporte,

            Neto_Esperado:
              pago.netoEsperado,

            Fecha_Acreditacion_Estimada:
              pago.fechaAcreditacion,

            Neto_Acreditado:
              acreditadoYa
                ? pago.netoEsperado
                : '',

            Fecha_Acreditacion_Real:
              acreditadoYa
                ? fecha
                : '',

            Estado_Pago:
              acreditadoYa
                ? 'ACREDITADO'
                : 'PENDIENTE_ACREDITACION',

            Origen_Modelo:
              'V2',

            ID_Tarifa:
              pago.idTarifa || '',

            ID_Plan:
              pago.idPlan || '',

            ID_Procesador:
              pago.idProcesador || '',

            Canal_Cobro:
              pago.canalCobro || '',

            Tipo_Pago_Cobro:
              pago.tipoPagoCobro || '',

            Cuotas:
              pago.cuotas || 1,

            Tarifa_Base_Pct:
              pago.tarifaBasePct || 0,

            IVA_Tarifa_Pct:
              pago.ivaTarifaPct || 0,

            Costo_Plan_Pct:
              pago.costoPlanPct || 0,

            Recargo_Cliente_Pct:
              pago.recargoClientePct || 0,

            Quien_Absorbe:
              pago.quienAbsorbe || 'ninguno',

            Monto_Cliente_Cobrado:
              pago.montoClienteCobrado ||
              pago.montoCobrado,

            Costo_Cobranza_Total:
              pago.costoCobranzaTotal ||
              (
                (Number(pago.comisionImporte) || 0) +
                (Number(pago.cfImporte) || 0)
              )
          }
        );

        // Movimientos conserva por ahora
        // la estructura actual de 10 columnas.

        shMovimientos.appendRow([
          idV2_('MOV'),
          fecha,
          pago.idCuenta,
          'ingreso',
          'Venta',
          pago.netoEsperado,
          'Venta V2 ' + idVenta,
          idVenta,
          'venta_v2',
          pago.fechaAcreditacion
        ]);
      }
    );

    // ----------------------------------------------------------
    // 12. CUENTA POR COBRAR
    // ----------------------------------------------------------

    if (saldoPendiente > 0) {
      const idCPC =
        idV2_('CPC');

      shCPC.appendRow([
        idCPC,
        idVenta,
        b.id_cliente || '',
        totalFinal,
        montoPagado,
        saldoPendiente,
        montoPagado > 0
          ? 'cobrada_parcial'
          : 'pendiente',
        b.fecha_vencimiento || ''
      ]);
    }

    // ----------------------------------------------------------
    // 13. DESCONTAR STOCK
    // ----------------------------------------------------------

    Object.keys(
      cantidadesPorCodigo
    ).forEach(function(codigo) {
      const producto =
        productosMap[codigo];

      const stockActual =
        Number(
          producto.datos[5]
        ) || 0;

      const cantidad =
        cantidadesPorCodigo[codigo];

      shProductos
        .getRange(
          producto.fila,
          6
        )
        .setValue(
          stockActual -
          cantidad
        );
    });

    SpreadsheetApp.flush();

    // ----------------------------------------------------------
    // 14. RESPUESTA
    // ----------------------------------------------------------

    return {
      ok: true,

      id:
        idVenta,

      precio_lista:
        precioLista,

      base_comercial:
        baseComercial,

      descuento_medios:
        0,

      total_final:
        totalFinal,

      monto_pagado:
        montoPagado,

      saldo_pendiente:
        saldoPendiente,

      costo_cobranza:
        costoCobranza,

      neto_esperado:
        netoEsperado,

      costo_mercaderia:
        costoMercaderia,

      margen_comercial:
        margenComercial,

      margen_estimado:
        margenEstimado,

      estado_pago:
        estadoPago
    };

  } finally {
    lock.releaseLock();
  }
}


function setPorEncabezadoV2_(sheet, numeroFila, valores) {
  const info = encabezadosV2_(sheet);

  Object.keys(valores).forEach(function(nombreColumna) {
    if (
      Object.prototype.hasOwnProperty.call(
        info.mapa,
        nombreColumna
      )
    ) {
      sheet
        .getRange(
          numeroFila,
          info.mapa[nombreColumna] + 1
        )
        .setValue(valores[nombreColumna]);
    }
  });
}


function buscarFilaPorIdV2_(sheet, nombreColumna, idBuscado) {
  const info = encabezadosV2_(sheet);

  if (
    !Object.prototype.hasOwnProperty.call(
      info.mapa,
      nombreColumna
    )
  ) {
    throw new Error(
      'No existe la columna ' +
      nombreColumna +
      ' en ' +
      sheet.getName()
    );
  }

  const data =
    sheet
      .getDataRange()
      .getValues();

  const idx =
    info.mapa[nombreColumna];

  for (let i = 1; i < data.length; i++) {
    if (
      String(data[i][idx]).trim() ===
      String(idBuscado).trim()
    ) {
      return {
        fila: i + 1,
        datos: data[i],
        headers: info
      };
    }
  }

  return null;
}


// ============================================================
// CANCELAR VENTA V2
// ============================================================

function cancelarVentaV2_(ss, b) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    if (!b || !b.id_venta) {
      throw new Error(
        'Falta indicar el ID de la venta.'
      );
    }

    const idVenta =
      String(b.id_venta).trim();

    const fechaCancelacion =
      b.fecha ||
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        'yyyy-MM-dd'
      );

    const motivo =
      String(
        b.motivo ||
        'Cancelación de venta'
      ).trim();

    const shVentas =
      hojaV2_(ss, 'Ventas');

    const shDetalle =
      hojaV2_(ss, 'Detalle_Ventas');

    const shProductos =
      hojaV2_(ss, 'Productos');

    const shPagos =
      hojaV2_(ss, 'Pagos_Venta');

    const shMovimientos =
      hojaV2_(ss, 'Movimientos');

    const shCPC =
      hojaV2_(ss, 'Cuentas_Por_Cobrar');

    // --------------------------------------------------------
    // 1. BUSCAR VENTA
    // --------------------------------------------------------

    const venta =
      buscarFilaPorIdV2_(
        shVentas,
        'ID_Venta',
        idVenta
      );

    if (!venta) {
      throw new Error(
        'No existe la venta ' + idVenta
      );
    }

    const idxEstado =
      venta.headers.mapa['Estado'];

    const idxOrigen =
      venta.headers.mapa['Origen_Modelo'];

    const estadoActual =
      idxEstado !== undefined
        ? String(
            venta.datos[idxEstado] || ''
          ).toLowerCase()
        : '';

    const origen =
      idxOrigen !== undefined
        ? String(
            venta.datos[idxOrigen] || ''
          )
        : '';

    if (origen !== 'V2') {
      throw new Error(
        'Esta acción sólo puede cancelar ventas V2.'
      );
    }

    if (estadoActual === 'cancelada') {
      throw new Error(
        'La venta ya se encuentra cancelada.'
      );
    }

    const idxFacturada = venta.headers.mapa['Facturada'];
    asegurarVentaSinFactura_(
      ss,
      idVenta,
      idxFacturada !== undefined ? venta.datos[idxFacturada] : ''
    );

    // --------------------------------------------------------
    // 2. DEVOLVER STOCK
    // --------------------------------------------------------

    const infoDetalle =
      encabezadosV2_(shDetalle);

    const detalleData =
      shDetalle
        .getDataRange()
        .getValues();

    const idxDetVenta =
      infoDetalle.mapa['ID_Venta'];

    const idxCodigo =
      infoDetalle.mapa['Codigo_Producto'];

    const idxCantidad =
      infoDetalle.mapa['Cantidad'];

    if (
      idxDetVenta === undefined ||
      idxCodigo === undefined ||
      idxCantidad === undefined
    ) {
      throw new Error(
        'Detalle_Ventas no tiene la estructura requerida.'
      );
    }

    const cantidades = {};

    for (
      let i = 1;
      i < detalleData.length;
      i++
    ) {
      if (
        String(
          detalleData[i][idxDetVenta]
        ).trim() !== idVenta
      ) {
        continue;
      }

      const codigo =
        String(
          detalleData[i][idxCodigo]
        ).trim();

      const cantidad =
        Number(
          detalleData[i][idxCantidad]
        ) || 0;

      cantidades[codigo] =
        (cantidades[codigo] || 0) +
        cantidad;
    }

    if (
      Object.keys(cantidades).length === 0
    ) {
      throw new Error(
        'No se encontró el detalle de la venta.'
      );
    }

    const prodData =
      shProductos
        .getDataRange()
        .getValues();

    const prodMap = {};

    for (
      let i = 1;
      i < prodData.length;
      i++
    ) {
      prodMap[
        String(prodData[i][0]).trim()
      ] = {
        fila: i + 1,
        stock:
          Number(prodData[i][5]) || 0
      };
    }

    Object.keys(cantidades)
      .forEach(function(codigo) {
        if (!prodMap[codigo]) {
          throw new Error(
            'No existe el producto ' +
            codigo +
            ' al intentar devolver stock.'
          );
        }
      });

    // --------------------------------------------------------
    // 3. PAGOS V2
    // --------------------------------------------------------

    const infoPagos =
      encabezadosV2_(shPagos);

    const pagosData =
      shPagos
        .getDataRange()
        .getValues();

    const idxPagoVenta =
      infoPagos.mapa['ID_Venta'];

    const idxPagoCuenta =
      infoPagos.mapa['ID_Cuenta'];

    const idxPagoNeto =
      infoPagos.mapa['Neto_Esperado'];

    const idxPagoEstado =
      infoPagos.mapa['Estado_Pago'];

    const idxPagoAcred =
      infoPagos.mapa[
        'Fecha_Acreditacion_Estimada'
      ];

    const pagosVenta = [];

    for (
      let i = 1;
      i < pagosData.length;
      i++
    ) {
      if (
        String(
          pagosData[i][idxPagoVenta]
        ).trim() !== idVenta
      ) {
        continue;
      }

      pagosVenta.push({
        fila: i + 1,

        idCuenta:
          idxPagoCuenta !== undefined
            ? String(
                pagosData[i][idxPagoCuenta] ||
                ''
              )
            : '',

        neto:
          idxPagoNeto !== undefined
            ? Number(
                pagosData[i][idxPagoNeto]
              ) || 0
            : 0,

        estado:
          idxPagoEstado !== undefined
            ? String(
                pagosData[i][idxPagoEstado] ||
                ''
              )
            : '',

        fechaAcred:
          idxPagoAcred !== undefined
            ? pagosData[i][idxPagoAcred]
            : ''
      });
    }

    // --------------------------------------------------------
    // 4. MOVIMIENTOS ORIGINALES
    // --------------------------------------------------------

    const movData =
      shMovimientos
        .getDataRange()
        .getValues();

    const movimientosVenta = [];

    for (
      let i = 1;
      i < movData.length;
      i++
    ) {
      const idOrigen =
        String(
          movData[i][7] || ''
        ).trim();

      const tipoOrigen =
        String(
          movData[i][8] || ''
        ).trim();

      if (
        idOrigen === idVenta &&
        tipoOrigen === 'venta_v2'
      ) {
        movimientosVenta.push({
          fila: i + 1,
          idCuenta:
            String(movData[i][2] || ''),
          monto:
            Number(movData[i][5]) || 0,
          descripcion:
            String(movData[i][6] || ''),
          fechaAcreditacion:
            movData[i][9]
        });
      }
    }

    /*
      Si el dinero todavía estaba pendiente,
      neutralizamos el ingreso futuro.

      Además dejamos una nueva fila tipo "reversion"
      para mantener la trazabilidad del importe original.

      Los reportes actuales sólo suman ingreso/egreso,
      por lo que "reversion" queda como registro de auditoría
      sin alterar nuevamente el saldo.
    */

    movimientosVenta.forEach(
      function(mov) {
        const montoOriginal =
          mov.monto;

        shMovimientos
          .getRange(
            mov.fila,
            6
          )
          .setValue(0);

        shMovimientos
          .getRange(
            mov.fila,
            7
          )
          .setValue(
            '[CANCELADA] ' +
            mov.descripcion
          );

        shMovimientos.appendRow([
          idV2_('MOV'),
          fechaCancelacion,
          mov.idCuenta,
          'reversion',
          'Cancelación venta',
          montoOriginal,
          motivo +
            ' — ' +
            idVenta,
          idVenta,
          'cancelacion_venta_v2',
          fechaCancelacion
        ]);
      }
    );

    // --------------------------------------------------------
    // 5. MARCAR PAGOS CANCELADOS
    // --------------------------------------------------------

    pagosVenta.forEach(function(pago) {
      setPorEncabezadoV2_(
        shPagos,
        pago.fila,
        {
          Estado_Pago:
            'CANCELADO',

          Neto_Acreditado:
            0,

          Fecha_Acreditacion_Real:
            ''
        }
      );
    });

    // --------------------------------------------------------
    // 6. CANCELAR CUENTA POR COBRAR SI EXISTE
    // --------------------------------------------------------

    const infoCPC =
      encabezadosV2_(shCPC);

    const cpcData =
      shCPC
        .getDataRange()
        .getValues();

    const idxCpcVenta =
      infoCPC.mapa['ID_Venta'];

    const idxCpcEstado =
      infoCPC.mapa['Estado'];

    if (
      idxCpcVenta !== undefined
    ) {
      for (
        let i = 1;
        i < cpcData.length;
        i++
      ) {
        if (
          String(
            cpcData[i][idxCpcVenta]
          ).trim() === idVenta
        ) {

        setPorEncabezadoV2_(
          shCPC,
          i + 1,
          {
            Monto_Cobrado: 0,
            Saldo: 0,
            Estado: 'cancelada'
            }
        );

        }
      }
    }

    // --------------------------------------------------------
    // 7. DEVOLVER STOCK
    // --------------------------------------------------------

    Object.keys(cantidades)
      .forEach(function(codigo) {
        const producto =
          prodMap[codigo];

        shProductos
          .getRange(
            producto.fila,
            6
          )
          .setValue(
            producto.stock +
            cantidades[codigo]
          );
      });

    // --------------------------------------------------------
    // 8. MARCAR VENTA CANCELADA
    // --------------------------------------------------------

    const notasPrevias =
      venta.headers.mapa['Notas'] !==
      undefined
        ? String(
            venta.datos[
              venta.headers.mapa['Notas']
            ] || ''
          )
        : '';

    const notaCancelacion =
      (
        notasPrevias
          ? notasPrevias + ' | '
          : ''
      ) +
      'CANCELADA ' +
      fechaCancelacion +
      ': ' +
      motivo;

    setPorEncabezadoV2_(
      shVentas,
      venta.fila,
      {
        Estado:
          'cancelada',
        Estado_Pago:
          'CANCELADA',
        Monto_Pagado: 0,
        Saldo_Pendiente: 0,
        Costo_Cobranza: 0,
        Neto_Esperado: 0,
        Total_Neto: 0,
        Notas: notaCancelacion
      }
    );

    SpreadsheetApp.flush();

    return {
      ok: true,
      id_venta: idVenta,
      estado: 'cancelada',
      stock_reintegrado:
        cantidades,
      pagos_cancelados:
        pagosVenta.length,
      movimientos_revertidos:
        movimientosVenta.length
    };

  } finally {
    lock.releaseLock();
  }
}


function crearTarifaCobroV2_(
  ss,
  datos,
  sesion
) {
  const sh =
    hojaV2_(ss, 'Tarifas_Cobro');

  const idCuenta =
    String(datos.ID_Cuenta || '').trim();

  const idProcesador =
    String(datos.ID_Procesador || '').trim();

  const canal =
    String(datos.Canal || '').trim();

  const tipoPago =
    String(datos.Tipo_Pago || '').trim();

  const dias =
    Math.max(
      0,
      Number(datos.Dias_Acreditacion) || 0
    );

  if (!idCuenta) {
    throw new Error('Seleccioná una cuenta.');
  }

  if (!idProcesador) {
    throw new Error('Seleccioná un procesador.');
  }

  if (!canal) {
    throw new Error('Ingresá el canal.');
  }

  if (!tipoPago) {
    throw new Error('Ingresá el tipo de pago.');
  }

  const info =
    encabezadosV2_(sh);

  const filas =
    sh.getDataRange().getValues().slice(1);

  const valor = function(fila, nombre) {
    return fila[info.mapa[nombre]];
  };

  const yaExiste =
    filas.some(function(fila) {
      return (
        String(
          valor(fila, 'ID_Cuenta') || ''
        ) === idCuenta &&
        String(
          valor(fila, 'ID_Procesador') || ''
        ) === idProcesador &&
        String(
          valor(fila, 'Canal') || ''
        ).trim().toLowerCase() ===
          canal.toLowerCase() &&
        String(
          valor(fila, 'Tipo_Pago') || ''
        ).trim().toLowerCase() ===
          tipoPago.toLowerCase() &&
        Number(
          valor(fila, 'Dias_Acreditacion')
        ) === dias
      );
    });

  if (yaExiste) {
    throw new Error(
      'Ya existe una tarifa con esa cuenta, canal, tipo de pago y acreditación.'
    );
  }

  const idTarifa =
    idV2_('TAR');

  appendPorEncabezadoV2_(
    sh,
    {
      ID_Tarifa:
        idTarifa,

      ID_Cuenta:
        idCuenta,

      ID_Procesador:
        idProcesador,

      Canal:
        canal,

      Tipo_Pago:
        tipoPago,

      Dias_Acreditacion:
        dias,

      Comision_Base_Pct:
        Math.max(
          0,
          Number(
            datos.Comision_Base_Pct
          ) || 0
        ),

      IVA_Pct:
        Math.max(
          0,
          Number(datos.IVA_Pct) || 0
        ),

      Vigencia_Desde:
        Utilities.formatDate(
          new Date(),
          Session.getScriptTimeZone(),
          'yyyy-MM-dd'
        ),

      Vigencia_Hasta:
        '',

      Activo:
        datos.Activo !== false,

      Notas:
        String(datos.Notas || '').trim()
    }
  );

  const historial =
    ss.getSheetByName(
      'Historial_Tarifas_Cobro'
    );

  if (historial) {
    appendPorEncabezadoV2_(
      historial,
      {
        Fecha:
          new Date(),

        ID_Tarifa:
          idTarifa,

        Campo:
          'Creación',

        Valor_Anterior:
          '',

        Valor_Nuevo:
          'Tarifa creada',

        Motivo:
          'Alta de nuevo canal',

        Usuario:
          String(
            sesion.usuario || ''
          )
      }
    );
  }

  return {
    ok: true,
    id_tarifa: idTarifa
  };
}

function crearProcesadorCobroV2_(
  ss,
  nombre,
  sesion
) {
  const sh =
    hojaV2_(ss, 'Procesadores_Cobro');

  const nombreLimpio =
    String(nombre || '').trim();

  if (!nombreLimpio) {
    throw new Error(
      'Ingresá el nombre del procesador.'
    );
  }

  const info =
    encabezadosV2_(sh);

  const filas =
    sh.getDataRange().getValues();

  const idxNombre =
    info.mapa.Nombre;

  const repetido =
    filas.slice(1).some(function(fila) {
      return (
        String(fila[idxNombre] || '')
          .trim()
          .toLowerCase() ===
        nombreLimpio.toLowerCase()
      );
    });

  if (repetido) {
    throw new Error(
      'Ya existe un procesador con ese nombre.'
    );
  }

  const id =
    idV2_('PROC');

  appendPorEncabezadoV2_(
    sh,
    {
      ID_Procesador:
        id,

      Nombre:
        nombreLimpio,

      Activo:
        true
    }
  );

  return {
    ok: true,
    id_procesador: id
  };
}


function editarProcesadorCobroV2_(
  ss,
  idProcesador,
  cambios,
  sesion
) {
  const sh =
    hojaV2_(ss, 'Procesadores_Cobro');

  const info =
    encabezadosV2_(sh);

  const id =
    String(idProcesador || '').trim();

  if (!id) {
    throw new Error(
      'Falta el procesador.'
    );
  }

  const datos =
    sh.getDataRange().getValues();

  let filaEncontrada = -1;

  for (
    let i = 1;
    i < datos.length;
    i++
  ) {
    if (
      String(
        datos[i][
          info.mapa.ID_Procesador
        ] || ''
      ).trim() === id
    ) {
      filaEncontrada = i + 1;
      break;
    }
  }

  if (filaEncontrada === -1) {
    throw new Error(
      'No se encontró el procesador.'
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      cambios,
      'Nombre'
    )
  ) {
    const nombre =
      String(cambios.Nombre || '').trim();

    if (!nombre) {
      throw new Error(
        'Ingresá el nombre del procesador.'
      );
    }

    const repetido =
      datos.slice(1).some(function(fila) {
        return (
          String(
            fila[
              info.mapa.ID_Procesador
            ] || ''
          ).trim() !== id &&
          String(
            fila[info.mapa.Nombre] || ''
          )
            .trim()
            .toLowerCase() ===
            nombre.toLowerCase()
        );
      });

    if (repetido) {
      throw new Error(
        'Ya existe un procesador con ese nombre.'
      );
    }

    sh
      .getRange(
        filaEncontrada,
        info.mapa.Nombre + 1
      )
      .setValue(nombre);
  }

  if (
    Object.prototype.hasOwnProperty.call(
      cambios,
      'Activo'
    )
  ) {
    sh
      .getRange(
        filaEncontrada,
        info.mapa.Activo + 1
      )
      .setValue(
        cambios.Activo === true
      );
  }

  return {
    ok: true,
    id_procesador: id
  };
}


function eliminarProcesadorCobroV2_(
  ss,
  idProcesador,
  sesion
) {
  const id =
    String(idProcesador || '').trim();

  if (!id) {
    throw new Error(
      'Falta el procesador.'
    );
  }

  const referencias = [
    {
      hoja: 'Tarifas_Cobro',
      columna: 'ID_Procesador'
    },
    {
      hoja: 'Planes_Cuotas',
      columna: 'ID_Procesador'
    }
  ];

  referencias.forEach(function(ref) {
    const shRef =
      ss.getSheetByName(ref.hoja);

    if (!shRef || shRef.getLastRow() < 2) {
      return;
    }

    const infoRef =
      encabezadosV2_(shRef);

    const idx =
      infoRef.mapa[ref.columna];

    if (idx === undefined) {
      return;
    }

    const usado =
      shRef
        .getDataRange()
        .getValues()
        .slice(1)
        .some(function(fila) {
          return (
            String(fila[idx] || '').trim() ===
            id
          );
        });

    if (usado) {
      throw new Error(
        'Este procesador ya está asociado a tarifas o planes. Desactivalo en lugar de eliminarlo.'
      );
    }
  });

  const sh =
    hojaV2_(ss, 'Procesadores_Cobro');

  const info =
    encabezadosV2_(sh);

  const datos =
    sh.getDataRange().getValues();

  let filaEncontrada = -1;

  for (
    let i = 1;
    i < datos.length;
    i++
  ) {
    if (
      String(
        datos[i][
          info.mapa.ID_Procesador
        ] || ''
      ).trim() === id
    ) {
      filaEncontrada = i + 1;
      break;
    }
  }

  if (filaEncontrada === -1) {
    throw new Error(
      'No se encontró el procesador.'
    );
  }

  sh.deleteRow(filaEncontrada);

  return {
    ok: true,
    id_procesador: id,
    eliminado: true
  };
}

function hojaUsaValor_(ss, nombreHoja, encabezado, valor) {
  const hoja = ss.getSheetByName(nombreHoja);

  if (!hoja || hoja.getLastRow() < 2) {
    return false;
  }

  const encabezados =
    hoja.getRange(1, 1, 1, hoja.getLastColumn())
      .getDisplayValues()[0];

  const columna = encabezados.indexOf(encabezado);

  if (columna === -1) {
    return false;
  }

  const valores =
    hoja.getRange(2, columna + 1, hoja.getLastRow() - 1, 1)
      .getDisplayValues();

  return valores.some(function(fila) {
    return String(fila[0]).trim() === String(valor).trim();
  });
}


function eliminarFilaPorId_(ss, nombreHoja, encabezadoId, id) {
  const hoja = ss.getSheetByName(nombreHoja);

  if (!hoja) {
    throw new Error('No existe la hoja ' + nombreHoja + '.');
  }

  const datos = hoja.getDataRange().getDisplayValues();
  const columnaId = datos[0].indexOf(encabezadoId);

  if (columnaId === -1) {
    throw new Error(
      'No se encontró el encabezado ' + encabezadoId + '.'
    );
  }

  for (let i = 1; i < datos.length; i++) {
    if (
      String(datos[i][columnaId]).trim() ===
      String(id).trim()
    ) {
      hoja.deleteRow(i + 1);

      return {
        ok: true,
        id: id,
        eliminado: true
      };
    }
  }

  throw new Error('No se encontró el registro.');
}


function eliminarCuentaSegura_(ss, idCuenta) {
  if (!idCuenta) {
    throw new Error('Falta identificar la cuenta.');
  }

  const utilizada =
    hojaUsaValor_(
      ss,
      'Movimientos',
      'ID_Cuenta',
      idCuenta
    ) ||
    hojaUsaValor_(
      ss,
      'Tarifas_Cobro',
      'ID_Cuenta',
      idCuenta
    ) ||
    hojaUsaValor_(
      ss,
      'Pagos_Venta',
      'ID_Cuenta',
      idCuenta
    );

  if (utilizada) {
    throw new Error(
      'Esta cuenta ya fue utilizada. Podés desactivarla, pero no eliminarla.'
    );
  }

  return eliminarFilaPorId_(
    ss,
    'Cuentas',
    'ID_Cuenta',
    idCuenta
  );
}


function eliminarPlanCuotasSeguro_(ss, idPlan) {
  if (!idPlan) {
    throw new Error('Falta identificar el plan.');
  }

  if (
    hojaUsaValor_(
      ss,
      'Pagos_Venta',
      'ID_Plan',
      idPlan
    )
  ) {
    throw new Error(
      'Este plan ya fue utilizado en una venta. Podés desactivarlo, pero no eliminarlo.'
    );
  }

  return eliminarFilaPorId_(
    ss,
    'Planes_Cuotas',
    'ID_Plan',
    idPlan
  );
}

function eliminarTarifaCobroSegura_(ss, idTarifa) {
  if (!idTarifa) {
    throw new Error('Falta identificar el canal.');
  }

  if (
    hojaUsaValor_(
      ss,
      'Pagos_Venta',
      'ID_Tarifa',
      idTarifa
    )
  ) {
    throw new Error(
      'Este canal ya fue utilizado en una venta. Podés desactivarlo, pero no eliminarlo.'
    );
  }

  return eliminarFilaPorId_(
    ss,
    'Tarifas_Cobro',
    'ID_Tarifa',
    idTarifa
  );
}
