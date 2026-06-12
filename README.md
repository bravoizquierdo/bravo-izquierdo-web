# Sitio web — Constructora Bravo Izquierdo

Rediseño premium del sitio https://bravoizquierdo.cl como **sitio estático puro** (HTML + CSS + JS vanilla, sin npm, sin build, sin frameworks). Listo para arrastrar la carpeta a Hostinger, Netlify o cualquier hosting estático. Las noticias y los proyectos se administran desde planillas en **OneDrive**, sin tocar código.

Diseño: **corporativo claro y limpio** — fondo blanco con mucho aire, tipografía Manrope (titulares) + Inter (texto), tarjetas con sombras suaves, y el rojo del logo (`#d31f26`) usado con precisión como acento: botones, chips, palabras destacadas y detalles.

## Estructura

```
bravo-izquierdo-web/
├── index.html            Portada
├── quienes-somos.html    Historia, misión, visión, valores, directorio
├── proyectos.html        Portafolio (cargado desde OneDrive)
├── sostenibilidad.html   5 pilares + reportes
├── noticias.html         Noticias (cargadas desde OneDrive)
├── denuncias.html        Canal de denuncias (Ley 20.393)
├── contacto.html         Datos de contacto y formulario
├── styles.css            Estilos (un solo archivo)
├── main.js               Lógica (IIFE, sin módulos ES)
├── .htaccess             Cabeceras de caché para Hostinger/Apache
├── lib/manifest.js       ★ CONFIGURACIÓN: vínculos de OneDrive y datos de marca
├── data/noticias.csv     Noticias de respaldo (si OneDrive no responde)
├── data/proyectos.csv    Proyectos de respaldo (si OneDrive no responde)
└── assets/img/           Fotos del sitio (WebP)
```

## Conexión con OneDrive (noticias y proyectos)

El encargado de comunicaciones mantiene **dos planillas** en OneDrive. Configuración (una sola vez):

1. Subir `data/noticias.csv` y `data/proyectos.csv` a una carpeta de OneDrive de la empresa.
2. En OneDrive: clic derecho sobre cada archivo → **Compartir** → "Cualquier persona con el vínculo **puede ver**" → **Copiar vínculo**.
3. Abrir **`lib/manifest.js`** y pegar cada vínculo:
   ```js
   onedrive: {
     noticias: "https://1drv.ms/x/s!Ab...",   // vínculo de noticias.csv
     proyectos: "https://1drv.ms/x/s!Ab..."   // vínculo de proyectos.csv
   },
   ```
4. Subir el sitio al hosting. Cada vez que se guarde una planilla en OneDrive, el sitio mostrará el contenido nuevo automáticamente.

### Planilla de noticias (`noticias.csv`)

| Columna     | Obligatoria | Ejemplo                                  |
|-------------|-------------|-------------------------------------------|
| `fecha`     | Sí          | `12-06-2026` (día-mes-año)                |
| `titulo`    | Sí          | Título de la noticia                      |
| `resumen`   | Recomendada | 1–2 frases de bajada                      |
| `categoria` | Opcional    | Obras, Calidad, Reconocimientos…          |
| `imagen`    | Opcional    | URL pública de una foto                   |
| `enlace`    | Opcional    | URL a la nota completa ("Leer más")       |

Se ordenan automáticamente de la más reciente a la más antigua. La portada muestra las 3 últimas.

### Planilla de proyectos (`proyectos.csv`)

| Columna       | Obligatoria | Ejemplo                                          |
|---------------|-------------|---------------------------------------------------|
| `nombre`      | Sí          | Nombre del proyecto                               |
| `categoria`   | Recomendada | Educacional, Institucional, Hoteles…              |
| `anio`        | Recomendada | `2021`                                            |
| `ciudad`      | Recomendada | Santiago, Viña del Mar…                           |
| `descripcion` | Recomendada | 1–2 frases                                        |
| `imagen`      | Opcional    | URL pública de una foto                           |
| `enlace`      | Opcional    | URL con más información                           |
| `destacado`   | Opcional    | `si` → aparece en la portada (primeros 4)         |

Se muestran en el orden de las filas. Sin imagen, la tarjeta muestra un bloque gris claro con las iniciales del proyecto; con imagen, la foto.

> **Importante para el editor:** mantener el formato CSV al guardar (Excel: "Mantener formato CSV"). El sitio acepta separador coma `,` o punto y coma `;` (Excel en español).

> Nota técnica: el sitio descarga la planilla con la API pública de OneDrive (`api.onedrive.com/v1.0/shares`) directamente desde el navegador del visitante. Si OneDrive no responde, usa los CSV locales de `data/` como respaldo.

## Publicación (Hostinger u otro hosting)

1. Subir **toda la carpeta** por FTP o el administrador de archivos (incluido el archivo oculto `.htaccess`, que evita que el hosting sirva versiones antiguas con caché).
2. En cada deploy futuro, cambiar la fecha del parámetro `?v=AAAAMMDD` en los `<link>` y `<script>` de los HTML (hoy: `?v=20260612b`) para forzar la recarga del CSS/JS.

## Decisiones técnicas

- **Sin GSAP/librerías**: todos los efectos (marquee de ciudades, contadores animados, reveals al hacer scroll, elevación de tarjetas, cabecera con desenfoque) son CSS/vanilla — el sitio pesa menos y no tiene dependencias.
- **Scroll nativo** (`scroll-behavior: smooth`), sin Lenis: robusto en cualquier Windows.
- **Funciona sin JavaScript**: todo el contenido fijo está en el HTML; solo las tarjetas de noticias/proyectos (datos dinámicos) requieren JS.
- **Patrón IIFE** sin módulos ES: funciona en `file://`, FTP y cualquier hosting.

## Pendientes sugeridos

- Pegar los dos vínculos de OneDrive en `lib/manifest.js`.
- Fotos reales: subir a `assets/img/` en formato **WebP** y referenciarlas en la columna `imagen` de las planillas.
- Reemplazar el formulario `mailto:` de contacto por un servicio de formularios (Formspree o similar).
- Reemplazar el enlace del botón de denuncias por la URL directa del formulario en Buk cuando esté disponible.
