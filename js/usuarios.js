// Gestión de usuarios. Nunca se solicita ni se guarda el hash de una contraseña.
let usuariosGestionData=[];

async function iniciarUsuarios(){
  if(esVendedor())return;
  const loading=document.getElementById('usuarios-loading');
  const table=document.getElementById('usuarios-table');
  loading.innerHTML='<div class="spinner"></div> Cargando usuarios...';
  loading.style.display='flex';
  table.style.display='none';
  try{
    const respuesta=await apiGet('getUsuarios');
    if(!Array.isArray(respuesta?.usuarios))throw new Error('La API de Usuarios todavía no está publicada.');
    usuariosGestionData=respuesta.usuarios;
    renderUsuarios();
    loading.style.display='none';
    table.style.display='table';
  }catch(e){
    loading.innerHTML=`<div style="color:var(--error);font-size:13px">${textoSeguro(e.message||'No se pudieron cargar los usuarios.')} <button class="btn btn-secondary" style="padding:5px 9px;margin-left:8px" onclick="iniciarUsuarios()">Reintentar</button></div>`;
  }
}

function renderUsuarios(){
  const actual=String(sesionActual()?.usuario?.id_usuario||'');
  const rows=[...usuariosGestionData].sort((a,b)=>Number(b.activo)-Number(a.activo)||String(a.usuario).localeCompare(String(b.usuario)));
  document.getElementById('usuarios-body').innerHTML=rows.length?rows.map(u=>{
    const propio=String(u.id_usuario)===actual;
    const ultimo=u.ultimo_acceso?fechaStr(u.ultimo_acceso):'—';
    return`<tr><td><strong>${textoSeguro(u.usuario)}</strong>${propio?' <span style="font-size:10px;color:var(--text-light)">(tu cuenta)</span>':''}</td><td>${textoSeguro(u.nombre||'—')}</td><td>${u.rol==='administrador'?'Administrador':'Vendedor'}</td><td><span class="badge ${u.activo?'badge-ok':'badge-zero'}">${u.activo?'Activo':'Inactivo'}</span></td><td>${textoSeguro(ultimo)}</td><td style="text-align:right;white-space:nowrap"><button class="btn btn-secondary" style="padding:6px 9px;font-size:11px" data-id="${textoSeguro(u.id_usuario)}" onclick="abrirEditarUsuario(this.dataset.id)">Editar</button> <button class="btn btn-secondary" style="padding:6px 9px;font-size:11px" data-id="${textoSeguro(u.id_usuario)}" onclick="abrirClaveUsuario(this.dataset.id)" ${propio?'disabled title="Tu contraseña se cambia desde otra cuenta administradora"':''}>Contraseña</button> <button class="btn ${u.activo?'btn-danger':'btn-secondary'}" style="padding:6px 9px;font-size:11px" data-id="${textoSeguro(u.id_usuario)}" onclick="cambiarEstadoUsuario(this.dataset.id)" ${propio?'disabled title="No podés desactivar tu propia cuenta"':''}>${u.activo?'Desactivar':'Activar'}</button></td></tr>`;
  }).join(''):'<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-mid)">No hay usuarios registrados.</td></tr>';
}

function abrirNuevoUsuario(){
  ['usuario-nuevo-login','usuario-nuevo-nombre','usuario-nuevo-clave'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('usuario-nuevo-rol').value='vendedor';
  document.getElementById('modal-nuevo-usuario').classList.add('open');
  setTimeout(()=>document.getElementById('usuario-nuevo-login').focus(),50);
}

function abrirEditarUsuario(id){
  const u=usuariosGestionData.find(x=>String(x.id_usuario)===String(id));
  if(!u)return;
  const propio=String(id)===String(sesionActual()?.usuario?.id_usuario||'');
  document.getElementById('usuario-editar-id').value=u.id_usuario;
  document.getElementById('usuario-editar-login').value=u.usuario;
  document.getElementById('usuario-editar-nombre').value=u.nombre||'';
  document.getElementById('usuario-editar-rol').value=u.rol;
  document.getElementById('usuario-editar-rol').disabled=propio;
  document.getElementById('modal-editar-usuario').classList.add('open');
}

async function guardarEdicionUsuario(){
  const id_usuario=document.getElementById('usuario-editar-id').value;
  const nombre=document.getElementById('usuario-editar-nombre').value.trim();
  const rol=document.getElementById('usuario-editar-rol').value;
  if(!nombre){showToast('Ingresá el nombre visible.','error');return}
  try{
    await apiPost('editarUsuario',{id_usuario,nombre,rol});
    const sesion=sesionActual();
    if(sesion?.usuario?.id_usuario===id_usuario){
      sesion.usuario.nombre=nombre;
      sessionStorage.setItem(LOGIN_KEY,JSON.stringify(sesion));
      aplicarPermisosUI();
    }
    cerrarModal('modal-editar-usuario');
    await iniciarUsuarios();
    showToast('Usuario actualizado');
  }catch(e){showToast(e.message||'No se pudo editar el usuario.','error')}
}

async function guardarNuevoUsuario(){
  const usuario=document.getElementById('usuario-nuevo-login').value.trim().toLowerCase();
  const nombre=document.getElementById('usuario-nuevo-nombre').value.trim();
  const rol=document.getElementById('usuario-nuevo-rol').value;
  const password=document.getElementById('usuario-nuevo-clave').value;
  if(!usuario||!nombre){showToast('Completá usuario y nombre.','error');return}
  if(password.length<10){showToast('La contraseña debe tener al menos 10 caracteres.','error');return}
  try{
    await apiPost('crearUsuario',{usuario,nombre,rol,password});
    document.getElementById('usuario-nuevo-clave').value='';
    cerrarModal('modal-nuevo-usuario');
    await iniciarUsuarios();
    showToast('Usuario creado');
  }catch(e){showToast(e.message||'No se pudo crear el usuario.','error')}
}

function abrirClaveUsuario(id){
  const u=usuariosGestionData.find(x=>String(x.id_usuario)===String(id));
  if(!u||String(id)===String(sesionActual()?.usuario?.id_usuario||''))return;
  document.getElementById('usuario-clave-id').value=u.id_usuario;
  document.getElementById('usuario-clave-destino').textContent=`Usuario: ${u.usuario}`;
  document.getElementById('usuario-clave-nueva').value='';
  document.getElementById('modal-clave-usuario').classList.add('open');
}

async function guardarClaveUsuario(){
  const id_usuario=document.getElementById('usuario-clave-id').value;
  const password=document.getElementById('usuario-clave-nueva').value;
  if(password.length<10){showToast('La contraseña debe tener al menos 10 caracteres.','error');return}
  try{
    await apiPost('restablecerClaveUsuario',{id_usuario,password});
    document.getElementById('usuario-clave-nueva').value='';
    cerrarModal('modal-clave-usuario');
    showToast('Contraseña actualizada. Las sesiones anteriores se cerraron.');
  }catch(e){showToast(e.message||'No se pudo cambiar la contraseña.','error')}
}

async function cambiarEstadoUsuario(id){
  const u=usuariosGestionData.find(x=>String(x.id_usuario)===String(id));
  if(!u||String(id)===String(sesionActual()?.usuario?.id_usuario||''))return;
  const activo=!u.activo;
  if(!confirm(`${activo?'¿Activar':'¿Desactivar'} a ${u.nombre||u.usuario}?${activo?'':' Se cerrarán sus sesiones abiertas.'}`))return;
  try{
    await apiPost('cambiarEstadoUsuario',{id_usuario:u.id_usuario,activo});
    await iniciarUsuarios();
    showToast(activo?'Usuario activado':'Usuario desactivado');
  }catch(e){showToast(e.message||'No se pudo actualizar el usuario.','error')}
}

function abrirCambioClavePropia(){
  ['usuario-clave-actual','usuario-clave-propia-nueva','usuario-clave-propia-repetida'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('modal-clave-propia').classList.add('open');
  setTimeout(()=>document.getElementById('usuario-clave-actual').focus(),50);
}

async function guardarClavePropia(){
  const password_actual=document.getElementById('usuario-clave-actual').value;
  const password_nuevo=document.getElementById('usuario-clave-propia-nueva').value;
  const repetida=document.getElementById('usuario-clave-propia-repetida').value;
  if(password_nuevo.length<10){showToast('La nueva contraseña debe tener al menos 10 caracteres.','error');return}
  if(password_nuevo!==repetida){showToast('Las contraseñas nuevas no coinciden.','error');return}
  if(!password_actual){showToast('Ingresá tu contraseña actual.','error');return}
  try{
    await apiPost('cambiarClavePropia',{password_actual,password_nuevo});
    ['usuario-clave-actual','usuario-clave-propia-nueva','usuario-clave-propia-repetida'].forEach(id=>document.getElementById(id).value='');
    cerrarModal('modal-clave-propia');
    await cerrarSesion(false);
    showToast('Contraseña cambiada. Ingresá nuevamente.');
  }catch(e){showToast(e.message||'No se pudo cambiar la contraseña.','error')}
}
