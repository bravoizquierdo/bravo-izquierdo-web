/* Datos de marca — única variable global del sitio */
(function () {
  "use strict";
  window.__BRAND__ = {
    name: "Bravo Izquierdo",
    tagline: "Constructora · Inmobiliaria",

    // === CONFIGURACIÓN ONEDRIVE ===
    // Pegar aquí los vínculos compartidos ("cualquier persona puede ver")
    // de las planillas Excel (.xlsx). Si quedan vacíos, se usan los
    // respaldos locales de la carpeta data/.
    onedrive: {
      noticias: "",   // ← vínculo de noticias.xlsx en OneDrive
      proyectos: ""   // ← vínculo de proyectos.xlsx en OneDrive
    },
    respaldos: {
      noticias: "data/noticias.xlsx",
      proyectos: "data/proyectos.xlsx"
    },

    contact: {
      direccion: "Badajoz 45, Piso 13, Las Condes, Santiago, Chile",
      telefono1: "+56 2 233 93 300",
      telefono2: "+56 2 233 93 310",
      email: "comunicaciones@bravoizquierdo.cl"
    },
    social: {
      linkedin: "https://www.linkedin.com/company/constructora-bravo-izquierdo",
      facebook: "https://www.facebook.com/bravoizquierdo",
      instagram: "https://www.instagram.com/bravoizquierdo",
      youtube: "https://www.youtube.com/@bravoizquierdo"
    }
  };
})();
