# Circo Haus — gestión del showroom

Aplicación web interna para ventas, clientes, catálogo, stock, ingresos de mercadería, cuentas por cobrar, movimientos, conciliación, facturación registrada, reportes y usuarios.

## Arquitectura actual

- **Interfaz:** `index.html` y módulos activos en `js/`. La página incluye también parte de la lógica y los estilos; se está separando de forma gradual.
- **API:** Google Apps Script conectado a Google Sheets. `apps-script/Codigo.gs`, `apps-script/VentasV2.gs` y `apps-script/CobrosVentaV2.gs` conservan las copias recibidas del código publicado. Los archivos con sufijo `-produccion.gs` son candidatos depurados que reemplazarían sus originales. Ninguno se publica automáticamente en Apps Script; **no agregar original y candidato juntos**.
- **Hosting de la interfaz:** Netlify, conectado al repositorio Git.
- **Manuales:** guías dentro de la aplicación, visibles según el rol. `manual.html` redirige a esas guías para enlaces antiguos.

La facturación fiscal se hace en ARCA. La aplicación muestra ventas pendientes y registra después el número y fecha del comprobante; no emite facturas fiscales.

## Estructura

| Ruta | Uso |
| --- | --- |
| `index.html` | Pantallas, navegación y lógica compartida que todavía no se ha extraído |
| `js/` | Módulos cargados por `index.html` |
| `apps-script/` | Funciones auxiliares que deben coincidir con el proyecto publicado |
| `tests/` | Pruebas locales, sin escritura en la planilla real |
| `docs/` | Pasos de activación y notas de operación |

## Actualización segura

1. Trabajar en una rama y revisar los cambios antes de publicarlos.
2. Probar la sintaxis y las pruebas locales; después verificar los flujos reales en una copia de prueba.
3. Para cambios en Apps Script, guardar una versión nueva de la implementación web que usa la aplicación y comprobar sus rutas. No ejecutar funciones `TEST_` o `SETUP_` sobre producción sin revisar sus efectos: algunas modifican hojas.
4. Para cambios en la interfaz, subir la rama usada por Netlify y verificar la implementación publicada en computadora, tableta y celular.

**No limpiar datos de prueba por el solo hecho de publicar código.** La puesta en cero de Circo Haus es una operación aparte: primero se hace una copia de la planilla, se define qué datos maestros y qué stock inicial conservar, se simula la limpieza y recién entonces se ejecuta con aprobación expresa.

## Estado antes de producción

- Las seis piezas del backend están versionadas. En una copia vinculada a un Apps Script separado se aprobaron ventas, cobros, cancelación, facturación registrada, importación, conciliación y usuarios; consultar `docs/guion-pruebas-copia.md`.
- La interfaz local conectada a esa copia abrió Inicio, Cuentas por cobrar, Facturación, Stock, Usuarios y Manuales sin errores visibles. La URL alternativa sólo funciona en `localhost`; en Netlify se conserva la API habitual.
- **Todavía no se sustituyó la implementación real de Apps Script ni se limpiaron sus datos de prueba.** Para salir a producción faltan el reemplazo controlado, el respaldo y la definición aprobada de stock/saldos de apertura (`docs/puesta-cero-produccion.md`).
- La demora de Cuentas por cobrar y el volumen de respuestas de Apps Script siguen como mejora de rendimiento posterior, sin debilitar los controles de acceso.
