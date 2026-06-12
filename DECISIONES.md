# Decisiones de diseño y técnicas

Este documento explica **por qué** el proyecto está hecho como está. El
[README](README.md) cubre *cómo* se usa; este archivo cubre *por qué* se
decidió así, para que cualquiera (o cualquier sesión nueva de Claude, desde
otro computador) retome el proyecto con el contexto completo.

---

## 1. Sitio estático puro (sin WordPress, sin build)

**Decisión:** HTML + CSS + JavaScript vanilla. Sin npm, sin framework, sin
paso de compilación.

**Por qué:**
- El sitio original estaba en WordPress (PHP + base de datos MySQL), que exige
  actualizaciones, plugins y parches de seguridad constantes.
- Un sitio estático es más rápido, más seguro (no hay base de datos ni PHP que
  atacar) y no requiere mantenimiento de plugins.
- Se sube por FTP a cualquier hosting (Hostinger, Netlify, etc.) y funciona.
- **Patrón IIFE** en `main.js` (sin módulos ES): funciona incluso abriendo el
  archivo directo (`file://`), por FTP y en cualquier hosting compartido.

---

## 2. Las planillas en Excel (.xlsx), no CSV

**Decisión:** el contenido (proyectos y noticias) se administra en archivos
`.xlsx`.

**Por qué:**
- El CSV se ve mal al abrirlo en OneDrive/Excel (problemas de acentos) y no es
  amigable de editar para una persona no técnica.
- Excel permite formato, listas desplegables (ej. estado "Terminado/En
  ejecución"), una fila de instrucciones y los encabezados destacados.
- Se leen en el navegador con **SheetJS** (librería cargada desde CDN, sin
  instalar nada). SheetJS también lee CSV, así que el respaldo sigue siendo
  compatible.

---

## 3. Páginas de detalle dinámicas (una sola plantilla)

**Decisión:** `proyecto-detalle.html?id=…` y `noticia-detalle.html?id=…` son
**una sola plantilla cada una**, no una página por proyecto/noticia.

**Por qué:**
- El objetivo central es que comunicaciones **no toque código** para publicar.
- La plantilla lee el `id` de la URL, busca esa fila en la planilla y arma la
  ficha completa (foto, ficha técnica, descripción larga, galería).
- Agregar un proyecto = llenar una fila en Excel. Cero páginas nuevas, cero
  programación por ítem.
- El `id` se deriva del nombre/título (sin acentos ni símbolos). **Implicancia:**
  si se renombra un proyecto, su URL de detalle cambia; el nombre debe ser único.

---

## 4. ⭐ El gran hallazgo: OneDrive NO sirve para leer archivos desde una web estática

Esta fue la investigación más importante. La idea inicial era que comunicaciones
editara las planillas en OneDrive y el sitio las leyera directo. **Probamos y no
funciona** — ni personal ni corporativo, por razones distintas. Queda documentado
para no volver a intentarlo sin saber esto.

### Lo que probamos y encontramos

| Caso | Resultado | Causa |
|---|---|---|
| OneDrive **corporativo** (SharePoint) vía `api.onedrive.com` | `"User migrated"` | Esa API es solo para cuentas personales; no sirve cuentas de empresa. |
| OneDrive corporativo, descarga directa `&download=1` | `Failed to fetch` | SharePoint no envía cabeceras **CORS** → el navegador bloquea la lectura. |
| OneDrive **personal**, formato de vínculo nuevo (`1drv.ms/x/c/…`) | `401 unauthenticated` | El formato nuevo no funciona con la API anónima `u!base64`. |
| OneDrive personal, abrir el vínculo en el navegador | ✅ Se ve el Excel | Pero eso es el **visor de Office Online**, no la descarga del archivo crudo. |
| OneDrive personal, `&download=1` / seguir redirección | `Failed to fetch` | También bloqueado por **CORS**. |

### Conclusión

- **Ver** un archivo de OneDrive en el navegador (visor) ≠ **descargar** sus bytes
  para procesarlos con JavaScript. Lo segundo es lo que el sitio necesita, y
  Microsoft lo bloquea desde una web de otro dominio (CORS) y/o con el formato
  de vínculo nuevo.
- Esto **no se arregla en el código del sitio**: es del lado de Microsoft.

### Caminos viables (si algún día se quiere OneDrive)

- **OneDrive personal + vínculo anónimo de formato antiguo:** podría funcionar,
  pero las cuentas nuevas ya generan el formato nuevo `1drv.ms/x/c/…` que falla.
  Poco confiable.
- **OneDrive corporativo + proxy (Cloudflare Worker):** un "puente" gratuito que
  descarga el archivo del lado servidor (sin CORS) y lo re-sirve con las cabeceras
  correctas. Es la única forma de usar el SharePoint corporativo. Requiere desplegar
  el Worker una vez.
- **Google Sheets "Publicar en la web":** sí envía CORS correcto y funciona client-side,
  pero cambia la herramienta (Sheets en vez de Excel).

---

## 5. Decisión final: el contenido vive en el propio hosting (cPanel/FTP)

**Decisión:** las planillas e imágenes viven en la carpeta `data/` del mismo
hosting. El sitio las lee del mismo origen.

**Por qué:**
- **Mismo origen = sin CORS, sin proxy, sin cuentas externas.** Es la solución
  más simple y robusta, y resuelve de un golpe todo el problema de OneDrive.
- Ya estaba probada funcionando: durante todo el desarrollo el sitio leyó
  `data/proyectos.xlsx` local sin problemas.
- El editor actualiza vía **cPanel o una cuenta FTP restringida a `data/`**:
  descarga el `.xlsx`, lo edita en Excel, lo vuelve a subir. No toca el código.
- **Contrapartida:** editar tiene un par de pasos más que "guardar en OneDrive"
  (descargar → editar → subir). Se aceptó a cambio de cero dependencias.
- OneDrive personal queda como **alternativa opcional** en `lib/manifest.js`
  (si los campos están vacíos, se usa `data/`).

---

## 6. Dos carpetas de imágenes separadas

**Decisión:** `data/img/` (editable por comunicaciones) y `assets/img/`
(imágenes nativas del sitio: logos, íconos).

**Por qué:**
- La cuenta FTP del editor se restringe a `data/`, así que sus fotos deben estar
  bajo `data/img/` para que pueda subirlas sin ver el resto del sitio.
- Los logos/íconos del diseño van en `assets/img/`, fuera del alcance del editor,
  porque no deben cambiar salvo un rediseño.
- Las columnas `imagen`/`imagenes` aceptan ruta local (`data/img/foto.webp`), URL
  pública o vínculo de OneDrive personal — el código resuelve cada caso solo.

---

## 7. Formulario de contacto: pendiente cambiar `mailto:`

**Estado:** el formulario usa `mailto:` provisionalmente. **Hay que cambiarlo.**

**Por qué `mailto:` falla:**
- No envía nada: solo intenta abrir el programa de correo del visitante para que
  él mande el mensaje. Si usa webmail o no tiene cliente configurado, no pasa nada.
- Mensajes perdidos (sin registro ni confirmación), se ve poco profesional, expone
  el correo a spam y no tiene filtro anti-bot.

**Camino elegido (para cuando se aborde):**
- Preferente: **script PHP propio** en el cPanel (el hosting ya tiene PHP y el
  correo `@bravoizquierdo.cl`). Todo en casa, sin terceros.
- Alternativa rápida: un servicio gratis tipo Web3Forms/Formspree (cero backend).

---

## 8. Repositorio en GitHub

**Decisión:** el proyecto vive en `github.com/bravoizquierdo/bravo-izquierdo-web`.

**Por qué / notas:**
- Da historial de versiones y permite trabajar desde cualquier computador
  (`git clone`).
- **Nota técnica (Windows):** hubo un error de certificado SSL al hacer push. Se
  resolvió con `git config --global http.sslBackend schannel` (usar el almacén de
  certificados de Windows).
- ⚠️ **Esta conversación de chat NO se sincroniza entre computadores** — se guarda
  local. La continuidad del proyecto se preserva con este archivo + el README + el
  historial de Git. En otro PC: `git clone`, abrir la carpeta y pedirle a Claude
  "lee el README y DECISIONES.md y sigamos".

---

## Pendientes (resumen)

1. Reemplazar el `mailto:` del formulario de contacto (PHP propio o servicio).
2. Migrar desde WordPress: probar en paralelo → respaldar WP → cambiar →
   redirecciones de las URLs viejas (SEO).
3. Subir el contenido real (planillas + fotos en `data/img/`).
4. Crear la cuenta FTP restringida a `data/` para comunicaciones.
5. Botón de denuncias → URL directa de Buk cuando esté disponible.
6. Logos/íconos definitivos en `assets/img/`.
