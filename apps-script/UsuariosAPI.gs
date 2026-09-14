// CircoHaus: API de Usuarios. Pegar como archivo nuevo en el MISMO proyecto
// de Apps Script que contiene hashPassword_ y crearUsuarioSeguro_.
// Las cuatro rutas se agregan por separado en handleRequest (ver docs/usuarios-apps-script.md).

function usuariosValidarAdmin_(sesion) {
  if (String(sesion && sesion.rol || '').trim().toLowerCase() !== 'administrador') {
    throw new Error('Solo una administradora puede gestionar usuarios.');
  }
}

function usuariosHoja_(ss) {
  const hoja = ss.getSheetByName('Usuarios');
  if (!hoja || hoja.getLastColumn() < 9) {
    throw new Error('La hoja Usuarios no tiene la estructura esperada.');
  }
  return hoja;
}

function usuariosActivo_(valor) {
  return valor === true || String(valor).trim().toUpperCase() === 'TRUE';
}

function usuariosFilaPorId_(datos, id) {
  const buscado = String(id || '').trim();
  if (!buscado) throw new Error('Falta identificar al usuario.');
  for (let i = 1; i < datos.length; i++) {
    if (String(datos[i][0] || '').trim() === buscado) return i;
  }
  throw new Error('No se encontró el usuario.');
}

function usuariosRevocarSesiones_(idUsuario) {
  const propiedades = PropertiesService.getScriptProperties();
  const cache = CacheService.getScriptCache();
  const todas = propiedades.getProperties();
  Object.keys(todas).forEach(function(clave) {
    if (clave.indexOf('SESION_') !== 0) return;
    try {
      const sesion = JSON.parse(todas[clave]);
      if (String(sesion.id_usuario || '') !== String(idUsuario)) return;
      propiedades.deleteProperty(clave);
      cache.remove(clave);
    } catch (error) {
      // No modificar propiedades ajenas o sesiones que no se pueden identificar.
    }
  });
}

function usuariosListarSeguro_(ss, sesion) {
  usuariosValidarAdmin_(sesion);
  const datos = usuariosHoja_(ss).getDataRange().getValues();
  return {
    ok: true,
    usuarios: datos.slice(1).filter(function(fila) { return String(fila[0] || '').trim(); }).map(function(fila) {
      return {
        id_usuario: String(fila[0] || ''),
        usuario: String(fila[1] || ''),
        nombre: String(fila[2] || ''),
        rol: String(fila[5] || '').trim().toLowerCase(),
        activo: usuariosActivo_(fila[6]),
        ultimo_acceso: fila[8] || ''
      };
    })
  };
}

function usuariosCrearSeguro_(ss, sesion, body) {
  usuariosValidarAdmin_(sesion);
  const usuario = String(body.usuario || '').trim().toLowerCase();
  const nombre = String(body.nombre || '').trim();
  const password = String(body.password || '');
  const rol = String(body.rol || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,40}$/.test(usuario)) throw new Error('El usuario debe tener de 3 a 40 letras, números, puntos, guiones o guiones bajos.');
  if (!nombre || nombre.length > 100) throw new Error('Ingresá un nombre de hasta 100 caracteres.');
  if (password.length < 10) throw new Error('La contraseña debe tener al menos 10 caracteres.');
  if (rol !== 'administrador' && rol !== 'vendedor') throw new Error('Rol inválido.');
  usuariosHoja_(ss);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const id = crearUsuarioSeguro_(ss, usuario, nombre, password, rol);
    SpreadsheetApp.flush();
    return {ok: true, id_usuario: id};
  } finally {
    lock.releaseLock();
  }
}

function usuariosCambiarEstadoSeguro_(ss, sesion, body) {
  usuariosValidarAdmin_(sesion);
  if (typeof body.activo !== 'boolean') throw new Error('Estado inválido.');
  const id = String(body.id_usuario || '').trim();
  if (id === String(sesion.id_usuario || '')) throw new Error('No podés cambiar el estado de tu propia cuenta.');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const hoja = usuariosHoja_(ss);
    const datos = hoja.getDataRange().getValues();
    const i = usuariosFilaPorId_(datos, id);
    const rol = String(datos[i][5] || '').trim().toLowerCase();
    if (!body.activo && rol === 'administrador') {
      const otrasAdmin = datos.slice(1).filter(function(fila) {
        return String(fila[0]) !== id && String(fila[5] || '').trim().toLowerCase() === 'administrador' && usuariosActivo_(fila[6]);
      });
      if (!otrasAdmin.length) throw new Error('Debe quedar al menos una administradora activa.');
    }
    hoja.getRange(i + 1, 7).setValue(body.activo);
    SpreadsheetApp.flush();
    if (!body.activo) usuariosRevocarSesiones_(id);
    return {ok: true};
  } finally {
    lock.releaseLock();
  }
}

function usuariosRestablecerClaveSeguro_(ss, sesion, body) {
  usuariosValidarAdmin_(sesion);
  const id = String(body.id_usuario || '').trim();
  const password = String(body.password || '');
  if (id === String(sesion.id_usuario || '')) throw new Error('Pedile a otra administradora que cambie tu contraseña.');
  if (password.length < 10) throw new Error('La contraseña debe tener al menos 10 caracteres.');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const hoja = usuariosHoja_(ss);
    const datos = hoja.getDataRange().getValues();
    const i = usuariosFilaPorId_(datos, id);
    const salt = Utilities.getUuid();
    hoja.getRange(i + 1, 4, 1, 2).setValues([[hashPassword_(password, salt), salt]]);
    SpreadsheetApp.flush();
    usuariosRevocarSesiones_(id);
    return {ok: true};
  } finally {
    lock.releaseLock();
  }
}
