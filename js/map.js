// Función para limpiar geometrías - se define después de la inicialización
let limpiarGeometrias = null;










const inicializarMapa = () => {
    const map = L.map('map').setView([-3.992906, -79.203560], 10);
    window.map = map;

    // Grupo para capas cargadas desde archivos (GeoJSON, KML, SHP)
    window.grupoCapasCargadas = L.layerGroup().addTo(map);


    const baseMaps = {
        "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '© OpenStreetMap'
        }),
        "Google Satélite": L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            attribution: '© Google Maps'
        }),
        "Google Híbrido": L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            attribution: '© Google Maps'
        }),
        "ESRI Satélite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 18,
            attribution: '© ESRI & Contributors'
        })
    };

    baseMaps["Google Híbrido"].addTo(map);
    L.control.layers(baseMaps).addTo(map);
    
    // Agregar controles de dibujo de Geoman
    map.pm.addControls({
        position: 'topleft',
        drawCircle: true,
        drawMarker: true,
        drawPolyline: true,
        drawPolygon: true,
        drawRectangle: true,
        editMode: true,
        dragMode: true,
        cutPolygon: false,
        removalMode: true
    });

    // === SISTEMA DE MEDIDAS EN TIEMPO REAL ===
    let tooltipMedidas = null;
    let currentDrawingShape = null;
    let isDrawing = false;
    let drawingPoints = [];
    let currentLayer = null;

    // Función para crear/mostrar tooltip
    const mostrarTooltipMedidas = (latlng, contenido) => {
        if (!tooltipMedidas) {
            tooltipMedidas = L.tooltip({
                permanent: true,
                direction: 'top',
                className: 'tooltip-medidas',
                offset: [0, -10]
            });
        }
        
        tooltipMedidas.setLatLng(latlng)
            .setContent(contenido)
            .addTo(map);
    };

    // Función para calcular medidas dinámicas
    const calcularMedidasDinamicas = (mouseLatLng) => {
        if (!isDrawing || !currentLayer) return "🎯 Iniciando dibujo...";
        
        let contenido = '';
        
        if (currentDrawingShape === 'Line') {
            // Para líneas, obtener puntos del workingLayer
            let totalDistance = 0;
            let layerPoints = [];
            
            try {
                // Intentar obtener los puntos del layer actual
                if (currentLayer._latlngs && currentLayer._latlngs.length > 0) {
                    layerPoints = currentLayer._latlngs;
                }
                
                // Calcular distancia entre puntos existentes
                for (let i = 1; i < layerPoints.length; i++) {
                    totalDistance += layerPoints[i-1].distanceTo(layerPoints[i]);
                }
                
                // Agregar distancia desde el último punto al cursor
                if (layerPoints.length > 0) {
                    const ultimoPunto = layerPoints[layerPoints.length - 1];
                    totalDistance += ultimoPunto.distanceTo(mouseLatLng);
                }
                
                contenido = `📏 Distancia: ${totalDistance.toFixed(2)} m`;
                if (totalDistance >= 1000) {
                    contenido += ` (${(totalDistance/1000).toFixed(3)} km)`;
                }
            } catch (err) {
                contenido = "📏 Calculando distancia...";
            }
            
        } else if (currentDrawingShape === 'Polygon') {
            // Para polígonos, mostrar área y distancias de lados
            try {
                let layerPoints = [];
                
                // Debug: verificar estructura de datos (comentado en producción)
                // if (Math.random() < 0.1) { // Mostrar ocasionalmente
                //     console.log("🔍 Polígono debug:", {
                //         layer: currentLayer,
                //         _latlngs: currentLayer?._latlngs,
                //         _latlngs0: currentLayer?._latlngs?.[0],
                //         type: currentLayer?.constructor?.name
                //     });
                // }
                
                // Intentar diferentes formas de acceder a los puntos
                if (currentLayer._latlngs) {
                    if (Array.isArray(currentLayer._latlngs) && currentLayer._latlngs.length > 0) {
                        // Caso 1: Array directo de puntos
                        if (currentLayer._latlngs[0] && currentLayer._latlngs[0].lat) {
                            layerPoints = currentLayer._latlngs;
                        } 
                        // Caso 2: Array anidado [[puntos]]
                        else if (currentLayer._latlngs[0] && Array.isArray(currentLayer._latlngs[0])) {
                            layerPoints = currentLayer._latlngs[0];
                        }
                        // Caso 3: Array muy anidado [[[puntos]]]
                        else if (currentLayer._latlngs[0] && currentLayer._latlngs[0][0] && Array.isArray(currentLayer._latlngs[0][0])) {
                            layerPoints = currentLayer._latlngs[0][0];
                        }
                    }
                }
                
                // Debug: puntos encontrados (comentado en producción)
                // console.log("🔍 Puntos encontrados:", layerPoints.length, layerPoints);
                
                if (layerPoints.length >= 1) {
                    // Agregar el punto del cursor para calcular el polígono temporal
                    const allPoints = [...layerPoints, mouseLatLng];
                    
                    // Calcular área si hay al menos 3 puntos
                    if (allPoints.length >= 3) {
                        const coords = allPoints.map(p => [p.lng, p.lat]);
                        coords.push(coords[0]); // Cerrar el polígono
                        
                        const polygon = turf.polygon([coords]);
                        const area = turf.area(polygon);
                        
                        contenido = `📐 Área: ${area.toFixed(2)} m²`;
                        if (area >= 10000) {
                            contenido += ` (${(area/10000).toFixed(4)} ha)`;
                        }
                        contenido += '\n';
                    }
                    
                    // Mostrar distancias de los lados existentes
                    if (layerPoints.length >= 1) {
                        contenido += '📏 Lados:\n';
                        
                        // Distancias entre puntos consecutivos
                        for (let i = 1; i < layerPoints.length; i++) {
                            const distance = layerPoints[i-1].distanceTo(layerPoints[i]);
                            contenido += `L${i}: ${distance.toFixed(1)}m `;
                        }
                        
                        // Distancia desde el último punto al cursor
                        if (layerPoints.length > 0) {
                            const lastPoint = layerPoints[layerPoints.length - 1];
                            const cursorDistance = lastPoint.distanceTo(mouseLatLng);
                            contenido += `L${layerPoints.length + 1}: ${cursorDistance.toFixed(1)}m`;
                        }
                        
                        // Si hay más de un punto, mostrar distancia de cierre
                        if (layerPoints.length >= 2) {
                            const closeDistance = layerPoints[0].distanceTo(mouseLatLng);
                            contenido += `\n🔄 Cierre: ${closeDistance.toFixed(1)}m`;
                        }
                    }
                } else {
                    contenido = "📐 Coloca el primer punto...";
                }
            } catch (err) {
                console.warn("Error en polígono:", err);
                contenido = "📐 Calculando polígono...";
            }
            
        } else if (currentDrawingShape === 'Circle') {
            // Para círculos, SOLO usar drawingPoints para determinar si se colocó el centro
            try {
                // SOLO confiar en drawingPoints que se llena desde pm:centerplaced
                if (drawingPoints.length > 0) {
                    // Centro ya colocado, calcular medidas
                    const center = drawingPoints[0];
                    const radius = center.distanceTo(mouseLatLng);
                    
                    if (radius > 0) {
                        const area = Math.PI * radius * radius;
                        contenido = `⭕ Radio: ${radius.toFixed(2)} m`;
                        contenido += `\n📐 Área: ${area.toFixed(2)} m²`;
                        if (area >= 10000) {
                            contenido += ` (${(area/10000).toFixed(4)} ha)`;
                        }
                    } else {
                        contenido = "⭕ Mueve para establecer radio...";
                    }
                } else {
                    // Centro no colocado aún - NO calcular medidas
                    contenido = "⭕ Haz clic para colocar el centro";
                }
            } catch (err) {
                contenido = "⭕ Preparando círculo...";
            }
        } else if (currentDrawingShape === 'CircleMarker') {
            // Para circle markers, solo mostrar instrucción de colocación (sin medidas)
            contenido = "📍 Haz clic para colocar el marcador circular";
        } else if (currentDrawingShape === 'Rectangle') {
            // Para rectángulos, calcular área dinámicamente
            try {
                if (currentLayer._latlngs && currentLayer._latlngs[0] && currentLayer._latlngs[0].length >= 2) {
                    // Obtener las esquinas del rectángulo
                    const bounds = currentLayer._bounds || currentLayer.getBounds();
                    
                    if (bounds) {
                        // Calcular dimensiones usando las esquinas
                        const corner1 = bounds.getSouthWest();
                        const corner2 = bounds.getNorthEast();
                        
                        // Calcular ancho y alto
                        const width = corner1.distanceTo(L.latLng(corner1.lat, corner2.lng));
                        const height = corner1.distanceTo(L.latLng(corner2.lat, corner1.lng));
                        const area = width * height;
                        const perimeter = 2 * (width + height);
                        
                        contenido = `🟦 Rectángulo:\n`;
                        contenido += `📐 Área: ${area.toFixed(2)} m²`;
                        if (area >= 10000) {
                            contenido += ` (${(area/10000).toFixed(4)} ha)`;
                        }
                        contenido += `\n📏 Ancho: ${width.toFixed(1)}m`;
                        contenido += `\n📏 Alto: ${height.toFixed(1)}m`;
                        contenido += `\n⭕ Perímetro: ${perimeter.toFixed(1)}m`;
                    } else {
                        contenido = "🟦 Estableciendo rectángulo...";
                    }
                } else {
                    contenido = "🟦 Arrastra para crear rectángulo...";
                }
            } catch (err) {
                contenido = "🟦 Calculando rectángulo...";
            }
        } else {
            contenido = "🎯 Dibujando...";
        }
        
        return contenido;
    };

    // === EVENTOS DE GEOMAN PARA MEDIDAS EN TIEMPO REAL ===
    
    // Debug: verificar que Geoman esté disponible (comentado en producción)
    // console.log("🔍 Geoman disponible:", !!map.pm);
    
    // Test simple de evento (comentado en producción)
    // map.on('pm:create', (e) => {
    //     console.log("✅ Geometría creada:", e.shape);
    // });
    
    // Cuando comienza el dibujo
    map.on('pm:drawstart', (e) => {
        // console.log("🎨 Iniciando dibujo:", e.shape); // Debug comentado
        currentDrawingShape = e.shape;
        isDrawing = true;
        drawingPoints = [];
        currentLayer = e.workingLayer;
        
        // Debug específico para polígonos y rectángulos (comentado en producción)
        // if (e.shape === 'Polygon' || e.shape === 'Rectangle') {
        //     console.log("🔍 Debug específico:", e.shape, "WorkingLayer:", e.workingLayer);
        // }
        
        // Mostrar tooltip inicial
        const mousePos = map.getCenter();
        mostrarTooltipMedidas(mousePos, "🎯 Iniciando dibujo...");
        
        // Log de inicio (comentado en producción)
        // console.log("✅ Sistema de medidas activado para:", e.shape);
    });

    // Cuando se añade un vértice o se coloca un punto
    map.on('pm:vertexadded', (e) => {
        if (!isDrawing) return;
        
        console.log("📍 Vértice añadido, calculando medidas...");
        drawingPoints.push(e.latlng);
        
        // Actualizar tooltip con medidas actuales
        const contenido = calcularMedidasDinamicas(e.latlng);
        mostrarTooltipMedidas(e.latlng, contenido);
    });

    // Para círculos - cuando se coloca el centro
    map.on('pm:centerplaced', (e) => {
        if (currentDrawingShape === 'Circle') {
            // console.log("🎯 Centro del círculo colocado en:", e.latlng); // Debug comentado
            drawingPoints = [e.latlng]; // Guardar el centro
            
            // Actualizar el tooltip para mostrar que ahora se puede establecer el radio
            if (tooltipMedidas) {
                tooltipMedidas.setContent("⭕ Mueve para establecer radio...");
            }
        }
    });

    // Alternativa: detectar click durante dibujo de círculo
    map.on('click', (e) => {
        if (isDrawing && currentDrawingShape === 'Circle' && drawingPoints.length === 0) {
            // console.log("🎯 Click detectado durante círculo:", e.latlng); // Debug comentado
            drawingPoints = [e.latlng]; // Guardar el centro del círculo
            
            // Actualizar el tooltip
            if (tooltipMedidas) {
                tooltipMedidas.setContent("⭕ Mueve para establecer radio...");
            }
        }
    });

    // Cuando termina el dibujo
    map.on('pm:drawend', (e) => {
        // console.log("🎨 Dibujo terminado"); // Debug comentado
        isDrawing = false;
        currentDrawingShape = null;
        drawingPoints = [];
        currentLayer = null;
        
        // Remover tooltip de medidas
        if (tooltipMedidas) {
            map.removeLayer(tooltipMedidas);
            tooltipMedidas = null;
            // console.log("🗑️ Tooltip removido"); // Debug comentado
        }
    });

    // Seguir el cursor durante el dibujo y actualizar medidas
    map.on('mousemove', (e) => {
        if (!isDrawing || !tooltipMedidas) return;

        // Debug del layer muy ocasionalmente (comentado en producción)
        // if (Math.random() < 0.001) {
        //     console.log("🔍 Layer debug:", currentDrawingShape, currentLayer?.constructor?.name);
        // }

        // Actualizar posición del tooltip
        tooltipMedidas.setLatLng(e.latlng);
        
        // Calcular y mostrar medidas dinámicas
        const contenido = calcularMedidasDinamicas(e.latlng);
        tooltipMedidas.setContent(contenido);
    });

    // === FUNCIÓN HELPER PARA OBTENER INFO UTM CON FALLBACK ===
    const obtenerInfoUTMConFallback = (lat, lng) => {
        if (typeof obtenerInfoZonaUTM === 'function') {
            return obtenerInfoUTMConFallback(lat, lng);
        } else {
            // Fallback al sistema básico
            const zona = Math.floor((lng + 180) / 6) + 1;
            const hemisferio = lat >= 0 ? 'N' : 'S';
            const epsgCode = lat >= 0 ? `EPSG:326${zona}` : `EPSG:327${zona}`;
            const projDef = `+proj=utm +zone=${zona} ${hemisferio === 'S' ? '+south' : ''} +datum=WGS84 +units=m +no_defs`;
            const utmCoords = proj4(projDef, [lng, lat]);
            
            return {
                easting: utmCoords[0],
                northing: utmCoords[1],
                zoneString: `${zona}${hemisferio}`,
                epsg: epsgCode,
                zone: zona,
                hemisphere: hemisferio,
                esEcuador: false,
                esGalapagos: false,
                recomendacion: `UTM Zona ${zona} ${hemisferio === 'S' ? 'Sur' : 'Norte'}`
            };
        }
    };

    // === FUNCIÓN AUXILIAR PARA POPUP DE MARCADORES - MEJORADO CON CRS REGIONAL ===
    const crearPopupMarcador = (latlng, tipoMarcador = 'Marcador') => {
        const infoUTM = obtenerInfoUTMConFallback(latlng.lat, latlng.lng);
        const dms = convertirAFormatoGoogleMaps(latlng.lat, latlng.lng);
        const copyId = `copy-marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Determinar tipo de marcador
        const tipo = tipoMarcador === 'CircleMarker' ? 'Marcador Circular' : 'Marcador';
        const icono = tipoMarcador === 'CircleMarker' ? '🔵' : '📍';
        
        // Información contextual regional
        let contextoRegional = '';
        if (infoUTM.esEcuador) {
            contextoRegional = infoUTM.esGalapagos ? 'Islas Galápagos' : 'Ecuador Continental';
        }
        
        const textoCopia = `Tipo\t${tipo} Dibujado
Latitud (DMS)\t${dms.latitude}
Longitud (DMS)\t${dms.longitude}
Latitud (Decimal)\t${latlng.lat.toFixed(6)}
Longitud (Decimal)\t${latlng.lng.toFixed(6)}
Sistema Geográfico\tWGS84 (EPSG:4326)
UTM Zona\t${infoUTM.zoneString}
UTM Este\t${infoUTM.easting.toFixed(2)}
UTM Norte\t${infoUTM.northing.toFixed(2)}
Sistema UTM\t${infoUTM.epsg}
Región\t${contextoRegional || 'Internacional'}
CRS Recomendado\t${infoUTM.recomendacion}`;

        return `
            <div style="font-family: monospace; font-size: 13px; max-width: 280px;">
                <div style="background: #2563eb; color: white; padding: 8px; margin: -8px -8px 12px -8px; border-radius: 4px 4px 0 0; display: flex; justify-content: space-between; align-items: center;">
                    <b>${icono} ${tipo} Dibujado</b>
                    <button id="${copyId}" onclick="copiarAlPortapapeles(\`${textoCopia.replace(/`/g, '\\`')}\`, '${copyId}')" 
                            style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;"
                            title="Copiar coordenadas">
                        <i class="fas fa-copy"></i> Copiar
                    </button>
                </div>
                <b>🌐 Coordenadas Geográficas:</b><br>
                <b>DMS:</b> ${dms.format}<br>
                <b>Decimal:</b> ${latlng.lat.toFixed(6)}°, ${latlng.lng.toFixed(6)}°<br>
                <b>Sistema:</b> WGS84 (EPSG:4326)<br><br>
                <b>🗺️ Coordenadas UTM:</b><br>
                <b>Zona:</b> ${infoUTM.zoneString}<br>
                <b>Este:</b> ${infoUTM.easting.toFixed(2)} m<br>
                <b>Norte:</b> ${infoUTM.northing.toFixed(2)} m<br>
                <b>Sistema:</b> ${infoUTM.epsg}
            </div>
        `;
    };

    // === EVENTOS PARA GEOMETRÍAS COMPLETADAS ===
    map.on('pm:create', (e) => {
        const layer = e.layer;
        
        // Marcar explícitamente como geometría dibujada
        layer._esDibujada = true;
        if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
            // console.log("Marcador agregado:", layer.constructor.name); // Debug comentado
            
            // Obtener coordenadas del marcador y crear popup
            const latlng = layer.getLatLng();
            const tipoMarcador = layer instanceof L.CircleMarker ? 'CircleMarker' : 'Marcador';
            const popupContent = crearPopupMarcador(latlng, tipoMarcador);
            
            // Asignar popup al marcador
            layer.bindPopup(popupContent);
            
            // Actualizar popup cuando se edite o mueva el marcador
            layer.on('pm:edit', () => {
                const newLatlng = layer.getLatLng();
                const updatedContent = crearPopupMarcador(newLatlng, tipoMarcador);
                layer.setPopupContent(updatedContent);
            });
            
            layer.on('pm:dragend', () => {
                const newLatlng = layer.getLatLng();
                const updatedContent = crearPopupMarcador(newLatlng, tipoMarcador);
                layer.setPopupContent(updatedContent);
            });
        } else {
            calcularMedidas(layer);
            layer.on('pm:edit', () => calcularMedidas(layer));
            layer.on('pm:dragend', () => calcularMedidas(layer));
        }
    });

    // Mostrar coordenadas en tiempo real (Lat/Lon, UTM y EPSG) con debounce - MEJORADO CON CRS REGIONAL
    const actualizarCoordenadas = debounce((e) => {
        const { lat, lng } = e.latlng;
        
        // Usar el nuevo sistema de proyecciones regional con fallback
        const infoUTM = obtenerInfoUTMConFallback(lat, lng);

        document.getElementById("latlon").innerText = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
        document.getElementById("utm").innerText = `UTM: Zona ${infoUTM.zoneString}, Este ${infoUTM.easting.toFixed(2)}, Norte ${infoUTM.northing.toFixed(2)}`;
        
        // Mostrar información contextual sobre el sistema de coordenadas
        let epsgText = infoUTM.epsg;
        if (infoUTM.esEcuador) {
            epsgText += infoUTM.esGalapagos ? ' (Galápagos)' : ' (Ecuador)';
        }
        document.getElementById("epsg").innerText = epsgText;
        
        // Actualizar status con información regional
        let status = 'Explorando';
        if (infoUTM.esEcuador) {
            status += infoUTM.esGalapagos ? ' - Galápagos' : ' - Ecuador';
        }
        document.getElementById('mapStatus').textContent = status;
    }, 100); // Debounce de 100ms

    map.on("mousemove", actualizarCoordenadas);

    document.getElementById("tipoCoordenadas").addEventListener("change", (e) => {
        const tipo = e.target.value;
        
        // Ocultar todos los inputs primero
        document.getElementById("inputLatLon").style.display = "none";
        document.getElementById("inputDMS").style.display = "none";
        document.getElementById("inputUTM").style.display = "none";
        
        // Mostrar el input correspondiente
        if (tipo === "latlon") {
            document.getElementById("inputLatLon").style.display = "block";
        } else if (tipo === "dms") {
            document.getElementById("inputDMS").style.display = "block";
        } else if (tipo === "utm") {
            document.getElementById("inputUTM").style.display = "block";
        }
    });
    
    document.getElementById("btnIr").addEventListener("click", () => {
        const tipo = document.getElementById("tipoCoordenadas").value;
        
        let lat, lng;
        
        try {
            if (tipo === "latlon") {
                lat = parseFloat(document.getElementById("latInput").value);
                lng = parseFloat(document.getElementById("lonInput").value);
                
                // Validar rangos de latitud y longitud
                if (lat < -90 || lat > 90) {
                    throw new Error("La latitud debe estar entre -90 y 90 grados");
                }
                if (lng < -180 || lng > 180) {
                    throw new Error("La longitud debe estar entre -180 y 180 grados");
                }
            } else if (tipo === "dms") {
                const dmsInput = document.getElementById("dmsInput").value.trim();
                
                if (dmsInput === "") {
                    throw new Error("Por favor, ingrese coordenadas en formato DMS");
                }
                
                // Parsear coordenadas DMS usando la función definida en tools.js
                const coords = parsearCoordenadasDMS(dmsInput);
                lat = coords.lat;
                lng = coords.lng;
            } else {
                const este = parseFloat(document.getElementById("utmEste").value);
                const norte = parseFloat(document.getElementById("utmNorte").value);
                const zona = parseInt(document.getElementById("utmZona").value);
                const hemisferio = document.getElementById("utmHemisferio").value;
                
                // Validar valores UTM
                if (zona < 1 || zona > 60) {
                    throw new Error("La zona UTM debe estar entre 1 y 60");
                }
                if (este < 160000 || este > 840000) {
                    throw new Error("El valor Este UTM está fuera del rango válido");
                }
                if (norte < 0 || norte > 10000000) {
                    throw new Error("El valor Norte UTM está fuera del rango válido");
                }
                
                // Convertir UTM a Lat/Lon
                const projDef = `+proj=utm +zone=${zona} ${hemisferio === "S" ? "+south" : ""} +datum=WGS84 +units=m +no_defs`;
                const [lon, latConverted] = proj4(projDef, "WGS84", [este, norte]);
                lat = latConverted;
                lng = lon;
            }
        
            if (!isNaN(lat) && !isNaN(lng)) {
                // Convertir las coordenadas ingresadas a UTM usando el sistema regional
                const infoUTM = obtenerInfoUTMConFallback(lat, lng);
                const dms = convertirAFormatoGoogleMaps(lat, lng);
                
                // Crear texto para Excel (separado por tabulaciones)
                const copyId = `copy-nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const textoCopia = `Tipo\tCoordenada de Navegación
Latitud (DMS)\t${dms.latitude}
Longitud (DMS)\t${dms.longitude}
Latitud (Decimal)\t${lat.toFixed(6)}
Longitud (Decimal)\t${lng.toFixed(6)}
Sistema Geográfico\tWGS84 (EPSG:4326)
UTM Zona\t${infoUTM.zoneString}
UTM Este\t${infoUTM.easting.toFixed(2)}
UTM Norte\t${infoUTM.northing.toFixed(2)}
Sistema UTM\t${infoUTM.epsg}`;
        
                // Crear el contenido del popup homogenizado
                const contenidoNavegacion = `
                    <div class="popup-info-box">
                        <b>🌐 Coordenadas Geográficas:</b><br>
                        <b>DMS:</b> ${dms.format}<br>
                        <b>Decimal:</b> ${lat.toFixed(6)}°, ${lng.toFixed(6)}°<br>
                        <b>Sistema:</b> WGS84 (EPSG:4326)<br><br>
                        <b>🗺️ Coordenadas UTM:</b><br>
                        <b>Zona:</b> ${infoUTM.zoneString}<br>
                        <b>Este:</b> ${infoUTM.easting.toFixed(2)} m<br>
                        <b>Norte:</b> ${infoUTM.northing.toFixed(2)} m<br>
                        <b>Sistema:</b> ${infoUTM.epsg}
                    </div>
                `;
                
                const popupContent = window.crearPopupUniversal('🧭 Coordenada de Navegación', contenidoNavegacion, true, textoCopia);
        
                // Centrar mapa y agregar marcador con el popup
                map.setView([lat, lng], 15);
                L.marker([lat, lng]).addTo(map).bindPopup(popupContent).openPopup();
            } else {
                throw new Error("Las coordenadas ingresadas no son válidas");
            }
        } catch (error) {
            console.error("Error en validación de coordenadas:", error);
            alert(`Error: ${error.message}`);
        }
    });

    // Búsqueda de direcciones con debounce y feedback visual
    const buscarDireccion = debounce(() => {
        const direccion = document.getElementById("direccionInput").value;
        
        if (direccion.trim() === "") {
            mostrarMensaje("Por favor, ingrese una dirección.", 'warning');
            return;
        }
    
        mostrarCargando();
        actualizarProgreso(0, 'Buscando dirección...');
        
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}`;
    
        fetch(url)
            .then(response => {
                actualizarProgreso(50, 'Procesando resultados...');
                return response.json();
            })
            .then(data => {
                actualizarProgreso(100, 'Completado');
                
                if (data.length === 0) {
                    ocultarCargando();
                    mostrarMensaje("Dirección no encontrada. Intente con otra.", 'warning');
                    return;
                }
    
                // Obtener la primera coincidencia
                const { lat, lon, display_name } = data[0];
    
                // Convertir Lat/Lon a UTM usando el sistema regional
                const infoUTM = obtenerInfoUTMConFallback(parseFloat(lat), parseFloat(lon));
                const dms = convertirAFormatoGoogleMaps(parseFloat(lat), parseFloat(lon));
                
                // Crear texto para Excel (separado por tabulaciones)
                const copyId = `copy-search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const textoCopia = `Tipo\tDirección Encontrada
Dirección\t${display_name}
Latitud (DMS)\t${dms.latitude}
Longitud (DMS)\t${dms.longitude}
Latitud (Decimal)\t${parseFloat(lat).toFixed(6)}
Longitud (Decimal)\t${parseFloat(lon).toFixed(6)}
Sistema Geográfico\tWGS84 (EPSG:4326)
UTM Zona\t${infoUTM.zoneString}
UTM Este\t${infoUTM.easting.toFixed(2)}
UTM Norte\t${infoUTM.northing.toFixed(2)}
Sistema UTM\t${infoUTM.epsg}`;
    
                // Crear contenido del popup homogenizado
                const contenidoDireccion = `
                    <div class="popup-attributes-box">
                        <b>📍 Dirección:</b><br>
                        <span style="font-size: 12px; line-height: 1.3;">${display_name}</span>
                    </div>
                    <div class="popup-info-box">
                        <b>🌐 Coordenadas Geográficas:</b><br>
                        <b>DMS:</b> ${dms.format}<br>
                        <b>Decimal:</b> ${parseFloat(lat).toFixed(6)}°, ${parseFloat(lon).toFixed(6)}°<br>
                        <b>Sistema:</b> WGS84 (EPSG:4326)<br><br>
                        <b>🗺️ Coordenadas UTM:</b><br>
                        <b>Zona:</b> ${infoUTM.zoneString}<br>
                        <b>Este:</b> ${infoUTM.easting.toFixed(2)} m<br>
                        <b>Norte:</b> ${infoUTM.northing.toFixed(2)} m<br>
                        <b>Sistema:</b> ${infoUTM.epsg}
                    </div>
                `;
                
                const popupContent = window.crearPopupUniversal('🔍 Dirección Encontrada', contenidoDireccion, true, textoCopia);
    
                // Mover el mapa y agregar un marcador
                map.setView([lat, lon], 15);
                L.marker([lat, lon]).addTo(map).bindPopup(popupContent).openPopup();
                
                setTimeout(() => {
                    ocultarCargando();
                    mostrarMensaje("Dirección encontrada exitosamente", 'success');
                    // Actualizar status bar
                    document.getElementById('mapStatus').textContent = 'Dirección encontrada';
                }, 500);
            })
            .catch(error => {
                console.error("Error al buscar dirección:", error);
                ocultarCargando();
                mostrarMensaje("Hubo un problema al buscar la dirección. Inténtelo nuevamente.", 'error');
            });
    }, 300); // Debounce de 300ms

    document.getElementById("btnBuscarDireccion").addEventListener("click", buscarDireccion);

    // Autocompletar ejemplo para coordenadas DMS
    document.getElementById("dmsInput").addEventListener("focus", (e) => {
        if (e.target.value.trim() === "") {
            e.target.placeholder = "78°29'20.346\"W  0°20'44.158\"S";
        }
    });

    // Definir la función limpiarGeometrias después de que el mapa esté inicializado
    limpiarGeometrias = () => {
        console.log("🔴 Ejecutando limpieza de geometrías dibujadas...");
        console.log("📋 Estado inicial del mapa:");
        
        // Mostrar estado de todas las capas antes de limpiar
        let totalCapas = 0;
        window.map.eachLayer(() => totalCapas++);
        console.log(`📊 Total de capas en el mapa: ${totalCapas}`);
        
        if (window.grupoCapasCargadas) {
            let capasEnGrupo = 0;
            window.grupoCapasCargadas.eachLayer(() => capasEnGrupo++);
            console.log(`📂 Capas en grupo cargadas: ${capasEnGrupo}`);
        }

        // Verificar que el mapa esté inicializado
        if (!window.map) {
            console.error("❌ Error: El mapa no está inicializado");
            if (typeof mostrarMensaje === 'function') {
                mostrarMensaje("Error: El mapa no está inicializado", 'error');
            }
            return;
        }

        let geometriasEliminadas = 0;
        const capasAEliminar = [];

        window.map.eachLayer(layer => {
            // 🔹 PRIMERA PRIORIDAD: NUNCA eliminar capas base (TileLayer)
            if (layer instanceof L.TileLayer) {
                console.log("🚫 Capa base protegida:", layer);
                return;
            }

            // 🔹 SEGUNDA PRIORIDAD: NUNCA eliminar el propio grupo de capas cargadas
            if (layer === window.grupoCapasCargadas) {
                console.log("🚫 Grupo de capas cargadas protegido");
                return;
            }

            // 🔹 TERCERA PRIORIDAD: NUNCA eliminar capas dentro del grupo de capas cargadas
            if (window.grupoCapasCargadas && window.grupoCapasCargadas.hasLayer(layer)) {
                console.log("🚫 Capa protegida dentro de grupo de capas cargadas:", layer.constructor.name);
                return;
            }

            // 🔹 CUARTA PRIORIDAD: NUNCA eliminar capas que están en el registro de capas cargadas
            if (window.capasCargadas && Object.values(window.capasCargadas).includes(layer)) {
                console.log("🚫 Capa protegida en registro de capas cargadas:", layer.constructor.name);
                return;
            }

            // 🔹 QUINTA PRIORIDAD: NUNCA eliminar si es una capa de archivo cargado (verificar por subcapas)
            let esSubcapaDeArchivo = false;
            if (window.capasCargadas) {
                Object.values(window.capasCargadas).forEach(capaArchivo => {
                    if (capaArchivo && typeof capaArchivo.hasLayer === 'function' && capaArchivo.hasLayer(layer)) {
                        esSubcapaDeArchivo = true;
                        console.log("🚫 Subcapa de archivo protegida:", layer.constructor.name);
                    }
                });
            }
            if (esSubcapaDeArchivo) {
                return;
            }

            // 🔹 NUNCA eliminar controles de Leaflet
            if (layer instanceof L.Control) {
                console.log("🚫 Control de Leaflet protegido");
                return;
            }

            // 🔹 SOLO AHORA: verificar si es una geometría dibujada con Geoman
            if (layer.pm && layer.pm._shape) {
                console.log("🗑️ Geometría dibujada marcada para eliminación:", {
                    tipo: layer.constructor.name,
                    tieneGeoman: !!layer.pm,
                    tieneShape: !!(layer.pm && layer.pm._shape)
                });
                capasAEliminar.push(layer);
                geometriasEliminadas++;
                return;
            }

            // 🔹 Depuración: registrar capas que NO se eliminan
            console.log("🔍 Capa analizada pero NO eliminada:", {
                tipo: layer.constructor.name,
                tieneGeoman: !!layer.pm,
                tieneShape: !!(layer.pm && layer.pm._shape),
                esMarker: layer instanceof L.Marker,
                enGrupo: window.grupoCapasCargadas ? window.grupoCapasCargadas.hasLayer(layer) : false,
                enRegistro: window.capasCargadas ? Object.values(window.capasCargadas).includes(layer) : false
            });
        });

        // Eliminar las capas marcadas en un segundo paso
        capasAEliminar.forEach(layer => {
            try {
                window.map.removeLayer(layer);
                console.log("✅ Geometría eliminada exitosamente");
            } catch (error) {
                console.error("❌ Error al eliminar geometría:", error);
            }
        });

        // Mostrar resumen final
        console.log("📋 Resumen de limpieza:");
        console.log(`🗑️ Geometrías eliminadas: ${geometriasEliminadas}`);
        
        let totalCapasDespues = 0;
        window.map.eachLayer(() => totalCapasDespues++);
        console.log(`📊 Total de capas después: ${totalCapasDespues}`);
        
        if (window.grupoCapasCargadas) {
            let capasEnGrupoDespues = 0;
            window.grupoCapasCargadas.eachLayer(() => capasEnGrupoDespues++);
            console.log(`📂 Capas en grupo después: ${capasEnGrupoDespues}`);
        }

        if (geometriasEliminadas > 0) {
            if (typeof mostrarMensaje === 'function') {
                mostrarMensaje(`Se eliminaron ${geometriasEliminadas} geometrías dibujadas`, 'success');
            }
            const statusElement = document.getElementById('mapStatus');
            if (statusElement) {
                statusElement.textContent = 'Geometrías dibujadas eliminadas';
            }
        } else {
            if (typeof mostrarMensaje === 'function') {
                mostrarMensaje("No hay geometrías dibujadas para eliminar", 'warning');
            }
        }
        
        console.log("✅ Limpieza de geometrías completada");
    };

    // Hacer la función accesible globalmente
    window.limpiarGeometrias = limpiarGeometrias;
 
};

