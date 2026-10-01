# Pendientes del proyecto

Actualizado el 29 de septiembre de 2026.

## Prioridad propuesta

### 1. Importación de ventas históricas

Incorporar en lote las ventas conservadas en papel para poder consultar reportes de períodos anteriores.

- Procesar fotos o escaneos en tandas y preparar una tabla revisable antes de importar.
- Guardar cada operación con su fecha real y marcarla como `HISTORICO_IMPORTADO`.
- Incluirla en los reportes de ventas, canales, productos, clientes y rentabilidad según los datos disponibles.
- No descontar el stock actual, no generar movimientos actuales y no crear cuentas por cobrar vigentes.
- Controlar duplicados y conservar el origen de cada registro.
- Si una venta no tiene detalle de productos, importar únicamente la información comprobable, sin completar datos por suposición.

### 2. Validación de cobros y cuotas

Contrastar la configuración de Mercado Pago con reportes reales, especialmente los planes cuyo costo o interés paga el cliente, y confirmar cómo deben reflejarse el total cobrado, el neto esperado y la conciliación.

### 3. Rendimiento

- Reducir el tiempo de carga de Cuentas por cobrar.
- Evitar respuestas completas innecesarias de Apps Script a medida que crezcan los datos.
- Revisar el caso en que el inicio mostró cero ventas aunque el historial contenía una venta no cancelada del período.

### 4. Catálogo público y pedidos de Circo Haus

Primera entrega preparada en código: campos de Productos para foto, descripción pública y visibilidad. Pendiente aplicar el backend en la copia y verificar allí. Ver [guía de pruebas](catalogo-productos-pruebas.md).

Reemplazar el uso de Tienda Nube como catálogo con una vista pública alimentada por los productos y el stock existentes en Circo Hub. El cliente llega, por ejemplo, desde Instagram, busca por nombre o categoría, arma y modifica un carrito y completa nombre, teléfono y correo.

- Mostrar sólo productos marcados como visibles y con stock mayor a cero; incorporar foto y descripción breve al catálogo existente, sin mantener una segunda base de productos.
- En el checkout ofrecer efectivo, transferencia y tarjeta. Mostrar descuentos y promociones vigentes desde una configuración comercial verificable, sin fijar todavía el medio de pago ni calcular un importe final por financiación.
- Al confirmar, guardar primero un pedido con número único, datos de contacto, productos, cantidades, precios y condiciones vistas, medio indicado y fecha. Debe aparecer en Pedidos pendientes de la aplicación, sin descontar stock ni crear movimientos o cuentas por cobrar.
- Mostrar el número de pedido y un botón claro para abrir WhatsApp con un mensaje preparado dirigido al negocio. El cliente debe tocar **Enviar** en WhatsApp. Entonces el mensaje llega a la conversación del negocio; el envío no es automático en esta versión.
- Si el cliente no envía el WhatsApp o falla la apertura, el pedido queda en Circo Hub para que el equipo pueda contactarlo desde los datos registrados. No crear un segundo pedido al reintentar.
- El vendedor o administrador revisa el pedido, conversa con el cliente, ajusta productos y medio de pago si corresponde y lo convierte en venta mediante la lógica existente. Revalidar stock y precio antes de confirmar la venta.
- Usar «pedido recibido» o «pedido pendiente», no «venta confirmada», hasta la revisión interna y el acuerdo con el cliente.

Texto propuesto al terminar: «¡Recibimos tu pedido #1234! Para continuar, tocá **Enviar pedido por WhatsApp**. Se abrirá un mensaje con el detalle: presioná **Enviar** en WhatsApp para avisarnos. Después nos comunicaremos con vos para confirmar el pago y coordinar la entrega». El botón debe permitir reabrir el mismo pedido sin generar otro.

### 5. Evolución a varios comercios

Revisar primero la propuesta de Circo SaaS Producto antes de definir el siguiente alcance técnico.

- Separar configuración visual, logo y colores por comercio.
- Aislar usuarios y datos de cada comercio.
- Diseñar la migración futura desde Apps Script y Sheets hacia un backend y una base de datos cuando el crecimiento lo justifique.

## Fuera de prioridad por ahora

- Integrar WhatsApp Business Platform de Meta para enviar mensajes automáticos al cliente sin que toque **Enviar**, y evaluar confirmaciones y avisos automáticos al negocio. Mantener el pedido guardado independientemente del resultado del mensaje.
- Enviar también correos automáticos de confirmación de pedido.
- Limpiar manualmente las ventas de prueba o los respaldos conservados.
- Reemplazar Netlify o Apps Script solamente por anticipación, sin una necesidad de capacidad o rendimiento comprobada.
