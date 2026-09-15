/**
 * @OnlyCurrentDoc
 */
// SÓLO en la planilla de pruebas. Deja dos movimientos conciliados en la copia.
function probarConciliacionEnCopia() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss || !/pruebas de producci[oó]n/i.test(ss.getName())) {
    throw new Error('Detenido: no es la planilla de pruebas.');
  }

  const movimientos = ss.getSheetByName('Movimientos');
  const cuentas = ss.getSheetByName('Cuentas');
  if (!movimientos || !cuentas) {
    throw new Error('Falta la hoja Movimientos o Cuentas.');
  }

  const cuenta = cuentas.getDataRange().getValues().slice(1).find(function(fila) {
    const activa = fila[4] === true || String(fila[4]).toUpperCase() === 'TRUE';
    return String(fila[0] || '').trim() && activa;
  });
  if (!cuenta) throw new Error('No hay una cuenta activa para la prueba.');

  const marca = Date.now();
  const idExacto = 'MOV-PRUEBA-EXACTO-' + marca;
  const idDiferencia = 'MOV-PRUEBA-DIF-' + marca;
  const fecha = new Date().toISOString().slice(0, 10);
  const idCuenta = String(cuenta[0]).trim();

  movimientos.appendRow([
    idExacto, fecha, idCuenta, 'ingreso', 'PRUEBA CONCILIACION', 1000,
    'PRUEBA EN COPIA - importe exacto', '', 'prueba_conciliacion', fecha
  ]);
  movimientos.appendRow([
    idDiferencia, fecha, idCuenta, 'ingreso', 'PRUEBA CONCILIACION', 1000,
    'PRUEBA EN COPIA - diferencia', '', 'prueba_conciliacion', fecha
  ]);
  SpreadsheetApp.flush();

  const sesion = {usuario: 'PRUEBA_COPIA', nombre: 'Prueba en copia'};
  try {
    const exacto = conciliarMovimientoSeguro_(ss, {
      id_movimiento: idExacto,
      importe_real: 1000,
      nota: 'Prueba exacta'
    }, sesion);
    const diferente = conciliarMovimientoSeguro_(ss, {
      id_movimiento: idDiferencia,
      importe_real: 950,
      nota: 'Prueba con diferencia'
    }, sesion);

    if (!exacto.ok || exacto.diferencia !== 0 ||
        !diferente.ok || diferente.diferencia !== -50) {
      throw new Error('Los importes conciliados no dieron el resultado esperado.');
    }

    let dobleRechazada = false;
    try {
      conciliarMovimientoSeguro_(ss, {
        id_movimiento: idExacto,
        importe_real: 1000,
        nota: 'Segundo intento'
      }, sesion);
    } catch (error) {
      dobleRechazada = /ya fue conciliado/i.test(String(error.message || ''));
      if (!dobleRechazada) throw error;
    }
    if (!dobleRechazada) throw new Error('Se permitió conciliar dos veces.');

    const datos = movimientos.getDataRange().getValues();
    const encabezados = datos[0].map(function(valor) { return String(valor || '').trim(); });
    const colEstado = encabezados.indexOf('Estado_Conciliacion');
    const colReal = encabezados.indexOf('Importe_Real');
    const colDiferencia = encabezados.indexOf('Diferencia_Conciliacion');
    const colUsuario = encabezados.indexOf('Usuario_Conciliacion');
    if ([colEstado, colReal, colDiferencia, colUsuario].some(function(i) { return i < 0; })) {
      throw new Error('Faltan columnas de conciliación.');
    }
    const buscar = function(id) {
      return datos.slice(1).find(function(fila) { return String(fila[0]).trim() === id; });
    };
    const filaExacta = buscar(idExacto);
    const filaDiferencia = buscar(idDiferencia);
    if (!filaExacta || !filaDiferencia ||
        String(filaExacta[colEstado]).toLowerCase() !== 'conciliado' ||
        String(filaDiferencia[colEstado]).toLowerCase() !== 'conciliado' ||
        Number(filaExacta[colReal]) !== 1000 || Number(filaExacta[colDiferencia]) !== 0 ||
        Number(filaDiferencia[colReal]) !== 950 || Number(filaDiferencia[colDiferencia]) !== -50 ||
        String(filaExacta[colUsuario]) !== 'Prueba en copia') {
      throw new Error('Los movimientos no quedaron conciliados correctamente.');
    }

    Logger.log('OK: conciliación exacta y con diferencia correctas; segundo intento rechazado.');
    Logger.log('Los movimientos ' + idExacto + ' y ' + idDiferencia + ' quedan sólo en la COPIA.');
  } catch (error) {
    Logger.log('FALLÓ la prueba. Revisar en la COPIA los movimientos con marca ' + marca + '.');
    throw error;
  }
}
