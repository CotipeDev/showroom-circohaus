# Guion de prueba antes de producción

**Ejecutar sólo en una copia aislada de la planilla y del proyecto Apps Script.** No utilizar la URL ni los datos de producción. Registrar fecha, URL de prueba, versión de código y responsable. Antes de empezar, confirmar que la copia conserva los mismos encabezados y que el código apunta a esa copia.

## Preparación

1. Elegir un producto de prueba con stock conocido, precio y costo válidos; anotar su código y stock inicial.
2. Elegir una cuenta activa y anotar su saldo inicial. Verificar que haya un medio de cobro configurado.
3. Crear o identificar una cuenta de administrador y otra de vendedor en la copia.
4. Usar IDs y descripciones que indiquen claramente `PRUEBA`; no usar números de factura reales ni registrar nada en ARCA.
5. Ejecutar `tests/VerificarEntornoPruebas.gs` en el proyecto copiado. Es de sólo lectura y debe registrar `OK: planilla de pruebas, hojas y módulos presentes.` antes de implementar la API de pruebas.

## Casos y resultados esperados

| Caso | Acción en la app de prueba | Resultado a comprobar |
| --- | --- | --- |
| Accesos | Entrar como administrador y vendedor | Ambos ingresan; vendedor sólo ve y ejecuta módulos permitidos, sin costos ni configuración reservada. Cambiar clave propia y volver a ingresar. |
| Catálogo | Consultar producto, proveedor y categoría | Búsquedas y vínculos correctos; stock disponible visible antes de agregarlo a una venta. |
| Venta | Registrar una venta de una unidad con un cobro | Aparece una sola venta, se descuenta una unidad de stock y se generan pagos y movimientos una sola vez. El saldo de la cuenta y el movimiento se ven sin recargar la página. |
| Reintento | Repetir una operación sólo si la pantalla informa error o demora | No aparecen ventas, pagos ni movimientos duplicados. Si no se puede garantizar, marcar como falla y no pasar a producción. |
| Cancelación | Cancelar la venta de prueba | Estado cancelado, stock restaurado una sola vez y movimientos revertidos conforme a la regla de la app. Repetir la cancelación debe rechazarse. |
| Cuentas por cobrar | Registrar una venta fiada y un cobro parcial | Saldo pendiente y movimiento coinciden con el importe cobrado; no hay sobrecobro accidental. |
| Conciliación | Conciliar un movimiento pendiente con importe igual y luego distinto | Se muestra estado procesando; el primero tiene diferencia cero y el segundo la diferencia esperada. No se permite conciliar dos veces. |
| Facturación registrada | Asociar a una venta no cancelada un número ficticio sólo en la copia | Venta y factura quedan vinculadas; repetir el mismo número no duplica, otro número para la misma venta se rechaza. No se emite comprobante ante ARCA. |
| Importación | Importar un CSV pequeño con producto nuevo y código ya existente | Crea sólo el nuevo, informa el omitido, conserva los existentes y registra el costo inicial. Una fila inválida no debe dejar una importación parcial. |
| Vista y rendimiento | Abrir inicio, ventas, cuentas, movimientos y facturación en computadora y celular | No hay errores; la carga y las actualizaciones son aceptables. Anotar tiempos aproximados y cualquier pantalla que quede en espera. |

## Criterio de salida

No reemplazar la implementación de producción si falla un caso crítico de permisos, stock, dinero, duplicación, cancelación o facturación. Corregir y repetir los casos afectados en una copia nueva o restaurada. La puesta en cero de la planilla real es otra etapa y requiere respaldo y aprobación expresa (`puesta-cero-produccion.md`).
