// === dashboard.js ===
// Sistema integrado de Dashboard para MapTool GeoVisor
// Genera visualizaciones y estadísticas de los datos geoespaciales cargados

class DashboardManager {
    constructor() {
        this.isVisible = false;
        this.activeTab = 'resumen';
        this.charts = {};
        this.updateInterval = null;
        this.isCalculatingStats = false;
        this.data = {
            resumen: {},
            espacial: {},
            atributos: {},
            actividad: {}
        };
        
        this.init();
    }

    init() {
        this.createDashboardPanel();
        this.bindEvents();
        this.startAutoUpdate();
        
        // Hacer accesible globalmente
        window.dashboardManager = this;
    }

    // === CREACIÓN DE INTERFAZ ===
    createDashboardPanel() {
        // Crear overlay y panel principal del dashboard
        const dashboardHTML = `
            <div class="dashboard-overlay" id="dashboardOverlay"></div>
            <div class="dashboard-panel" id="dashboardPanel">
                <div class="dashboard-header">
                    <h3>
                        <i class="fas fa-chart-line"></i> 
                        Dashboard de Análisis
                    </h3>
                    <button class="dashboard-close" id="closeDashboard">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Navegación por tabs -->
                <div class="dashboard-tabs">
                    <button class="dashboard-tab active" data-tab="resumen">
                        <i class="fas fa-home"></i> Resumen
                    </button>
                    <button class="dashboard-tab" data-tab="espacial">
                        <i class="fas fa-map"></i> Espacial
                    </button>
                    <button class="dashboard-tab" data-tab="atributos">
                        <i class="fas fa-table"></i> Atributos
                    </button>
                    <button class="dashboard-tab" data-tab="actividad">
                        <i class="fas fa-chart-bar"></i> Actividad
                    </button>
                </div>

                <!-- Contenido de los tabs -->
                <div class="dashboard-content">
                    <!-- Tab Resumen -->
                    <div class="dashboard-tab-content active" id="tab-resumen">
                        ${this.createResumenTab()}
                    </div>
                    
                    <!-- Tab Espacial -->
                    <div class="dashboard-tab-content" id="tab-espacial">
                        ${this.createEspacialTab()}
                    </div>
                    
                    <!-- Tab Atributos -->
                    <div class="dashboard-tab-content" id="tab-atributos">
                        ${this.createAtributosTab()}
                    </div>
                    
                    <!-- Tab Actividad -->
                    <div class="dashboard-tab-content" id="tab-actividad">
                        ${this.createActividadTab()}
                    </div>
                </div>

                <!-- Acciones del dashboard -->
                <div class="dashboard-actions">
                    <button class="dashboard-btn secondary" id="exportDashboard">
                        <i class="fas fa-download"></i> Exportar Reporte
                    </button>
                    <button class="dashboard-btn primary" id="refreshDashboard">
                        <i class="fas fa-sync"></i> Actualizar
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', dashboardHTML);
        
        // Agregar botón al navbar
        this.addDashboardButton();
    }

    createResumenTab() {
        return `
            <div class="dashboard-section">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-layer-group"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="totalCapas">0</div>
                            <div class="stat-label">Capas Cargadas</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-shapes"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="totalFeatures">0</div>
                            <div class="stat-label">Total Features</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-map-pin"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="totalPuntos">0</div>
                            <div class="stat-label">Puntos</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-route"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="totalLineas">0</div>
                            <div class="stat-label">Líneas</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-draw-polygon"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="totalPoligonos">0</div>
                            <div class="stat-label">Polígonos</div>
                        </div>
                    </div>
                </div>
                
                <div class="chart-container">
                    <h4><i class="fas fa-pie-chart"></i> Distribución por Tipo de Geometría</h4>
                    <canvas id="chartTiposGeometria"></canvas>
                </div>
            </div>
        `;
    }

    createEspacialTab() {
        return `
            <div class="dashboard-section">
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-header">
                            <i class="fas fa-expand"></i>
                            <span>Área Total</span>
                        </div>
                        <div class="metric-values">
                            <div class="metric-value">
                                <span class="value" id="areaTotalM2">0</span>
                                <span class="unit">m²</span>
                            </div>
                            <div class="metric-value">
                                <span class="value" id="areaTotalHa">0</span>
                                <span class="unit">ha</span>
                            </div>
                            <div class="metric-value">
                                <span class="value" id="areaTotalKm2">0</span>
                                <span class="unit">km²</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-header">
                            <i class="fas fa-ruler"></i>
                            <span>Longitud Total</span>
                        </div>
                        <div class="metric-values">
                            <div class="metric-value">
                                <span class="value" id="longitudTotalM">0</span>
                                <span class="unit">m</span>
                            </div>
                            <div class="metric-value">
                                <span class="value" id="longitudTotalKm">0</span>
                                <span class="unit">km</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="chart-container">
                    <h4><i class="fas fa-chart-area"></i> Distribución de Áreas por Capa</h4>
                    <canvas id="chartAreas"></canvas>
                </div>
                
                <div class="chart-container">
                    <h4><i class="fas fa-globe"></i> Distribución por Zona UTM</h4>
                    <canvas id="chartZonasUTM"></canvas>
                </div>
            </div>
        `;
    }

    createAtributosTab() {
        return `
            <div class="dashboard-section">
                <!-- Selector de campo para análisis estadístico -->
                <div class="field-selector-card">
                    <h4><i class="fas fa-calculator"></i> Análisis Estadístico en Tiempo Real</h4>
                    <div class="field-selector-controls">
                        <div class="selector-row">
                            <label for="layerSelectStats">Capa:</label>
                            <select id="layerSelectStats" class="layer-select-stats">
                                <option value="">-- Selecciona una capa --</option>
                            </select>
                        </div>
                        <div class="selector-row">
                            <label for="fieldSelectStats">Campo:</label>
                            <select id="fieldSelectStats" class="field-select-stats">
                                <option value="">-- Selecciona un campo --</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Resultados estadísticos -->
                    <div class="stats-results" id="statsResults" style="display: none;">
                        <div class="stats-grid-detailed">
                            <div class="stat-detail-card">
                                <div class="stat-detail-label">Total Registros</div>
                                <div class="stat-detail-value" id="statTotal">0</div>
                            </div>
                            <div class="stat-detail-card">
                                <div class="stat-detail-label">Valores Únicos</div>
                                <div class="stat-detail-value" id="statUnicos">0</div>
                            </div>
                            <div class="stat-detail-card">
                                <div class="stat-detail-label">Con Datos</div>
                                <div class="stat-detail-value" id="statConDatos">0</div>
                            </div>
                            <div class="stat-detail-card">
                                <div class="stat-detail-label">Sin Datos</div>
                                <div class="stat-detail-value" id="statSinDatos">0</div>
                            </div>
                        </div>
                        
                        <!-- Estadísticas numéricas (si aplica) -->
                        <div class="numeric-stats" id="numericStats" style="display: none;">
                            <h5><i class="fas fa-chart-line"></i> Estadísticas Numéricas</h5>
                            <div class="stats-grid-numeric">
                                <div class="stat-numeric-card">
                                    <div class="stat-numeric-label">Promedio</div>
                                    <div class="stat-numeric-value" id="statPromedio">0</div>
                                </div>
                                <div class="stat-numeric-card">
                                    <div class="stat-numeric-label">Mediana</div>
                                    <div class="stat-numeric-value" id="statMediana">0</div>
                                </div>
                                <div class="stat-numeric-card">
                                    <div class="stat-numeric-label">Mínimo</div>
                                    <div class="stat-numeric-value" id="statMinimo">0</div>
                                </div>
                                <div class="stat-numeric-card">
                                    <div class="stat-numeric-label">Máximo</div>
                                    <div class="stat-numeric-value" id="statMaximo">0</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Valores más frecuentes -->
                        <div class="frequent-values" id="frequentValues">
                            <h5><i class="fas fa-list-ol"></i> Valores Más Frecuentes</h5>
                            <div class="frequent-list" id="frequentList">
                                <!-- Se llena dinámicamente -->
                            </div>
                        </div>
                        
                        <!-- Gráfico de distribución -->
                        <div class="chart-container">
                            <h5><i class="fas fa-chart-bar"></i> Distribución de Valores</h5>
                            <canvas id="chartDistribucion"></canvas>
                        </div>
                        
                        <!-- Controles de simbología -->
                        <div class="symbology-controls" id="symbologyControls" style="display: none;">
                            <h5><i class="fas fa-palette"></i> Simbología por Atributo</h5>
                            <div class="symbology-options">
                                <button class="symbology-btn" id="applySymbology">
                                    <i class="fas fa-paint-brush"></i> Aplicar Colores
                                </button>
                                <button class="symbology-btn secondary" id="resetSymbology">
                                    <i class="fas fa-undo"></i> Restablecer
                                </button>
                            </div>
                            <div class="color-legend" id="colorLegend">
                                <!-- Se llena dinámicamente -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="attributes-summary">
                    <div class="summary-card">
                        <h4><i class="fas fa-list"></i> Campos Únicos</h4>
                        <div class="field-list" id="camposUnicos">
                            <!-- Se llena dinámicamente -->
                        </div>
                    </div>
                    
                    <div class="summary-card">
                        <h4><i class="fas fa-chart-pie"></i> Completitud de Datos</h4>
                        <canvas id="chartCompletitud"></canvas>
                    </div>
                </div>
                
                <div class="attributes-detail">
                    <h4><i class="fas fa-table"></i> Análisis por Campo</h4>
                    <div class="field-analysis" id="analisisCampos">
                        <!-- Se llena dinámicamente -->
                    </div>
                </div>
            </div>
        `;
    }

    createActividadTab() {
        return `
            <div class="dashboard-section">
                <div class="activity-summary">
                    <div class="activity-stat">
                        <i class="fas fa-clock"></i>
                        <span>Tiempo de Sesión: <strong id="tiempoSesion">00:00:00</strong></span>
                    </div>
                    <div class="activity-stat">
                        <i class="fas fa-mouse"></i>
                        <span>Acciones Realizadas: <strong id="accionesRealizadas">0</strong></span>
                    </div>
                    <div class="activity-stat">
                        <i class="fas fa-search"></i>
                        <span>Búsquedas: <strong id="busquedasRealizadas">0</strong></span>
                    </div>
                </div>
                
                <div class="chart-container">
                    <h4><i class="fas fa-chart-line"></i> Actividad en el Tiempo</h4>
                    <canvas id="chartActividad"></canvas>
                </div>
            </div>
        `;
    }

    addDashboardButton() {
        const navbarRight = document.querySelector('.navbar-right');
        
        // Verificar si ya existe un botón de dashboard
        const existingBtn = document.getElementById('toggleDashboard');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        const dashboardBtn = document.createElement('button');
        dashboardBtn.className = 'nav-btn';
        dashboardBtn.id = 'toggleDashboard';
        dashboardBtn.title = 'Dashboard';
        dashboardBtn.innerHTML = `
            <i class="fas fa-chart-line"></i>
            <span>Dashboard</span>
        `;
        
        // Insertar antes del botón de información
        const infoBtn = document.getElementById('btnInformacion');
        navbarRight.insertBefore(dashboardBtn, infoBtn);
    }

    // === EVENTOS ===
    bindEvents() {
        // Toggle dashboard
        document.addEventListener('click', (e) => {
            if (e.target.closest('#toggleDashboard')) {
                this.toggle();
            }
            
            if (e.target.closest('#closeDashboard') || e.target.closest('#dashboardOverlay')) {
                this.hide();
            }
            
            if (e.target.closest('#refreshDashboard')) {
                this.updateData();
            }
            
            if (e.target.closest('#exportDashboard')) {
                this.exportReport();
            }
            
            if (e.target.closest('#applySymbology')) {
                this.applySymbologyToLayer();
            }
            
            if (e.target.closest('#resetSymbology')) {
                this.resetLayerSymbology();
            }
        });

        // Cerrar con tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        // Indicador de scroll en dashboard
        this.setupScrollIndicator();

        // Navegación por tabs
        document.addEventListener('click', (e) => {
            if (e.target.closest('.dashboard-tab')) {
                const tab = e.target.closest('.dashboard-tab');
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            }
        });

        // Selectores de análisis estadístico - con eventos únicos
        this.setupStatsEventListeners();

        // Escuchar cambios en las capas con debounce
        let updateTimeout = null;
        
        document.addEventListener('layerAdded', () => {
            if (this.isVisible) {
                if (updateTimeout) clearTimeout(updateTimeout);
                updateTimeout = setTimeout(() => {
                    this.updateData();
                }, 500);
            }
        });

        document.addEventListener('layerRemoved', () => {
            if (this.isVisible) {
                if (updateTimeout) clearTimeout(updateTimeout);
                updateTimeout = setTimeout(() => {
                    this.updateData();
                }, 500);
            }
        });
    }

    setupStatsEventListeners() {
        // Remover listeners anteriores si existen
        const layerSelect = document.getElementById('layerSelectStats');
        const fieldSelect = document.getElementById('fieldSelectStats');
        
        if (layerSelect) {
            // Clonar el elemento para remover todos los event listeners
            const newLayerSelect = layerSelect.cloneNode(true);
            layerSelect.parentNode.replaceChild(newLayerSelect, layerSelect);
            
            newLayerSelect.addEventListener('change', () => {
                console.log('Layer selector cambió');
                this.updateFieldSelector();
            });
        }
        
        if (fieldSelect) {
            // Clonar el elemento para remover todos los event listeners
            const newFieldSelect = fieldSelect.cloneNode(true);
            fieldSelect.parentNode.replaceChild(newFieldSelect, fieldSelect);
            
            newFieldSelect.addEventListener('change', () => {
                console.log('Field selector cambió');
                this.calculateFieldStatistics();
            });
        }
    }

    // === FUNCIONALIDADES PRINCIPALES ===
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        const overlay = document.getElementById('dashboardOverlay');
        const panel = document.getElementById('dashboardPanel');
        
        // Mostrar overlay primero
        overlay.classList.add('visible');
        
        // Mostrar panel con pequeña demora
        setTimeout(() => {
            panel.classList.add('visible');
            panel.classList.add('animated');
        }, 50);
        
        this.isVisible = true;
        this.updateData();
        
        // Prevenir scroll del body
        document.body.style.overflow = 'hidden';
    }

    hide() {
        const overlay = document.getElementById('dashboardOverlay');
        const panel = document.getElementById('dashboardPanel');
        
        panel.classList.remove('visible', 'animated');
        overlay.classList.remove('visible');
        
        this.isVisible = false;
        
        // Restaurar scroll del body
        document.body.style.overflow = '';
    }

    switchTab(tabName) {
        // Actualizar tabs
        document.querySelectorAll('.dashboard-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Actualizar contenido
        document.querySelectorAll('.dashboard-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`tab-${tabName}`).classList.add('active');
        
        this.activeTab = tabName;
        
        // Actualizar datos específicos del tab
        this.updateTabData(tabName);
    }

    // === PROCESAMIENTO DE DATOS ===
    updateData() {
        if (!window.capasCargadas) return;
        
        this.calculateResumenData();
        this.calculateEspacialData();
        this.calculateAtributosData();
        this.calculateActividadData();
        
        this.updateUI();
    }

    calculateResumenData() {
        const capas = window.capasCargadas || {};
        let totalFeatures = 0;
        let totalPuntos = 0;
        let totalLineas = 0;
        let totalPoligonos = 0;

        Object.values(capas).forEach(capa => {
            capa.eachLayer(layer => {
                if (layer.feature) {
                    totalFeatures++;
                    const geomType = layer.feature.geometry.type;
                    
                    switch (geomType) {
                        case 'Point':
                        case 'MultiPoint':
                            totalPuntos++;
                            break;
                        case 'LineString':
                        case 'MultiLineString':
                            totalLineas++;
                            break;
                        case 'Polygon':
                        case 'MultiPolygon':
                            totalPoligonos++;
                            break;
                    }
                }
            });
        });

        this.data.resumen = {
            totalCapas: Object.keys(capas).length,
            totalFeatures,
            totalPuntos,
            totalLineas,
            totalPoligonos,
            distribucion: {
                puntos: totalPuntos,
                lineas: totalLineas,
                poligonos: totalPoligonos
            }
        };
    }

    calculateEspacialData() {
        const capas = window.capasCargadas || {};
        let areaTotalM2 = 0;
        let longitudTotalM = 0;
        const areasCapas = {};
        const zonasUTM = {};

        Object.entries(capas).forEach(([nombreCapa, capa]) => {
            let areaCapa = 0;
            
            capa.eachLayer(layer => {
                if (layer.feature) {
                    const feature = layer.feature;
                    const geomType = feature.geometry.type;
                    
                    try {
                        if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
                            const area = turf.area(feature);
                            areaTotalM2 += area;
                            areaCapa += area;
                        }
                        
                        if (geomType === 'LineString' || geomType === 'MultiLineString') {
                            const length = turf.length(feature, { units: 'meters' });
                            longitudTotalM += length;
                        }
                        
                        // Zona UTM
                        const coords = this.getFeatureCoordinates(feature);
                        if (coords) {
                            const infoUTM = obtenerInfoZonaUTM(coords.lat, coords.lng);
                            const zona = infoUTM.zoneString;
                            zonasUTM[zona] = (zonasUTM[zona] || 0) + 1;
                        }
                    } catch (error) {
                        console.warn('Error calculando métricas espaciales:', error);
                    }
                }
            });
            
            if (areaCapa > 0) {
                areasCapas[nombreCapa] = areaCapa;
            }
        });

        this.data.espacial = {
            areaTotalM2,
            areaTotalHa: areaTotalM2 / 10000,
            areaTotalKm2: areaTotalM2 / 1000000,
            longitudTotalM,
            longitudTotalKm: longitudTotalM / 1000,
            areasCapas,
            zonasUTM
        };
    }

    calculateAtributosData() {
        const capas = window.capasCargadas || {};
        const camposUnicos = new Set();
        const analisisCampos = {};
        let totalFeatures = 0;

        Object.values(capas).forEach(capa => {
            capa.eachLayer(layer => {
                if (layer.feature && layer.feature.properties) {
                    totalFeatures++;
                    const props = layer.feature.properties;
                    
                    Object.keys(props).forEach(campo => {
                        camposUnicos.add(campo);
                        
                        if (!analisisCampos[campo]) {
                            analisisCampos[campo] = {
                                total: 0,
                                conDatos: 0,
                                sinDatos: 0,
                                valoresUnicos: new Set(),
                                tipos: new Set()
                            };
                        }
                        
                        const valor = props[campo];
                        analisisCampos[campo].total++;
                        
                        if (valor !== null && valor !== undefined && valor !== '') {
                            analisisCampos[campo].conDatos++;
                            analisisCampos[campo].valoresUnicos.add(valor);
                            analisisCampos[campo].tipos.add(typeof valor);
                        } else {
                            analisisCampos[campo].sinDatos++;
                        }
                    });
                }
            });
        });

        // Calcular completitud
        Object.keys(analisisCampos).forEach(campo => {
            const datos = analisisCampos[campo];
            datos.completitud = totalFeatures > 0 ? (datos.conDatos / totalFeatures) * 100 : 0;
            datos.valoresUnicos = Array.from(datos.valoresUnicos);
            datos.tipos = Array.from(datos.tipos);
        });

        this.data.atributos = {
            camposUnicos: Array.from(camposUnicos),
            totalFeatures,
            analisisCampos
        };
    }

    calculateActividadData() {
        // Por ahora datos simulados - se puede implementar tracking real
        this.data.actividad = {
            tiempoSesion: this.formatSessionTime(),
            accionesRealizadas: Math.floor(Math.random() * 50) + 10,
            busquedasRealizadas: Math.floor(Math.random() * 20) + 5
        };
    }

    // === ACTUALIZACIÓN DE UI ===
    updateUI() {
        this.updateResumenUI();
        this.updateEspacialUI();
        this.updateAtributosUI();
        this.updateActividadUI();
    }

    updateResumenUI() {
        const data = this.data.resumen;
        
        document.getElementById('totalCapas').textContent = data.totalCapas || 0;
        document.getElementById('totalFeatures').textContent = data.totalFeatures || 0;
        document.getElementById('totalPuntos').textContent = data.totalPuntos || 0;
        document.getElementById('totalLineas').textContent = data.totalLineas || 0;
        document.getElementById('totalPoligonos').textContent = data.totalPoligonos || 0;
        
        // Actualizar gráfico de distribución de tipos de geometría
        this.updateGeometryTypesChart();
    }

    updateEspacialUI() {
        const data = this.data.espacial;
        
        document.getElementById('areaTotalM2').textContent = this.formatNumber(data.areaTotalM2);
        document.getElementById('areaTotalHa').textContent = this.formatNumber(data.areaTotalHa);
        document.getElementById('areaTotalKm2').textContent = this.formatNumber(data.areaTotalKm2);
        document.getElementById('longitudTotalM').textContent = this.formatNumber(data.longitudTotalM);
        document.getElementById('longitudTotalKm').textContent = this.formatNumber(data.longitudTotalKm);
        
        // Actualizar gráficos espaciales
        this.updateAreaChart();
        this.updateUTMChart();
    }

    updateAtributosUI() {
        const data = this.data.atributos;
        
        // Actualizar selector de capas para estadísticas
        this.updateLayerSelector();
        
        // Campos únicos
        const camposContainer = document.getElementById('camposUnicos');
        if (camposContainer) {
            camposContainer.innerHTML = data.camposUnicos.map(campo => 
                `<span class="field-tag">${campo}</span>`
            ).join('');
        }
        
        // Análisis de campos
        const analisisContainer = document.getElementById('analisisCampos');
        if (analisisContainer) {
            analisisContainer.innerHTML = Object.entries(data.analisisCampos)
                .map(([campo, info]) => `
                    <div class="field-analysis-item">
                        <div class="field-name">${campo}</div>
                        <div class="field-stats">
                            <span>Completitud: ${info.completitud.toFixed(1)}%</span>
                            <span>Valores únicos: ${info.valoresUnicos.length}</span>
                            <span>Tipo: ${info.tipos.join(', ')}</span>
                        </div>
                    </div>
                `).join('');
        }
        
        // Actualizar gráfico de completitud
        this.updateCompletitudChart();
        
        // Reconfigurar event listeners para evitar duplicación
        this.setupStatsEventListeners();
    }

    // === ANÁLISIS ESTADÍSTICO EN TIEMPO REAL ===
    updateLayerSelector() {
        const layerSelect = document.getElementById('layerSelectStats');
        if (!layerSelect) return;
        
        // Limpiar opciones anteriores
        layerSelect.innerHTML = '<option value="">-- Selecciona una capa --</option>';
        
        // Agregar capas disponibles
        const capas = window.capasCargadas || {};
        Object.keys(capas).forEach(nombreCapa => {
            const option = document.createElement('option');
            option.value = nombreCapa;
            option.textContent = nombreCapa;
            layerSelect.appendChild(option);
        });
    }

    updateFieldSelector() {
        const layerSelect = document.getElementById('layerSelectStats');
        const fieldSelect = document.getElementById('fieldSelectStats');
        const statsResults = document.getElementById('statsResults');
        
        if (!layerSelect || !fieldSelect) return;
        
        // Limpiar selector de campos
        fieldSelect.innerHTML = '<option value="">-- Selecciona un campo --</option>';
        
        // Ocultar resultados
        if (statsResults) {
            statsResults.style.display = 'none';
        }
        
        const selectedLayer = layerSelect.value;
        if (!selectedLayer) return;
        
        const capas = window.capasCargadas || {};
        const capa = capas[selectedLayer];
        
        if (!capa) return;
        
        // Obtener campos únicos de la capa seleccionada
        const campos = new Set();
        
        capa.eachLayer(layer => {
            if (layer.feature && layer.feature.properties) {
                Object.keys(layer.feature.properties).forEach(campo => {
                    campos.add(campo);
                });
            }
        });
        
        // Llenar selector de campos
        Array.from(campos).sort().forEach(campo => {
            const option = document.createElement('option');
            option.value = campo;
            option.textContent = campo;
            fieldSelect.appendChild(option);
        });
    }

    calculateFieldStatistics() {
        // Prevenir ejecución múltiple
        if (this.isCalculatingStats) {
            console.log('Ya se están calculando estadísticas, omitiendo...');
            return;
        }
        
        this.isCalculatingStats = true;
        
        const layerSelect = document.getElementById('layerSelectStats');
        const fieldSelect = document.getElementById('fieldSelectStats');
        const statsResults = document.getElementById('statsResults');
        
        if (!layerSelect || !fieldSelect || !statsResults) {
            console.warn('Elementos del selector de estadísticas no encontrados');
            this.isCalculatingStats = false;
            return;
        }
        
        const selectedLayer = layerSelect.value;
        const selectedField = fieldSelect.value;
        
        console.log('Calculando estadísticas para:', { selectedLayer, selectedField });
        
        if (!selectedLayer || !selectedField) {
            statsResults.style.display = 'none';
            this.isCalculatingStats = false;
            return;
        }
        
        const capas = window.capasCargadas || {};
        const capa = capas[selectedLayer];
        
        if (!capa) {
            this.isCalculatingStats = false;
            return;
        }
        
        // Recolectar valores del campo seleccionado
        const valores = [];
        const valoresValidos = [];
        let totalRegistros = 0;
        let conDatos = 0;
        let sinDatos = 0;
        
        capa.eachLayer(layer => {
            if (layer.feature && layer.feature.properties) {
                totalRegistros++;
                const valor = layer.feature.properties[selectedField];
                
                valores.push(valor);
                
                if (valor !== null && valor !== undefined && valor !== '') {
                    conDatos++;
                    valoresValidos.push(valor);
                } else {
                    sinDatos++;
                }
            }
        });
        
        // Calcular estadísticas básicas
        const valoresUnicos = [...new Set(valoresValidos)];
        
        // Actualizar UI básica
        document.getElementById('statTotal').textContent = totalRegistros;
        document.getElementById('statUnicos').textContent = valoresUnicos.length;
        document.getElementById('statConDatos').textContent = conDatos;
        document.getElementById('statSinDatos').textContent = sinDatos;
        
        // Determinar si son valores numéricos
        const valoresNumericos = valoresValidos.filter(val => {
            const num = parseFloat(val);
            return !isNaN(num) && isFinite(num);
        }).map(val => parseFloat(val));
        
        const esNumerico = valoresNumericos.length > 0 && valoresNumericos.length >= valoresValidos.length * 0.5;
        
        // Mostrar/ocultar estadísticas numéricas
        const numericStats = document.getElementById('numericStats');
        if (esNumerico && numericStats) {
            numericStats.style.display = 'block';
            
            // Calcular estadísticas numéricas
            const promedio = valoresNumericos.reduce((sum, val) => sum + val, 0) / valoresNumericos.length;
            const sorted = [...valoresNumericos].sort((a, b) => a - b);
            const mediana = sorted.length % 2 === 0 
                ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
                : sorted[Math.floor(sorted.length / 2)];
            const minimo = Math.min(...valoresNumericos);
            const maximo = Math.max(...valoresNumericos);
            
            document.getElementById('statPromedio').textContent = promedio.toFixed(2);
            document.getElementById('statMediana').textContent = mediana.toFixed(2);
            document.getElementById('statMinimo').textContent = minimo.toString();
            document.getElementById('statMaximo').textContent = maximo.toString();
        } else if (numericStats) {
            numericStats.style.display = 'none';
        }
        
        // Calcular valores más frecuentes
        this.updateFrequentValues(valoresValidos);
        
        // Mostrar resultados primero
        statsResults.style.display = 'block';
        
        // Mostrar gráfico de distribución - SIEMPRE mostrar independientemente del tipo
        console.log('Valores a procesar en gráfico:', valoresValidos.slice(0, 10)); // Muestra los primeros 10 valores
        
        // Delay pequeño para asegurar que el DOM esté listo
        setTimeout(() => {
            this.updateDistributionChart(valoresValidos, selectedField);
            this.showSymbologyControls(selectedLayer, selectedField, valoresValidos);
        }, 100);
        
        // Liberar el flag después de un pequeño delay
        setTimeout(() => {
            this.isCalculatingStats = false;
        }, 100);
    }

    updateFrequentValues(valores) {
        const frequentList = document.getElementById('frequentList');
        if (!frequentList) return;
        
        // Contar frecuencias
        const frecuencias = {};
        valores.forEach(valor => {
            const key = valor === null || valor === undefined ? 'null' : valor.toString();
            frecuencias[key] = (frecuencias[key] || 0) + 1;
        });
        
        // Ordenar por frecuencia
        const sortedFreq = Object.entries(frecuencias)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Top 10
        
        // Mostrar en UI
        frequentList.innerHTML = sortedFreq.map(([valor, count]) => `
            <div class="frequent-item">
                <span class="frequent-value">${valor}</span>
                <span class="frequent-count">${count}</span>
            </div>
        `).join('');
    }

    updateDistributionChart(valores, fieldName) {
        console.log('=== INICIO updateDistributionChart ===');
        console.log('Parámetros recibidos:', { valores: valores?.length, fieldName });
        
        const canvas = document.getElementById('chartDistribucion');
        if (!canvas) {
            console.error('Canvas chartDistribucion no encontrado');
            return;
        }
        
        console.log('Canvas encontrado:', canvas);
        
        if (!valores || valores.length === 0) {
            console.warn('No hay valores para mostrar en el gráfico de distribución');
            return;
        }
        
        // Destruir todos los gráficos asociados a este canvas
        Chart.getChart(canvas)?.destroy();
        
        // Fijar dimensiones del canvas
        canvas.style.height = '300px';
        canvas.style.maxHeight = '300px';
        canvas.style.width = '100%';
        canvas.style.maxWidth = '100%';
        
        const ctx = canvas.getContext('2d');
        
        // Limpiar gráfico anterior de manera más robusta
        if (this.charts.distributionField) {
            this.charts.distributionField.destroy();
            this.charts.distributionField = null;
        }
        
        // Limpiar el canvas manualmente
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Preparar datos para el gráfico
        const frecuencias = {};
        valores.forEach(valor => {
            const key = valor === null || valor === undefined || valor === '' ? 'Sin datos' : valor.toString();
            frecuencias[key] = (frecuencias[key] || 0) + 1;
        });
        
        console.log('Frecuencias calculadas:', frecuencias);
        
        const sortedData = Object.entries(frecuencias)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15); // Top 15 para legibilidad
        
        if (sortedData.length === 0) {
            console.warn('No hay datos para mostrar en el gráfico');
            return;
        }
        
        const labels = sortedData.map(([label]) => {
            // Truncar etiquetas largas para strings
            const truncated = label.length > 15 ? label.substring(0, 12) + '...' : label;
            return truncated;
        });
        const data = sortedData.map(([, count]) => count);
        
        console.log('Datos procesados para gráfico:', { labels, data });
        
        if (data.length === 0 || labels.length === 0) {
            console.error('No hay datos válidos para crear el gráfico');
            return;
        }
        
        console.log('Creando gráfico de distribución con datos:', { labels, data, fieldName });
        
        // Verificar que el canvas esté visible
        const statsResults = document.getElementById('statsResults');
        console.log('Canvas visible:', canvas.offsetWidth > 0 && canvas.offsetHeight > 0);
        console.log('StatsResults visible:', statsResults ? statsResults.style.display : 'no encontrado');
        console.log('Canvas dimensiones:', { width: canvas.offsetWidth, height: canvas.offsetHeight });
        
        this.charts.distributionField = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: `Frecuencia - ${fieldName}`,
                    data: data,
                    backgroundColor: '#3b82f6',
                    borderColor: '#2563eb',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 500
                },
                scales: {
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            font: {
                                size: 10
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return Number.isInteger(value) ? value : '';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                onResize: function(chart, size) {
                    chart.canvas.style.height = '300px';
                    chart.canvas.style.maxHeight = '300px';
                }
            }
        });
        
        console.log('Gráfico de distribución creado exitosamente');
    }

    // === SIMBOLOGÍA ===
    showSymbologyControls(layerName, fieldName, valores) {
        const symbologyControls = document.getElementById('symbologyControls');
        if (!symbologyControls) return;
        
        // Guardar información actual para simbología
        this.currentSymbology = {
            layerName,
            fieldName,
            valores
        };
        
        symbologyControls.style.display = 'block';
        this.generateColorLegend(valores, fieldName);
    }

    generateColorLegend(valores, fieldName) {
        const colorLegend = document.getElementById('colorLegend');
        if (!colorLegend) return;
        
        // Calcular frecuencias para generar colores
        const frecuencias = {};
        valores.forEach(valor => {
            const key = valor === null || valor === undefined || valor === '' ? 'Sin datos' : valor.toString();
            frecuencias[key] = (frecuencias[key] || 0) + 1;
        });
        
        const sortedValues = Object.entries(frecuencias)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Top 10 valores
        
        // Generar paleta de colores
        const colors = this.generateColorPalette(sortedValues.length);
        
        let legendHTML = `<div class="legend-title">Colores para "${fieldName}":</div>`;
        sortedValues.forEach(([valor, count], index) => {
            const color = colors[index];
            legendHTML += `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${color}"></div>
                    <span class="legend-label">${valor} (${count})</span>
                </div>
            `;
        });
        
        colorLegend.innerHTML = legendHTML;
        
        // Guardar mapeo de colores
        this.colorMapping = {};
        sortedValues.forEach(([valor], index) => {
            this.colorMapping[valor] = colors[index];
        });
    }

    generateColorPalette(count) {
        // Paleta de colores vibrantes para categorías
        const baseColors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
            '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
        ];
        
        const colors = [];
        for (let i = 0; i < count; i++) {
            if (i < baseColors.length) {
                colors.push(baseColors[i]);
            } else {
                // Generar colores adicionales variando la saturación/brillo
                const hue = (i * 137.508) % 360; // Número áureo para distribución uniforme
                colors.push(`hsl(${hue}, 70%, 50%)`);
            }
        }
        return colors;
    }

    applySymbologyToLayer() {
        if (!this.currentSymbology) {
            console.warn('No hay simbología configurada');
            return;
        }
        
        const { layerName, fieldName } = this.currentSymbology;
        const layer = window.capasCargadas[layerName];
        
        if (!layer) {
            console.warn('Capa no encontrada:', layerName);
            return;
        }
        
        // Aplicar colores a cada feature
        layer.eachLayer(sublayer => {
            if (sublayer.feature && sublayer.feature.properties) {
                const fieldValue = sublayer.feature.properties[fieldName];
                const key = fieldValue === null || fieldValue === undefined || fieldValue === '' ? 'Sin datos' : fieldValue.toString();
                const color = this.colorMapping[key] || '#666666'; // Color por defecto
                
                // Aplicar estilo según el tipo de geometría
                if (sublayer.setStyle) {
                    sublayer.setStyle({
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.7,
                        weight: 2,
                        opacity: 0.9
                    });
                }
            }
        });
        
        console.log(`Simbología aplicada a la capa "${layerName}" por campo "${fieldName}"`);
        
        if (window.mostrarMensaje) {
            window.mostrarMensaje(`Simbología aplicada por campo "${fieldName}"`, 'success');
        }
    }

    resetLayerSymbology() {
        if (!this.currentSymbology) {
            console.warn('No hay simbología configurada');
            return;
        }
        
        const { layerName } = this.currentSymbology;
        const layer = window.capasCargadas[layerName];
        
        if (!layer) {
            console.warn('Capa no encontrada:', layerName);
            return;
        }
        
        // Determinar color original según tipo de archivo
        let originalColor = '#3b82f6'; // Por defecto
        if (layerName.toLowerCase().includes('.kml')) {
            originalColor = '#ef4444'; // Rojo para KML
        } else if (layerName.toLowerCase().includes('.zip') || layerName.toLowerCase().includes('.shp')) {
            originalColor = '#10b981'; // Verde para SHP
        }
        
        // Restablecer estilo original
        layer.eachLayer(sublayer => {
            if (sublayer.setStyle) {
                sublayer.setStyle({
                    color: originalColor,
                    fillColor: originalColor,
                    fillOpacity: 0.2,
                    weight: 2,
                    opacity: 0.8
                });
            }
        });
        
        console.log(`Simbología restablecida para la capa "${layerName}"`);
        
        if (window.mostrarMensaje) {
            window.mostrarMensaje('Simbología restablecida', 'info');
        }
    }

    updateActividadUI() {
        const data = this.data.actividad;
        
        document.getElementById('tiempoSesion').textContent = data.tiempoSesion;
        document.getElementById('accionesRealizadas').textContent = data.accionesRealizadas;
        document.getElementById('busquedasRealizadas').textContent = data.busquedasRealizadas;
        
        // Actualizar gráfico de actividad
        this.updateActividadChart();
    }

    // === GRÁFICOS ===
    updateGeometryTypesChart() {
        const canvas = document.getElementById('chartTiposGeometria');
        if (!canvas) return;
        
        // Destruir todos los gráficos asociados a este canvas
        Chart.getChart(canvas)?.destroy();
        
        const ctx = canvas.getContext('2d');
        
        // Limpiar canvas anterior de manera más robusta
        if (this.charts.distributionMain) {
            this.charts.distributionMain.destroy();
            this.charts.distributionMain = null;
        }
        
        // Limpiar el canvas manualmente
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const data = this.data.resumen.distribucion;
        
        this.charts.distributionMain = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Puntos', 'Líneas', 'Polígonos'],
                datasets: [{
                    data: [data.puntos, data.lineas, data.poligonos],
                    backgroundColor: [
                        '#3b82f6',
                        '#10b981',
                        '#f59e0b'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateAreaChart() {
        const canvas = document.getElementById('chartAreas');
        if (!canvas) return;
        
        // Destruir todos los gráficos asociados a este canvas
        Chart.getChart(canvas)?.destroy();
        
        const ctx = canvas.getContext('2d');
        
        // Limpiar canvas anterior
        if (this.charts.areas) {
            this.charts.areas.destroy();
            this.charts.areas = null;
        }
        
        // Limpiar el canvas manualmente
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const data = this.data.espacial.areasCapas;
        const labels = Object.keys(data);
        const values = Object.values(data).map(area => area / 10000); // Convertir a hectáreas
        
        this.charts.areas = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Área (hectáreas)',
                    data: values,
                    backgroundColor: '#3b82f6',
                    borderColor: '#2563eb',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateCompletitudChart() {
        const canvas = document.getElementById('chartCompletitud');
        if (!canvas) return;
        
        // Destruir gráfico anterior
        Chart.getChart(canvas)?.destroy();
        
        // Fijar dimensiones del canvas antes de crear el gráfico
        canvas.style.height = '200px';
        canvas.style.maxHeight = '200px';
        canvas.style.width = '100%';
        canvas.style.maxWidth = '100%';
        
        const ctx = canvas.getContext('2d');
        
        if (this.charts.completitud) {
            this.charts.completitud.destroy();
            this.charts.completitud = null;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const data = this.data.atributos;
        if (!data.analisisCampos || Object.keys(data.analisisCampos).length === 0) return;
        
        // Calcular promedio de completitud
        const completitudes = Object.values(data.analisisCampos).map(campo => campo.completitud);
        const completitudPromedio = completitudes.reduce((sum, val) => sum + val, 0) / completitudes.length;
        
        const labels = ['Completitud Promedio', 'Datos Faltantes'];
        const values = [completitudPromedio, 100 - completitudPromedio];
        
        this.charts.completitud = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#10b981',
                        '#ef4444'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false
                },
                animation: {
                    duration: 0
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                onResize: function(chart, size) {
                    // Prevenir redimensionamiento infinito
                    chart.canvas.style.height = '200px';
                    chart.canvas.style.maxHeight = '200px';
                }
            }
        });
    }

    updateUTMChart() {
        const canvas = document.getElementById('chartZonasUTM');
        if (!canvas) return;
        
        // Destruir todos los gráficos asociados a este canvas
        Chart.getChart(canvas)?.destroy();
        
        const ctx = canvas.getContext('2d');
        
        // Limpiar canvas anterior
        if (this.charts.utm) {
            this.charts.utm.destroy();
            this.charts.utm = null;
        }
        
        // Limpiar el canvas manualmente
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const data = this.data.espacial.zonasUTM;
        const labels = Object.keys(data);
        const values = Object.values(data);
        
        this.charts.utm = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#3b82f6',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateActividadChart() {
        const canvas = document.getElementById('chartActividad');
        if (!canvas) return;
        
        // Destruir gráfico anterior
        Chart.getChart(canvas)?.destroy();
        
        // Fijar dimensiones del canvas
        canvas.style.height = '250px';
        canvas.style.maxHeight = '250px';
        canvas.style.width = '100%';
        canvas.style.maxWidth = '100%';
        
        const ctx = canvas.getContext('2d');
        
        if (this.charts.actividad) {
            this.charts.actividad.destroy();
            this.charts.actividad = null;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Generar datos simulados de actividad en el tiempo
        const ahora = new Date();
        const labels = [];
        const data = [];
        
        // Generar datos para las últimas 24 horas (cada 2 horas)
        for (let i = 23; i >= 0; i -= 2) {
            const tiempo = new Date(ahora.getTime() - (i * 60 * 60 * 1000));
            labels.push(tiempo.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }));
            
            // Simular actividad variable (más actividad en horas normales)
            const hora = tiempo.getHours();
            let actividad = 0;
            
            if (hora >= 8 && hora <= 18) {
                // Horas de trabajo: más actividad
                actividad = Math.floor(Math.random() * 15) + 5;
            } else if (hora >= 19 && hora <= 23) {
                // Tarde/noche: actividad moderada
                actividad = Math.floor(Math.random() * 8) + 2;
            } else {
                // Madrugada: poca actividad
                actividad = Math.floor(Math.random() * 3);
            }
            
            data.push(actividad);
        }
        
        this.charts.actividad = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Acciones por Hora',
                    data: data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#3b82f6',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                size: 10
                            },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        display: true,
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                size: 10
                            },
                            stepSize: 5,
                            callback: function(value) {
                                return Number.isInteger(value) ? value : '';
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        hoverBackgroundColor: '#1d4ed8'
                    }
                },
                onResize: function(chart, size) {
                    chart.canvas.style.height = '250px';
                    chart.canvas.style.maxHeight = '250px';
                }
            }
        });
        
        console.log('Gráfico de actividad creado exitosamente');
    }

    // === UTILIDADES ===
    getFeatureCoordinates(feature) {
        try {
            const coords = feature.geometry.coordinates;
            let lat, lng;
            
            switch (feature.geometry.type) {
                case 'Point':
                    [lng, lat] = coords;
                    break;
                case 'LineString':
                case 'MultiLineString':
                    [lng, lat] = coords[0];
                    break;
                case 'Polygon':
                case 'MultiPolygon':
                    [lng, lat] = coords[0][0];
                    break;
                default:
                    return null;
            }
            
            return { lat, lng };
        } catch (error) {
            return null;
        }
    }

    formatNumber(num) {
        if (num < 1000) return num.toFixed(2);
        if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
        return (num / 1000000).toFixed(1) + 'M';
    }

    formatSessionTime() {
        const now = new Date();
        const start = window.sessionStartTime || now;
        const diff = now - start;
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateTabData(tabName) {
        // Pequeña demora para asegurar que el DOM esté listo
        setTimeout(() => {
            switch (tabName) {
                case 'resumen':
                    this.updateGeometryTypesChart();
                    break;
                case 'espacial':
                    this.updateAreaChart();
                    this.updateUTMChart();
                    break;
                case 'atributos':
                    // Los datos ya se actualizan en updateUI
                    break;
                case 'actividad':
                    this.updateActividadChart();
                    break;
            }
        }, 100);
    }

    setupScrollIndicator() {
        // Configurar indicador de scroll
        setTimeout(() => {
            const dashboardContent = document.querySelector('.dashboard-content');
            if (dashboardContent) {
                dashboardContent.addEventListener('scroll', () => {
                    if (dashboardContent.scrollTop > 10) {
                        dashboardContent.classList.add('scrolled');
                    } else {
                        dashboardContent.classList.remove('scrolled');
                    }
                });
            }
        }, 500);
    }

    startAutoUpdate() {
        // Actualizar cada 60 segundos si está visible (reducir frecuencia)
        this.updateInterval = setInterval(() => {
            if (this.isVisible && Object.keys(window.capasCargadas || {}).length > 0) {
                this.updateData();
            }
        }, 60000);
    }

    exportReport() {
        const reportData = {
            timestamp: new Date().toISOString(),
            resumen: this.data.resumen,
            espacial: this.data.espacial,
            atributos: this.data.atributos,
            actividad: this.data.actividad
        };
        
        const dataStr = JSON.stringify(reportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        if (window.mostrarMensaje) {
            window.mostrarMensaje('Reporte exportado exitosamente', 'success');
        }
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Destruir todos los gráficos de manera más robusta
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                try {
                    chart.destroy();
                } catch (error) {
                    console.warn('Error destroying chart:', error);
                }
            }
        });
        
        // Limpiar objeto de gráficos
        this.charts = {};
        
        const overlay = document.getElementById('dashboardOverlay');
        const panel = document.getElementById('dashboardPanel');
        
        if (overlay) {
            overlay.remove();
        }
        
        if (panel) {
            panel.remove();
        }
        
        const button = document.getElementById('toggleDashboard');
        if (button) {
            button.remove();
        }
        
        // Restaurar scroll del body
        document.body.style.overflow = '';
    }
}

// === INICIALIZACIÓN ===
let dashboardManager = null;

const inicializarDashboard = () => {
    // Destruir instancia anterior si existe
    if (dashboardManager) {
        dashboardManager.destroy();
        dashboardManager = null;
    }
    
    // Verificar que Chart.js esté disponible
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js no está disponible. Cargando desde CDN...');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
        script.onload = () => {
            dashboardManager = new DashboardManager();
        };
        document.head.appendChild(script);
    } else {
        dashboardManager = new DashboardManager();
    }
    
    // Marcar tiempo de inicio de sesión
    if (!window.sessionStartTime) {
        window.sessionStartTime = new Date();
    }
};

// Hacer función accesible globalmente
window.inicializarDashboard = inicializarDashboard;

// Auto-inicializar si el DOM está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarDashboard);
} else {
    // Pequeña demora para evitar inicialización múltiple
    setTimeout(inicializarDashboard, 100);
}