# Activar la carga masiva de Productos

La interfaz acepta CSV UTF-8 exportado desde Excel. Por seguridad, solo crea productos con códigos nuevos; nunca cambia productos existentes. El stock del archivo es stock inicial del producto nuevo, no un ingreso posterior.

Al completar la plantilla en Excel, configurá la columna `codigo` como **Texto** antes de escribir códigos con ceros a la izquierda. Guardá después como **CSV UTF-8**. Los importes y cantidades deben ser números; proveedor y categoría deben existir previamente en la aplicación.

1. En el proyecto de Apps Script de Circo Haus, creá `ImportarProductosAPI.gs` y pegá completo el contenido de [`apps-script/ImportarProductosAPI.gs`](../apps-script/ImportarProductosAPI.gs).
2. En `Código.gs`, dentro de `handleRequest`, después de `autorizarAccionSegura_(sesion, action)` y antes de `agregarProducto`, agregá:

```javascript
if (action === 'importarProductos') {
  return jsonResponse(importarProductosSeguros_(ss, body, sesion));
}
```

`body` ya se obtiene al comienzo de `handleRequest`. No agregues esta acción a `accionesVendedor`: la importación es solo para administradoras.

3. Guardá y publicá una nueva versión de la implementación web utilizada por la aplicación.
4. Probá primero con un CSV de dos filas: un código nuevo y uno existente. Confirmá que solo se agregue el nuevo y que el precio y el stock del existente queden iguales. Hacé una copia de la planilla antes de la primera importación real.

La vista previa marca errores, pero el servidor vuelve a validar todo al confirmar. Si falla una fila válida enviada al servidor, no empieza la escritura del lote. Google Sheets no ofrece una transacción entre las hojas `Productos` e `Historial_Costos`: ante un error extraordinario durante la escritura, revisá ambas hojas antes de reintentar. Los códigos ya creados se omiten en un reintento.
