# Revisión del backend para producción

`apps-script/Codigo.gs`, `apps-script/VentasV2.gs` y `apps-script/CobrosVentaV2.gs` son copias recibidas del código publicado. Los archivos con sufijo `-produccion.gs` son **reemplazos del contenido de sus respectivos archivos en Apps Script**, no archivos adicionales para pegar en el mismo proyecto. Las dos versiones de `Codigo` contienen `doGet` y `doPost`.

## Cambios de la propuesta

- Se conservaron `cancelarVenta` y `cancelarVentaV2`: el historial aún elige la ruta según la versión de la venta.
- Se conservó `registrarFacturaVenta`, la ruta usada por la pantalla actual de facturación.
- Se quitaron `marcarFacturada` y `registrarFactura`, rutas antiguas que permitían modificar sólo una parte del registro de factura y dejar datos inconsistentes.
- Se quitaron las funciones `TEST_` y `SETUP_` del código candidato. Algunas conciliaban movimientos, cambiaban tarifas o modificaban catálogos. No eran pruebas de sólo lectura.
- `Codigo-produccion.gs` declara `@OnlyCurrentDoc` para pedir acceso a la planilla vinculada, no a todas las planillas de la cuenta. Se debe confirmar el alcance real en la pantalla de autorización antes de aceptar.
- En `VentasV2-produccion.gs` se quitaron `TEST_registrarVentaV2`, `TEST_cancelarVentaV2` y `PREPARAR_COLUMNAS_COBRO_PAGOS_V2`; las funciones operativas siguen presentes.
- En `CobrosVentaV2-produccion.gs` se quitaron `TEST_resolverCobroVentaV2`, `TEST_validarCrearPlanCuotasV2` y `SETUP_separarLinkPagoPorTipo`; las funciones operativas siguen presentes.
- La venta nueva usa `Tarifas_Cobro` y `Planes_Cuotas`: se quitó la lectura de `Medios_Pago` y se rechaza el antiguo `id_medio`. `Historial_Medios_Pago` no es consultado por el backend candidato. Las hojas y los datos existentes se dejan intactos durante este despliegue; cualquier limpieza queda para una decisión posterior de la usuaria.

La propuesta está desplegada **sólo en la copia de pruebas**, no en el proyecto real. `UsuariosAPI.gs` coincidió exactamente con la copia facilitada por la usuaria; `FacturacionAPI.gs` e `ImportarProductosAPI.gs` coincidieron en contenido tras retirar el escape de formato agregado por el mensaje. Las seis piezas principales ya están versionadas y los flujos críticos se verificaron en una copia de Apps Script vinculada a una copia de la planilla.

## Verificación previa al reemplazo: resultado en la copia

1. Comprobar que el proyecto de prueba inicia sesión con administrador y vendedor.
2. Cargar inicio, ventas, productos, cuentas y facturación sin errores.
3. Registrar y cancelar una venta de prueba; verificar stock, pagos y movimientos.
4. Registrar un comprobante de prueba y confirmar que ventas y facturas quedan vinculadas.
5. Confirmar que no se pueden invocar `marcarFacturada` ni `registrarFactura` como rutas activas.
6. Repetir con la implementación web de prueba. No cambiar la URL de producción antes de completar la verificación.

El 14 y 15 de septiembre de 2026 la usuaria informó resultados `OK` de los guiones de entorno, lógica sin escritura, venta y cancelación, cobro y movimiento, facturación ficticia, importación, conciliación y usuarios. La interfaz local separada cargó Inicio, Cuentas por cobrar, Facturación, Stock, Usuarios y Manuales. Esto habilita preparar el reemplazo de código, pero no autoriza aún la puesta en cero ni asegura que se haya medido el rendimiento en todos los dispositivos.

Por decisión de la usuaria, este despliegue no incluye limpieza de ventas, ingresos, productos, stock ni otras filas de la planilla.
