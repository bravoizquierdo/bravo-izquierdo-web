/* Datos de marca — única variable global del sitio */
(function () {
  "use strict";
  window.__BRAND__ = {
    name: "Bravo Izquierdo",
    tagline: "Constructora · Inmobiliaria",

    // === ORIGEN DE LAS PLANILLAS ===
    // Método principal (recomendado): dejar estos campos VACÍOS. El sitio
    // lee las planillas desde data/ en el propio hosting (sin CORS), y el
    // editor las actualiza por cPanel/FTP.
    //
    // Opcional — OneDrive PERSONAL: pegar aquí el vínculo "Cualquier
    // persona con el vínculo · Puede ver" de cada .xlsx. (No funciona con
    // OneDrive corporativo/SharePoint: requiere un proxy con CORS.)
    onedrive: {
      noticias: "",   // ← (opcional) vínculo de noticias.xlsx en OneDrive personal
      proyectos: ""   // ← (opcional) vínculo de proyectos.xlsx en OneDrive personal
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
