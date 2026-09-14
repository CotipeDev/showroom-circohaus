const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const rows = [
  ['ID','Usuario','Nombre','Hash','Salt','Rol','Activo','Creado','Ultimo'],
  ['USR-1','admin','Dueña','hash-secreto','salt-secreto','administrador',true,'',''],
  ['USR-2','venta','Vendedora','hash-venta','salt-venta','vendedor',true,'','']
];
const sessions = {'SESION_abc':JSON.stringify({id_usuario:'USR-2',rol:'vendedor'})};
const sheet = {
  getLastColumn:()=>9,
  getDataRange:()=>({getValues:()=>rows}),
  getRange:(r,c)=>({
    setValue:v=>{rows[r-1][c-1]=v},
    setValues:values=>{values[0].forEach((v,i)=>{rows[r-1][c-1+i]=v})}
  })
};
const context = {
  SpreadsheetApp:{flush(){}},
  LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
  PropertiesService:{getScriptProperties:()=>({getProperties:()=>({...sessions}),deleteProperty:key=>{delete sessions[key]}})},
  CacheService:{getScriptCache:()=>({remove(){}})},
  Utilities:{getUuid:()=> 'nuevo-salt'},
  hashPassword_:(password,salt)=>`hash:${salt}:${password}`,
  crearUsuarioSeguro_:(ss,usuario,nombre,password,rol)=>{
    rows.push(['USR-3',usuario,nombre,`hash:${password}`,'salt',rol,true,'','']);
    return 'USR-3';
  }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('apps-script/UsuariosAPI.gs','utf8'),context);
const ss={getSheetByName:name=>name==='Usuarios'?sheet:null};
const admin={id_usuario:'USR-1',rol:'administrador'};
const vendedor={id_usuario:'USR-2',rol:'vendedor'};

assert.throws(()=>context.usuariosListarSeguro_(ss,vendedor),/administradora/);
const listado=context.usuariosListarSeguro_(ss,admin).usuarios;
assert.equal(listado.length,2);
assert.equal(JSON.stringify(listado).includes('hash-secreto'),false);
assert.equal(JSON.stringify(listado).includes('salt-secreto'),false);
assert.throws(()=>context.usuariosCambiarEstadoSeguro_(ss,admin,{id_usuario:'USR-1',activo:false}),/propia cuenta/);
assert.throws(()=>context.usuariosCrearSeguro_(ss,admin,{usuario:'maria',nombre:'María',rol:'vendedor',password:'corta'}),/10 caracteres/);
assert.equal(context.usuariosCrearSeguro_(ss,admin,{usuario:'maria',nombre:'María',rol:'vendedor',password:'clave-larga-123'}).id_usuario,'USR-3');
assert.equal(rows.length,4);
assert.equal(context.usuariosRestablecerClaveSeguro_(ss,admin,{id_usuario:'USR-2',password:'nueva-clave-123'}).ok,true);
assert.equal(rows[2][3],'hash:nuevo-salt:nueva-clave-123');
assert.equal(sessions.SESION_abc,undefined);
assert.equal(context.usuariosCambiarEstadoSeguro_(ss,admin,{id_usuario:'USR-2',activo:false}).ok,true);
assert.equal(rows[2][6],false);
assert.throws(()=>context.usuariosEditarSeguro_(ss,admin,{id_usuario:'USR-1',nombre:'Dueña',rol:'vendedor'}),/propio rol/);
assert.equal(context.usuariosEditarSeguro_(ss,admin,{id_usuario:'USR-1',nombre:'Constanza',rol:'administrador'}).ok,true);
assert.equal(rows[1][2],'Constanza');
sessions.SESION_def=JSON.stringify({id_usuario:'USR-3',rol:'vendedor'});
assert.equal(context.usuariosEditarSeguro_(ss,admin,{id_usuario:'USR-3',nombre:'María López',rol:'administrador'}).ok,true);
assert.equal(rows[3][5],'administrador');
assert.equal(sessions.SESION_def,undefined);
rows[2][3]='hash:salt-venta:clave-actual-123';
rows[2][4]='salt-venta';
rows[2][6]=true;
sessions.SESION_ghi=JSON.stringify({id_usuario:'USR-2',rol:'vendedor'});
assert.throws(()=>context.usuariosCambiarClavePropiaSeguro_(ss,vendedor,{password_actual:'incorrecta',password_nuevo:'nueva-clave-456'}),/incorrecta/);
assert.equal(context.usuariosCambiarClavePropiaSeguro_(ss,vendedor,{password_actual:'clave-actual-123',password_nuevo:'nueva-clave-456'}).ok,true);
assert.equal(rows[2][3],'hash:nuevo-salt:nueva-clave-456');
assert.equal(sessions.SESION_ghi,undefined);
console.log('Usuarios API: pruebas correctas');
