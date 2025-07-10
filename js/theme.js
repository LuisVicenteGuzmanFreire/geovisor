// === Sistema de Tema Claro/Oscuro ===

class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'dark';
        this.themeToggleBtn = null;
        this.themeIcon = null;
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.themeToggleBtn = document.getElementById('themeToggle');
            this.themeIcon = this.themeToggleBtn?.querySelector('i');
            
            if (this.themeToggleBtn) {
                this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
                this.updateIcon();
            }
        });

        // Escuchar cambios en las preferencias del sistema
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!this.getStoredTheme()) {
                    this.currentTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme(this.currentTheme);
                    this.updateIcon();
                }
            });
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        this.storeTheme(this.currentTheme);
        this.updateIcon();
        this.animateToggle();
        
        // Disparar evento personalizado para que otros componentes respondan
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme: this.currentTheme }
        }));
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Actualizar meta theme-color para dispositivos móviles
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        const themeColor = theme === 'dark' ? '#1e293b' : '#ffffff';
        
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', themeColor);
        } else {
            const meta = document.createElement('meta');
            meta.name = 'theme-color';
            meta.content = themeColor;
            document.head.appendChild(meta);
        }
    }

    updateIcon() {
        if (this.themeIcon) {
            // Animación suave de cambio de icono
            this.themeIcon.style.transform = 'scale(0)';
            
            setTimeout(() => {
                this.themeIcon.className = this.currentTheme === 'light' 
                    ? 'fas fa-moon' 
                    : 'fas fa-sun';
                this.themeIcon.style.transform = 'scale(1)';
            }, 150);

            // Actualizar tooltip
            if (this.themeToggleBtn) {
                this.themeToggleBtn.title = this.currentTheme === 'light' 
                    ? 'Cambiar a tema oscuro' 
                    : 'Cambiar a tema claro';
            }
        }
    }

    animateToggle() {
        // Efecto visual de cambio de tema
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${this.currentTheme === 'dark' ? 'radial-gradient(circle, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0) 70%)' : 'radial-gradient(circle, rgba(248,250,252,0.8) 0%, rgba(248,250,252,0) 70%)'};
            pointer-events: none;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(overlay);
        
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
        
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 300);
        }, 100);
    }

    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    getStoredTheme() {
        try {
            return localStorage.getItem('maptool-theme');
        } catch (e) {
            return null;
        }
    }

    storeTheme(theme) {
        try {
            localStorage.setItem('maptool-theme', theme);
        } catch (e) {
            console.warn('No se pudo guardar la preferencia de tema');
        }
    }

    // Método público para obtener el tema actual
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Método público para cambiar programáticamente el tema
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.currentTheme = theme;
            this.applyTheme(theme);
            this.storeTheme(theme);
            this.updateIcon();
        }
    }
}

// Inicializar el gestor de temas inmediatamente
const themeManager = new ThemeManager();

// Exportar para uso global
window.themeManager = themeManager;

// Funciones de utilidad para otros scripts
window.getCurrentTheme = () => themeManager.getCurrentTheme();
window.setTheme = (theme) => themeManager.setTheme(theme);
window.toggleTheme = () => themeManager.toggleTheme();