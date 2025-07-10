// === feedback.js ===
// Sistema de feedback visual para el usuario

const mostrarCargando = () => {
    document.getElementById('loadingOverlay').style.display = 'block';
    document.getElementById('loader').style.display = 'block';
};

const ocultarCargando = () => {
    document.getElementById('loadingOverlay').style.display = 'none';
    document.getElementById('loader').style.display = 'none';
};

const mostrarMensaje = (mensaje, tipo = 'info', duracion = 3000) => {
    const statusMessage = document.getElementById('statusMessage');
    
    // Limpiar clases anteriores
    statusMessage.className = 'status-message';
    
    // Agregar clase según el tipo
    if (tipo === 'success') {
        statusMessage.classList.add('success');
    } else if (tipo === 'error') {
        statusMessage.classList.add('error');
    } else if (tipo === 'warning') {
        statusMessage.classList.add('warning');
    }
    
    // Mostrar mensaje
    statusMessage.textContent = mensaje;
    statusMessage.style.display = 'block';
    
    // Ocultar automáticamente después de la duración especificada
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, duracion);
};

// Funciones de progreso para archivos
const actualizarProgreso = (porcentaje, mensaje = '') => {
    const loader = document.getElementById('loader');
    loader.innerHTML = `
        <div class="spinner"></div>
        <div style="margin-top: 10px; color: white; font-size: 12px; text-align: center;">
            ${mensaje}<br>
            ${porcentaje}%
        </div>
    `;
};

// Hacer las funciones accesibles globalmente
window.mostrarCargando = mostrarCargando;
window.ocultarCargando = ocultarCargando;
window.mostrarMensaje = mostrarMensaje;
window.actualizarProgreso = actualizarProgreso;