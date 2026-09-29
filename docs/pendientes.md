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

### 2. Operaciones solicitadas por conversación

Crear una conexión segura para pedir acciones como registrar una venta, un ingreso, un cobro o un movimiento sin cargarlos manualmente en la interfaz.

- Reutilizar las validaciones, sesiones y permisos de la API existente.
- Mostrar una vista previa y solicitar confirmación antes de escribir en producción.
- Incorporar controles de duplicados y devolver el identificador de cada operación creada.
- Probar primero contra el entorno y la planilla de pruebas.

### 3. Rendimiento

- Reducir el tiempo de carga de Cuentas por cobrar.
- Evitar respuestas completas innecesarias de Apps Script a medida que crezcan los datos.
- Revisar el caso en que el inicio mostró cero ventas aunque el historial contenía una venta no cancelada del período.

### 4. Validación de cobros y cuotas

Contrastar la configuración de Mercado Pago con reportes reales, especialmente los planes cuyo costo o interés paga el cliente, y confirmar cómo deben reflejarse el total cobrado, el neto esperado y la conciliación.

### 5. Evolución a varios comercios

- Separar configuración visual, logo y colores por comercio.
- Aislar usuarios y datos de cada comercio.
- Diseñar la migración futura desde Apps Script y Sheets hacia un backend y una base de datos cuando el crecimiento lo justifique.

## Fuera de prioridad por ahora

- Limpiar manualmente las ventas de prueba o los respaldos conservados.
- Reemplazar Netlify o Apps Script solamente por anticipación, sin una necesidad de capacidad o rendimiento comprobada.

