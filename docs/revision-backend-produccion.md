# Revisión del backend para producción

`apps-script/Codigo.gs` es la copia recibida del código publicado. `apps-script/Codigo-produccion.gs` es un **reemplazo del contenido de `Código.gs`**, no un archivo adicional para pegar en el mismo proyecto de Apps Script. Ambos contienen `doGet` y `doPost`.

## Cambios de la propuesta

- Se conservaron `cancelarVenta` y `cancelarVentaV2`: el historial aún elige la ruta según la versión de la venta.
- Se conservó `registrarFacturaVenta`, la ruta usada por la pantalla actual de facturación.
- Se quitaron `marcarFacturada` y `registrarFactura`, rutas antiguas que permitían modificar sólo una parte del registro de factura y dejar datos inconsistentes.
- Se quitaron las funciones `TEST_` y `SETUP_` del código candidato. Algunas conciliaban movimientos, cambiaban tarifas o modificaban catálogos. No eran pruebas de sólo lectura.

La propuesta no está desplegada. Antes de sustituir el código publicado, probarla en una **copia de Apps Script vinculada a una copia de la planilla**, manteniendo también los módulos `VentasV2.gs`, `CobrosVentaV2.gs`, `UsuariosAPI.gs`, `FacturacionAPI.gs` e `ImportarProductosAPI.gs` que usa la instalación. Sólo cuatro de esos módulos auxiliares están versionados en este repositorio; para una publicación reproducible falta incorporar las copias vigentes de `VentasV2.gs` y `CobrosVentaV2.gs`.

## Verificación previa al reemplazo

1. Comprobar que el proyecto de prueba inicia sesión con administrador y vendedor.
2. Cargar inicio, ventas, productos, cuentas y facturación sin errores.
3. Registrar y cancelar una venta de prueba; verificar stock, pagos y movimientos.
4. Registrar un comprobante de prueba y confirmar que ventas y facturas quedan vinculadas.
5. Confirmar que no se pueden invocar `marcarFacturada` ni `registrarFactura` como rutas activas.
6. Repetir con la implementación web de prueba. No cambiar la URL de producción antes de completar la verificación.

La limpieza de datos de prueba y la definición de stock/saldos de apertura son operaciones distintas: ver `docs/puesta-cero-produccion.md`.
