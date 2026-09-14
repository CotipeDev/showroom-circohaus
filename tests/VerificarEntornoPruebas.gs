// Pegar y ejecutar sólo en el proyecto Apps Script de pruebas.
// Esta verificación es de sólo lectura: no modifica hojas ni publica la API.
function verificarEntornoPruebas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss || !/pruebas de producci[oó]n/i.test(ss.getName())) {
    throw new Error('Detenido: abrí Apps Script desde la planilla de pruebas.');
  }

  const hojas = [
    'Productos', 'Proveedores', 'Categorias', 'Historial_Costos',
    'Cuentas', 'Clientes', 'Ventas', 'Detalle_Ventas', 'Pagos_Venta',
    'Movimientos', 'Cuentas_Por_Cobrar', 'Facturas',
    'Procesadores_Cobro', 'Tarifas_Cobro', 'Planes_Cuotas', 'Usuarios'
  ];
  const faltantes = hojas.filter(function(nombre) {
    return !ss.getSheetByName(nombre);
  });
  if (faltantes.length) {
    throw new Error('Faltan hojas: ' + faltantes.join(', '));
  }

  if (
    typeof handleRequest !== 'function' ||
    typeof registrarVentaV2_ !== 'function' ||
    typeof cancelarVentaV2_ !== 'function' ||
    typeof resolverCobroVentaV2_ !== 'function' ||
    typeof registrarFacturaVentaSegura_ !== 'function' ||
    typeof importarProductosSeguros_ !== 'function' ||
    typeof usuariosListarSeguro_ !== 'function'
  ) {
    throw new Error('Falta una función del backend en el proyecto de pruebas.');
  }

  Logger.log('OK: planilla de pruebas, hojas y módulos presentes.');
}
