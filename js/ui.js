const configurarCargaDeArchivos = () => {
    document.getElementById("uploadGeoJSON").addEventListener("change", (event) => {
        if (event.target.files[0]) {
            cargarGeoJSON(event.target.files[0]);
        }
        // Limpiar el input para permitir cargar el mismo archivo nuevamente
        event.target.value = '';
    });

    document.getElementById("uploadKML").addEventListener("change", (event) => {
        if (event.target.files[0]) {
            cargarDesdeKML(event.target.files[0]);
        }
        // Limpiar el input para permitir cargar el mismo archivo nuevamente
        event.target.value = '';
    });

    document.getElementById("uploadShp").addEventListener("change", (event) => {
        if (event.target.files[0]) {
            cargarDesdeShp(event.target.files[0]);
        }
        // Limpiar el input para permitir cargar el mismo archivo nuevamente
        event.target.value = '';
    });
};

// Función principal de inicialización - será llamada desde index.html
const inicializarApp = () => {
    inicializarMapa();
    agregarEventosMapa();
    configurarCargaDeArchivos();
    configurarEventosLimpieza();
    inicializarInterfaz();
};


// Hacer la función accesible globalmente
window.inicializarApp = inicializarApp;

const agregarEventosMapa = () => {
    // Los eventos de medidas en tiempo real están en map.js
    // Solo mantener eventos de geometrías creadas completamente
};

// Verifica que `agregarEventosMapa` esté disponible globalmente
window.agregarEventosMapa = agregarEventosMapa;
