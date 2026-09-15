# Interfaz local conectada a una copia

La interfaz acepta una URL alternativa de Apps Script **únicamente** en `localhost` o `127.0.0.1` y sólo mediante el parámetro `api_url`. Fuera de esas direcciones siempre utiliza la API de producción. Una dirección local sin parámetro, inválida o que coincida con la API real queda sin conexión: no debe iniciar sesión ni enviar acciones a producción.

1. Confirmar que la implementación web de pruebas se creó desde el proyecto Apps Script vinculado a la copia de la planilla. Nunca utilizar la implementación real como parámetro.
2. Iniciar un servidor local desde el directorio de la interfaz; no abrir `index.html` como archivo suelto.
3. Abrir `http://127.0.0.1:8765/index.html?api_url=URL_DE_LA_IMPLEMENTACION_DE_PRUEBAS_CODIFICADA`. El agente puede generar y abrir este enlace; no guardar credenciales ni la URL concreta de la copia en Git.
4. Ingresar personalmente con un usuario de la copia. La sesión local usa una clave separada por URL y origen de la app publicada. No pegar contraseñas en el chat.
5. Revisar inicio, catálogo, ventas, facturación, stock, movimientos, conciliación, usuarios y manuales. Hacer escrituras sólo identificadas como prueba; confirmar en la planilla copiada que aparecen allí y no en la real.
6. Registrar tiempos y errores de la interfaz. Cerrar la sesión local al terminar. La URL local no debe convertirse en enlace público ni en variable permanente de producción.

Los guiones Apps Script de `tests/` no deben agregarse al proyecto real. Esta revisión visual no equivale a autorización para limpiar la planilla de producción.
