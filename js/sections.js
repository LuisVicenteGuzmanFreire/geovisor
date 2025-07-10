// === Sistema de Secciones Colapsables ===

class SectionManager {
    constructor() {
        this.sections = [];
        this.storageKey = 'maptool-sections-state';
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.initializeSections();
            this.loadSectionStates();
        });
    }

    setupEventListeners() {
        // Obtener todas las cabeceras de sección
        const sectionHeaders = document.querySelectorAll('.section-header[data-section]');
        
        sectionHeaders.forEach(header => {
            const sectionId = header.getAttribute('data-section');
            const content = document.getElementById(sectionId);
            const toggleIcon = header.querySelector('.section-toggle');

            if (content && toggleIcon) {
                // Agregar evento de clic
                header.addEventListener('click', () => {
                    this.toggleSection(sectionId, header, content, toggleIcon);
                });

                // Registrar la sección
                this.sections.push({
                    id: sectionId,
                    header: header,
                    content: content,
                    toggleIcon: toggleIcon
                });
            }
        });
    }

    initializeSections() {
        // Inicializar todas las secciones con altura correcta
        this.sections.forEach(section => {
            if (section.content.classList.contains('collapsed')) {
                // Si ya tiene la clase collapsed, asegurar que esté bien colapsada
                section.content.style.maxHeight = '0px';
                section.toggleIcon.style.transform = 'rotate(-90deg)';
                section.header.classList.add('collapsed');
            } else {
                // Si no está colapsada, establecer altura automática
                section.content.style.maxHeight = 'none';
                section.toggleIcon.style.transform = 'rotate(0deg)';
                section.header.classList.remove('collapsed');
            }
        });
    }

    toggleSection(sectionId, header, content, toggleIcon) {
        const isCollapsed = content.classList.contains('collapsed');
        
        if (isCollapsed) {
            this._expandSection(sectionId, header, content, toggleIcon);
        } else {
            this._collapseSection(sectionId, header, content, toggleIcon);
        }

        // Guardar estado
        this.saveSectionState(sectionId, !isCollapsed);
        
        // Efecto de retroalimentación táctil
        this.addFeedbackEffect(header);
    }

    _expandSection(sectionId, header, content, toggleIcon) {
        // Primero establecer la altura para permitir la transición
        content.style.maxHeight = content.scrollHeight + 'px';
        
        // Remover clases collapsed
        content.classList.remove('collapsed');
        header.classList.remove('collapsed');
        
        // Animar icono
        toggleIcon.style.transform = 'rotate(0deg)';
        
        // Después de la animación, remover max-height para permitir contenido dinámico
        setTimeout(() => {
            if (!content.classList.contains('collapsed')) {
                content.style.maxHeight = 'none';
            }
        }, 300);
    }

    _collapseSection(sectionId, header, content, toggleIcon) {
        // Primero establecer la altura actual
        content.style.maxHeight = content.scrollHeight + 'px';
        
        // Forzar reflow para que el navegador aplique la altura
        content.offsetHeight;
        
        // Luego aplicar las clases collapsed
        content.classList.add('collapsed');
        header.classList.add('collapsed');
        
        // Animar icono
        toggleIcon.style.transform = 'rotate(-90deg)';
    }

    addFeedbackEffect(header) {
        // Efecto visual de clic
        header.style.transform = 'scale(0.98)';
        setTimeout(() => {
            header.style.transform = 'scale(1)';
        }, 100);
    }

    saveSectionState(sectionId, isExpanded) {
        try {
            const states = this.getSectionStates();
            states[sectionId] = isExpanded;
            localStorage.setItem(this.storageKey, JSON.stringify(states));
        } catch (e) {
            console.warn('No se pudo guardar el estado de la sección');
        }
    }

    getSectionStates() {
        try {
            const states = localStorage.getItem(this.storageKey);
            return states ? JSON.parse(states) : {};
        } catch (e) {
            return {};
        }
    }

    loadSectionStates() {
        const states = this.getSectionStates();
        
        // Si no hay estados guardados, establecer defaults
        if (Object.keys(states).length === 0) {
            this.setDefaultStates();
            return;
        }

        // Aplicar estados guardados
        this.sections.forEach(section => {
            const isExpanded = states[section.id];
            if (isExpanded === false) {
                section.content.classList.add('collapsed');
                section.header.classList.add('collapsed');
                section.content.style.maxHeight = '0px';
                section.toggleIcon.style.transform = 'rotate(-90deg)';
            } else {
                section.content.classList.remove('collapsed');
                section.header.classList.remove('collapsed');
                section.content.style.maxHeight = 'none';
                section.toggleIcon.style.transform = 'rotate(0deg)';
            }
        });
    }

    setDefaultStates() {
        // Por defecto: Cargar Datos y Navegación expandidas, otras colapsadas
        const defaultStates = {
            'cargar-datos': true,
            'navegacion': true,
            'exportar': false,
            'edicion': false
        };

        // Aplicar estados por defecto
        this.sections.forEach(section => {
            const isExpanded = defaultStates[section.id] ?? true;
            
            if (!isExpanded) {
                section.content.classList.add('collapsed');
                section.header.classList.add('collapsed');
                section.content.style.maxHeight = '0px';
                section.toggleIcon.style.transform = 'rotate(-90deg)';
            } else {
                section.content.classList.remove('collapsed');
                section.header.classList.remove('collapsed');
                section.content.style.maxHeight = 'none';
                section.toggleIcon.style.transform = 'rotate(0deg)';
            }
            
            this.saveSectionState(section.id, isExpanded);
        });
    }

    // Métodos públicos para control programático
    expandAllSections() {
        this.sections.forEach(section => {
            this._expandSection(
                section.id,
                section.header,
                section.content,
                section.toggleIcon
            );
            this.saveSectionState(section.id, true);
        });
    }

    collapseAllSections() {
        this.sections.forEach(section => {
            this._collapseSection(
                section.id,
                section.header,
                section.content,
                section.toggleIcon
            );
            this.saveSectionState(section.id, false);
        });
    }

    expandSectionById(sectionId) {
        const section = this.sections.find(s => s.id === sectionId);
        if (section) {
            this._expandSection(
                section.id,
                section.header,
                section.content,
                section.toggleIcon
            );
            this.saveSectionState(section.id, true);
        }
    }

    collapseSectionById(sectionId) {
        const section = this.sections.find(s => s.id === sectionId);
        if (section) {
            this._collapseSection(
                section.id,
                section.header,
                section.content,
                section.toggleIcon
            );
            this.saveSectionState(section.id, false);
        }
    }
}

// Inicializar el gestor de secciones
const sectionManager = new SectionManager();

// Exportar para uso global
window.sectionManager = sectionManager;