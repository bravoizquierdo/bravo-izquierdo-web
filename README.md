# Sitio web — Constructora Bravo Izquierdo

Rediseño premium del sitio https://bravoizquierdo.cl como **sitio estático puro** (HTML + CSS + JS vanilla, sin npm, sin build, sin frameworks). Listo para arrastrar la carpeta a Hostinger, Netlify o cualquier hosting estático. Las noticias y los proyectos se administran desde planillas **Excel (.xlsx)**, sin tocar código — incluyendo las **páginas de detalle** de cada proyecto y noticia, que se arman solas a partir de la planilla.

El contenido (planillas e imágenes) vive en el propio hosting y el encargado de comunicaciones lo actualiza desde **cPanel/FTP** (método principal, sin dependencias externas). Opcionalmente puede servirse desde OneDrive — ver más abajo.

Diseño: **corporativo claro y limpio** — fondo blanco con mucho aire, tipografía Manrope (titulares) + Inter (texto), tarjetas con sombras suaves, y el rojo del logo (`#d31f26`) usado con precisión como acento: botones, chips, palabras destacadas y detalles.

> 📋 **¿Por qué está hecho así?** Las decisiones de diseño y técnicas (incluido por qué **no** se usó OneDrive directo) están explicadas en **[DECISIONES.md](DECISIONES.md)**. Si retomas el proyecto desde otro computador o en una sesión nueva, lee ese archivo junto a este.

## Estructura

```
bravo-izquierdo-web/
│  ┌─ CÓDIGO DEL SITIO (no lo toca comunicaciones) ─────────────────┐
├── index.html             Portada
├── quienes-somos.html     Historia, misión, visión, valores, directorio
├── proyectos.html         Portafolio (cargado desde la planilla)
├── proyecto-detalle.html  ★ Ficha de proyecto (dinámica: ?id=…)
├── sostenibilidad.html    5 pilares + reportes
├── noticias.html          Noticias (cargadas desde la planilla)
├── noticia-detalle.html   ★ Detalle de noticia (dinámico: ?id=…)
├── denuncias.html         Canal de denuncias (Ley 20.393)
├── contacto.html          Datos de contacto y formulario
├── styles.css             Estilos (un solo archivo)
├── main.js                Lógica (IIFE, sin módulos ES)
├── .htaccess              Cabeceras de caché para Hostinger/Apache
├── lib/manifest.js        ★ CONFIGURACIÓN: datos de marca y (opcional) vínculos OneDrive
├── assets/img/            Imágenes NATIVAS del sitio: logos, íconos (fijas)
│  └────────────────────────────────────────────────────────────────┘
│
│  ┌─ CONTENIDO EDITABLE (comunicaciones, vía cPanel/FTP) ──────────┐
├── data/proyectos.xlsx    Planilla de proyectos (editar en Excel → subir)
├── data/noticias.xlsx     Planilla de noticias
├── data/img/              Fotos de proyectos y noticias (editable)
│  └────────────────────────────────────────────────────────────────┘
│
├── data/*.csv             Respaldo final (solo si SheetJS no carga)
└── data/_gen_plantillas.py  Regenera las plantillas .xlsx (opcional, se puede borrar)
```

**Dos zonas claras:** el **código** del sitio (que no cambia salvo rediseño) y el **contenido editable** dentro de `data/` (planillas + imágenes de proyectos/noticias). El acceso del editor se restringe a `data/` — ver más abajo.

**Páginas de detalle dinámicas:** `proyecto-detalle.html` y `noticia-detalle.html` son una sola plantilla cada una. Leen el identificador desde la URL (`?id=nombre-del-proyecto`), buscan esa fila en la planilla y arman la ficha completa (foto, ficha técnica, descripción larga, galería). **No hay que crear ni programar una página por cada proyecto o noticia** — basta con llenar la fila en Excel. Las tarjetas de los listados enlazan automáticamente a su detalle.

## Administración del contenido (método principal: cPanel/FTP)

El contenido vive en la carpeta **`data/`** del hosting. El encargado de comunicaciones lo actualiza sin tocar código y sin servicios externos: edita las planillas en **Excel** y las sube por cPanel o FTP. Como el archivo está en el mismo servidor que la web, no hay CORS, ni proxy, ni cuentas de terceros.

**Configuración (una sola vez):**

1. Subir todo el sitio al hosting (incluida la carpeta `data/` con las planillas y `data/img/`).
2. En cPanel → **Cuentas FTP**, crear una cuenta para comunicaciones **restringida al directorio `data/`** (en "Directorio", apuntar a `.../public_html/data`). Así el editor solo ve/cambia el contenido, nunca el código.

**Flujo del editor (cada vez que actualiza):**

1. Descargar `proyectos.xlsx` (o `noticias.xlsx`) desde cPanel/FTP.
2. Editarlo en Excel — agregar o modificar filas (ver columnas más abajo).
3. Subirlo de vuelta a `data/`, reemplazando el anterior.
4. Para fotos: subir la imagen a `data/img/` y poner su ruta en la planilla (ver "Imágenes").

Los cambios se ven al instante: el `.htaccess` marca los `.xlsx` como "nunca cachear", y el sitio los pide siempre frescos.

> **Edición en Excel:** la fila 1 de cada planilla contiene instrucciones (qué va en cada columna) y la fila 2 son los encabezados reales. El editor solo agrega o modifica filas desde la 3 en adelante. Las columnas pueden ir en cualquier orden; el sitio las reconoce por su nombre de encabezado.

> **cPanel no edita Excel.** Su Administrador de Archivos sirve para subir/descargar/reemplazar, no para editar la planilla. La edición se hace en Excel en el computador del editor.

## (Opcional) Servir el contenido desde OneDrive

En lugar del hosting, las planillas pueden vivir en **OneDrive**. Limitación importante: **solo funciona con OneDrive personal** (no corporativo/SharePoint) y con vínculos **anónimos** "Cualquier persona con el vínculo · Puede ver" — Microsoft bloquea la lectura directa de OneDrive Business y de vínculos que requieran inicio de sesión. Para OneDrive corporativo se necesita un proxy (ej. Cloudflare Worker) que agregue CORS.

Si usas OneDrive personal: comparte cada `.xlsx` con vínculo "Puede ver" y pégalos en **`lib/manifest.js`**:
```js
onedrive: {
  noticias: "https://1drv.ms/x/s!Ab...",   // vínculo de noticias.xlsx
  proyectos: "https://1drv.ms/x/s!Ab..."   // vínculo de proyectos.xlsx
},
```
Si quedan **vacíos** (recomendado con el método cPanel), el sitio usa directamente los `.xlsx` de `data/`. Las columnas `imagen`/`imagenes` también aceptan vínculos de OneDrive y se convierten solos.

### Planilla de noticias (`noticias.xlsx`)

| Columna     | Obligatoria | Dónde se usa | Ejemplo                                  |
|-------------|-------------|--------------|-------------------------------------------|
| `fecha`     | Sí          | Tarjeta + detalle | `12-06-2026` (día-mes-año)           |
| `titulo`    | Sí          | Tarjeta + detalle | Título de la noticia                 |
| `resumen`   | Recomendada | Tarjeta (bajada) | 1–2 frases                            |
| `cuerpo`    | Recomendada | **Detalle** | Texto completo (acepta varios párrafos)    |
| `categoria` | Opcional    | Tarjeta + detalle | Obras, Calidad, Reconocimientos…     |
| `imagen`    | Opcional    | Tarjeta + detalle | URL pública de una foto              |
| `enlace`    | Opcional    | Detalle | URL externa ("Ver publicación original")       |

Se ordenan automáticamente de la más reciente a la más antigua. La portada muestra las 3 últimas. Cada noticia tiene su página de detalle automática en `noticia-detalle.html?id=…`.

### Planilla de proyectos (`proyectos.xlsx`)

| Columna            | Obligatoria | Dónde se usa | Ejemplo                                  |
|--------------------|-------------|--------------|-------------------------------------------|
| `nombre`           | Sí          | Tarjeta + detalle | Nombre del proyecto                  |
| `categoria`        | Recomendada | Tarjeta + detalle | Educacional, Institucional, Hoteles… |
| `anio`             | Recomendada | Tarjeta + detalle | `2021`                               |
| `ciudad`           | Recomendada | Tarjeta + detalle | Santiago, Viña del Mar…              |
| `descripcion`      | Recomendada | Tarjeta (frase corta) | 1–2 frases                       |
| `descripcion_larga`| Recomendada | **Detalle** | Texto completo (acepta varios párrafos)    |
| `cliente`          | Opcional    | Detalle (ficha técnica) | Ministerio de Educación        |
| `superficie`       | Opcional    | Detalle (ficha técnica) | `6.800 m²`                     |
| `estado`           | Opcional    | Detalle (ficha técnica) | Terminado / En ejecución       |
| `imagen`           | Opcional    | Tarjeta + detalle (foto principal) | URL pública        |
| `imagenes`         | Opcional    | Detalle (galería) | Varias URLs separadas por `\|`       |
| `enlace`           | Opcional    | Detalle | URL externa ("Más información")                |
| `destacado`        | Opcional    | Portada | `si` → aparece en la portada (primeros 4)      |

Se muestran en el orden de las filas. Sin imagen, la tarjeta y el detalle muestran un bloque gris claro con las iniciales del proyecto; con imagen, la foto. Cada proyecto tiene su página de detalle automática en `proyecto-detalle.html?id=…`.

> **Cómo se identifica cada ficha:** la URL de detalle usa un `id` derivado del nombre/título (sin acentos ni símbolos). Si se **renombra** un proyecto o noticia, su URL de detalle cambia (los enlaces viejos dejarán de funcionar). El nombre/título debe ser único dentro de la planilla.

### Imágenes

Hay **dos carpetas de imágenes** con propósitos distintos:

| Carpeta | Para qué | ¿La toca comunicaciones? |
|---|---|---|
| **`data/img/`** | Fotos de proyectos y noticias | **Sí** — sube/cambia libremente |
| **`assets/img/`** | Imágenes nativas del sitio (logos, íconos) | **No** — son del diseño |

Las columnas `imagen` e `imagenes` aceptan **tres formatos** y el sitio resuelve cada uno automáticamente:

1. **Ruta en el hosting** (recomendado): sube la foto a `data/img/` y escribe `data/img/foto.webp` en la celda.
2. **URL pública cualquiera** (CDN, otro hosting): se usa tal cual.
3. **Vínculo de OneDrive personal**: pega el vínculo "Puede ver" y el sitio lo convierte solo a descarga directa.

Para la galería (`imagenes`), separa varias con `|`. Ejemplo: `data/img/foto1.webp | data/img/foto2.webp`.

> Optimiza las fotos antes de subir: WebP o JPG a ~1600px de ancho. Una foto de cámara sin comprimir (5–10 MB) hace lento el sitio; optimizada queda en ~200 KB.

> Nota técnica: el sitio lee la planilla `.xlsx` con **SheetJS** (cargado desde CDN, sin instalación). Por defecto la toma de `data/` en el mismo hosting (mismo origen, sin CORS). Si configuras vínculos de OneDrive personal en `manifest.js`, los usa en su lugar; y si SheetJS no cargara, recurre a los `.csv` locales como respaldo final.

## Publicación (Hostinger u otro hosting)

1. Subir **toda la carpeta** por FTP o el administrador de archivos (incluido el archivo oculto `.htaccess`, que evita que el hosting sirva versiones antiguas con caché, y la carpeta `data/` con planillas e imágenes).
2. Crear la **cuenta FTP del editor restringida a `data/`** (cPanel → Cuentas FTP → Directorio: `.../public_html/data`). El editor administra contenido sin acceso al código.
3. En cada deploy futuro **del código** (no del contenido), cambiar la fecha del parámetro `?v=AAAAMMDD` en los `<link>` y `<script>` de los HTML (hoy: `?v=20260612c`) para forzar la recarga del CSS/JS. Las planillas no necesitan esto: ya van sin caché.

## Decisiones técnicas

- **Sin GSAP/librerías de animación**: todos los efectos (marquee de ciudades, contadores animados, reveals al hacer scroll, elevación de tarjetas, cabecera con desenfoque) son CSS/vanilla — el sitio pesa menos y no tiene dependencias.
- **Única dependencia: SheetJS** (lectura de `.xlsx`), cargada desde CDN como las fuentes de Google. No requiere npm ni build. Si no carga, el sitio recurre a los `.csv` de respaldo.
- **Páginas de detalle dinámicas**: una sola plantilla (`proyecto-detalle.html` / `noticia-detalle.html`) sirve todas las fichas, resueltas por `?id=` contra la planilla. Cero código por proyecto o noticia.
- **Contenido en el mismo origen**: por defecto las planillas e imágenes se sirven desde `data/` en el propio hosting → sin CORS, sin servicios externos. OneDrive personal queda como alternativa opcional.
- **Scroll nativo** (`scroll-behavior: smooth`), sin Lenis: robusto en cualquier Windows.
- **Patrón IIFE** sin módulos ES: funciona en `file://`, FTP y cualquier hosting.
- Las planillas `.xlsx` se generan/regeneran con `data/_gen_plantillas.py` (openpyxl). Es un script auxiliar; el flujo normal es editarlas en Excel, no con Python.

## Pendientes sugeridos

- Subir el sitio al hosting y crear la cuenta FTP del editor restringida a `data/`.
- Fotos reales: subir a `data/img/` en formato **WebP** y referenciarlas (`data/img/foto.webp`) en la columna `imagen`/`imagenes` de las planillas.
- Logos/íconos definitivos del sitio: colocarlos en `assets/img/`.
- Reemplazar el formulario `mailto:` de contacto por un servicio de formularios (Formspree o similar).
- Reemplazar el enlace del botón de denuncias por la URL directa del formulario en Buk cuando esté disponible.
