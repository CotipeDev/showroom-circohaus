# Circo Haus — sistema de gestión V2

Aplicación interna para gestionar el showroom de Circo Haus: catálogo, ingresos, stock, ventas, cobros, cuentas, facturación registrada, reportes y usuarios. La V2 está publicada en producción desde el 15 de septiembre de 2026.

## Versión publicada y entornos

| Entorno | Código y sitio | Apps Script y planilla |
| --- | --- | --- |
| Producción | Rama `main` · [showroomcircohaus.netlify.app](https://showroomcircohaus.netlify.app/) | Implementación web del proyecto de Apps Script vinculado a **Circo Haus — PRODUCCIÓN - V2**. El proyecto de script todavía puede figurar con el antiguo nombre “CircoHaus DEV - Ventas V2”. |
| Pruebas | Rama `feature/ventas-v2` · [feature-ventas-v2--showroomcircohaus.netlify.app](https://feature-ventas-v2--showroomcircohaus.netlify.app/) | Implementación web del proyecto de pruebas vinculado a **Circo Haus — pruebas de producción**. Allí están también las funciones de prueba de Apps Script. |

La rama separa el código; la URL de la API separa los datos. La interfaz elige la API de pruebas sólo en el dominio de la publicación de `feature/ventas-v2`. En el sitio público usa la API de producción. La vista local necesita un `api_url` explícito de pruebas y no debe usarse para operar sobre producción.

**Sistema Showroom**, **Sistema Showroom - BACKUP pre Ventas V2 - 20-08-2026** y **Sistema Showroom - DEV Ventas V2 - RESPALDO antes de producción** son la versión anterior y respaldos. Ninguno es la planilla activa de la V2. Los respaldos son copias puntuales: no se actualizan automáticamente.

## Cómo está construida

La interfaz es un sitio estático de HTML, CSS y JavaScript publicado por Netlify desde GitHub. `index.html` contiene las pantallas, navegación, estilos y parte de la lógica compartida; las funciones separadas por área están en `js/`. La interfaz llama a una API web de Google Apps Script, que valida la sesión y los permisos y lee o escribe las pestañas de la planilla correspondiente.

```text
Navegador → Netlify (interfaz) → Apps Script (API y permisos) → Google Sheets (datos)
```

La facturación fiscal se realiza fuera de la aplicación, en ARCA. Este sistema **no emite comprobantes**: registra en la venta el número y la fecha de una factura ya emitida.

## Módulos implementados

| Módulo | Qué permite hacer |
| --- | --- |
| Inicio | Ver indicadores del período: ventas, monto vendido, neto esperado, saldo por cobrar, margen estimado y alertas de stock; acceder a las tareas habituales. |
| Nueva venta | Elegir productos y cliente, aplicar descuento general, registrar uno o varios cobros o una venta a cuenta, seleccionar tarifa y plan de cuotas, estimar costos de cobranza, neto y margen, y descontar stock al confirmar. |
| Historial de ventas | Buscar y filtrar ventas, consultar su detalle, ver estado y factura, y cancelar las ventas permitidas. La cancelación reintegra el stock una sola vez. |
| Clientes | Consultar, crear y editar clientes utilizados en las ventas y cuentas por cobrar. |
| Productos | Consultar y editar catálogo, precios, costos, categoría, proveedor y estado comercial; registrar cambios de costo. |
| Importación de productos | Dar de alta productos nuevos en lote, validando datos y omitiendo códigos duplicados sin modificar productos existentes. |
| Stock e inventario | Consultar existencias y productos críticos; revisar precios y disponibilidad. |
| Ingreso de mercadería | Registrar ingresos y su detalle para actualizar stock; consultar historial y cancelar ingresos cuando corresponde. |
| Proveedores | Crear, consultar y editar los proveedores asociados al catálogo y los ingresos. |
| Categorías | Crear, consultar y editar las categorías que organizan los productos. |
| Medios y planes de cobro | Configurar procesadores, tarifas por cuenta/canal/tipo de pago y planes de cuotas; consultar historial de cambios. Las antiguas pestañas `Medios_Pago` y `Historial_Medios_Pago` no son consultadas por el backend V2. |
| Cuentas por cobrar | Ver ventas fiadas, saldos y pagos de clientes; registrar cobros pendientes. |
| Facturación | Ver ventas pendientes de facturar y registrar una factura ya emitida en ARCA, sin emitirla desde la aplicación. |
| Cuentas | Mantener las cuentas donde se reciben o registran fondos. |
| Movimientos | Registrar y consultar movimientos de dinero y sus categorías. |
| Conciliación | Comparar movimientos con importes esperados, registrar diferencias y evitar una segunda conciliación del mismo movimiento. |
| Análisis y reportes | Consultar ventas, rentabilidad y otros indicadores operativos por período. |
| Usuarios | Iniciar y cerrar sesión; administrar usuarios, estado, rol y claves con permisos según el perfil. |
| Manuales de uso | Consultar guías dentro de la aplicación según el rol; `manual.html` redirige allí para enlaces antiguos. |

## Organización de los datos

La planilla funciona como base de datos. Las pestañas principales se agrupan así:

| Área | Pestañas principales y relación |
| --- | --- |
| Catálogo e inventario | `Productos` guarda cada producto y su stock; `Proveedores` y `Categorias` clasifican el catálogo; `Historial_Costos` registra cambios de costo. |
| Mercadería | `Ingresos` guarda la cabecera de cada ingreso y `Detalle_Ingresos` sus productos y cantidades. |
| Ventas y clientes | `Ventas` guarda la operación; `Detalle_Ventas` sus productos; `Pagos_Venta` los cobros; `Clientes`, `Cuentas_Por_Cobrar` y `Facturas` vinculan cliente, deuda y comprobante registrado. |
| Cobranza y dinero | `Cuentas` identifica los destinos de fondos; `Movimientos` y `Categorias_Movimientos` registran y clasifican movimientos. `Procesadores_Cobro`, `Tarifas_Cobro`, `Planes_Cuotas` y sus historiales definen costos y cuotas. |
| Acceso | `Usuarios` sostiene la autenticación y los roles. |

## Código y pruebas

| Ruta | Contenido |
| --- | --- |
| `index.html` | Interfaz, navegación y lógica común aún no extraída |
| `js/` | Módulos de productos, stock, ingresos, clientes, ventas, cobros, usuarios y manuales |
| `apps-script/` | Código versionado de la API. `Codigo-produccion.gs`, `VentasV2-produccion.gs` y `CobrosVentaV2-produccion.gs` corresponden al contenido pegado en los respectivos archivos existentes al publicar la V2; `Codigo.gs`, `VentasV2.gs` y `CobrosVentaV2.gs` quedan como referencias anteriores. También están versionadas las API de usuarios, facturación e importación. |
| `tests/*.test.js` | Pruebas locales de interfaz y backend que no escriben en la planilla |
| `tests/*.gs` | Guiones para ejecutar **sólo en el Apps Script de pruebas**; algunos escriben datos en esa copia |
| `docs/` | Notas técnicas e instrucciones históricas de pruebas y despliegue |

GitHub y Netlify publican la **interfaz**; no sincronizan automáticamente los archivos `.gs` con Apps Script. Cuando cambia el backend, primero se verifica en la copia de pruebas y luego se actualizan los archivos existentes y una nueva versión de la implementación web de producción, conservando la URL utilizada por el sitio. Una actualización sólo del README no requiere volver a implementar Apps Script.

Las ventas, los ingresos, el stock y los demás datos existentes se conservaron durante el lanzamiento. **Publicar código no implica limpiar la planilla.** Cualquier limpieza futura es una decisión y operación aparte.

## Alcance actual

Esta instalación está configurada para Circo Haus. Cambiar logo y colores o utilizarla para otros comercios es una evolución prevista, pero todavía no hay aislamiento automático de múltiples comercios ni una plataforma SaaS lista para activar nuevos clientes. La carga de Cuentas por cobrar y el tamaño de algunas respuestas de Apps Script siguen como mejoras de rendimiento posteriores.
