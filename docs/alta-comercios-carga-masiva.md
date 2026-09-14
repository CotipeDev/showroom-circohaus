# Alta de otro comercio: catálogo y stock inicial

Pendiente de implementar después de cerrar Usuarios y revisar Facturación.

## Datos para pedirle al comercio

- Nombre comercial, logo y paleta de colores (configuración visual, sin cambiar el logo de CircoHaus).
- Archivo Excel o CSV con su catálogo actual.
- Proveedores y categorías, si ya los usa.
- Definición de precios y stock inicial a la fecha de puesta en marcha.

## Importación guiada propuesta

1. Subir `.xlsx` o `.csv` desde Productos.
2. Reconocer y mapear columnas: código, descripción, proveedor, categoría, costo, precio de venta, stock y stock mínimo.
3. Mostrar una vista previa con cantidad de filas válidas, errores, códigos duplicados y productos que ya existen.
4. Elegir explícitamente si los productos existentes se actualizan o se omiten. Nunca sobrescribir sin confirmación.
5. Confirmar una única importación por lote, con resultado descargable y registro de quién la hizo.
6. Registrar el stock importado como apertura de inventario, diferenciándolo de los ingresos de mercadería posteriores.

Antes de ofrecerlo a otro comercio, sus datos deben quedar separados de los de CircoHaus. No usar una misma planilla compartida sin un mecanismo de aislamiento verificado.
