# Sitio web — Constructora Bravo Izquierdo

Rediseño premium del sitio https://bravoizquierdo.cl como **sitio estático puro** (HTML + CSS + JS vanilla, sin npm, sin build, sin frameworks). Listo para arrastrar la carpeta a Hostinger, Netlify o cualquier hosting estático. Las noticias y los proyectos se administran desde planillas **Excel (.xlsx) en OneDrive**, sin tocar código — incluyendo las **páginas de detalle** de cada proyecto y noticia, que se arman solas a partir de la planilla.

Diseño: **corporativo claro y limpio** — fondo blanco con mucho aire, tipografía Manrope (titulares) + Inter (texto), tarjetas con sombras suaves, y el rojo del logo (`#d31f26`) usado con precisión como acento: botones, chips, palabras destacadas y detalles.

## Estructura

```
bravo-izquierdo-web/
├── index.html             Portada
├── quienes-somos.html     Historia, misión, visión, valores, directorio
├── proyectos.html         Portafolio (cargado desde OneDrive)
├── proyecto-detalle.html  ★ Ficha de proyecto (dinámica: ?id=…)
├── sostenibilidad.html    5 pilares + reportes
├── noticias.html          Noticias (cargadas desde OneDrive)
├── noticia-detalle.html   ★ Detalle de noticia (dinámico: ?id=…)
├── denuncias.html         Canal de denuncias (Ley 20.393)
├── contacto.html          Datos de contacto y formulario
├── styles.css             Estilos (un solo archivo)
├── main.js                Lógica (IIFE, sin módulos ES)
├── .htaccess              Cabeceras de caché para Hostinger/Apache
├── lib/manifest.js        ★ CONFIGURACIÓN: vínculos de OneDrive y datos de marca
├── data/proyectos.xlsx    Plantilla/respaldo de proyectos (editar en Excel → subir a OneDrive)
├── data/noticias.xlsx     Plantilla/respaldo de noticias
├── data/*.csv             Respaldo final (solo si SheetJS no carga)
├── data/_gen_plantillas.py  Regenera las plantillas .xlsx (opcional, se puede borrar)
└── assets/img/            Fotos del sitio (WebP)
```

**Páginas de detalle dinámicas:** `proyecto-detalle.html` y `noticia-detalle.html` son una sola plantilla cada una. Leen el identificador desde la URL (`?id=nombre-del-proyecto`), buscan esa fila en la planilla de OneDrive y arman la ficha completa (foto, ficha técnica, descripción larga, galería). **No hay que crear ni programar una página por cada proyecto o noticia** — basta con llenar la fila en Excel. Las tarjetas de los listados enlazan automáticamente a su detalle.

## Conexión con OneDrive (noticias y proyectos)

El encargado de comunicaciones mantiene **dos planillas Excel** en OneDrive. Se editan como cualquier Excel (con formato, autocompletado y listas desplegables ya incluidas). Configuración (una sola vez):

1. Subir `data/proyectos.xlsx` y `data/noticias.xlsx` a una carpeta de OneDrive de la empresa. Estas plantillas ya vienen con los encabezados, una fila de instrucciones y los datos actuales cargados.
2. En OneDrive: clic derecho sobre cada archivo → **Compartir** → "Cualquier persona con el vínculo **puede ver**" → **Copiar vínculo**.
3. Abrir **`lib/manifest.js`** y pegar cada vínculo:
   ```js
   onedrive: {
     noticias: "https://1drv.ms/x/s!Ab...",   // vínculo de noticias.xlsx
     proyectos: "https://1drv.ms/x/s!Ab..."   // vínculo de proyectos.xlsx
   },
   ```
4. Subir el sitio al hosting. Cada vez que se guarde la planilla en OneDrive, el sitio mostrará el contenido nuevo automáticamente — listados **y** páginas de detalle.

> **Edición en Excel:** la fila 1 de cada planilla contiene instrucciones (qué va en cada columna) y la fila 2 son los encabezados reales. El encargado solo agrega o edita filas desde la 3 en adelante. Las columnas pueden ir en cualquier orden; el sitio las reconoce por su nombre de encabezado.

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

> Nota técnica: el sitio descarga la planilla `.xlsx` con la API pública de OneDrive (`api.onedrive.com/v1.0/shares`) y la lee en el navegador con **SheetJS** (cargado desde CDN, sin instalación). Si OneDrive no responde, usa el `.xlsx` local de `data/`; y si SheetJS no cargara, recurre a los `.csv` locales como respaldo final.

## Publicación (Hostinger u otro hosting)

1. Subir **toda la carpeta** por FTP o el administrador de archivos (incluido el archivo oculto `.htaccess`, que evita que el hosting sirva versiones antiguas con caché).
2. En cada deploy futuro, cambiar la fecha del parámetro `?v=AAAAMMDD` en los `<link>` y `<script>` de los HTML (hoy: `?v=20260612c`) para forzar la recarga del CSS/JS.

## Decisiones técnicas

- **Sin GSAP/librerías de animación**: todos los efectos (marquee de ciudades, contadores animados, reveals al hacer scroll, elevación de tarjetas, cabecera con desenfoque) son CSS/vanilla — el sitio pesa menos y no tiene dependencias.
- **Única dependencia: SheetJS** (lectura de `.xlsx`), cargada desde CDN como las fuentes de Google. No requiere npm ni build. Si no carga, el sitio recurre a los `.csv` de respaldo.
- **Páginas de detalle dinámicas**: una sola plantilla (`proyecto-detalle.html` / `noticia-detalle.html`) sirve todas las fichas, resueltas por `?id=` contra la planilla de OneDrive. Cero código por proyecto o noticia.
- **Scroll nativo** (`scroll-behavior: smooth`), sin Lenis: robusto en cualquier Windows.
- **Patrón IIFE** sin módulos ES: funciona en `file://`, FTP y cualquier hosting.
- Las planillas `.xlsx` se generan/regeneran con `data/_gen_plantillas.py` (openpyxl). Es un script auxiliar; el flujo normal es editarlas en Excel, no con Python.

## Pendientes sugeridos

- Pegar los dos vínculos de OneDrive en `lib/manifest.js`.
- Fotos reales: subir a `assets/img/` en formato **WebP** y referenciarlas en la columna `imagen` de las planillas.
- Reemplazar el formulario `mailto:` de contacto por un servicio de formularios (Formspree o similar).
- Reemplazar el enlace del botón de denuncias por la URL directa del formulario en Buk cuando esté disponible.
