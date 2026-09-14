function datosPorEncabezadoCobroV2_(hoja) {
  const datos = hoja.getDataRange().getValues();

  if (!datos.length) {
    return {
      encabezados: [],
      filas: []
    };
  }

  const encabezados = datos[0].map(function(valor) {
    return String(valor || '').trim();
  });

  const filas = [];

  for (let i = 1; i < datos.length; i++) {
    const objeto = {};

    encabezados.forEach(function(nombre, indice) {
      objeto[nombre] = datos[i][indice];
    });

    filas.push(objeto);
  }

  return {
    encabezados: encabezados,
    filas: filas
  };
}


function activoCobroV2_(valor) {
  return (
    valor === true ||
    String(valor).toUpperCase() === 'TRUE' ||
    Number(valor) === 1
  );
}


function resolverCobroVentaV2_(ss, pago) {
  const idTarifa =
    String(pago.id_tarifa || '').trim();

  const idPlan =
    String(pago.id_plan || '').trim();

  const baseAsignada =
    Math.round(
      Number(pago.base_asignada) || 0
    );

  if (!idTarifa) {
    throw new Error(
      'Seleccioná un canal y una tarifa de cobro.'
    );
  }

  if (baseAsignada <= 0) {
    throw new Error(
      'El importe asignado debe ser mayor a cero.'
    );
  }

  const hojaTarifas =
    ss.getSheetByName('Tarifas_Cobro');

  const hojaPlanes =
    ss.getSheetByName('Planes_Cuotas');

  if (!hojaTarifas || !hojaPlanes) {
    throw new Error(
      'Falta la configuración de cobros.'
    );
  }

  const tarifas =
    datosPorEncabezadoCobroV2_(
      hojaTarifas
    ).filas;

  const planes =
    datosPorEncabezadoCobroV2_(
      hojaPlanes
    ).filas;

  const tarifa = tarifas.find(function(item) {
    return (
      String(item.ID_Tarifa || '').trim() ===
      idTarifa
    );
  });

  if (!tarifa) {
    throw new Error(
      'No existe la tarifa ' + idTarifa + '.'
    );
  }

  if (!activoCobroV2_(tarifa.Activo)) {
    throw new Error(
      'La tarifa seleccionada está inactiva.'
    );
  }

  let plan = null;

  if (idPlan) {
    plan = planes.find(function(item) {
      return (
        String(item.ID_Plan || '').trim() ===
        idPlan
      );
    });

    if (!plan) {
      throw new Error(
        'No existe el plan ' + idPlan + '.'
      );
    }

    if (!activoCobroV2_(plan.Activo)) {
      throw new Error(
        'El plan seleccionado está inactivo.'
      );
    }

    const procesadorTarifa =
      String(
        tarifa.ID_Procesador || ''
      ).trim();

    const procesadorPlan =
      String(
        plan.ID_Procesador || ''
      ).trim();

    if (
      procesadorPlan &&
      procesadorPlan !== procesadorTarifa
    ) {
      throw new Error(
        'El plan no corresponde al procesador seleccionado.'
      );
    }

    const canalTarifa =
      String(tarifa.Canal || '').trim();

    const canalPlan =
      String(plan.Canal || '').trim();

    if (
      canalPlan &&
      canalPlan !== '*' &&
      canalPlan !== canalTarifa
    ) {
      throw new Error(
        'El plan no corresponde al canal seleccionado.'
      );
    }

    const montoMinimo =
      Number(plan.Monto_Minimo) || 0;

    const montoMaximo =
      Number(plan.Monto_Maximo) || 0;

    if (
      montoMinimo > 0 &&
      baseAsignada < montoMinimo
    ) {
      throw new Error(
        'Este plan requiere una venta mínima de $' +
        montoMinimo.toLocaleString('es-AR') +
        '.'
      );
    }

    if (
      montoMaximo > 0 &&
      baseAsignada > montoMaximo
    ) {
      throw new Error(
        'Este plan admite como máximo $' +
        montoMaximo.toLocaleString('es-AR') +
        '.'
      );
    }
  }

  const tarifaBasePct =
    Math.max(
      0,
      Number(tarifa.Comision_Base_Pct) || 0
    );

  const ivaPct =
    Math.max(
      0,
      Number(tarifa.IVA_Pct) || 0
    );

  const quienAbsorbe =
    String(
      plan
        ? plan.Quien_Absorbe || 'ninguno'
        : 'ninguno'
    )
      .trim()
      .toLowerCase();

  const costoPlanPct =
    plan &&
    (
      quienAbsorbe === 'negocio' ||
      quienAbsorbe === 'compartido'
    )
      ? Math.max(
          0,
          Number(plan.Costo_Negocio_Pct) || 0
        )
      : 0;

  const recargoClientePct =
    plan &&
    (
      quienAbsorbe === 'cliente' ||
      quienAbsorbe === 'compartido'
    )
      ? Math.max(
          0,
          Number(plan.Recargo_Cliente_Pct) || 0
        )
      : 0;

  const cuotas =
    Math.max(
      1,
      Number(plan ? plan.Cuotas : 1) || 1
    );

  if (
    cuotas > 1 &&
    quienAbsorbe === 'cliente' &&
    recargoClientePct <= 0
  ) {
    throw new Error(
      'El recargo al cliente de este plan todavía no está configurado.'
    );
  }

  const montoCliente =
    Math.round(
      baseAsignada *
      (1 + recargoClientePct / 100)
    );

  // Tanto la tarifa de cobro como el costo del plan
  // están informados sin IVA.
  const costoSinIvaPct =
    tarifaBasePct + costoPlanPct;

  const costoTotalPct =
    costoSinIvaPct *
    (1 + ivaPct / 100);

  const costoCobranzaTotal =
    Math.round(
      montoCliente *
      costoTotalPct /
      100
    );

  const netoEsperado =
    montoCliente -
    costoCobranzaTotal;

  return {
    id_tarifa:
      String(tarifa.ID_Tarifa || ''),

    id_plan:
      plan
        ? String(plan.ID_Plan || '')
        : '',

    id_cuenta:
      String(tarifa.ID_Cuenta || ''),

    id_procesador:
      String(tarifa.ID_Procesador || ''),

    canal:
      String(tarifa.Canal || ''),

    tipo_pago:
      String(tarifa.Tipo_Pago || ''),

    dias_acreditacion:
      Math.max(
        0,
        Number(tarifa.Dias_Acreditacion) || 0
      ),

    cuotas: cuotas,
    base_asignada: baseAsignada,
    tarifa_base_pct: tarifaBasePct,
    iva_tarifa_pct: ivaPct,
    costo_plan_pct: costoPlanPct,
    recargo_cliente_pct: recargoClientePct,
    quien_absorbe: quienAbsorbe,
    monto_cliente: montoCliente,
    costo_total_pct: costoTotalPct,
    costo_cobranza_total:
      costoCobranzaTotal,
    neto_esperado: netoEsperado,

    margen_minimo_pct:
      Math.max(
        0,
        Number(
          plan
            ? plan.Margen_Minimo_Pct
            : 0
        ) || 0
      )
  };
}

function TEST_resolverCobroVentaV2() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const hojaTarifas =
    ss.getSheetByName('Tarifas_Cobro');

  const tarifas =
    datosPorEncabezadoCobroV2_(
      hojaTarifas
    ).filas;

  const tarifaLink10 =
    tarifas.find(function(item) {
      return (
        String(item.Canal || '').trim() ===
          'Link de pago' &&
        Number(item.Dias_Acreditacion) === 10
      );
    });

  if (!tarifaLink10) {
    throw new Error(
      'No se encontró Link de pago a 10 días.'
    );
  }

  const hojaPlanes =
    ss.getSheetByName('Planes_Cuotas');

  const planes =
    datosPorEncabezadoCobroV2_(
      hojaPlanes
    ).filas;

  const plan2 =
    planes.find(function(item) {
      return Number(item.Cuotas) === 2;
    });

  if (!plan2) {
    throw new Error(
      'No se encontró el plan de 2 cuotas.'
    );
  }

  const resultado =
    resolverCobroVentaV2_(
      ss,
      {
        id_tarifa:
          tarifaLink10.ID_Tarifa,

        id_plan:
          plan2.ID_Plan,

        base_asignada:
          100000
      }
    );

  Logger.log(
    JSON.stringify(resultado, null, 2)
  );
}

function crearPlanCuotasV2_(
  ss,
  datos,
  sesion
) {
  const sh =
    ss.getSheetByName('Planes_Cuotas');

  if (!sh) {
    throw new Error(
      'No existe la hoja Planes_Cuotas.'
    );
  }

  const idProcesador =
    String(
      datos.ID_Procesador || ''
    ).trim();

  const canal =
    String(datos.Canal || '*').trim() ||
    '*';

  const cuotas =
    Math.max(
      1,
      Math.round(
        Number(datos.Cuotas) || 1
      )
    );

  if (!idProcesador) {
    throw new Error(
      'Seleccioná un procesador.'
    );
  }

  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const filas =
      sh.getDataRange().getValues();

    const duplicado =
      filas.slice(1).some(function(fila) {
        return (
          String(fila[1] || '').trim() ===
            idProcesador &&
          String(fila[2] || '*')
            .trim()
            .toLowerCase() ===
            canal.toLowerCase() &&
          Number(fila[4]) === cuotas
        );
      });

    if (duplicado) {
      throw new Error(
        'Ya existe un plan con ese procesador, canal y cantidad de cuotas.'
      );
    }

    const idPlan =
      'PLAN-' +
      idProcesador
        .replace(/[^a-z0-9]/gi, '')
        .toUpperCase() +
      '-' +
      cuotas +
      '-' +
      Utilities
        .getUuid()
        .slice(0, 6)
        .toUpperCase();

    const nombrePlan =
      cuotas +
      (cuotas === 1
        ? ' cuota'
        : ' cuotas');

    sh.appendRow([
      idPlan,
      idProcesador,
      canal,
      nombrePlan,
      cuotas,
      Number(
        datos.Costo_Negocio_Pct
      ) || 0,
      Number(
        datos.Recargo_Cliente_Pct
      ) || 0,
      String(
        datos.Quien_Absorbe ||
        'ninguno'
      )
        .trim()
        .toLowerCase(),
      Number(datos.Monto_Minimo) || 0,
      0,
      '',
      '',
      0,
      datos.Activo !== false,
      String(datos.Notas || '').trim(),
      Number(
        datos.Margen_Minimo_Pct
      ) || 0
    ]);

    const shHistorial =
      ss.getSheetByName(
        'Historial_Planes_Cuotas'
      );

    if (shHistorial) {
      shHistorial.appendRow([
        new Date(),
        idPlan,
        'Alta',
        '',
        nombrePlan,
        'Creación de plan',
        String(
          sesion &&
          sesion.usuario ||
          ''
        )
      ]);
    }

    return {
      ok: true,
      id_plan: idPlan
    };

  } finally {
    lock.releaseLock();
  }
}


function TEST_validarCrearPlanCuotasV2() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  try {
    crearPlanCuotasV2_(
      ss,
      {},
      {
        usuario: 'test'
      }
    );
  } catch (error) {
    Logger.log(error.message);
  }
}

function SETUP_separarLinkPagoPorTipo() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sh =
    ss.getSheetByName('Tarifas_Cobro');

  if (!sh) {
    throw new Error(
      'No existe la hoja Tarifas_Cobro.'
    );
  }

  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const datos =
      sh.getDataRange().getValues();

    const tipos = [
      {
        nombre: 'Crédito',
        sufijo: 'CRE'
      },
      {
        nombre: 'Débito',
        sufijo: 'DEB'
      },
      {
        nombre: 'Prepaga',
        sufijo: 'PRE'
      }
    ];

    const nuevasFilas = [];
    const originalesDesactivados = [];
    const idsExistentes =
      new Set(
        datos
          .slice(1)
          .map(function(fila) {
            return String(fila[0] || '');
          })
      );

    for (
      let i = 1;
      i < datos.length;
      i++
    ) {
      const fila = datos[i];

      const canal =
        String(fila[3] || '')
          .trim()
          .toLowerCase();

      const tipo =
        String(fila[4] || '')
          .trim()
          .toLowerCase();

      if (
        canal !== 'link de pago' ||
        tipo !== 'todos'
      ) {
        continue;
      }

      tipos.forEach(function(config) {
        const idNuevo =
          String(fila[0]) +
          '-' +
          config.sufijo;

        if (idsExistentes.has(idNuevo)) {
          return;
        }

        const nueva = fila.slice();

        nueva[0] = idNuevo;
        nueva[4] = config.nombre;

        nuevasFilas.push(nueva);
        idsExistentes.add(idNuevo);
      });

      // El registro genérico se conserva,
      // pero queda inactivo.
      sh.getRange(
        i + 1,
        11
      ).setValue(false);

      originalesDesactivados.push(
        String(fila[0])
      );
    }

    if (nuevasFilas.length) {
      sh.getRange(
        sh.getLastRow() + 1,
        1,
        nuevasFilas.length,
        nuevasFilas[0].length
      ).setValues(nuevasFilas);
    }

    const resultado = {
      ok: true,
      tarifas_creadas:
        nuevasFilas.length,
      originales_desactivados:
        originalesDesactivados
    };

    Logger.log(
      JSON.stringify(
        resultado,
        null,
        2
      )
    );

    return resultado;

  } finally {
    lock.releaseLock();
  }
}
