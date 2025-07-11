// === dataLoader.js ===
// Gestión unificada de capas cargadas en el visor
let capasCargadas = {}; // Objeto para almacenar las capas por nombre
let grupoCapasCargadas = null; // Grupo que contiene todas las capas cargadas

// Hacer variables accesibles globalmente
window.capasCargadas = capasCargadas;

// Función para copiar texto al portapapeles
const copiarAlPortapapeles = (texto, botonId) => {
    navigator.clipboard.writeText(texto).then(() => {
        const boton = document.getElementById(botonId);
        const textoOriginal = boton.innerHTML;
        boton.innerHTML = '<i class="fas fa-check"></i> ¡Copiado!';
        boton.style.background = '#10b981';
        
        setTimeout(() => {
            boton.innerHTML = textoOriginal;
            boton.style.background = '#2563eb';
        }, 2000);
        
        mostrarMensaje('Información copiada al portapapeles', 'success');
    }).catch(err => {
        console.error('Error al copiar:', err);
        mostrarMensaje('Error al copiar al portapapeles', 'error');
    });
};

// Función para formatear información atributiva
const formatearInformacionAtributiva = (feature, nombreCapa) => {
    const properties = feature.properties || {};
    const geometry = feature.geometry;
    const copyId = `copy-btn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear texto para Excel (separado por tabulaciones)
    let textoCopia = `Capa\t${nombreCapa}\n`;
    textoCopia += `Tipo de Geometría\t${geometry.type}\n`;
    
    // Agregar información geométrica
    if (geometry.type === 'Point') {
        const [lng, lat] = geometry.coordinates;
        const utm = convertirLatLngAutm(lat, lng);
        const dms = convertirAFormatoGoogleMaps(lat, lng);
        textoCopia += `Latitud (DMS)\t${dms.latitude}\n`;
        textoCopia += `Longitud (DMS)\t${dms.longitude}\n`;
        textoCopia += `Latitud (Decimal)\t${lat.toFixed(6)}\n`;
        textoCopia += `Longitud (Decimal)\t${lng.toFixed(6)}\n`;
        textoCopia += `UTM Zona\t${utm.zone}\n`;
        textoCopia += `UTM Este\t${utm.easting}\n`;
        textoCopia += `UTM Norte\t${utm.northing}\n`;
        textoCopia += `EPSG\t${utm.epsg}\n`;
    } else if (geometry.type === 'Polygon') {
        const area = turf.area(feature);
        const polygon = turf.polygon(geometry.coordinates);
        const perimeter = turf.length(turf.polygonToLine(polygon), { units: "meters" });
        textoCopia += `Área (m²)\t${area.toFixed(2)}\n`;
        textoCopia += `Área (ha)\t${(area/10000).toFixed(4)}\n`;
        textoCopia += `Área (km²)\t${(area/1000000).toFixed(6)}\n`;
        textoCopia += `Perímetro (m)\t${perimeter.toFixed(2)}\n`;
        textoCopia += `Perímetro (km)\t${(perimeter/1000).toFixed(3)}\n`;
    } else if (geometry.type === 'LineString') {
        const length = turf.length(feature, { units: "meters" });
        textoCopia += `Longitud (m)\t${length.toFixed(2)}\n`;
        textoCopia += `Longitud (km)\t${(length/1000).toFixed(3)}\n`;
    }
    
    // Agregar información atributiva
    if (Object.keys(properties).length > 0) {
        Object.entries(properties).forEach(([key, value]) => {
            const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            let formattedValue = value;
            if (value === null || value === undefined) {
                formattedValue = 'Sin datos';
            } else if (typeof value === 'string' && value.trim() === '') {
                formattedValue = 'Vacío';
            } else if (typeof value === 'object') {
                formattedValue = JSON.stringify(value);
            }
            textoCopia += `${formattedKey}\t${formattedValue}\n`;
        });
    } else {
        textoCopia += `Información Atributiva\tSin información atributiva\n`;
    }
    
    // Crear contenido del popup con botón de copia
    let content = `
        <div class="popup-container">
            <div class="popup-header">
                <b>📊 ${nombreCapa}</b>
                <button id="${copyId}" onclick="copiarAlPortapapeles(\`${textoCopia.replace(/`/g, '\\`')}\`, '${copyId}')" 
                        class="popup-copy-btn"
                        title="Copiar información">
                    <i class="fas fa-copy"></i> Copiar
                </button>
            </div>
    `;
    
    // Información de la geometría
    content += `
        <div class="popup-info-box">
            <b>🗺️ Tipo de Geometría:</b> ${geometry.type}<br>
    `;
    
    // Agregar coordenadas dependiendo del tipo
    if (geometry.type === 'Point') {
        const [lng, lat] = geometry.coordinates;
        const utm = convertirLatLngAutm(lat, lng);
        const dms = convertirAFormatoGoogleMaps(lat, lng);
        content += `
            <b>📍 Coordenadas Geográficas:</b><br>
            <b>DMS:</b> ${dms.format}<br>
            <b>Decimal:</b> ${lat.toFixed(6)}°, ${lng.toFixed(6)}°<br>
            <b>📍 Coordenadas UTM:</b><br>
            <b>Zona:</b> ${utm.zone}<br>
            <b>Este:</b> ${utm.easting} m<br>
            <b>Norte:</b> ${utm.northing} m
        `;
    } else if (geometry.type === 'Polygon') {
        // Calcular área y perímetro
        const area = turf.area(feature);
        const polygon = turf.polygon(geometry.coordinates);
        const perimeter = turf.length(turf.polygonToLine(polygon), { units: "meters" });
        
        content += `
            <b>📐 Área:</b> ${area.toFixed(2)} m² (${(area/10000).toFixed(4)} ha)<br>
            <b>📏 Perímetro:</b> ${perimeter.toFixed(2)} m
        `;
    } else if (geometry.type === 'LineString') {
        const length = turf.length(feature, { units: "meters" });
        content += `
            <b>📏 Longitud:</b> ${length.toFixed(2)} m
        `;
    }
    
    content += `</div>`;
    
    // Información atributiva
    if (Object.keys(properties).length > 0) {
        content += `
            <div class="popup-attributes-box">
                <b>📋 Información Atributiva:</b><br><br>
        `;
        
        // Formatear cada propiedad
        Object.entries(properties).forEach(([key, value]) => {
            // Formatear la clave (convertir snake_case a texto legible)
            const formattedKey = key
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
            
            // Formatear el valor
            let formattedValue = value;
            if (value === null || value === undefined) {
                formattedValue = '<em>Sin datos</em>';
            } else if (typeof value === 'string' && value.trim() === '') {
                formattedValue = '<em>Vacío</em>';
            } else if (typeof value === 'number') {
                formattedValue = value.toLocaleString();
            } else if (typeof value === 'object') {
                formattedValue = JSON.stringify(value, null, 2);
            }
            
            content += `<b>${formattedKey}:</b> ${formattedValue}<br>`;
        });
        
        content += `</div>`;
    } else {
        content += `
            <div class="popup-warning-box">
                <b>⚠️ Sin información atributiva</b>
            </div>
        `;
    }
    
    content += `</div>`;
    
    return content;
};

// Hacer función accesible globalmente
window.copiarAlPortapapeles = copiarAlPortapapeles;

// Función universal para crear popups homogenizados
const crearPopupUniversal = (titulo, contenido, incluyeBotonCopiar = false, textoCopia = '') => {
    const copyId = incluyeBotonCopiar ? `copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : null;
    
    let popup = `
        <div class="popup-container">
            <div class="popup-header">
                <b>${titulo}</b>
                ${incluyeBotonCopiar ? `
                    <button id="${copyId}" onclick="copiarAlPortapapeles(\`${textoCopia.replace(/`/g, '\\`')}\`, '${copyId}')" 
                            class="popup-copy-btn"
                            title="Copiar información">
                        <i class="fas fa-copy"></i> Copiar
                    </button>
                ` : ''}
            </div>
            <div class="popup-content-body">
                ${contenido}
            </div>
        </div>
    `;
    
    return popup;
};

// Hacer función accesible globalmente
window.crearPopupUniversal = crearPopupUniversal;

const agregarCapaAlPanel = (nombre, capa) => {
    const lista = document.getElementById("listaCapas");
    const li = document.createElement("li");
    li.innerHTML = `
        <div class="layer-info">
            <input type="checkbox" id="visibility-${nombre}" class="layer-visibility" checked 
                   onchange="toggleCapaVisibilidad('${nombre}', this.checked)" title="Mostrar/Ocultar capa">
            <span class="layer-name" onclick="hacerZoomACapa('${nombre}')" title="Hacer zoom a esta capa">${nombre}</span>
        </div>
        <div class="layer-controls">
            <button onclick="hacerZoomACapa('${nombre}')" title="Zoom a capa" class="zoom-btn">🎯</button>
            <button onclick="eliminarCapa('${nombre}')" title="Eliminar capa" class="delete-btn">❌</button>
        </div>
    `;
    
    // Añadir clase para animación de nueva capa
    li.classList.add('nueva-capa');
    
    // Remover la clase después de la animación
    setTimeout(() => {
        li.classList.remove('nueva-capa');
    }, 1000);
    
    lista.appendChild(li);

    // Guardar capa en capasCargadas y agregarla al grupo unificado
    capasCargadas[nombre] = capa;
    
    // Asegurar que el grupo existe y agregar la capa
    if (!grupoCapasCargadas) {
        grupoCapasCargadas = window.grupoCapasCargadas;
    }
    
    if (grupoCapasCargadas && typeof grupoCapasCargadas.addLayer === 'function') {
        grupoCapasCargadas.addLayer(capa);
        console.log(`✅ Capa ${nombre} añadida al grupo de capas`);
    } else {
        console.error("❌ Error: grupo de capas no disponible");
        mostrarMensaje("Error: sistema de capas no inicializado", 'error');
        return;
    }
    
    // Hacer zoom automático a la capa cargada
    if (window.map && capa.getBounds) {
        try {
            const bounds = capa.getBounds();
            if (bounds.isValid()) {
                window.map.fitBounds(bounds, { padding: [20, 20] });
                console.log("🎯 Zoom automático a la capa:", nombre);
                
                // Actualizar status
                if (document.getElementById('mapStatus')) {
                    document.getElementById('mapStatus').textContent = `Capa cargada: ${nombre}`;
                }
            }
        } catch (error) {
            console.warn("⚠️ No se pudo hacer zoom a la capa:", error);
        }
    }
    
    // Hacer las capas accesibles globalmente
    window.capasCargadas = capasCargadas;
    
    // Desplegar automáticamente el panel de información si está colapsado
    const infoPanel = document.getElementById('infoPanel');
    const toggleInfoBtn = document.getElementById('toggleInfo');
    
    if (infoPanel && infoPanel.classList.contains('collapsed')) {
        // Solo si está colapsado, desplegarlo
        if (typeof window.toggleInfoPanel === 'function') {
            window.toggleInfoPanel();
            console.log("📖 Panel de capas desplegado automáticamente");
        }
    }
    
    // En dispositivos móviles, mostrar el panel si está oculto
    if (window.innerWidth <= 768 && infoPanel && infoPanel.style.display === 'none') {
        if (typeof window.toggleInfoPanel === 'function') {
            window.toggleInfoPanel();
            console.log("📱 Panel de capas mostrado en móvil");
        }
    }
    
    // Actualizar panel de capas
    if (typeof window.actualizarPanelCapas === 'function') {
        window.actualizarPanelCapas();
    } else {
        console.error("❌ Función actualizarPanelCapas no disponible");
    }
    
    // Mostrar mensaje de confirmación
    setTimeout(() => {
        mostrarMensaje(`Capa "${nombre}" añadida al panel`, 'success');
    }, 100);
    
    console.log("📂 Capas cargadas después de agregar:", capasCargadas);
};




const eliminarCapa = (nombre) => {
    console.log(`🗑️ Eliminando capa: ${nombre}`);
    
    if (capasCargadas[nombre]) {
        try {
            // Remover del grupo unificado
            if (grupoCapasCargadas && grupoCapasCargadas.removeLayer) {
                grupoCapasCargadas.removeLayer(capasCargadas[nombre]);
                console.log(`✅ Capa ${nombre} removida del grupo`);
            }
            
            // Eliminar de la lista de capas cargadas
            delete capasCargadas[nombre];
            console.log(`✅ Capa ${nombre} eliminada del registro`);
            
            // Actualizar lista visual
            actualizarListaCapas();
            
            // Mostrar mensaje de confirmación
            mostrarMensaje(`Capa "${nombre}" eliminada`, 'success');
            
        } catch (error) {
            console.error("❌ Error al eliminar capa:", error);
            mostrarMensaje(`Error al eliminar capa "${nombre}"`, 'error');
        }
    } else {
        console.warn(`⚠️ Capa ${nombre} no encontrada en capasCargadas`);
        mostrarMensaje(`Capa "${nombre}" no encontrada`, 'warning');
    }

    // Hacer las capas accesibles globalmente
    window.capasCargadas = capasCargadas;
    
    // Actualizar panel de capas
    if (typeof window.actualizarPanelCapas === 'function') {
        window.actualizarPanelCapas();
    } else {
        console.error("❌ Función actualizarPanelCapas no disponible");
    }
    
    console.log("📂 Capas restantes después de eliminar:", Object.keys(capasCargadas));
};

// Hacer función accesible globalmente
window.eliminarCapa = eliminarCapa;


// Función para hacer zoom a una capa específica
const hacerZoomACapa = (nombre) => {
    if (capasCargadas[nombre] && window.map) {
        try {
            const capa = capasCargadas[nombre];
            if (capa.getBounds) {
                const bounds = capa.getBounds();
                if (bounds.isValid()) {
                    window.map.fitBounds(bounds, { padding: [20, 20] });
                    mostrarMensaje(`Zoom a capa: ${nombre}`, 'success');
                    document.getElementById('mapStatus').textContent = `Viendo: ${nombre}`;
                }
            }
        } catch (error) {
            console.error("Error al hacer zoom a capa:", error);
            mostrarMensaje("Error al hacer zoom a la capa", 'error');
        }
    }
};

// Hacer función accesible globalmente
window.hacerZoomACapa = hacerZoomACapa;

// Función para mostrar/ocultar capas
const toggleCapaVisibilidad = (nombre, visible) => {
    if (capasCargadas[nombre] && window.map) {
        try {
            if (visible) {
                // Mostrar la capa
                if (!window.map.hasLayer(capasCargadas[nombre])) {
                    window.map.addLayer(capasCargadas[nombre]);
                    console.log(`✅ Capa "${nombre}" mostrada`);
                    mostrarMensaje(`Capa "${nombre}" visible`, 'success');
                }
            } else {
                // Ocultar la capa
                if (window.map.hasLayer(capasCargadas[nombre])) {
                    window.map.removeLayer(capasCargadas[nombre]);
                    console.log(`👁️‍🗨️ Capa "${nombre}" oculta`);
                    mostrarMensaje(`Capa "${nombre}" oculta`, 'warning');
                }
            }
            
            // Actualizar estado visual del checkbox y texto
            const checkbox = document.getElementById(`visibility-${nombre}`);
            const layerItem = checkbox.closest('li');
            
            if (layerItem) {
                if (visible) {
                    layerItem.style.opacity = '1';
                    layerItem.classList.remove('layer-hidden');
                } else {
                    layerItem.style.opacity = '0.6';
                    layerItem.classList.add('layer-hidden');
                }
            }
            
        } catch (error) {
            console.error("❌ Error al cambiar visibilidad de capa:", error);
            mostrarMensaje(`Error al cambiar visibilidad de "${nombre}"`, 'error');
        }
    }
};

// Hacer función accesible globalmente
window.toggleCapaVisibilidad = toggleCapaVisibilidad;

const actualizarListaCapas = () => {
    const lista = document.getElementById("listaCapas");
    lista.innerHTML = ""; // Limpia la lista
    Object.keys(capasCargadas).forEach((nombre) => {
        const li = document.createElement("li");
        
        // Verificar si la capa está visible en el mapa
        const estaVisible = window.map && window.map.hasLayer(capasCargadas[nombre]);
        
        li.innerHTML = `
            <div class="layer-info">
                <input type="checkbox" id="visibility-${nombre}" class="layer-visibility" ${estaVisible ? 'checked' : ''} 
                       onchange="toggleCapaVisibilidad('${nombre}', this.checked)" title="Mostrar/Ocultar capa">
                <span class="layer-name" onclick="hacerZoomACapa('${nombre}')" title="Hacer zoom a esta capa">${nombre}</span>
            </div>
            <div class="layer-controls">
                <button onclick="hacerZoomACapa('${nombre}')" title="Zoom a capa" class="zoom-btn">🎯</button>
                <button onclick="eliminarCapa('${nombre}')" title="Eliminar capa" class="delete-btn">❌</button>
            </div>
        `;
        
        // Aplicar estilo visual según visibilidad
        if (!estaVisible) {
            li.style.opacity = '0.6';
            li.classList.add('layer-hidden');
        }
        
        lista.appendChild(li);
    });
};

const cargarGeoJSON = (file) => {
    console.log("🔄 Iniciando carga de GeoJSON:", file?.name);
    
    // Validar archivo
    if (!file || file.size === 0) {
        console.error("❌ Archivo GeoJSON inválido o vacío");
        mostrarMensaje("Error: El archivo GeoJSON está vacío.", 'error');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB límite
        console.error("❌ Archivo GeoJSON demasiado grande:", file.size);
        mostrarMensaje("Error: El archivo GeoJSON es demasiado grande (máx 10MB).", 'error');
        return;
    }

    console.log("✅ Validación inicial de GeoJSON exitosa");
    mostrarCargando();
    actualizarProgreso(0, 'Cargando GeoJSON...');
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            actualizarProgreso(50, 'Procesando GeoJSON...');
            const data = JSON.parse(event.target.result);
            
            // Validar estructura GeoJSON
            if (!data.type || (data.type !== 'FeatureCollection' && data.type !== 'Feature')) {
                throw new Error("Formato GeoJSON inválido");
            }
            
            actualizarProgreso(75, 'Creando capa...');
            const geojsonLayer = L.geoJSON(data, {
                style: { color: 'blue' },
                onEachFeature: (feature, layer) => {
                    const popupContent = formatearInformacionAtributiva(feature, file.name);
                    layer.bindPopup(popupContent);
                }
            });

            actualizarProgreso(100, 'Finalizando...');
            agregarCapaAlPanel(file.name, geojsonLayer);
            
            setTimeout(() => {
                ocultarCargando();
                mostrarMensaje(`GeoJSON "${file.name}" cargado exitosamente`, 'success');
            }, 500);
            
            console.log("✅ GeoJSON cargado:", capasCargadas);
        } catch (error) {
            console.error("⚠️ Error al cargar GeoJSON:", error);
            ocultarCargando();
            mostrarMensaje(`Error al cargar el archivo GeoJSON: ${error.message}`, 'error');
        }
    };
    reader.readAsText(file);
};

const cargarDesdeKML = (file) => {
    // Validar archivo
    if (!file || file.size === 0) {
        mostrarMensaje("Error: El archivo KML está vacío.", 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB límite
        mostrarMensaje("Error: El archivo KML es demasiado grande (máx 5MB).", 'error');
        return;
    }

    mostrarCargando();
    actualizarProgreso(0, 'Cargando KML...');
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            actualizarProgreso(30, 'Validando KML...');
            const kmlText = event.target.result;
            
            // Validar que sea XML válido
            if (!kmlText.includes('<kml') && !kmlText.includes('<?xml')) {
                throw new Error("El archivo no parece ser un KML válido");
            }
            
            actualizarProgreso(60, 'Procesando KML...');
            const parser = new DOMParser();
            const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
            
            // Verificar errores de parsing
            if (kmlDoc.getElementsByTagName('parsererror').length > 0) {
                throw new Error("Error al parsear el archivo KML");
            }
            
            const geojson = toGeoJSON.kml(kmlDoc);

            actualizarProgreso(90, 'Creando capa...');
            const kmlLayer = L.geoJSON(geojson, {
                style: { color: 'red' },
                onEachFeature: (feature, layer) => {
                    const popupContent = formatearInformacionAtributiva(feature, file.name);
                    layer.bindPopup(popupContent);
                }
            });

            agregarCapaAlPanel(file.name, kmlLayer);
            
            setTimeout(() => {
                ocultarCargando();
                mostrarMensaje(`KML "${file.name}" cargado exitosamente`, 'success');
            }, 500);
            
            console.log("✅ KML cargado:", capasCargadas);
        } catch (error) {
            console.error("⚠️ Error al cargar KML:", error);
            ocultarCargando();
            mostrarMensaje(`Error al cargar el archivo KML: ${error.message}`, 'error');
        }
    };
    reader.readAsText(file);
};

const cargarDesdeShp = (file) => {
    // Validar archivo
    if (!file || file.size === 0) {
        mostrarMensaje("Error: El archivo SHP/ZIP está vacío.", 'error');
        return;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB límite
        mostrarMensaje("Error: El archivo SHP es demasiado grande (máx 50MB).", 'error');
        return;
    }
    
    // Validar que sea un archivo ZIP
    if (!file.name.toLowerCase().endsWith('.zip')) {
        mostrarMensaje("Error: Por favor selecciona un archivo ZIP que contenga el shapefile.", 'error');
        return;
    }

    mostrarCargando();
    actualizarProgreso(0, 'Cargando Shapefile...');
    
    const reader = new FileReader();
    reader.onload = (event) => {
        actualizarProgreso(25, 'Extrayendo archivos...');
        const arrayBuffer = event.target.result;
        
        shp(arrayBuffer).then(geojson => {
            actualizarProgreso(70, 'Validando geometrías...');
            
            // Validar que el GeoJSON resultante tenga features
            if (!geojson.features || geojson.features.length === 0) {
                throw new Error("El shapefile no contiene geometrías válidas");
            }
            
            actualizarProgreso(90, 'Creando capa...');
            const shpLayer = L.geoJSON(geojson, {
                style: { color: 'green' },
                onEachFeature: (feature, layer) => {
                    const popupContent = formatearInformacionAtributiva(feature, file.name);
                    layer.bindPopup(popupContent);
                }
            });

            agregarCapaAlPanel(file.name, shpLayer);
            
            setTimeout(() => {
                ocultarCargando();
                mostrarMensaje(`Shapefile "${file.name}" cargado exitosamente`, 'success');
            }, 500);
            
            console.log("✅ SHP cargado:", capasCargadas);
        }).catch(error => {
            console.error("⚠️ Error al cargar SHP:", error);
            ocultarCargando();
            mostrarMensaje(`Error al cargar el SHP: ${error.message}. Verifica que el archivo ZIP contenga los archivos .shp, .dbf y .prj.`, 'error');
        });
    };
    reader.readAsArrayBuffer(file);
};



// === Funciones de Exportación ===
const exportarGeoJSON = () => {
    const features = [];

    // SOLO exportar geometrías marcadas como dibujadas
    map.eachLayer(layer => {
        if (layer._esDibujada === true) {
            features.push(layer.toGeoJSON());
        }
    });

    // Verificar si hay elementos para exportar
    if (features.length === 0) {
        mostrarMensaje("No hay geometrías dibujadas para exportar.", 'warning');
        return;
    }

    // Crear archivo GeoJSON y descargarlo
    const geojsonFinal = { type: "FeatureCollection", features };
    const blob = new Blob([JSON.stringify(geojsonFinal, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "geometrias_dibujadas.geojson";
    link.click();
    
    mostrarMensaje(`GeoJSON exportado con ${features.length} geometrías dibujadas`, 'success');
};


const convertirGeoJSONaKML = (geojson) => {
    if (!geojson || !geojson.geometry) return "";

    let kml = "";

    if (geojson.geometry.type === "Point") {
        kml += `<Placemark><Point><coordinates>${geojson.geometry.coordinates.join(",")}</coordinates></Point></Placemark>\n`;
    } else if (geojson.geometry.type === "LineString") {
        kml += `<Placemark><LineString><coordinates>${geojson.geometry.coordinates.map(c => c.join(",")).join(" ")}</coordinates></LineString></Placemark>\n`;
    } else if (geojson.geometry.type === "Polygon") {
        kml += `<Placemark><Polygon><outerBoundaryIs><LinearRing><coordinates>${geojson.geometry.coordinates[0].map(c => c.join(",")).join(" ")}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>\n`;
    }

    return kml;
};




const exportarKML = () => {
    let kml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    kml += '<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n';
    let geometriasExportadas = 0;

    // SOLO exportar geometrías marcadas como dibujadas
    map.eachLayer(layer => {
        if (layer._esDibujada === true) {
            kml += convertirGeoJSONaKML(layer.toGeoJSON());
            geometriasExportadas++;
        }
    });

    kml += '</Document>\n</kml>';

    // Verificar si hay elementos para exportar
    if (geometriasExportadas === 0) {
        mostrarMensaje("No hay geometrías dibujadas para exportar.", 'warning');
        return;
    }

    // Descargar el archivo KML
    const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "geometrias_dibujadas.kml";
    link.click();
    
    mostrarMensaje(`KML exportado con ${geometriasExportadas} geometrías dibujadas`, 'success');
};

const exportarCSV = async () => {
    const features = [];

    // SOLO exportar geometrías marcadas como dibujadas
    map.eachLayer(layer => {
        if (layer._esDibujada === true) {
            features.push(layer.toGeoJSON());
        }
    });

    // Verificar si hay elementos para exportar
    if (features.length === 0) {
        mostrarMensaje("No hay geometrías dibujadas para exportar.", 'warning');
        return;
    }

    // Mostrar previsualización antes de exportar
    await mostrarPreviewCSV(features);
};

const crearContenidoCSV = (features, elevacionesData = null) => {
    const filas = [];
    
    // BOM para UTF-8 (ayuda a Excel a reconocer la codificación)
    const BOM = '\uFEFF';
    
    // Cabecera del CSV (usando punto y coma como separador para Excel en español)
    const cabecera = [
        '#',
        'Tipo',
        'Vertice', 
        'Latitud',
        'Longitud',
        'Elevacion_m',
        'UTMX_m',
        'UTMY_m',
        'Zona_UTM',
        'Distancia_m'
    ];
    
    filas.push(cabecera.join(';'));
    
    // Usar elevaciones si están disponibles, sino usar función sin elevaciones
    let datosTabla;
    if (elevacionesData) {
        datosTabla = crearDatosTablaConElevaciones(features, elevacionesData.coordenadasMap, elevacionesData.elevaciones);
    } else {
        datosTabla = crearDatosTabla(features);
    }
    
    datosTabla.forEach(fila => {
        filas.push(fila.join(';'));
    });
    
    return BOM + filas.join('\n');
};

// === Funciones para obtener elevación ===
const obtenerElevacion = async (lat, lng) => {
    try {
        const response = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`);
        if (!response.ok) throw new Error('Error en API de elevación');
        const data = await response.json();
        return data.results[0].elevation || 0;
    } catch (error) {
        console.warn('Error obteniendo elevación:', error);
        return 0; // Fallback
    }
};

const obtenerElevacionesMasivas = async (coordenadas) => {
    console.log('📍 Solicitando elevaciones para coordenadas:', coordenadas);
    try {
        // Open Elevation permite hasta 1024 ubicaciones por request
        const maxBatch = 1024;
        const resultados = [];
        
        for (let i = 0; i < coordenadas.length; i += maxBatch) {
            const batch = coordenadas.slice(i, i + maxBatch);
            const locationsStr = batch.map(coord => `${coord.lat},${coord.lng}`).join('|');
            const url = `https://api.open-elevation.com/api/v1/lookup?locations=${locationsStr}`;
            
            console.log('🌐 Consultando API de elevación:', url);
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error ${response.status} en API de elevación`);
            const data = await response.json();
            
            console.log('📊 Respuesta de API:', data);
            
            const elevacionesBatch = data.results.map(r => r.elevation || 0);
            resultados.push(...elevacionesBatch);
            
            console.log(`✅ Procesado lote ${i + 1}-${Math.min(i + maxBatch, coordenadas.length)} de ${coordenadas.length}`);
            
            // Pequeña pausa entre requests para ser amigables con la API
            if (i + maxBatch < coordenadas.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log('🏔️ Todas las elevaciones obtenidas:', resultados);
        return resultados;
    } catch (error) {
        console.error('❌ Error obteniendo elevaciones masivas:', error);
        const fallback = coordenadas.map(() => 0);
        console.log('🔄 Usando fallback:', fallback);
        return fallback; // Fallback array con ceros
    }
};

// === Funciones para la previsualización CSV ===
const mostrarPreviewCSV = async (features) => {
    const overlay = document.getElementById('csvPreviewOverlay');
    const table = document.getElementById('csvPreviewTable');
    const info = document.getElementById('csvPreviewInfo');
    
    // Mostrar loading primero
    mostrarCargando();
    actualizarProgreso(0, 'Preparando datos...');
    
    // Limpiar tabla anterior
    table.innerHTML = '';
    
    // Recopilar todas las coordenadas únicas para consultar elevaciones
    const coordenadasUnicas = [];
    const coordenadasMap = new Map(); // Para mapear coordenadas a índices
    
    features.forEach(feature => {
        if (feature.geometry.type === 'Point') {
            const [lng, lat] = feature.geometry.coordinates;
            const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
            if (!coordenadasMap.has(key)) {
                coordenadasMap.set(key, coordenadasUnicas.length);
                coordenadasUnicas.push({ lat, lng });
            }
        } else if (feature.geometry.type === 'LineString') {
            feature.geometry.coordinates.forEach(coord => {
                const [lng, lat] = coord;
                const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
                if (!coordenadasMap.has(key)) {
                    coordenadasMap.set(key, coordenadasUnicas.length);
                    coordenadasUnicas.push({ lat, lng });
                }
            });
        } else if (feature.geometry.type === 'Polygon') {
            const vertices = feature.geometry.coordinates[0].slice(0, -1); // Excluir último punto duplicado
            vertices.forEach(coord => {
                const [lng, lat] = coord;
                const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
                if (!coordenadasMap.has(key)) {
                    coordenadasMap.set(key, coordenadasUnicas.length);
                    coordenadasUnicas.push({ lat, lng });
                }
            });
        }
    });
    
    actualizarProgreso(25, `Obteniendo elevaciones de ${coordenadasUnicas.length} puntos únicos...`);
    
    // Obtener elevaciones de forma masiva
    const elevaciones = await obtenerElevacionesMasivas(coordenadasUnicas);
    console.log('🏔️ Elevaciones obtenidas:', elevaciones);
    
    actualizarProgreso(75, 'Creando tabla...');
    
    // Crear datos estructurados para la tabla con elevaciones
    const datosTabla = crearDatosTablaConElevaciones(features, coordenadasMap, elevaciones);
    
    // Crear cabecera de la tabla
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const cabeceras = [
        '#', 'Tipo', 'Vértice', 'Latitud', 'Longitud', 'Elevación (m)', 
        'UTMX (m)', 'UTMY (m)', 'Zona UTM', 'Distancia (m)'
    ];
    
    cabeceras.forEach(cabecera => {
        const th = document.createElement('th');
        th.textContent = cabecera;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Crear cuerpo de la tabla
    const tbody = document.createElement('tbody');
    
    datosTabla.forEach(fila => {
        const tr = document.createElement('tr');
        fila.forEach(celda => {
            const td = document.createElement('td');
            td.textContent = celda;
            td.title = celda; // Tooltip para texto completo
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    
    // Actualizar información
    const puntos = features.filter(f => f.geometry.type === 'Point').length;
    const lineas = features.filter(f => f.geometry.type === 'LineString').length;
    const poligonos = features.filter(f => f.geometry.type === 'Polygon').length;
    
    // Contar vértices totales
    let totalVertices = 0;
    features.forEach(feature => {
        if (feature.geometry.type === 'Point') {
            totalVertices += 1;
        } else if (feature.geometry.type === 'LineString') {
            totalVertices += feature.geometry.coordinates.length;
        } else if (feature.geometry.type === 'Polygon') {
            totalVertices += feature.geometry.coordinates[0].length - 1; // Excluir último punto duplicado
        }
    });
    
    info.innerHTML = `
        <strong>Total:</strong> ${features.length} geometrías, ${totalVertices} vértices 
        (${puntos} puntos, ${lineas} líneas, ${poligonos} polígonos)
    `;
    
    // Guardar features y elevaciones para usar en la descarga
    window.csvFeaturesPreview = features;
    window.csvElevacionesPreview = { coordenadasMap, elevaciones };
    
    actualizarProgreso(100, 'Completado');
    
    // Ocultar loading y mostrar overlay
    setTimeout(() => {
        ocultarCargando();
        overlay.style.display = 'block';
        
        // Agregar animación
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
    }, 500);
};

const crearDatosTablaConElevaciones = (features, coordenadasMap, elevaciones) => {
    const datos = [];
    
    features.forEach((feature, featureIndex) => {
        const geometry = feature.geometry;
        const geometryId = featureIndex + 1;
        let tipo = '';
        
        // Determinar tipo en español
        if (geometry.type === 'Point') {
            tipo = 'Punto';
        } else if (geometry.type === 'LineString') {
            tipo = 'Línea';
        } else if (geometry.type === 'Polygon') {
            tipo = 'Polígono';
        }
        
        if (geometry.type === 'Point') {
            const [lng, lat] = geometry.coordinates;
            const utm = convertirLatLngAutm(lat, lng);
            const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
            const elevacion = elevaciones[coordenadasMap.get(key)] || 0;
            
            datos.push([
                geometryId,                        // #
                tipo,                              // Tipo
                1,                                 // Vértice
                lat.toFixed(5),                    // Latitud
                lng.toFixed(5),                    // Longitud
                Math.round(elevacion),             // Elevación
                parseFloat(utm.easting).toFixed(2), // UTMX
                parseFloat(utm.northing).toFixed(2), // UTMY
                utm.zone,                          // Zona UTM
                '-'                                // Distancia (N/A para puntos)
            ]);
            
        } else if (geometry.type === 'LineString') {
            const coords = geometry.coordinates;
            
            coords.forEach((coord, vertexIndex) => {
                const [lng, lat] = coord;
                const utm = convertirLatLngAutm(lat, lng);
                const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
                const elevacion = elevaciones[coordenadasMap.get(key)] || 0;
                
                // Calcular distancia al vértice anterior
                let distancia = '-';
                if (vertexIndex > 0) {
                    const prevCoord = coords[vertexIndex - 1];
                    const prevLatLng = L.latLng(prevCoord[1], prevCoord[0]);
                    const currentLatLng = L.latLng(lat, lng);
                    distancia = prevLatLng.distanceTo(currentLatLng).toFixed(2);
                }
                
                datos.push([
                    geometryId,                        // #
                    tipo,                              // Tipo
                    vertexIndex + 1,                   // Vértice
                    lat.toFixed(5),                    // Latitud
                    lng.toFixed(5),                    // Longitud
                    Math.round(elevacion),             // Elevación
                    parseFloat(utm.easting).toFixed(2), // UTMX
                    parseFloat(utm.northing).toFixed(2), // UTMY
                    utm.zone,                          // Zona UTM
                    distancia                          // Distancia al vértice anterior
                ]);
            });
            
        } else if (geometry.type === 'Polygon') {
            const coords = geometry.coordinates[0]; // Solo anillo exterior
            
            // Para polígonos, excluir el último punto que es igual al primero
            const vertices = coords.slice(0, -1);
            
            vertices.forEach((coord, vertexIndex) => {
                const [lng, lat] = coord;
                const utm = convertirLatLngAutm(lat, lng);
                const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
                const elevacion = elevaciones[coordenadasMap.get(key)] || 0;
                
                // Calcular distancia al vértice anterior (o al último para cerrar el polígono)
                let distancia = '-';
                if (vertexIndex > 0) {
                    const prevCoord = vertices[vertexIndex - 1];
                    const prevLatLng = L.latLng(prevCoord[1], prevCoord[0]);
                    const currentLatLng = L.latLng(lat, lng);
                    distancia = prevLatLng.distanceTo(currentLatLng).toFixed(2);
                } else if (vertices.length > 1) {
                    // Para el primer vértice, calcular distancia al último (cierre del polígono)
                    const lastCoord = vertices[vertices.length - 1];
                    const lastLatLng = L.latLng(lastCoord[1], lastCoord[0]);
                    const currentLatLng = L.latLng(lat, lng);
                    distancia = currentLatLng.distanceTo(lastLatLng).toFixed(2);
                }
                
                datos.push([
                    geometryId,                        // #
                    tipo,                              // Tipo
                    vertexIndex + 1,                   // Vértice
                    lat.toFixed(5),                    // Latitud
                    lng.toFixed(5),                    // Longitud
                    Math.round(elevacion),             // Elevación
                    parseFloat(utm.easting).toFixed(2), // UTMX
                    parseFloat(utm.northing).toFixed(2), // UTMY
                    utm.zone,                          // Zona UTM
                    distancia                          // Distancia entre vértices
                ]);
            });
        }
    });
    
    return datos;
};

const crearDatosTabla = (features) => {
    const datos = [];
    
    features.forEach((feature, featureIndex) => {
        const geometry = feature.geometry;
        const geometryId = featureIndex + 1;
        let tipo = '';
        
        // Determinar tipo en español
        if (geometry.type === 'Point') {
            tipo = 'Punto';
        } else if (geometry.type === 'LineString') {
            tipo = 'Línea';
        } else if (geometry.type === 'Polygon') {
            tipo = 'Polígono';
        }
        
        if (geometry.type === 'Point') {
            const [lng, lat] = geometry.coordinates;
            const utm = convertirLatLngAutm(lat, lng);
            
            datos.push([
                geometryId,                        // #
                tipo,                              // Tipo
                1,                                 // Vértice
                lat.toFixed(5),                    // Latitud
                lng.toFixed(5),                    // Longitud
                0,                                 // Elevación (placeholder)
                parseFloat(utm.easting).toFixed(2), // UTMX
                parseFloat(utm.northing).toFixed(2), // UTMY
                utm.zone,                          // Zona UTM
                '-'                                // Distancia (N/A para puntos)
            ]);
            
        } else if (geometry.type === 'LineString') {
            const coords = geometry.coordinates;
            
            coords.forEach((coord, vertexIndex) => {
                const [lng, lat] = coord;
                const utm = convertirLatLngAutm(lat, lng);
                
                // Calcular distancia al vértice anterior
                let distancia = '-';
                if (vertexIndex > 0) {
                    const prevCoord = coords[vertexIndex - 1];
                    const prevLatLng = L.latLng(prevCoord[1], prevCoord[0]);
                    const currentLatLng = L.latLng(lat, lng);
                    distancia = prevLatLng.distanceTo(currentLatLng).toFixed(2);
                }
                
                datos.push([
                    geometryId,                        // #
                    tipo,                              // Tipo
                    vertexIndex + 1,                   // Vértice
                    lat.toFixed(5),                    // Latitud
                    lng.toFixed(5),                    // Longitud
                    0,                                 // Elevación (placeholder)
                    parseFloat(utm.easting).toFixed(2), // UTMX
                    parseFloat(utm.northing).toFixed(2), // UTMY
                    utm.zone,                          // Zona UTM
                    distancia                          // Distancia al vértice anterior
                ]);
            });
            
        } else if (geometry.type === 'Polygon') {
            const coords = geometry.coordinates[0]; // Solo anillo exterior
            
            // Para polígonos, excluir el último punto que es igual al primero
            const vertices = coords.slice(0, -1);
            
            vertices.forEach((coord, vertexIndex) => {
                const [lng, lat] = coord;
                const utm = convertirLatLngAutm(lat, lng);
                
                // Calcular distancia al vértice anterior (o al último para cerrar el polígono)
                let distancia = '-';
                if (vertexIndex > 0) {
                    const prevCoord = vertices[vertexIndex - 1];
                    const prevLatLng = L.latLng(prevCoord[1], prevCoord[0]);
                    const currentLatLng = L.latLng(lat, lng);
                    distancia = prevLatLng.distanceTo(currentLatLng).toFixed(2);
                } else if (vertices.length > 1) {
                    // Para el primer vértice, calcular distancia al último (cierre del polígono)
                    const lastCoord = vertices[vertices.length - 1];
                    const lastLatLng = L.latLng(lastCoord[1], lastCoord[0]);
                    const currentLatLng = L.latLng(lat, lng);
                    distancia = currentLatLng.distanceTo(lastLatLng).toFixed(2);
                }
                
                datos.push([
                    geometryId,                        // #
                    tipo,                              // Tipo
                    vertexIndex + 1,                   // Vértice
                    lat.toFixed(5),                    // Latitud
                    lng.toFixed(5),                    // Longitud
                    0,                                 // Elevación (placeholder)
                    parseFloat(utm.easting).toFixed(2), // UTMX
                    parseFloat(utm.northing).toFixed(2), // UTMY
                    utm.zone,                          // Zona UTM
                    distancia                          // Distancia entre vértices
                ]);
            });
        }
    });
    
    return datos;
};

const cerrarPreviewCSV = () => {
    const overlay = document.getElementById('csvPreviewOverlay');
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
};

const descargarCSVDesdePreview = () => {
    const features = window.csvFeaturesPreview;
    const elevacionesData = window.csvElevacionesPreview;
    if (!features) return;
    
    // Crear contenido CSV completo con elevaciones
    let csvContent = crearContenidoCSV(features, elevacionesData);
    
    // Crear archivo CSV y descargarlo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "geometrias_dibujadas_con_elevaciones.csv";
    link.click();
    
    // Cerrar preview
    cerrarPreviewCSV();
    
    mostrarMensaje(`CSV exportado con ${features.length} geometrías y datos de elevación`, 'success');
};







// Asociar eventos a los botones de exportación
document.getElementById("exportGeoJSON").addEventListener("click", exportarGeoJSON);
document.getElementById("exportKML").addEventListener("click", exportarKML);
document.getElementById("exportCSV").addEventListener("click", exportarCSV);

// Asociar eventos a los botones de la previsualización CSV
document.getElementById("csvPreviewClose").addEventListener("click", cerrarPreviewCSV);
document.getElementById("csvPreviewCancel").addEventListener("click", cerrarPreviewCSV);
document.getElementById("csvPreviewDownload").addEventListener("click", descargarCSVDesdePreview);

// Cerrar preview al hacer clic en el overlay
document.getElementById("csvPreviewOverlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
        cerrarPreviewCSV();
    }
});

// Configurar eventos de limpieza cuando la app se inicialice
const configurarEventosLimpieza = () => {
    const botonLimpiar = document.getElementById("clearGeometrias");
    if (botonLimpiar) {
        botonLimpiar.addEventListener("click", () => {
            // Verificar que la función esté disponible
            if (typeof window.limpiarGeometrias === "function") {
                window.limpiarGeometrias();
            } else {
                console.error("Error: La función limpiarGeometrias no está disponible.");
                if (typeof mostrarMensaje === 'function') {
                    mostrarMensaje("Error: Función de limpieza no disponible", 'error');
                }
            }
        });
    }
};

// Hacer la función accesible globalmente
window.configurarEventosLimpieza = configurarEventosLimpieza;



