const convertirLatLngAutm = (lat, lng) => {
    const zona = Math.floor((lng + 180) / 6) + 1;
    const hemisferio = lat >= 0 ? "N" : "S";
    const epsgCode = lat >= 0 ? `EPSG:326${zona}` : `EPSG:327${zona}`; // EPSG 326XX para el hemisferio norte, 327XX para el sur

    const projDef = `+proj=utm +zone=${zona} ${hemisferio === "S" ? "+south" : ""} +datum=WGS84 +units=m +no_defs`;
    const utmCoords = proj4(projDef, [lng, lat]);

    return {
        easting: utmCoords[0].toFixed(2),
        northing: utmCoords[1].toFixed(2),
        zone: `${zona}${hemisferio}`,
        epsg: epsgCode
    };
};

// Hacer la función accesible globalmente
window.convertirLatLngAutm = convertirLatLngAutm;

// Función debounce para optimizar rendimiento
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Hacer debounce accesible globalmente
window.debounce = debounce;

// Función para convertir coordenadas decimales a formato DMS (Google Maps)
const convertirAFormatoGoogleMaps = (lat, lng) => {
    const convertirDMS = (coord, isLatitude) => {
        const absolute = Math.abs(coord);
        const degrees = Math.floor(absolute);
        const minutesFloat = (absolute - degrees) * 60;
        const minutes = Math.floor(minutesFloat);
        const seconds = (minutesFloat - minutes) * 60;
        
        const direction = isLatitude 
            ? (coord >= 0 ? 'N' : 'S')
            : (coord >= 0 ? 'E' : 'W');
            
        return `${degrees}°${minutes}'${seconds.toFixed(2)}"${direction}`;
    };
    
    return {
        latitude: convertirDMS(lat, true),
        longitude: convertirDMS(lng, false),
        format: `${convertirDMS(lat, true)}, ${convertirDMS(lng, false)}`
    };
};

// Hacer función accesible globalmente
window.convertirAFormatoGoogleMaps = convertirAFormatoGoogleMaps;

// Función para parsear coordenadas DMS de Google Maps
const parsearCoordenadasDMS = (dmsString) => {
    try {
        // Limpiar la cadena de entrada - normalizar espacios y caracteres especiales
        let cleanString = dmsString.trim();
        
        // Reemplazar caracteres especiales comunes
        cleanString = cleanString.replace(/[""]/g, '"'); // Normalizar comillas
        cleanString = cleanString.replace(/['']/g, "'"); // Normalizar apostrofes
        cleanString = cleanString.replace(/\s+/g, ' '); // Normalizar espacios
        
        // Varios patrones para diferentes formatos posibles
        const patterns = [
            // Formato principal: 78°29'20.346"W  0°20'44.158"S
            /(\d+)°(\d+)'([\d.]+)"([NSEW])\s+(\d+)°(\d+)'([\d.]+)"([NSEW])/i,
            // Formato alternativo: 78°29'20.346"W, 0°20'44.158"S
            /(\d+)°(\d+)'([\d.]+)"([NSEW])\s*,\s*(\d+)°(\d+)'([\d.]+)"([NSEW])/i,
            // Formato sin espacios extra: 78°29'20.346"W 0°20'44.158"S
            /(\d+)°(\d+)'([\d.]+)"([NSEW])\s(\d+)°(\d+)'([\d.]+)"([NSEW])/i,
            // Formato con coordenadas al revés: 0°20'44.158"S 78°29'20.346"W
            /(\d+)°(\d+)'([\d.]+)"([NSEW])\s+(\d+)°(\d+)'([\d.]+)"([NSEW])/i
        ];
        
        let match = null;
        
        // Probar cada patrón
        for (const pattern of patterns) {
            match = cleanString.match(pattern);
            if (match) break;
        }
        
        if (!match) {
            throw new Error(`Formato de coordenadas DMS no válido. Use el formato: 78°29'20.346"W  0°20'44.158"S`);
        }
        
        // Extraer componentes
        const [, deg1, min1, sec1, dir1, deg2, min2, sec2, dir2] = match;
        
        // Convertir a decimal
        const convertDMSToDecimal = (degrees, minutes, seconds, direction) => {
            let decimal = parseInt(degrees) + parseInt(minutes)/60 + parseFloat(seconds)/3600;
            if (direction.toUpperCase() === 'S' || direction.toUpperCase() === 'W') {
                decimal = -decimal;
            }
            return decimal;
        };
        
        const coord1 = convertDMSToDecimal(deg1, min1, sec1, dir1);
        const coord2 = convertDMSToDecimal(deg2, min2, sec2, dir2);
        
        // Determinar cuál es latitud y cuál es longitud basándose en las direcciones
        let lat, lng;
        
        if (dir1.toUpperCase() === 'N' || dir1.toUpperCase() === 'S') {
            // Primera coordenada es latitud
            lat = coord1;
            lng = coord2;
        } else if (dir1.toUpperCase() === 'E' || dir1.toUpperCase() === 'W') {
            // Primera coordenada es longitud
            lat = coord2;
            lng = coord1;
        } else {
            throw new Error('Direcciones cardinales no válidas. Use N, S, E, W');
        }
        
        // Validar que tengamos una latitud y una longitud
        const isLatDirection = (dir) => dir.toUpperCase() === 'N' || dir.toUpperCase() === 'S';
        const isLngDirection = (dir) => dir.toUpperCase() === 'E' || dir.toUpperCase() === 'W';
        
        if (!(isLatDirection(dir1) && isLngDirection(dir2)) && !(isLngDirection(dir1) && isLatDirection(dir2))) {
            throw new Error('Debe proporcionar una coordenada de latitud (N/S) y una de longitud (E/W)');
        }
        
        // Validar rangos
        if (lat < -90 || lat > 90) {
            throw new Error(`La latitud ${lat.toFixed(6)} está fuera del rango válido (-90 a 90 grados)`);
        }
        if (lng < -180 || lng > 180) {
            throw new Error(`La longitud ${lng.toFixed(6)} está fuera del rango válido (-180 a 180 grados)`);
        }
        
        return { lat, lng };
        
    } catch (error) {
        throw new Error(`Error al parsear coordenadas DMS: ${error.message}`);
    }
};

// Hacer función accesible globalmente
window.parsearCoordenadasDMS = parsearCoordenadasDMS;



const calcularMedidas = (layer) => {
    if (layer instanceof L.Marker) return;
    const geojson = layer.toGeoJSON();
    
    if (geojson.geometry.type === "Polygon") {
        // Calcular área
        const area = turf.area(geojson);
        
        // Calcular perímetro convirtiendo el polígono a línea
        const polygon = turf.polygon(geojson.geometry.coordinates);
        const perimeter = turf.length(turf.polygonToLine(polygon), { units: "meters" });
        
        // Crear texto para Excel (separado por tabulaciones)
        const copyId = `copy-polygon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const textoCopia = `Tipo\tPolígono Dibujado
Área (m²)\t${area.toFixed(2)}
Área (ha)\t${(area / 10000).toFixed(4)}
Área (km²)\t${(area / 1000000).toFixed(6)}
Perímetro (m)\t${perimeter.toFixed(2)}
Perímetro (km)\t${(perimeter / 1000).toFixed(3)}`;
        
        const popupContent = `
            <div style="font-family: monospace; font-size: 13px; max-width: 280px;">
                <div style="background: #2563eb; color: white; padding: 8px; margin: -8px -8px 12px -8px; border-radius: 4px 4px 0 0; display: flex; justify-content: space-between; align-items: center;">
                    <b>📐 Polígono Dibujado</b>
                    <button id="${copyId}" onclick="copiarAlPortapapeles(\`${textoCopia.replace(/`/g, '\\`')}\`, '${copyId}')" 
                            style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;"
                            title="Copiar medidas">
                        <i class="fas fa-copy"></i> Copiar
                    </button>
                </div>
                <b>🔳 Área:</b><br>
                <b>Metros²:</b> ${area.toFixed(2)} m²<br>
                <b>Hectáreas:</b> ${(area / 10000).toFixed(4)} ha<br>
                <b>Kilómetros²:</b> ${(area / 1000000).toFixed(6)} km²<br><br>
                <b>📏 Perímetro:</b><br>
                <b>Metros:</b> ${perimeter.toFixed(2)} m<br>
                <b>Kilómetros:</b> ${(perimeter / 1000).toFixed(3)} km
            </div>
        `;
        
        layer.bindPopup(popupContent);
    } else if (geojson.geometry.type === "LineString") {
        const length = turf.length(geojson, { units: "meters" });
        
        // Crear texto para Excel (separado por tabulaciones)
        const copyId = `copy-line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const textoCopia = `Tipo\tLínea Dibujada
Longitud (m)\t${length.toFixed(2)}
Longitud (km)\t${(length / 1000).toFixed(3)}`;
        
        const popupContent = `
            <div style="font-family: monospace; font-size: 13px; max-width: 280px;">
                <div style="background: #2563eb; color: white; padding: 8px; margin: -8px -8px 12px -8px; border-radius: 4px 4px 0 0; display: flex; justify-content: space-between; align-items: center;">
                    <b>📏 Línea Dibujada</b>
                    <button id="${copyId}" onclick="copiarAlPortapapeles(\`${textoCopia.replace(/`/g, '\\`')}\`, '${copyId}')" 
                            style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;"
                            title="Copiar medidas">
                        <i class="fas fa-copy"></i> Copiar
                    </button>
                </div>
                <b>📏 Longitud:</b><br>
                <b>Metros:</b> ${length.toFixed(2)} m<br>
                <b>Kilómetros:</b> ${(length / 1000).toFixed(3)} km
            </div>
        `;
        
        layer.bindPopup(popupContent);
    } else if (geojson.geometry.type === "Point" && layer.getRadius) {
        // Es un círculo (Circle)
        const radius = layer.getRadius();
        const area = Math.PI * radius * radius;
        
        // Crear texto para Excel (separado por tabulaciones)
        const copyId = `copy-circle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const textoCopia = `Tipo\tCírculo Dibujado
Radio (m)\t${radius.toFixed(2)}
Radio (km)\t${(radius / 1000).toFixed(3)}
Área (m²)\t${area.toFixed(2)}
Área (ha)\t${(area / 10000).toFixed(4)}
Área (km²)\t${(area / 1000000).toFixed(6)}`;
        
        const popupContent = `
            <div style="font-family: monospace; font-size: 13px; max-width: 280px;">
                <div style="background: #2563eb; color: white; padding: 8px; margin: -8px -8px 12px -8px; border-radius: 4px 4px 0 0; display: flex; justify-content: space-between; align-items: center;">
                    <b>⭕ Círculo Dibujado</b>
                    <button id="${copyId}" onclick="copiarAlPortapapeles(\`${textoCopia.replace(/`/g, '\\`')}\`, '${copyId}')" 
                            style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;"
                            title="Copiar medidas">
                        <i class="fas fa-copy"></i> Copiar
                    </button>
                </div>
                <b>⭕ Radio:</b><br>
                <b>Metros:</b> ${radius.toFixed(2)} m<br>
                <b>Kilómetros:</b> ${(radius / 1000).toFixed(3)} km<br><br>
                <b>📐 Área:</b><br>
                <b>Metros²:</b> ${area.toFixed(2)} m²<br>
                <b>Hectáreas:</b> ${(area / 10000).toFixed(4)} ha<br>
                <b>Kilómetros²:</b> ${(area / 1000000).toFixed(6)} km²
            </div>
        `;
        
        layer.bindPopup(popupContent);
    }
};
