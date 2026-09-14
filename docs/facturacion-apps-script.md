# Activar el registro seguro de facturas

La aplicación **no emite facturas fiscales**. El comprobante se emite en ARCA y luego se registra su número en Circo Haus.

1. En el mismo proyecto de Apps Script que usa la aplicación, creá un archivo llamado `FacturacionAPI.gs` y pegá el contenido completo de [`apps-script/FacturacionAPI.gs`](../apps-script/FacturacionAPI.gs).
2. En `Código.gs`, dentro de `handleRequest`, **después de** `autorizarAccionSegura_(sesion, action)` y **antes de** los bloques antiguos `marcarFacturada` y `registrarFactura`, agregá:

```javascript
if (action === 'registrarFacturaVenta') {
  return jsonResponse(
    registrarFacturaVentaSegura_(ss, body, sesion)
  );
}
```

`body` es el objeto que ya se obtiene al principio de `handleRequest` con `JSON.parse(e.postData.contents || '{}')`. Si en tu versión tiene otro nombre, usá ese nombre. No agregues `registrarFacturaVenta` a la lista de acciones del vendedor: solo una administradora debe registrar facturas.

3. Guardá y publicá una versión nueva de la implementación web **que usa esta aplicación**. El cambio visual no funcionará hasta publicar también este backend.
4. Probá con una venta pendiente: emití en ARCA, registrá su número en Facturación y comprobá que aparece en el historial y la venta queda marcada como facturada. Repetir exactamente el mismo número para esa venta no crea otra factura.

Los bloques antiguos pueden quedar temporalmente para compatibilidad, pero la interfaz nueva ya no los usa. Más adelante conviene retirarlos para que no exista una vía alternativa que vuelva a desincronizar los datos. Antes de importar o migrar registros antiguos, revisar posibles facturas duplicadas y ventas marcadas sin comprobante.
