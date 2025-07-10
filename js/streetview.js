// === Sistema de Google Street View ===

class StreetViewManager {
    constructor() {
        this.isActive = false;
        this.streetViewBtn = null;
        this.map = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
        });

        // Esperar a que el mapa esté inicializado
        this.waitForMap();
    }

    waitForMap() {
        const checkMap = () => {
            if (window.map && typeof window.map.on === 'function') {
                this.map = window.map;
                this.setupMapListeners();
            } else {
                setTimeout(checkMap, 250);
            }
        };
        // Esperar un poco más antes del primer check
        setTimeout(checkMap, 500);
    }

    setupEventListeners() {
        this.streetViewBtn = document.getElementById('btnStreetView');
        
        if (this.streetViewBtn) {
            this.streetViewBtn.addEventListener('click', () => {
                this.toggleStreetViewMode();
            });
        }
    }

    setupMapListeners() {
        if (!this.map || typeof this.map.on !== 'function') {
            console.warn('Map not ready for Street View integration');
            return;
        }

        try {
            // Listener para clics en el mapa cuando Street View esté activo
            this.map.on('click', (e) => {
                if (this.isActive) {
                    this.openStreetView(e.latlng.lat, e.latlng.lng);
                }
            });
            console.log('Street View integration ready');
        } catch (error) {
            console.error('Error setting up Street View map listeners:', error);
        }
    }

    toggleStreetViewMode() {
        this.isActive = !this.isActive;
        
        if (this.isActive) {
            this.activateStreetViewMode();
        } else {
            this.deactivateStreetViewMode();
        }
    }

    activateStreetViewMode() {
        this.isActive = true;
        
        // Cambiar estilos del botón
        this.streetViewBtn.classList.add('active');
        this.streetViewBtn.innerHTML = '<i class="fas fa-street-view"></i> Clic en mapa';
        
        // Cambiar cursor del mapa
        if (this.map && this.map.getContainer) {
            try {
                this.map.getContainer().style.cursor = 'crosshair';
            } catch (error) {
                console.warn('Could not change map cursor:', error);
            }
        }
        
        // Si el mapa no está listo, configurar un listener temporal
        if (!this.map || typeof this.map.on !== 'function') {
            this.setupTemporaryMapListener();
        }
        
        // Mostrar mensaje informativo
        this.showMessage('Haz clic en cualquier punto del mapa para ver Street View', 'info');
    }

    setupTemporaryMapListener() {
        // Crear un listener temporal en el contenedor del mapa
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            const tempClickHandler = (e) => {
                if (this.isActive) {
                    // Obtener coordenadas aproximadas (esto es un fallback)
                    // En la práctica, esto sería más preciso con acceso al mapa real
                    const rect = mapContainer.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    // Para este fallback, usar coordenadas predeterminadas
                    // El usuario tendrá que ajustar en Google Maps
                    this.openStreetView(-0.1807, -78.4678); // Coordenadas de ejemplo (Quito)
                    
                    // Remover el listener temporal
                    mapContainer.removeEventListener('click', tempClickHandler);
                }
            };
            
            mapContainer.addEventListener('click', tempClickHandler);
        }
    }

    deactivateStreetViewMode() {
        this.isActive = false;
        
        // Restaurar estilos del botón
        this.streetViewBtn.classList.remove('active');
        this.streetViewBtn.innerHTML = '<i class="fas fa-street-view"></i> Street View';
        
        // Restaurar cursor del mapa
        if (this.map && this.map.getContainer) {
            try {
                this.map.getContainer().style.cursor = '';
            } catch (error) {
                console.warn('Could not restore map cursor:', error);
            }
        }
    }

    openStreetView(lat, lng) {
        // Opción 1: Abrir en Google Maps con Street View
        const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
        
        // Crear modal para mostrar Street View
        this.showStreetViewModal(lat, lng, streetViewUrl);
        
        // Desactivar modo después de usar
        this.deactivateStreetViewMode();
    }

    showStreetViewModal(lat, lng, streetViewUrl) {
        // Crear modal dinámico
        const modal = document.createElement('div');
        modal.className = 'streetview-modal-overlay';
        modal.innerHTML = `
            <div class="streetview-modal">
                <div class="streetview-modal-header">
                    <h3><i class="fab fa-google"></i> Google Street View</h3>
                    <button class="streetview-modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="streetview-modal-content">
                    <div class="streetview-info">
                        <p><strong>Coordenadas:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                        <p>Selecciona cómo quieres ver Street View:</p>
                    </div>
                    <div class="streetview-options">
                        <button class="streetview-option-btn" onclick="window.open('${streetViewUrl}', '_blank')">
                            <i class="fas fa-external-link-alt"></i>
                            Abrir en Google Maps
                        </button>
                        <button class="streetview-option-btn" onclick="streetViewManager.openEmbeddedStreetView(${lat}, ${lng})">
                            <i class="fas fa-window-maximize"></i>
                            Ver en ventana nueva
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners para cerrar modal
        const closeBtn = modal.querySelector('.streetview-modal-close');
        closeBtn.addEventListener('click', () => this.closeStreetViewModal(modal));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeStreetViewModal(modal);
            }
        });

        // Cerrar con ESC
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.closeStreetViewModal(modal);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    openEmbeddedStreetView(lat, lng) {
        // Abrir ventana nueva con Street View embebido
        const streetViewWindow = window.open('', '_blank', 'width=800,height=600,resizable=yes,scrollbars=yes');
        
        streetViewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Street View - MapTool</title>
                <style>
                    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .coordinates { background: #f0f0f0; padding: 10px; border-radius: 5px; margin-bottom: 10px; }
                    .streetview-container { width: 100%; height: 500px; border: 1px solid #ccc; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>🌍 MapTool - Street View</h2>
                    <div class="coordinates">
                        <strong>Coordenadas:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}
                    </div>
                    <p><a href="https://www.google.com/maps/@${lat},${lng},15z" target="_blank">Ver en Google Maps</a></p>
                </div>
                <iframe 
                    class="streetview-container"
                    src="https://www.google.com/maps/embed?pb=!4v1234567890!6m8!1m7!1s!2m2!1d${lng}!2d${lat}!3f0!4f0!5f0"
                    allowfullscreen>
                </iframe>
            </body>
            </html>
        `);
        
        streetViewWindow.document.close();
    }

    closeStreetViewModal(modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    }

    showMessage(message, type = 'info') {
        // Usar el sistema de mensajes existente si está disponible
        if (typeof window.mostrarMensaje === 'function') {
            window.mostrarMensaje(message, type);
        } else if (typeof window.showStatusMessage === 'function') {
            window.showStatusMessage(message, type);
        } else {
            // Fallback: crear mensaje temporal simple
            this.createSimpleMessage(message, type);
        }
    }

    createSimpleMessage(message, type) {
        const messageEl = document.createElement('div');
        messageEl.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'info' ? '#3b82f6' : '#dc2626'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 9999;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 400px;
            text-align: center;
        `;
        messageEl.textContent = message;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(messageEl)) {
                    document.body.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    // Método público para abrir Street View en coordenadas específicas
    openStreetViewAt(lat, lng) {
        this.openStreetView(lat, lng);
    }
}

// Inicializar el gestor de Street View
const streetViewManager = new StreetViewManager();

// Exportar para uso global
window.streetViewManager = streetViewManager;
window.openStreetView = (lat, lng) => streetViewManager.openStreetViewAt(lat, lng);