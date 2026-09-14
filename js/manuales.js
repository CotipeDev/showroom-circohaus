// Guías breves vinculadas a los módulos reales. El acceso lo controla la sesión.
const guiaOperativa=[
  {titulo:'Nueva venta',ruta:'ventas',pasos:['Buscá el producto por código o nombre y comprobá el stock antes de agregarlo.','Indicá cantidad, canal de venta y forma de cobro. Para una venta a crédito, seleccioná el cliente.','Revisá el resumen y confirmá una sola vez. La venta descuenta stock y queda en el historial.'],nota:'Si el producto no tiene stock, no lo agregues a la venta.'},
  {titulo:'Historial de ventas',ruta:'historial-ventas',pasos:['Usá la búsqueda y los filtros de fecha o estado para encontrar una venta.','Abrí el detalle para ver productos, pagos y quién la registró.'],nota:'El botón de facturar solo está disponible para administración.'},
  {titulo:'Clientes',ruta:'clientes',pasos:['Buscá o creá un cliente antes de registrar una venta a crédito.','Desde Historial podés ver sus ventas, saldo y pagos relacionados.']},
  {titulo:'Productos y consulta de precios',ruta:'productos',pasos:['Buscá por código o descripción.','Verificá el precio, estado comercial y stock disponible.'],nota:'El vendedor consulta el catálogo; el alta y la edición corresponden a administración.'},
  {titulo:'Stock',ruta:'stock',pasos:['Consultá las unidades disponibles y los productos con stock bajo o agotado.','Si un dato no coincide con la mercadería física, avisá a administración antes de vender.']},
  {titulo:'Cuentas por cobrar',ruta:'cxc',pasos:['Buscá al cliente y revisá su saldo pendiente.','Al recibir un pago, elegí Registrar pago, completá el importe y confirmá.','Volvé a abrir el detalle para verificar que el pago y el saldo se actualizaron.']}
];
const guiaAdministracion=[
  {titulo:'Productos y carga masiva',ruta:'productos',pasos:['Usá Nuevo producto para un alta individual.','Para muchos productos, descargá la plantilla CSV, completala en Excel y guardala como CSV UTF-8.','En Carga masiva, revisá la vista previa y confirmá solo los códigos nuevos.'],nota:'La importación no cambia productos existentes. Para modificar un precio o stock existente, usá el flujo correspondiente; hacé una copia de la planilla antes de una carga real.'},
  {titulo:'Ingreso de mercadería',ruta:'ingresos',pasos:['Registrá el proveedor y los productos recibidos.','Revisá cantidades y costos antes de confirmar; el ingreso actualiza el stock.','Consultá el historial si necesitás revisar una recepción.']},
  {titulo:'Cuentas',ruta:'cuentas',pasos:['Consultá el disponible de cada cuenta.','Entrá a una cuenta para ver sus movimientos asociados.','Usá Nueva cuenta cuando agregues efectivo, banco o billetera.']},
  {titulo:'Movimientos',ruta:'movimientos',pasos:['Filtrá por cuenta, tipo o período.','Usá Registrar movimiento para ingresos o egresos manuales que no provienen de una venta.','Revisá cuenta, monto y categoría antes de guardar.'],nota:'Las ventas y los cobros registrados por sus módulos generan movimientos automáticamente.'},
  {titulo:'Conciliación',ruta:'conciliacion',pasos:['Elegí cuenta, mes y estado.','Compará el importe esperado con lo acreditado realmente.','Revisá y conciliá solo cuando coincidan.']},
  {titulo:'Facturación',ruta:'facturas',pasos:['En Ventas pendientes, elegí la venta a facturar.','Emití el comprobante fiscal en ARCA.','Volvé a Circo Haus, registrá el número y la fecha; verificá el resultado en Historial de facturas.'],nota:'Circo Haus registra el comprobante, pero no lo emite ante ARCA. No ingreses números de prueba en la base real.'},
  {titulo:'Análisis y reportes',ruta:'reportes',pasos:['Elegí el período a analizar.','Revisá ventas, medios de pago, márgenes y productos según la sección.','Contrastá los resultados con las ventas y movimientos cuando investigues una diferencia.']},
  {titulo:'Proveedores y categorías',ruta:'proveedores',pasos:['Creá proveedores y categorías antes de usarlos en el catálogo o en una importación.','Entrá en un proveedor o categoría para ver sus productos.']},
  {titulo:'Medios y planes de cobro',ruta:'medios-pago',pasos:['Mantené actualizados los medios, costos y planes que se ofrecen al cobrar.','Revisá la configuración antes de registrar ventas con un medio nuevo.']},
  {titulo:'Usuarios',ruta:'usuarios',pasos:['Creá un usuario con el rol correcto y compartí su clave inicial por un canal privado.','Editá o desactivá accesos cuando cambien las personas.','Cada usuario puede cambiar su propia contraseña desde la parte inferior del menú.']}
];

function iniciarManuales(){
  const vendedor=esVendedor();
  const subtitulo=document.getElementById('manuales-subtitulo');
  subtitulo.textContent=vendedor?'Guía de ventas y consultas disponibles para tu perfil':'Guía de operación, finanzas y configuración';
  const seccion=(titulo,items)=>'<h2 style="font-size:17px;color:var(--navy);margin:24px 0 12px">'+titulo+'</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px">'+items.map(g=>'<article class="card" style="margin:0"><h3 style="font-size:15px;color:var(--navy);margin-bottom:10px">'+textoSeguro(g.titulo)+'</h3><ol style="padding-left:20px;font-size:13px;line-height:1.6;color:var(--text-mid)">'+g.pasos.map(p=>'<li>'+textoSeguro(p)+'</li>').join('')+'</ol>'+(g.nota?'<p style="font-size:12px;color:var(--text-mid);background:var(--off-white);border-radius:8px;padding:9px;margin:10px 0">'+textoSeguro(g.nota)+'</p>':'')+'<button class="btn btn-secondary" style="margin-top:10px;font-size:12px" data-ruta="'+textoSeguro(g.ruta)+'" onclick="irA(this.dataset.ruta)">Ir al módulo →</button></article>').join('')+'</div>';
  document.getElementById('manuales-contenido').innerHTML=seccion('Ventas y atención al cliente',guiaOperativa)+(vendedor?'':seccion('Administración',guiaAdministracion));
}
