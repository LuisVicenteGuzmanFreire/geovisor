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
