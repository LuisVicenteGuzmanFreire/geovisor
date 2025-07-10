// === Modal de Información ===

// Función para mostrar el modal de información
const mostrarModalInformacion = () => {
    const overlay = document.getElementById('infoModalOverlay');
    overlay.style.display = 'flex';
    
    // Agregar animación de entrada
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 10);
};

// Función para cerrar el modal de información
const cerrarModalInformacion = () => {
    const overlay = document.getElementById('infoModalOverlay');
    overlay.style.opacity = '0';
    
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
};

// Event listeners para el modal de información
document.addEventListener('DOMContentLoaded', () => {
    // Botón para abrir el modal
    const btnInformacion = document.getElementById('btnInformacion');
    if (btnInformacion) {
        btnInformacion.addEventListener('click', mostrarModalInformacion);
    }
    
    // Botón X para cerrar el modal
    const btnCerrar = document.getElementById('infoModalClose');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', cerrarModalInformacion);
    }
    
    // Botón "Entendido" para cerrar el modal
    const btnAceptar = document.getElementById('infoModalAccept');
    if (btnAceptar) {
        btnAceptar.addEventListener('click', cerrarModalInformacion);
    }
    
    // Cerrar modal al hacer clic en el overlay (fondo)
    const overlay = document.getElementById('infoModalOverlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                cerrarModalInformacion();
            }
        });
    }
    
    // Cerrar modal con tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('infoModalOverlay');
            if (overlay && overlay.style.display === 'flex') {
                cerrarModalInformacion();
            }
        }
    });
});

// Función para actualizar información dinámica (opcional para futuras versiones)
const actualizarInfoVersion = () => {
    const fechaActual = new Date();
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const fechaFormateada = `${meses[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`;
    
    // Esta función puede usarse para actualizar dinámicamente la fecha
    // si se quiere mostrar la última fecha de acceso, etc.
    console.log(`Información del geovisor actualizada: ${fechaFormateada}`);
};

// Exportar funciones para uso global
window.mostrarModalInformacion = mostrarModalInformacion;
window.cerrarModalInformacion = cerrarModalInformacion;