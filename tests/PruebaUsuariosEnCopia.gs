/**
 * @OnlyCurrentDoc
 */
// SÓLO en la planilla de pruebas. Deja un vendedor de prueba desactivado.
function probarUsuariosEnCopia() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss || !/pruebas de producci[oó]n/i.test(ss.getName())) {
    throw new Error('Detenido: no es la planilla de pruebas.');
  }

  const hoja = ss.getSheetByName('Usuarios');
  if (!hoja) throw new Error('No existe la hoja Usuarios.');
  const datos = hoja.getDataRange().getValues();
  const admin = datos.slice(1).find(function(fila) {
    const activo = fila[6] === true || String(fila[6]).toUpperCase() === 'TRUE';
    return String(fila[0] || '').trim() &&
      String(fila[5] || '').trim().toLowerCase() === 'administrador' && activo;
  });
  if (!admin) throw new Error('No hay una administradora activa para la prueba.');

  const marca = Date.now();
  const usuario = 'prueba_vend_' + marca;
  const claveInicial = 'Inicial-' + marca + '-Aa1';
  const claveNueva = 'Nueva-' + marca + '-Bb2';
  const sesionAdmin = {
    id_usuario: String(admin[0]).trim(),
    usuario: String(admin[1]).trim(),
    nombre: String(admin[2] || admin[1]).trim(),
    rol: 'administrador'
  };
  let idUsuario = '';

  try {
    const alta = usuariosCrearSeguro_(ss, sesionAdmin, {
      usuario: usuario,
      nombre: 'Vendedor de prueba',
      password: claveInicial,
      rol: 'vendedor'
    });
    idUsuario = String(alta.id_usuario || '').trim();
    if (!alta.ok || !idUsuario) throw new Error('No se creó el vendedor de prueba.');

    const ingresoInicial = iniciarSesionSegura_(ss, usuario, claveInicial);
    if (!ingresoInicial.ok || !ingresoInicial.token ||
        String(ingresoInicial.usuario.rol).toLowerCase() !== 'vendedor') {
      throw new Error('El vendedor no pudo ingresar con la clave inicial.');
    }

    let listadoDenegado = false;
    try {
      usuariosListarSeguro_(ss, ingresoInicial.usuario);
    } catch (error) {
      listadoDenegado = /administradora/i.test(String(error.message || ''));
      if (!listadoDenegado) throw error;
    }
    if (!listadoDenegado) throw new Error('El vendedor pudo consultar la administración de usuarios.');

    const cambio = usuariosCambiarClavePropiaSeguro_(ss, ingresoInicial.usuario, {
      password_actual: claveInicial,
      password_nuevo: claveNueva
    });
    if (!cambio.ok) throw new Error('No se pudo cambiar la clave propia.');

    let claveAnteriorRechazada = false;
    try {
      iniciarSesionSegura_(ss, usuario, claveInicial);
    } catch (error) {
      claveAnteriorRechazada = /incorrectos/i.test(String(error.message || ''));
      if (!claveAnteriorRechazada) throw error;
    }
    if (!claveAnteriorRechazada) throw new Error('La contraseña anterior continuó funcionando.');

    const ingresoNuevo = iniciarSesionSegura_(ss, usuario, claveNueva);
    if (!ingresoNuevo.ok || !ingresoNuevo.token) {
      throw new Error('La nueva contraseña no permitió ingresar.');
    }

    const baja = usuariosCambiarEstadoSeguro_(ss, sesionAdmin, {
      id_usuario: idUsuario,
      activo: false
    });
    if (!baja.ok) throw new Error('No se desactivó el vendedor de prueba.');

    let desactivadoRechazado = false;
    try {
      iniciarSesionSegura_(ss, usuario, claveNueva);
    } catch (error) {
      desactivadoRechazado = /desactivado/i.test(String(error.message || ''));
      if (!desactivadoRechazado) throw error;
    }
    if (!desactivadoRechazado) throw new Error('El usuario desactivado pudo volver a ingresar.');

    const listado = usuariosListarSeguro_(ss, sesionAdmin).usuarios;
    const creado = listado.find(function(item) {
      return String(item.id_usuario) === idUsuario;
    });
    if (!creado || creado.activo !== false || creado.rol !== 'vendedor') {
      throw new Error('El usuario no quedó registrado como vendedor desactivado.');
    }
    if (/password|hash|salt/i.test(JSON.stringify(creado))) {
      throw new Error('El listado expuso información reservada de la contraseña.');
    }

    Logger.log('OK: alta, ingreso, cambio de clave, permisos y desactivación del vendedor correctos.');
    Logger.log('El usuario ' + usuario + ' queda desactivado sólo en la COPIA.');
  } catch (error) {
    if (idUsuario) {
      try {
        usuariosCambiarEstadoSeguro_(ss, sesionAdmin, {
          id_usuario: idUsuario,
          activo: false
        });
      } catch (ignorar) {}
    }
    Logger.log('FALLÓ la prueba. Revisar en la COPIA el usuario ' + usuario + '.');
    throw error;
  }
}
