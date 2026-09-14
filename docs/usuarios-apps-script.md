# Activar el módulo Usuarios

Este cambio requiere publicar una versión nueva de Apps Script. Hasta entonces, la pantalla mostrará que la API de Usuarios no está disponible.

## 1. Antes de editar

En la planilla, la pestaña `Usuarios` debe conservar estas nueve columnas, en este orden:

1. ID de usuario
2. Usuario
3. Nombre
4. Hash de contraseña
5. Salt
6. Rol (`administrador` o `vendedor`)
7. Activo
8. Fecha de creación
9. Último acceso

No cambies los datos existentes ni pegues contraseñas en la planilla.

## 2. Archivo nuevo

En el mismo proyecto de Apps Script donde está `Código.gs`, creá un archivo llamado `UsuariosAPI.gs`. Pegá allí **todo** el contenido de [UsuariosAPI.gs](../apps-script/UsuariosAPI.gs). El archivo reutiliza las funciones existentes `crearUsuarioSeguro_` y `hashPassword_`.

## 3. Rutas en `handleRequest`

En `Código.gs`, dentro de `handleRequest(e)`, después de estas líneas:

```javascript
autorizarAccionSegura_(sesion, action);
```

y **antes** del bloque especial para el rol `vendedor`, pegá:

```javascript
if (action === 'getUsuarios') {
  return jsonResponse(usuariosListarSeguro_(ss, sesion));
}
if (action === 'crearUsuario') {
  return jsonResponse(usuariosCrearSeguro_(ss, sesion, body));
}
if (action === 'cambiarEstadoUsuario') {
  return jsonResponse(usuariosCambiarEstadoSeguro_(ss, sesion, body));
}
if (action === 'restablecerClaveUsuario') {
  return jsonResponse(usuariosRestablecerClaveSeguro_(ss, sesion, body));
}
if (action === 'editarUsuario') {
  return jsonResponse(usuariosEditarSeguro_(ss, sesion, body));
}
if (action === 'cambiarClavePropia') {
  return jsonResponse(usuariosCambiarClavePropiaSeguro_(ss, sesion, body));
}
```

Si ya pegaste y publicaste las primeras cuatro rutas, **no las dupliques**: agregá solamente los bloques `editarUsuario` y `cambiarClavePropia` inmediatamente debajo de `restablecerClaveUsuario`. Después reemplazá el contenido de `UsuariosAPI.gs` por la versión actualizada completa.

En la función `autorizarAccionSegura_`, agregá **solo** `'cambiarClavePropia'` dentro de la lista `accionesVendedor`. No agregues `getUsuarios`, `crearUsuario`, `editarUsuario`, `cambiarEstadoUsuario` ni `restablecerClaveUsuario`: esas operaciones siguen siendo exclusivas de administradora.

Guardá y publicá una **versión nueva** de la implementación web. Nombre sugerido: `Gestión segura de usuarios`.

## 4. Prueba sin tocar la cuenta principal

1. Entrá como administradora y abrí **Configuración → Usuarios**. La lista debe mostrar usuario, nombre, rol, estado y último acceso; nunca hash ni salt.
2. Creá una cuenta de prueba con rol vendedor y contraseña de al menos diez caracteres.
3. Abrí una ventana privada e iniciá sesión con esa cuenta. Debe ver solo los módulos permitidos y no debe ver Usuarios.
4. Desactivá la cuenta de prueba desde la sesión administradora. Su sesión abierta debe dejar de funcionar y no debe poder volver a ingresar.
5. Reactivala y restablecé su contraseña. La contraseña anterior debe dejar de funcionar.
6. Verificá que no podés desactivar ni restablecer la contraseña de la cuenta administradora desde su propia sesión.
7. Editá el nombre visible de la cuenta de prueba. Cambiá su rol y comprobá que su sesión anterior se cierre. El nombre de usuario con el que inicia sesión debe quedar fijo.
8. Desde una cuenta vendedora, usá **Cambiar contraseña** al pie del menú. Debe exigir la contraseña actual, cerrar la sesión y aceptar solo la nueva al volver a ingresar.

Si alguno de estos pasos falla, no uses todavía Usuarios para cuentas reales.
