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

  function filasAObjetos(filas) {
    if (!filas.length) return [];
    var encabezados = filas[0].map(function (h) { return h.trim().toLowerCase(); });
    return filas.slice(1).map(function (f) {
      var obj = {};
      encabezados.forEach(function (h, i) { obj[h] = (f[i] || "").trim(); });
      return obj;
    });
  }

  function cargarCSV(shareUrl, respaldoLocal) {
    var fuentes = [];
    if (shareUrl) fuentes.push(urlDescargaOneDrive(shareUrl));
    fuentes.push(respaldoLocal);
    var intento = function (idx) {
      if (idx >= fuentes.length) return Promise.resolve(null);
      return fetch(fuentes[idx], { cache: "no-store" })
        .then(function (resp) {
          if (!resp.ok) throw new Error("HTTP " + resp.status);
          return resp.text().then(function (texto) {
            return { objetos: filasAObjetos(parsearCSV(texto)), desdeOneDrive: fuentes[idx] !== respaldoLocal };
          });
        })
        .catch(function () { return intento(idx + 1); });
    };
    return intento(0);
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
    var enlace = opts.enlace
      ? '<a class="enlace" href="' + escHTML(opts.enlace) + '" target="_blank" rel="noopener">' + escHTML(opts.cta || "Leer más") + " →</a>"
      : "";
    return '<article class="cell-card">' + media +
      '<div class="cell-card-body">' +
      '<span class="meta">' + escHTML(opts.meta || "") + "</span>" +
      "<h3>" + escHTML(opts.titulo) + "</h3>" +
      "<p>" + escHTML(opts.texto || "") + "</p>" + enlace +
      "</div></article>";
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

    cargarCSV(data.onedrive && data.onedrive.noticias, data.respaldos.noticias).then(function (res) {
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
          enlace: n.enlace, cta: "Leer más",
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

    cargarCSV(data.onedrive && data.onedrive.proyectos, data.respaldos.proyectos).then(function (res) {
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
          enlace: p.enlace, cta: "Ver proyecto",
          sello: inicialesSello(p.nombre)
        });
      }).join("");
      var fuente = $("[data-fuente-proyectos]");
      if (fuente && res.desdeOneDrive) fuente.textContent = "Sincronizado desde OneDrive";
    });
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
    safe(initNav, "initNav");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initReveals, "initReveals");
    safe(initCounters, "initCounters");
    safe(initCursorCoords, "initCursorCoords");
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
