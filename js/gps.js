// === GPS y Geolocalización ===

let watchId = null;
let marcadorUbicacion = null;
let circuloPrecision = null;
let siguiendoUbicacion = false;

// Función principal para obtener ubicación GPS
const obtenerUbicacionGPS = () => {
    const boton = document.getElementById('btnUbicacionGPS');
    
    // Verificar si el navegador soporta geolocalización
    if (!navigator.geolocation) {
        mostrarMensaje('Tu navegador no soporta geolocalización GPS', 'error');
        return;
    }
    
    // Si ya está siguiendo, detener el seguimiento
    if (siguiendoUbicacion) {
        detenerSeguimientoGPS();
        return;
    }
    
    // Cambiar estado del botón
    boton.classList.add('localizando');
    boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Localizando...';
    boton.disabled = true;
    
    // Opciones de geolocalización
    const opciones = {
        enableHighAccuracy: true,      // Usar GPS si está disponible
        timeout: 15000,                // Timeout de 15 segundos
        maximumAge: 60000              // Cache por 1 minuto
    };
    
    // Obtener ubicación actual
    navigator.geolocation.getCurrentPosition(
        exitoUbicacion,
        errorUbicacion,
        opciones
    );
};

// Función cuando se obtiene la ubicación exitosamente
const exitoUbicacion = (position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const precision = position.coords.accuracy; // En metros
    const timestamp = new Date(position.timestamp);
    
    console.log('📍 Ubicación GPS obtenida:', {
        lat: lat,
        lng: lng,
        precision: precision + 'm',
        timestamp: timestamp.toLocaleString()
    });
    
    // Centrar el mapa en la ubicación
    map.setView([lat, lng], 16);
    
    // Agregar marcador de ubicación
    agregarMarcadorUbicacion(lat, lng, precision);
    
    // Actualizar campos de coordenadas
    actualizarCamposCoordenadas(lat, lng);
    
    // Cambiar botón a modo seguimiento
    const boton = document.getElementById('btnUbicacionGPS');
    boton.classList.remove('localizando');
    boton.classList.add('siguiendo');
    boton.innerHTML = '<i class="fas fa-location-arrow"></i> Siguiendo GPS';
    boton.disabled = false;
    
    // Iniciar seguimiento continuo
    iniciarSeguimientoGPS();
    
    // Mostrar mensaje de éxito
    mostrarMensaje(`Ubicación GPS obtenida (precisión: ${Math.round(precision)}m)`, 'success');
};

// Función cuando hay error en la geolocalización
const errorUbicacion = (error) => {
    const boton = document.getElementById('btnUbicacionGPS');
    boton.classList.remove('localizando');
    boton.disabled = false;
    boton.innerHTML = '<i class="fas fa-location-arrow"></i> Mi Ubicación GPS';
    
    let mensajeError = '';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            mensajeError = 'Permiso de ubicación denegado. Habilita la ubicación en tu navegador.';
            break;
        case error.POSITION_UNAVAILABLE:
            mensajeError = 'Ubicación no disponible. Verifica tu conexión GPS/internet.';
            break;
        case error.TIMEOUT:
            mensajeError = 'Tiempo de espera agotado. Intenta nuevamente.';
            break;
        default:
            mensajeError = 'Error desconocido al obtener ubicación GPS.';
            break;
    }
    
    console.error('❌ Error GPS:', error);
    mostrarMensaje(mensajeError, 'error');
};

// Función para agregar marcador de ubicación en el mapa
const agregarMarcadorUbicacion = (lat, lng, precision) => {
    // Remover marcador anterior si existe
    if (marcadorUbicacion) {
        map.removeLayer(marcadorUbicacion);
    }
    if (circuloPrecision) {
        map.removeLayer(circuloPrecision);
    }
    
    // Crear icono personalizado para GPS
    const iconoGPS = L.divIcon({
        className: 'marcador-gps',
        html: `
            <div style="
                background: #10b981;
                border: 3px solid white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                position: relative;
            ">
                <div style="
                    background: #10b981;
                    border: 2px solid white;
                    border-radius: 50%;
                    width: 10px;
                    height: 10px;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    animation: pulse-gps 2s infinite;
                "></div>
            </div>
            <style>
                @keyframes pulse-gps {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    70% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            </style>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
    
    // Agregar marcador
    marcadorUbicacion = L.marker([lat, lng], { icon: iconoGPS }).addTo(map);
    
    // Crear popup con información
    const utm = convertirLatLngAutm(lat, lng);
    const dms = convertirAFormatoGoogleMaps(lat, lng);
    const timestamp = new Date().toLocaleString();
    
    const contenidoGPS = `
        <div class="popup-info-box">
            <b>🌐 Coordenadas Geográficas:</b><br>
            <b>DMS:</b> ${dms.format}<br>
            <b>Decimal:</b> ${lat.toFixed(6)}°, ${lng.toFixed(6)}°<br><br>
            <b>🗺️ Coordenadas UTM:</b><br>
            <b>Zona:</b> ${utm.zone}<br>
            <b>Este:</b> ${utm.easting} m<br>
            <b>Norte:</b> ${utm.northing} m<br><br>
            <b>📊 Información del GPS:</b><br>
            <b>Precisión:</b> ±${Math.round(precision)} metros<br>
            <b>Timestamp:</b> ${timestamp}
        </div>
    `;
    
    const popupContent = window.crearPopupUniversal('📍 Mi Ubicación GPS', contenidoGPS);
    
    marcadorUbicacion.bindPopup(popupContent);
    
    // Agregar círculo de precisión
    circuloPrecision = L.circle([lat, lng], {
        radius: precision,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5, 5'
    }).addTo(map);
};

// Función para actualizar campos de coordenadas con la ubicación GPS
const actualizarCamposCoordenadas = (lat, lng) => {
    // Actualizar campos de latitud/longitud
    document.getElementById('latInput').value = lat.toFixed(6);
    document.getElementById('lonInput').value = lng.toFixed(6);
    
    // Convertir a UTM y actualizar esos campos también
    const utm = convertirLatLngAutm(lat, lng);
    document.getElementById('utmEste').value = parseFloat(utm.easting).toFixed(2);
    document.getElementById('utmNorte').value = parseFloat(utm.northing).toFixed(2);
    document.getElementById('utmZona').value = utm.zone.slice(0, -1); // Quitar N/S
    document.getElementById('utmHemisferio').value = utm.zone.slice(-1); // Solo N/S
    
    // Asegurar que está en modo Lat/Lon
    document.getElementById('tipoCoordenadas').value = 'latlon';
    document.getElementById('inputLatLon').style.display = 'block';
    document.getElementById('inputUTM').style.display = 'none';
};

// Función para iniciar seguimiento continuo de GPS
const iniciarSeguimientoGPS = () => {
    if (siguiendoUbicacion) return;
    
    siguiendoUbicacion = true;
    
    const opciones = {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 5000 // Actualizar cada 5 segundos máximo
    };
    
    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const precision = position.coords.accuracy;
            
            // Actualizar marcador y círculo
            agregarMarcadorUbicacion(lat, lng, precision);
            actualizarCamposCoordenadas(lat, lng);
            
            console.log('🔄 Ubicación actualizada:', { lat, lng, precision: precision + 'm' });
        },
        (error) => {
            console.warn('⚠️ Error en seguimiento GPS:', error);
            // No mostrar mensaje de error para no saturar, solo log
        },
        opciones
    );
};

// Función para detener el seguimiento GPS
const detenerSeguimientoGPS = () => {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    
    siguiendoUbicacion = false;
    
    // Restaurar botón
    const boton = document.getElementById('btnUbicacionGPS');
    boton.classList.remove('siguiendo', 'localizando');
    boton.innerHTML = '<i class="fas fa-location-arrow"></i> Mi Ubicación GPS';
    boton.disabled = false;
    
    // Remover marcadores
    if (marcadorUbicacion) {
        map.removeLayer(marcadorUbicacion);
        marcadorUbicacion = null;
    }
    if (circuloPrecision) {
        map.removeLayer(circuloPrecision);
        circuloPrecision = null;
    }
    
    mostrarMensaje('Seguimiento GPS detenido', 'warning');
};

// Evento para el botón GPS
document.addEventListener('DOMContentLoaded', () => {
    const botonGPS = document.getElementById('btnUbicacionGPS');
    if (botonGPS) {
        botonGPS.addEventListener('click', obtenerUbicacionGPS);
    }
});

// Limpiar seguimiento al salir de la página
window.addEventListener('beforeunload', () => {
    detenerSeguimientoGPS();
});