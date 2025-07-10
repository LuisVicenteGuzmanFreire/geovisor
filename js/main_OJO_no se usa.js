// main.js (versión refactorizada y optimizada)
document.addEventListener("DOMContentLoaded", () => {
    // ============================================
    // 1. Inicialización del mapa y capas base
    // ============================================
    const map = L.map('map').setView([-3.992906, -79.203560], 10);
    window.map = map; // Para que otras funciones puedan acceder al mapa si es necesario
  
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
  
    // Agregar la capa base predeterminada
    baseMaps["Google Híbrido"].addTo(map);
    L.control.layers(baseMaps).addTo(map);
    
    // ============================================
    // 2. Controles de dibujo con Leaflet-Geoman
    // ============================================
    map.pm.addControls({
      position: 'topleft',
      drawMarker: true,
      drawCircleMarker: true,
      drawPolyline: true,
      drawRectangle: true,
      drawPolygon: true,
      drawCircle: true,
      editMode: true,
      dragMode: true,
      cutPolygon: true,
      removalMode: true
    });
  
    // ============================================
    // 3. Funciones utilitarias
    // ============================================
    // Conversión de Lat/Lng a UTM usando proj4, recococe todas las zonas
    const convertirLatLngAutm = (lat, lng) => {
        const zona = Math.floor((lng + 180) / 6) + 1;
        const hemisferio = lat >= 0 ? "N" : "S";
        // Crear la definición dinámica de la proyección UTM
        const projDef = `+proj=utm +zone=${zona} ${hemisferio === "S" ? "+south" : ""} +datum=WGS84 +units=m +no_defs`;
        const utmCoords = proj4(projDef, [lng, lat]);
        
        return {
          easting: utmCoords[0].toFixed(2),
          northing: utmCoords[1].toFixed(2),
          zone: `${zona}${hemisferio}`
        };
      };
  
    // Calcular área (para polígonos) o longitud (para líneas) con Turf.js
    const calcularMedidas = (layer) => {
      // Evitar calcular en marcadores
      if (layer instanceof L.Marker) return;
      const geojson = layer.toGeoJSON();
      if (geojson.geometry.type === "Polygon" || geojson.geometry.type === "MultiPolygon") {
        const area = turf.area(geojson);
        layer.unbindPopup();
        layer.bindPopup(`Área: ${area.toFixed(2)} m²`).openPopup();
      } else if (geojson.geometry.type === "LineString" || geojson.geometry.type === "MultiLineString") {
        const length = turf.length(geojson, { units: "meters" });
        layer.unbindPopup();
        layer.bindPopup(`Longitud: ${length.toFixed(2)} m`).openPopup();
      }
    };
  
    // Mostrar coordenadas en un marcador (Lat/Lng y UTM)
    const mostrarCoordenadas = (marker) => {
      const { lat, lng } = marker.getLatLng();
      const utm = convertirLatLngAutm(lat, lng);
      const popupContent = `
        <b>Lat/Lng:</b> ${lat.toFixed(6)}, ${lng.toFixed(6)}<br>
        <b>UTM:</b> ${utm.easting} m E, ${utm.northing} m N (Zona ${utm.zone})
      `;
      marker.unbindPopup();
      marker.bindPopup(popupContent).openPopup();
    };
  
    // Guardar geometrías en localStorage
    const guardarGeometrias = () => {
      const layers = [];
      map.eachLayer(layer => {
        if (layer.pm && layer.pm._shape) {
          layers.push(layer.toGeoJSON());
        }
      });
      if (layers.length === 0) {
        alert("No hay geometrías para guardar.");
        return;
      }
      localStorage.setItem("geometrias", JSON.stringify(layers));
      alert("Geometrías guardadas correctamente.");
    };
  
    // Cargar geometrías desde localStorage
    const cargarGeometrias = () => {
      const data = localStorage.getItem("geometrias");
      if (!data) {
        alert("No hay geometrías guardadas.");
        return;
      }
      const geojsonData = JSON.parse(data);
      geojsonData.forEach(feature => {
        const layer = L.geoJSON(feature).addTo(map);
        layer.eachLayer(l => {
          l.pm && l.pm.enable();
        });
      });
      alert("Geometrías cargadas correctamente.");
    };
  
    // Descargar geometrías en un archivo GeoJSON con coordenadas UTM
    const descargarGeoJSON = () => {
      const features = [];
      map.eachLayer(layer => {
        if (layer.pm && layer.pm._shape) {
          const geojson = layer.toGeoJSON();
          if (geojson.geometry.type === "Point") {
            const utm = convertirLatLngAutm(geojson.geometry.coordinates[1], geojson.geometry.coordinates[0]);
            geojson.properties = { ...geojson.properties, UTM_E: utm.easting, UTM_N: utm.northing, UTM_Zone: utm.zone };
          } else if (geojson.geometry.type === "LineString" || geojson.geometry.type === "Polygon") {
            geojson.properties = { 
              ...geojson.properties,
              UTM_Coordinates: geojson.geometry.coordinates.map(coord => {
                const utm = convertirLatLngAutm(coord[1], coord[0]);
                return { E: utm.easting, N: utm.northing, Zone: utm.zone };
              })
            };
          }
          features.push(geojson);
        }
      });
      if (features.length === 0) {
        alert("No hay geometrías para descargar.");
        return;
      }
      const geojsonFinal = { type: "FeatureCollection", features };
      const blob = new Blob([JSON.stringify(geojsonFinal, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "geometrias_con_utm.geojson";
      link.click();
    };
  
    // Cargar un archivo GeoJSON en el visor
    const cargarDesdeArchivo = (event) => {
        const file = event.target.files[0];
        if (!file) return;
      
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = JSON.parse(e.target.result);
          
          // Crear la capa GeoJSON y agregarla al mapa
          const geojsonLayer = L.geoJSON(data, {
            onEachFeature: (feature, layer) => {
              // Habilitar edición en cada geometría si es posible
              layer.pm && layer.pm.enable();
            }
          }).addTo(map);
          
          // Ajustar el zoom del mapa a la extensión de las nuevas geometrías
          map.fitBounds(geojsonLayer.getBounds());
      
          alert("Archivo GeoJSON cargado correctamente.");
        };
        reader.readAsText(file);
      };

  // Función para cargar archivos SHP (ZIP) y convertirlos a GeoJSON
  const cargarDesdeShp = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      // Utilizamos shp.js para convertir el archivo ZIP a GeoJSON
      shp(arrayBuffer)
        .then(geojson => {
          // Si ya existe una capa SHP previa, la eliminamos para actualizarla
          if (window.shpLayer) {
            map.removeLayer(window.shpLayer);
          }
          // Crear la capa GeoJSON
          window.shpLayer = L.geoJSON(geojson, {
            onEachFeature: (feature, layer) => {
              layer.pm && layer.pm.enable();
            }
          });
          // Agregar la capa al mapa sólo si el checkbox está marcado
          const toggleSHP = document.getElementById("toggleSHP");
          if (toggleSHP && toggleSHP.checked) {
            map.addLayer(window.shpLayer);
          }
          // Ajustar el zoom del mapa para abarcar las nuevas geometrías
          if (window.shpLayer.getBounds && window.shpLayer.getBounds().isValid()) {
            map.fitBounds(window.shpLayer.getBounds());
          }
          alert("Archivo SHP cargado correctamente.");
        })
        .catch(error => {
          console.error("Error al cargar el shapefile:", error);
          alert("Error al cargar el shapefile. Asegúrate de que el archivo esté en formato ZIP válido.");
        });
    };
    reader.readAsArrayBuffer(file);
  };

  // Exponer la función globalmente, si es necesario
  window.cargarDesdeShp = cargarDesdeShp;

  // Listener para el checkbox de SHP
  const toggleSHP = document.getElementById("toggleSHP");
  if (toggleSHP) {
    toggleSHP.addEventListener("change", () => {
      if (toggleSHP.checked) {
        // Si el checkbox está marcado y la capa SHP existe, agregarla al mapa (si aún no está)
        if (window.shpLayer && !map.hasLayer(window.shpLayer)) {
          map.addLayer(window.shpLayer);
        }
      } else {
        // Si no está marcado y la capa SHP está en el mapa, removerla
        if (window.shpLayer && map.hasLayer(window.shpLayer)) {
          map.removeLayer(window.shpLayer);
        }
      }
    });
  }
    
    // ============================================
    // 4. Eventos de dibujo con Leaflet-Geoman
    // ============================================
    map.on('pm:create', (e) => {
      const layer = e.layer;
      if (layer instanceof L.Marker) {
        mostrarCoordenadas(layer);
        layer.on('pm:dragend', () => mostrarCoordenadas(layer));
      } else if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
        calcularMedidas(layer);
        layer.on('pm:edit', () => calcularMedidas(layer));
        layer.on('pm:dragend', () => calcularMedidas(layer));
      }
    });
  
    map.on('pm:update', (e) => {
      if (typeof e.layer.eachLayer === 'function') {
        e.layer.eachLayer(layer => calcularMedidas(layer));
      } else {
        calcularMedidas(e.layer);
      }
    });
  
    // ============================================
    // 5. Funcionalidades adicionales
    // ============================================
  
    // 5.1 Mostrar coordenadas del cursor en tiempo real (control en la esquina inferior izquierda)
    const coordControl = L.control({ position: 'bottomleft' });
    coordControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'cursor-coords');
    div.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    div.style.padding = '5px';
    div.style.borderRadius = '4px';
    div.style.fontSize = '14px';
    // Inicialmente se muestra sin datos
    div.innerHTML = 'Lat: --, Lng: --<br>UTM: --';
    return div;
    };
    coordControl.addTo(map);

    // Actualizar las coordenadas en tiempo real, incluyendo UTM
    map.on('mousemove', (e) => {
    const { lat, lng } = e.latlng;
    // Obtener coordenadas UTM usando la función de conversión
    const utm = convertirLatLngAutm(lat, lng);
    const coordDiv = document.querySelector('.cursor-coords');
    if (coordDiv) {
        coordDiv.innerHTML = `
        Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}<br>
        UTM: ${utm.easting} m E, ${utm.northing} m N (Zona ${utm.zone})
        `;
    }
    });
  
    // 5.2 Botón para limpiar todas las geometrías del mapa
    const limpiarGeometrias = () => {
      map.eachLayer(layer => {
        if (layer.pm && layer.pm._shape) {
          map.removeLayer(layer);
        }
      });
      alert("Todas las geometrías han sido eliminadas.");
    };
  
    // Se asume que en index.html agregas un botón con id "clearGeometrias"
    const clearButton = document.getElementById('clearGeometrias');
    if (clearButton) {
      clearButton.addEventListener('click', limpiarGeometrias);
    }
  
    // ============================================
    // 6. Carga de raster (GeoTIFF, PNG, JPG)
    // ============================================
    const inputRaster = document.getElementById("uploadRaster");
    if (inputRaster) {
        inputRaster.addEventListener("change", function(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            if (file.name.match(/\.(tif|tiff)$/i)) {
              reader.onload = (e) => {
                const arrayBuffer = e.target.result;
                parseGeoraster(arrayBuffer).then((georaster) => {
                  if (georaster.projection !== 4326) {
                    alert("El archivo TIFF puede no mostrarse correctamente porque no está en EPSG:4326.");
                  }
                  if (window.layer) {
                    map.removeLayer(window.layer);
                  }
                  window.layer = new GeoRasterLayer({
                    georaster,
                    opacity: 0.8,
                    resolution: 512,
                    debugLevel: 1,
                    zIndex: 500
                  });
                  // Agregar el raster solo si el checkbox está marcado
                  const toggleRaster = document.getElementById('toggleRaster');
                  if (toggleRaster && toggleRaster.checked) {
                    map.addLayer(window.layer);
                  }
                  map.fitBounds(window.layer.getBounds());
                  alert("GeoTIFF cargado correctamente.");
                }).catch((error) => {
                  console.error("Error al procesar el GeoTIFF:", error);
                  alert("No se pudo renderizar el archivo GeoTIFF.");
                });
              };
              reader.readAsArrayBuffer(file);
            } else if (file.name.match(/\.(png|jpg|jpeg)$/i)) {
              reader.onload = (e) => {
                if (window.layer) {
                  map.removeLayer(window.layer);
                }
                const imgUrl = e.target.result;
                window.layer = L.imageOverlay(imgUrl, map.getBounds(), { opacity: 0.8, zIndex: 500 });
                const toggleRaster = document.getElementById('toggleRaster');
                if (toggleRaster && toggleRaster.checked) {
                  window.layer.addTo(map);
                }
                alert("Imagen cargada correctamente.");
              };
              reader.readAsDataURL(file);
            } else {
              alert("Formato de archivo no soportado. Usa TIFF, PNG o JPG.");
            }
          });
    }
    // Función para cargar archivos KML y convertirlos a GeoJSON
    const cargarDesdeKML = (event) => {
        const file = event.target.files[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (e) => {
        const kmlText = e.target.result;
    
        // Parsear el texto a un documento XML
        const parser = new DOMParser();
        const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
    
        // Convertir el documento KML a GeoJSON utilizando togeojson
        const geojson = toGeoJSON.kml(kmlDoc);
    
        // Si ya existe una capa KML previa, se elimina para actualizarla
        if (window.kmlLayer) {
            map.removeLayer(window.kmlLayer);
        }
    
        // Crear la capa GeoJSON sin agregarla aún al mapa
        window.kmlLayer = L.geoJSON(geojson, {
            onEachFeature: (feature, layer) => {
            // Habilitar edición si está disponible
            layer.pm && layer.pm.enable();
            }
        });
    
        // Agregar la capa al mapa sólo si el checkbox está marcado
        const toggleKML = document.getElementById('toggleKML');
        if (toggleKML && toggleKML.checked) {
            window.kmlLayer.addTo(map);
        }
    
        // Ajustar el zoom al área de la capa, si es válido
        if (window.kmlLayer.getBounds && window.kmlLayer.getBounds().isValid()) {
            map.fitBounds(window.kmlLayer.getBounds());
        }
    
        alert("Archivo KML cargado correctamente.");
        };
        reader.readAsText(file);
    };
    
    // Exponer la función globalmente, en caso de ser necesario
    window.cargarDesdeKML = cargarDesdeKML;
  
    // Listener para el checkbox de KML
    const toggleKML = document.getElementById('toggleKML');
    if (toggleKML) {
        toggleKML.addEventListener('change', () => {
        if (toggleKML.checked) {
            // Si el checkbox está marcado y la capa existe, agregarla al mapa (si no está ya)
            if (window.kmlLayer && !map.hasLayer(window.kmlLayer)) {
            map.addLayer(window.kmlLayer);
            }
        } else {
            // Si no está marcado y la capa está en el mapa, quitarla
            if (window.kmlLayer && map.hasLayer(window.kmlLayer)) {
            map.removeLayer(window.kmlLayer);
            }
        }
        });
    }

        // ============================================
        // 7. Exponer funciones globales para botones (si es necesario)
        // ============================================
        window.guardarGeometrias = guardarGeometrias;
        window.cargarGeometrias = cargarGeometrias;
        window.descargarGeoJSON = descargarGeoJSON;
        window.cargarDesdeArchivo = cargarDesdeArchivo;
    });
    // Control para mostrar/ocultar el raster cargado
    const toggleRaster = document.getElementById('toggleRaster');
    if (toggleRaster) {
    toggleRaster.addEventListener('change', () => {
        if (toggleRaster.checked) {
        // Si está marcado, y el raster ya fue cargado, agregarlo al mapa (si aún no está)
        if (window.layer && !map.hasLayer(window.layer)) {
            map.addLayer(window.layer);
        }
        } else {
        // Si no está marcado, remover el raster del mapa (si está agregado)
        if (window.layer && map.hasLayer(window.layer)) {
            map.removeLayer(window.layer);
        }
        }
    });
    }