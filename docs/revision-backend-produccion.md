# Revisión del backend para producción

`apps-script/Codigo.gs` y `apps-script/VentasV2.gs` son copias recibidas del código publicado. Los archivos con sufijo `-produccion.gs` son **reemplazos del contenido de sus respectivos archivos en Apps Script**, no archivos adicionales para pegar en el mismo proyecto. Las dos versiones de `Codigo` contienen `doGet` y `doPost`.

## Cambios de la propuesta

- Se conservaron `cancelarVenta` y `cancelarVentaV2`: el historial aún elige la ruta según la versión de la venta.
- Se conservó `registrarFacturaVenta`, la ruta usada por la pantalla actual de facturación.
- Se quitaron `marcarFacturada` y `registrarFactura`, rutas antiguas que permitían modificar sólo una parte del registro de factura y dejar datos inconsistentes.
- Se quitaron las funciones `TEST_` y `SETUP_` del código candidato. Algunas conciliaban movimientos, cambiaban tarifas o modificaban catálogos. No eran pruebas de sólo lectura.
- En `VentasV2-produccion.gs` se quitaron `TEST_registrarVentaV2`, `TEST_cancelarVentaV2` y `PREPARAR_COLUMNAS_COBRO_PAGOS_V2`; las funciones operativas siguen presentes.

La propuesta no está desplegada. Antes de sustituir el código publicado, probarla en una **copia de Apps Script vinculada a una copia de la planilla**, manteniendo también los módulos `CobrosVentaV2.gs`, `UsuariosAPI.gs`, `FacturacionAPI.gs` e `ImportarProductosAPI.gs` que usa la instalación. Falta recibir y revisar la copia vigente de `CobrosVentaV2.gs` para una publicación reproducible.

## Verificación previa al reemplazo

1. Comprobar que el proyecto de prueba inicia sesión con administrador y vendedor.
2. Cargar inicio, ventas, productos, cuentas y facturación sin errores.
3. Registrar y cancelar una venta de prueba; verificar stock, pagos y movimientos.
4. Registrar un comprobante de prueba y confirmar que ventas y facturas quedan vinculadas.
5. Confirmar que no se pueden invocar `marcarFacturada` ni `registrarFactura` como rutas activas.
6. Repetir con la implementación web de prueba. No cambiar la URL de producción antes de completar la verificación.

La limpieza de datos de prueba y la definición de stock/saldos de apertura son operaciones distintas: ver `docs/puesta-cero-produccion.md`.
