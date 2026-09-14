# Puesta en cero de Circo Haus

**Estado:** procedimiento pendiente de aprobación. No ejecutar sobre la planilla actual todavía.

La planilla contiene operaciones de prueba. Publicar código nuevo no debe borrar ni modificar esos datos. Una limpieza directa de `Ventas` o `Detalle_Ventas` sin reconciliar el stock puede dejar existencias incorrectas; tampoco alcanza con cancelar todas las ventas, porque podrían existir ingresos, ajustes y cancelaciones de prueba.

## Preparación obligatoria

1. Crear una copia fechada de la planilla completa y conservar la versión de Apps Script usada en las pruebas.
2. Definir el inventario de apertura por producto mediante conteo físico o una carga inicial revisada. No calcularlo automáticamente sólo a partir de ventas de prueba.
3. Acordar qué datos maestros se conservan: productos, proveedores, categorías, cuentas, medios y planes de cobro, clientes y usuarios. Las contraseñas y permisos requieren una revisión aparte.
4. Listar las hojas operativas y auxiliares, sus encabezados, cantidad de filas y vínculos. Preparar una vista previa del borrado sin escribir en la planilla.
5. Probar el procedimiento completo sobre una copia y verificar que la aplicación abre, que el stock coincide con el conteo y que los saldos iniciales son los aprobados.
6. Sólo entonces, con confirmación explícita de la usuaria, ejecutar la puesta en cero en la planilla de producción. Conservar la copia de respaldo y registrar fecha, responsable y resultado.

## Comprobaciones posteriores

- Sin ventas, cobros, movimientos, conciliaciones ni facturas de prueba visibles.
- Stock y saldo inicial de cada cuenta coinciden con los valores de apertura aprobados.
- Configuración de cobros, catálogo, roles y acceso funcionan.
- Una venta de prueba controlada actualiza stock y movimientos; se revierte y se comprueba de nuevo antes de abrir al uso diario.

**No ejecutar funciones `TEST_` o `SETUP_` del `Código.gs` publicado sobre la planilla real:** varias escriben datos, cambian tarifas o concilian movimientos.
