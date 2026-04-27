# showroom-circohaus - 27/04/26
# CircoHaus — Sistema de Gestión de Showroom

Sistema web de gestión interna para **CircoHaus Casa Atelier**, showroom de vajilla y decoración.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | HTML + CSS + JavaScript (un solo archivo `index.html`) |
| Backend / API | Google Apps Script |
| Base de datos | Google Sheets |
| Hosting | Netlify (conectado a GitHub) |
| Control de versiones | GitHub |

---

## URLs importantes

- **Sistema publicado:** https://showroomcircohaus.netlify.app
- **Apps Script (API actual):** `https://script.google.com/macros/s/AKfycbyoO1Ox8yjZK78W4UFAf9vB0U_9DpbtCSZHjB_mru3TNDlO041ZFs1kYKAEWnAe1pOo/exec`

---

## Estructura del repositorio

```
showroom-circohauss/
├── index.html                          ← Sistema completo (HTML + CSS + JS en un solo archivo)
├── manual.html                         ← Página del manual con visor inline
├── docs/
│   └── manual_gestion_ingresos_stock.pdf
└── apps-script.js                      ← Código del backend (referencia — se pega en Google Apps Script)
```

> **Importante:** Todo el sistema vive en `index.html`. CSS, JS y HTML están en un solo archivo para evitar problemas de carga en Netlify.

---

## Base de datos — Google Sheets

El archivo se llama **"Sistema Showroom"** y tiene estas pestañas:

| Pestaña | Columnas |
|---|---|
| `Productos` | Codigo, Descripcion, Proveedor, Precio_Venta, Precio_Costo, Stock, Stock_Minimo, Categoria |
| `Proveedores` | Codigo_Proveedor, Nombre, Contacto |
| `Ingresos` | ID_Ingreso, Fecha, Proveedor, Nro_Remito |
| `Detalle_Ingresos` | ID_Ingreso, Codigo_Producto, Cantidad, Precio_Costo |
| `Categorias` | Nombre |
| `Historial_Costos` | Fecha, Codigo_Producto, Descripcion, Costo_Anterior, Costo_Nuevo, Margen_Anterior, Margen_Nuevo |

---

## Módulos implementados

- **Home** — KPIs (alertas de stock, total productos, proveedores) + tarjetas de acceso a módulos
- **Ingresos** — Registro de mercadería con buscador autocomplete + popup de actualización de costos
- **Stock** — Inventario en tiempo real con badges de estado, buscador y filtro por categoría
- **Productos** — Catálogo con cálculo automático de precio por margen, edición y eliminación
- **Proveedores** — ABM de proveedores
- **Categorías** — ABM de categorías
- **Instructivos** — Visor de manuales con descarga en PDF
- **Notificaciones** — Campana con alertas automáticas de stock bajo o agotado

---

## Paleta de colores

```css
--navy:      #485472   /* Header, textos importantes */
--teal:      #58A4B0   /* Acento principal, botones, tabs activos */
--rose:      #DAA49A   /* Acento cálido, logo, hover */
--pearl:     #D8DBE2   /* Fondo principal */
--blue-mist: #A9BCD0   /* Textos secundarios sobre fondo oscuro */
```

---

## Cómo actualizar el sistema

### Cambios en el frontend (index.html)
1. Modificar `index.html`
2. Subir a GitHub
3. En Netlify → Deploys → Trigger deploy → Deploy site

### Cambios en el backend (Apps Script)
1. Abrir Google Apps Script del sheet
2. Reemplazar el código con el contenido de `apps-script.js`
3. Guardar
4. Implementar → Nueva implementación → Aplicación web
   - Ejecutar como: Yo
   - Quién tiene acceso: Cualquier usuario
5. Copiar la nueva URL
6. Actualizar la variable `API_URL` en `index.html`
7. Subir a GitHub y redesplegar en Netlify

> **Importante:** Cada vez que se modifica el Apps Script hay que hacer una **nueva implementación** (no actualizar la existente). La URL cambia con cada nueva implementación.

---

## Funcionalidad clave — Popup de actualización de costos

Cuando en un ingreso el precio de costo de un producto difiere del registrado, aparece un popup con estas opciones:

1. **Mantener margen %** → el precio de venta sube o baja según el nuevo costo
2. **Mantener precio de venta** → el margen se recalcula automáticamente
3. **Definir nuevo margen** → el usuario ingresa el % y se calcula el nuevo precio
4. **No actualizar** → saltea sin hacer cambios

Todos los cambios quedan registrados en la pestaña `Historial_Costos` del Sheet.

---

## Convenciones de código

- **Códigos de producto:** prefijo del proveedor + número secuencial. Ej: `PQY-0001`
- **Cada variante es un SKU independiente** (color/talle distinto = código distinto)
- **Precios:** siempre en pesos argentinos
- **Ventas:** solo minorista

---

## Próximos módulos a desarrollar

- [ ] Módulo de Ventas
- [ ] Módulo de Reportes (rentabilidad, evolución de costos, ventas por período)
- [ ] Manual de Ventas (PDF + página HTML)
- [ ] Mejoras de responsive para mobile/tablet

---

## Manuales disponibles

| Manual | Cubre |
|---|---|
| Manual de Gestión: Ingresos y Stock | Categorías, Proveedores, Productos, Ingresos, Stock, Notificaciones |
| Manual de Ventas | *Próximamente* |
| Manual de Reportes | *Próximamente* |
