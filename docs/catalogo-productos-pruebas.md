# Preparación de Productos para el catálogo público

Primera entrega: campos internos del catálogo. Todavía no hay catálogo público, carrito ni pedidos.

## Campos de la hoja Productos

Las diez columnas operativas existentes conservan sus posiciones. Las columnas nuevas se agregan al final:

| Columna | Encabezado | Valor |
| --- | --- | --- |
| 11 | Foto_Principal | URL HTTPS pública de la foto principal, o vacío |
| 12 | Descripcion_Publica | Texto de hasta 500 caracteres, o vacío |
| 13 | Visible_Catalogo | Booleano; vacío se interpreta como oculto |

Al guardar un producto se comprueban esos encabezados antes de escribir. Si las columnas están ocupadas por otros campos o los nombres aparecen en otra posición, se rechaza el guardado. Revisar primero los encabezados reales de la copia. No desplazar columnas existentes.

Los productos anteriores y los nuevos creados por la importación masiva quedan ocultos hasta habilitarlos. La importación existente sigue creando sólo productos nuevos; no modifica los campos de los productos ya registrados. La descripción interna sigue siendo el nombre utilizado en la gestión; el texto público es un campo separado.

Foto principal se carga por enlace en esta entrega. No incluye subida de archivos ni descarga desde Tienda Nube. Esa migración incorporará las imágenes a un alojamiento independiente y asignará sus enlaces a los productos revisados.

## Aplicar exclusivamente en pruebas

1. Confirmar la API de pruebas y la planilla **Circo Haus — pruebas de producción**. Conservar una copia previa a los ensayos.
2. Revisar las primeras diez columnas de Productos y verificar que 11–13 estén vacías o coincidan con los encabezados indicados.
3. Reemplazar el contenido del archivo existente `Codigo.gs` del Apps Script de pruebas con `apps-script/Codigo-produccion.gs` de esta rama. No agregarlo como un segundo archivo ni tocar el proyecto de producción.
4. Publicar una nueva versión en la implementación existente de pruebas, conservando la URL `/exec`. El frontend comprueba la capacidad `getConfiguracionCatalogoProductos` antes de guardar para evitar que una API anterior ignore los campos nuevos.
5. Abrir la publicación de `feature/ventas-v2`, iniciar sesión como administrador y probar con un producto identificado como prueba.
6. Verificar alta y edición: foto HTTPS, texto público, visibilidad Sí/No, vista previa y columna Catálogo. Un enlace válido que no apunte a una imagen debe mostrar un aviso de carga en la vista previa.
7. Editar solamente los campos del catálogo: el stock debe conservarse y no debe agregarse un costo ficticio al historial. Reabrir y comprobar persistencia.
8. Verificar que un producto habilitado con stock cero figure como Sin stock; uno no habilitado como Oculto. Esta regla está preparada para el catálogo público posterior.
9. Importar un producto nuevo usando el formato existente, y repetir su código: se crea sólo una vez y queda oculto. Verificar Stock y una venta/cancelación de prueba con las reglas existentes.
10. Verificar que un vendedor no pueda modificar productos ni estos campos. Revisar los formularios desde celular y computadora.

## Verificación local

`node --test tests/*.test.js`: 13 archivos de prueba aprobados, incluyendo altas y ediciones con campos nuevos, conservación del stock, compatibilidad con solicitudes antiguas, permisos, importación y rechazo de esquema incompatible antes de escribir.

La verificación local usa hojas simuladas. La persistencia real y la revisión visual del entorno publicado se deben comprobar en la copia de Apps Script antes de producción.
