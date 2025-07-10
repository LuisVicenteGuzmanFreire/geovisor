// === interface.js ===
// Gestión de la interfaz de usuario - paneles, sidebars y controles

// Estado de los paneles
let panelStates = {
    sidebar: true,
    infoPanel: true,
    isMobile: false
};

// Inicializar controles de interfaz
const inicializarInterfaz = () => {
    // Detectar dispositivo móvil
    panelStates.isMobile = window.innerWidth <= 768;
    
    // Configurar sidebar en móvil
    if (panelStates.isMobile) {
        document.getElementById('sidebar').classList.add('collapsed');
        document.getElementById('infoPanel').style.display = 'none';
        panelStates.sidebar = false;
        panelStates.infoPanel = false;
    } else {
        // En desktop, marcar botones como activos por defecto
        document.getElementById('toggleSidebar').classList.add('active');
        document.getElementById('toggleInfo').classList.add('active');
    }
    
    // Eventos de los botones de la navbar
    document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);
    document.getElementById('toggleInfo').addEventListener('click', toggleInfoPanel);
    
    // Responsive al cambiar tamaño de ventana
    window.addEventListener('resize', handleResize);
    
    // Actualizar área del mapa
    updateMapArea();
};

// Toggle sidebar desde navbar
const toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleSidebar');
    
    if (panelStates.isMobile) {
        sidebar.classList.toggle('open');
        toggleBtn.classList.toggle('active', sidebar.classList.contains('open'));
    } else {
        sidebar.classList.toggle('collapsed');
        panelStates.sidebar = !sidebar.classList.contains('collapsed');
        toggleBtn.classList.toggle('active', panelStates.sidebar);
    }
    
    updateMapArea();
};

// Toggle panel de información
const toggleInfoPanel = () => {
    const infoPanel = document.getElementById('infoPanel');
    const toggleBtn = document.getElementById('toggleInfo');
    
    if (panelStates.isMobile) {
        const isVisible = infoPanel.style.display !== 'none';
        infoPanel.style.display = isVisible ? 'none' : 'block';
        toggleBtn.classList.toggle('active', !isVisible);
    } else {
        infoPanel.classList.toggle('collapsed');
        panelStates.infoPanel = !infoPanel.classList.contains('collapsed');
        toggleBtn.classList.toggle('active', panelStates.infoPanel);
    }
    
    updateMapArea();
};

// Funciones eliminadas - ahora se controla desde navbar

// Actualizar área del mapa según paneles
const updateMapArea = () => {
    const mapContainer = document.getElementById('map');
    const sidebar = document.getElementById('sidebar');
    const infoPanel = document.getElementById('infoPanel');
    
    if (panelStates.isMobile) {
        // En móvil, mapa ocupa toda la pantalla
        mapContainer.style.left = '0';
        mapContainer.style.right = '0';
    } else {
        // En desktop, ajustar según paneles
        if (sidebar.classList.contains('collapsed')) {
            mapContainer.style.left = '0';
        } else {
            mapContainer.style.left = 'var(--sidebar-width)';
        }
        
        if (infoPanel.classList.contains('collapsed')) {
            mapContainer.style.right = '0';
        } else {
            mapContainer.style.right = 'var(--info-panel-width)';
        }
    }
    
    // Trigger resize del mapa para que se ajuste
    if (window.map) {
        setTimeout(() => {
            window.map.invalidateSize();
        }, 300);
    }
};

// Manejar cambios de tamaño de ventana
const handleResize = () => {
    const wasMobile = panelStates.isMobile;
    panelStates.isMobile = window.innerWidth <= 768;
    
    if (wasMobile !== panelStates.isMobile) {
        // Cambió de móvil a desktop o viceversa
        const sidebar = document.getElementById('sidebar');
        const infoPanel = document.getElementById('infoPanel');
        
        const sidebarBtn = document.getElementById('toggleSidebar');
        const infoBtn = document.getElementById('toggleInfo');
        
        if (panelStates.isMobile) {
            // Cambió a móvil
            sidebar.classList.remove('collapsed');
            sidebar.classList.add('collapsed');
            infoPanel.style.display = 'none';
            panelStates.sidebar = false;
            panelStates.infoPanel = false;
            sidebarBtn.classList.remove('active');
            infoBtn.classList.remove('active');
        } else {
            // Cambió a desktop
            sidebar.classList.remove('open');
            sidebar.classList.remove('collapsed');
            infoPanel.style.display = 'block';
            infoPanel.classList.remove('collapsed');
            panelStates.sidebar = true;
            panelStates.infoPanel = true;
            sidebarBtn.classList.add('active');
            infoBtn.classList.add('active');
        }
    }
    
    updateMapArea();
};

// Gestión mejorada del panel de capas
const actualizarPanelCapas = () => {
    const panelCapas = document.getElementById('panelCapas');
    const noLayers = panelCapas.querySelector('.no-layers');
    const listaCapas = document.getElementById('listaCapas');
    
    console.log("📋 Actualizando panel de capas, capas disponibles:", Object.keys(window.capasCargadas || {}));
    
    if (Object.keys(window.capasCargadas || {}).length === 0) {
        noLayers.style.display = 'block';
        listaCapas.style.display = 'none';
        console.log("📋 Panel: Mostrando mensaje 'no hay capas'");
    } else {
        noLayers.style.display = 'none';
        listaCapas.style.display = 'block';
        console.log("📋 Panel: Mostrando lista de capas");
        
        // Resaltar brevemente las capas para mostrar actividad
        setTimeout(() => {
            const items = listaCapas.querySelectorAll('li');
            items.forEach((item, index) => {
                // Efecto de resaltado escalonado
                setTimeout(() => {
                    item.style.transition = 'all 0.3s ease';
                    item.style.transform = 'scale(1.02)';
                    item.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.3)';
                    
                    setTimeout(() => {
                        item.style.transform = 'scale(1)';
                        item.style.boxShadow = '';
                    }, 300);
                }, index * 100);
            });
        }, 200);
    }
};

// Hacer funciones accesibles globalmente
window.inicializarInterfaz = inicializarInterfaz;
window.toggleSidebar = toggleSidebar;
window.toggleInfoPanel = toggleInfoPanel;
window.actualizarPanelCapas = actualizarPanelCapas;
window.updateMapArea = updateMapArea;