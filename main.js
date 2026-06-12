(function () {
  /* BRAVO IZQUIERDO — main.js (IIFE, sin módulos ES) */
  "use strict";

  var data = window.__BRAND__ || {};

  /* ---------- Helpers ---------- */
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var escHTML = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  /* ---------- OneDrive: descarga de planillas CSV ---------- */
  function urlDescargaOneDrive(shareUrl) {
    var base64 = btoa(shareUrl).replace(/=+$/, "").replace(/\//g, "_").replace(/\+/g, "-");
    return "https://api.onedrive.com/v1.0/shares/u!" + base64 + "/root/content";
  }

  function parsearCSV(texto) {
    var filas = [], fila = [], campo = "", entreComillas = false, i, c;
    texto = texto.replace(/^﻿/, "");
    for (i = 0; i < texto.length; i++) {
      c = texto[i];
      if (entreComillas) {
        if (c === '"') {
          if (texto[i + 1] === '"') { campo += '"'; i++; }
          else entreComillas = false;
        } else campo += c;
      } else if (c === '"') {
        entreComillas = true;
      } else if (c === "," || c === ";") {
        fila.push(campo); campo = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && texto[i + 1] === "\n") i++;
        fila.push(campo); campo = "";
        if (fila.some(function (v) { return v.trim() !== ""; })) filas.push(fila);
        fila = [];
      } else campo += c;
    }
    if (campo !== "" || fila.length) {
      fila.push(campo);
      if (fila.some(function (v) { return v.trim() !== ""; })) filas.push(fila);
    }
    return filas;
  }

  // Las planillas .xlsx traen una fila de instrucciones antes de los
  // encabezados; buscamos la fila que contiene una clave conocida.
  var CLAVES_ENCABEZADO = ["nombre", "titulo", "fecha"];
  function filasAObjetos(filas) {
    if (!filas.length) return [];
    var hIdx = 0;
    for (var k = 0; k < filas.length; k++) {
      var bajos = filas[k].map(function (v) { return String(v == null ? "" : v).trim().toLowerCase(); });
      if (bajos.some(function (v) { return CLAVES_ENCABEZADO.indexOf(v) !== -1; })) { hIdx = k; break; }
    }
    var encabezados = filas[hIdx].map(function (h) { return String(h == null ? "" : h).trim().toLowerCase(); });
    return filas.slice(hIdx + 1).map(function (f) {
      var obj = {};
      encabezados.forEach(function (h, i) { obj[h] = String(f[i] == null ? "" : f[i]).trim(); });
      return obj;
    });
  }

  // Lee un .xlsx con SheetJS (si está disponible) → matriz de filas.
  function hayXLSX() { return typeof XLSX !== "undefined"; }
  function leerXLSX(buffer) {
    var wb = XLSX.read(buffer, { type: "array" });
    var ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false, blankrows: false });
  }

  // Carga una planilla. Prioridad:
  //   1. OneDrive (.xlsx vía SheetJS)   2. Respaldo local .xlsx (SheetJS)
  //   3. Respaldo local .csv (parser propio — funciona aunque SheetJS falle)
  function cargarPlanilla(shareUrl, respaldoXlsx) {
    var respaldoCsv = respaldoXlsx.replace(/\.xlsx$/i, ".csv");
    var fuentes = [];
    if (shareUrl && hayXLSX()) fuentes.push({ url: urlDescargaOneDrive(shareUrl), tipo: "xlsx", od: true });
    if (hayXLSX()) fuentes.push({ url: respaldoXlsx, tipo: "xlsx", od: false });
    fuentes.push({ url: respaldoCsv, tipo: "csv", od: false });

    var intento = function (idx) {
      if (idx >= fuentes.length) return Promise.resolve(null);
      var f = fuentes[idx];
      return fetch(f.url, { cache: "no-store" })
        .then(function (resp) {
          if (!resp.ok) throw new Error("HTTP " + resp.status);
          if (f.tipo === "xlsx") {
            return resp.arrayBuffer().then(function (buf) {
              return { objetos: filasAObjetos(leerXLSX(buf)), desdeOneDrive: f.od };
            });
          }
          return resp.text().then(function (texto) {
            return { objetos: filasAObjetos(parsearCSV(texto)), desdeOneDrive: f.od };
          });
        })
        .catch(function () { return intento(idx + 1); });
    };
    return intento(0);
  }

  // Slug para URLs de detalle (sin acentos ni símbolos).
  function slug(texto) {
    return String(texto == null ? "" : texto).toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /* ---------- Fechas ---------- */
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  function formatearFecha(fechaStr) {
    var m = fechaStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) return m[1] + " " + (MESES[+m[2] - 1] || "").slice(0, 3) + " " + m[3];
    m = fechaStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (m) return m[3] + " " + (MESES[+m[2] - 1] || "").slice(0, 3) + " " + m[1];
    return fechaStr;
  }

  function claveOrden(fechaStr) {
    var m = fechaStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) return m[3] + ("0" + m[2]).slice(-2) + ("0" + m[1]).slice(-2);
    m = fechaStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (m) return m[1] + ("0" + m[2]).slice(-2) + ("0" + m[3]).slice(-2);
    return "00000000";
  }

  /* ---------- Render de tarjetas ---------- */
  function htmlTarjeta(opts) {
    var media;
    if (opts.imagen) {
      media = '<div class="cell-card-media" style="background-image:url(\'' + escHTML(opts.imagen) + '\')">' +
        (opts.chip ? '<span class="chip">' + escHTML(opts.chip) + "</span>" : "") + "</div>";
    } else {
      media = '<div class="cell-card-media"><span class="media-label" aria-hidden="true">' +
        escHTML(opts.sello || "BI") + "</span>" +
        (opts.chip ? '<span class="chip">' + escHTML(opts.chip) + "</span>" : "") + "</div>";
    }
    var cta = opts.href
      ? '<span class="enlace">' + escHTML(opts.cta || "Ver más") + " →</span>"
      : "";
    var cuerpo = '<div class="cell-card-body">' +
      '<span class="meta">' + escHTML(opts.meta || "") + "</span>" +
      "<h3>" + escHTML(opts.titulo) + "</h3>" +
      "<p>" + escHTML(opts.texto || "") + "</p>" + cta +
      "</div>";
    // La tarjeta completa enlaza a su página de detalle interna.
    if (opts.href) {
      return '<a class="cell-card" href="' + escHTML(opts.href) + '">' + media + cuerpo + "</a>";
    }
    return '<article class="cell-card">' + media + cuerpo + "</article>";
  }

  function inicialesSello(texto) {
    return texto.split(/\s+/).slice(0, 2).map(function (w) { return (w[0] || "").toUpperCase(); }).join("");
  }

  /* ---------- Mounts (idempotentes) ---------- */
  function mountNoticias() {
    var target = $("[data-noticias]");
    if (!target || target.dataset.mounted) return;
    target.dataset.mounted = "1";
    var limite = parseInt(target.getAttribute("data-limite") || "0", 10);
    target.innerHTML = '<p class="data-estado">Cargando noticias…</p>';

    cargarPlanilla(data.onedrive && data.onedrive.noticias, data.respaldos.noticias).then(function (res) {
      if (!res) {
        target.innerHTML = '<p class="data-estado">No fue posible cargar las noticias.</p>';
        return;
      }
      var noticias = res.objetos.filter(function (n) { return n.titulo; });
      noticias.sort(function (a, b) {
        return claveOrden(b.fecha || "").localeCompare(claveOrden(a.fecha || ""));
      });
      if (limite > 0) noticias = noticias.slice(0, limite);
      if (!noticias.length) {
        target.innerHTML = '<p class="data-estado">Aún no hay noticias publicadas.</p>';
        return;
      }
      target.innerHTML = noticias.map(function (n) {
        return htmlTarjeta({
          imagen: n.imagen, chip: n.categoria,
          meta: formatearFecha(n.fecha || ""),
          titulo: n.titulo, texto: n.resumen,
          href: "noticia-detalle.html?id=" + encodeURIComponent(slug(n.titulo)),
          cta: "Leer más",
          sello: inicialesSello(n.titulo)
        });
      }).join("");
      var fuente = $("[data-fuente-noticias]");
      if (fuente && res.desdeOneDrive) fuente.textContent = "Sincronizado desde OneDrive";
    });
  }

  function mountProyectos() {
    var target = $("[data-proyectos]");
    if (!target || target.dataset.mounted) return;
    target.dataset.mounted = "1";
    var soloDestacados = parseInt(target.getAttribute("data-destacados") || "0", 10);
    target.innerHTML = '<p class="data-estado">Cargando proyectos…</p>';

    cargarPlanilla(data.onedrive && data.onedrive.proyectos, data.respaldos.proyectos).then(function (res) {
      if (!res) {
        target.innerHTML = '<p class="data-estado">No fue posible cargar los proyectos.</p>';
        return;
      }
      var proyectos = res.objetos.filter(function (p) { return p.nombre; });
      if (soloDestacados > 0) {
        proyectos = proyectos.filter(function (p) {
          return (p.destacado || "").toLowerCase().indexOf("s") === 0;
        }).slice(0, soloDestacados);
      }
      if (!proyectos.length) {
        target.innerHTML = '<p class="data-estado">Aún no hay proyectos publicados.</p>';
        return;
      }
      target.innerHTML = proyectos.map(function (p) {
        return htmlTarjeta({
          imagen: p.imagen, chip: p.categoria,
          meta: [p.anio, p.ciudad].filter(Boolean).join(" · "),
          titulo: p.nombre, texto: p.descripcion,
          href: "proyecto-detalle.html?id=" + encodeURIComponent(slug(p.nombre)),
          cta: "Ver proyecto",
          sello: inicialesSello(p.nombre)
        });
      }).join("");
      var fuente = $("[data-fuente-proyectos]");
      if (fuente && res.desdeOneDrive) fuente.textContent = "Sincronizado desde OneDrive";
    });
  }

  /* ---------- Páginas de detalle (dinámicas, sin código por ficha) ---------- */
  function paramId() {
    var m = window.location.search.match(/[?&]id=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }
  function parrafos(texto) {
    return String(texto || "").split(/\n+/).map(function (t) { return t.trim(); })
      .filter(Boolean).map(function (t) { return "<p>" + escHTML(t) + "</p>"; }).join("");
  }
  function heroMedia(imagen, sello) {
    if (imagen) {
      return '<div class="detalle-hero-media" style="background-image:url(\'' + escHTML(imagen) + '\')"></div>';
    }
    return '<div class="detalle-hero-media sin-foto"><span aria-hidden="true">' + escHTML(sello || "BI") + "</span></div>";
  }
  function galeria(imagenesStr) {
    var urls = String(imagenesStr || "").split("|").map(function (u) { return u.trim(); }).filter(Boolean);
    if (!urls.length) return "";
    return '<div class="detalle-galeria">' + urls.map(function (u) {
      return '<div class="detalle-galeria-item" style="background-image:url(\'' + escHTML(u) + '\')"></div>';
    }).join("") + "</div>";
  }
  function botonExterno(enlace, texto) {
    return enlace
      ? '<p style="margin-top:1.8rem;"><a class="btn" href="' + escHTML(enlace) +
        '" target="_blank" rel="noopener">' + escHTML(texto) + " →</a></p>"
      : "";
  }
  function noEncontrado(target, mensaje, volverHref, volverTexto) {
    target.innerHTML = '<section class="section"><div class="split"><div>' +
      '<h1 class="display-l">' + escHTML(mensaje) + "</h1>" +
      '<p class="lede" style="margin-top:1rem;">El contenido pudo haber cambiado de nombre o aún no está publicado.</p>' +
      '<p style="margin-top:1.6rem;"><a class="btn" href="' + volverHref + '">' + escHTML(volverTexto) + "</a></p>" +
      "</div></div></section>";
  }

  function mountProyectoDetalle() {
    var target = $("[data-proyecto-detalle]");
    if (!target || target.dataset.mounted) return;
    target.dataset.mounted = "1";
    var id = paramId();
    target.innerHTML = '<p class="data-estado">Cargando proyecto…</p>';

    cargarPlanilla(data.onedrive && data.onedrive.proyectos, data.respaldos.proyectos).then(function (res) {
      if (!res) { noEncontrado(target, "No fue posible cargar el proyecto", "proyectos.html", "Ver todos los proyectos"); return; }
      var p = res.objetos.filter(function (x) { return x.nombre; })
        .filter(function (x) { return slug(x.nombre) === id; })[0];
      if (!p) { noEncontrado(target, "Proyecto no encontrado", "proyectos.html", "Ver todos los proyectos"); return; }

      document.title = p.nombre + " — Bravo Izquierdo";
      var meta = [p.anio, p.ciudad].filter(Boolean).join(" · ");
      var ficha = [
        ["Cliente", p.cliente], ["Superficie", p.superficie],
        ["Estado", p.estado], ["Año", p.anio], ["Ciudad", p.ciudad],
        ["Categoría", p.categoria]
      ].filter(function (f) { return f[1]; }).map(function (f) {
        return '<div class="item"><dt>' + escHTML(f[0]) + "</dt><dd>" + escHTML(f[1]) + "</dd></div>";
      }).join("");
      var cuerpo = parrafos(p.descripcion_larga || p.descripcion);

      target.innerHTML =
        '<section class="detalle-hero">' + heroMedia(p.imagen, inicialesSello(p.nombre)) + "</section>" +
        '<section class="section">' +
        '<div class="detalle-cabecera">' +
        (p.categoria ? '<p class="kicker">' + escHTML(p.categoria) + "</p>" : "") +
        '<h1 class="display-xl">' + escHTML(p.nombre) + "</h1>" +
        (meta ? '<p class="detalle-meta">' + escHTML(meta) + "</p>" : "") +
        "</div>" +
        '<div class="detalle-cuerpo split">' +
        "<div>" + (cuerpo || "<p>Próximamente más información sobre este proyecto.</p>") +
        botonExterno(p.enlace, "Más información") + "</div>" +
        (ficha ? '<aside><dl class="contact-list detalle-ficha">' + ficha + "</dl></aside>" : "<div></div>") +
        "</div>" +
        galeria(p.imagenes) +
        '<p style="max-width:var(--maxw);margin:2.5rem auto 0;padding-inline:var(--gutter);">' +
        '<a class="enlace" href="proyectos.html">← Volver a proyectos</a></p>' +
        "</section>";
      revelarNuevos(target);
    });
  }

  function mountNoticiaDetalle() {
    var target = $("[data-noticia-detalle]");
    if (!target || target.dataset.mounted) return;
    target.dataset.mounted = "1";
    var id = paramId();
    target.innerHTML = '<p class="data-estado">Cargando noticia…</p>';

    cargarPlanilla(data.onedrive && data.onedrive.noticias, data.respaldos.noticias).then(function (res) {
      if (!res) { noEncontrado(target, "No fue posible cargar la noticia", "noticias.html", "Ver todas las noticias"); return; }
      var n = res.objetos.filter(function (x) { return x.titulo; })
        .filter(function (x) { return slug(x.titulo) === id; })[0];
      if (!n) { noEncontrado(target, "Noticia no encontrada", "noticias.html", "Ver todas las noticias"); return; }

      document.title = n.titulo + " — Bravo Izquierdo";
      var meta = [formatearFecha(n.fecha || ""), n.categoria].filter(Boolean).join(" · ");
      var cuerpo = parrafos(n.cuerpo || n.resumen);

      target.innerHTML =
        (n.imagen ? '<section class="detalle-hero">' + heroMedia(n.imagen, "BI") + "</section>" : "") +
        '<section class="section">' +
        '<div class="detalle-cabecera detalle-cabecera-articulo">' +
        (meta ? '<p class="kicker">' + escHTML(meta) + "</p>" : "") +
        '<h1 class="display-l">' + escHTML(n.titulo) + "</h1>" +
        "</div>" +
        '<div class="detalle-articulo">' + (cuerpo || "<p>Próximamente el contenido completo de esta noticia.</p>") +
        botonExterno(n.enlace, "Ver publicación original") + "</div>" +
        '<p style="max-width:var(--maxw);margin:2.5rem auto 0;padding-inline:var(--gutter);">' +
        '<a class="enlace" href="noticias.html">← Volver a noticias</a></p>' +
        "</section>";
      revelarNuevos(target);
    });
  }

  // Activa el estado visible de cualquier .reveal recién insertado.
  function revelarNuevos(scope) {
    $$(".reveal", scope).forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Navegación ---------- */
  function initNav() {
    var toggle = $(".nav-toggle");
    var nav = $(".nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var abierto = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", abierto ? "true" : "false");
      toggle.textContent = abierto ? "Cerrar" : "Menú";
    });
  }

  /* ---------- Scroll suave en anclas ---------- */
  function initSmoothAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 72,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      });
    });
  }

  /* ---------- Reveals con red de seguridad ---------- */
  function initReveals() {
    var targets = $$(".reveal");
    if (!targets.length) return;
    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    targets.forEach(function (el) { io.observe(el); });

    // Red de seguridad: a los 6s, revelar todo lo que siga oculto
    setTimeout(function () {
      $$(".reveal:not(.is-visible)").forEach(function (el) {
        el.classList.add("is-visible");
      });
    }, 6000);
  }

  /* ---------- Contadores mono ---------- */
  function initCounters() {
    var nums = $$("[data-count-to]");
    if (!nums.length) return;
    var animar = function (el) {
      var meta = parseFloat(el.getAttribute("data-count-to"));
      var sufijo = el.getAttribute("data-suffix") || "";
      var dur = 1300;
      var t0 = performance.now();
      var paso = function (t) {
        var p = Math.min((t - t0) / dur, 1);
        var v = Math.round(meta * (1 - Math.pow(1 - p, 3)));
        el.textContent = v + sufijo;
        if (p < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    };
    if (!("IntersectionObserver" in window)) {
      nums.forEach(function (el) {
        el.textContent = el.getAttribute("data-count-to") + (el.getAttribute("data-suffix") || "");
      });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animar(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.01 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Marquee: duplicar contenido para loop continuo ---------- */
  function initMarquee() {
    $$(".marquee-track").forEach(function (track) {
      if (track.dataset.dup) return;
      track.dataset.dup = "1";
      track.innerHTML += track.innerHTML;
    });
  }

  /* ---------- Año en footer ---------- */
  function initYear() {
    var el = document.getElementById("anio-actual");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------- Boot ---------- */
  function boot() {
    safe(mountNoticias, "mountNoticias");
    safe(mountProyectos, "mountProyectos");
    safe(mountProyectoDetalle, "mountProyectoDetalle");
    safe(mountNoticiaDetalle, "mountNoticiaDetalle");
    safe(initNav, "initNav");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initReveals, "initReveals");
    safe(initCounters, "initCounters");
    safe(initMarquee, "initMarquee");
    safe(initYear, "initYear");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
