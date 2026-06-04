window.VoiceAssistant = window.VoiceAssistant || {};

window.VoiceAssistant.campoActivo = null;

window.VoiceAssistant.obtenerCampoDeTexto = function(evento) {
    let elemento = evento.target;
    if (evento.composedPath) {
        const path = evento.composedPath();
        if (path.length > 0) elemento = path[0];
    }
    const esCampoDeTexto = 
        elemento.tagName === 'INPUT' || 
        elemento.tagName === 'TEXTAREA' || 
        elemento.isContentEditable || 
        (elemento.hasAttribute && elemento.getAttribute('role') === 'textbox');
    return esCampoDeTexto ? elemento : null;
};

// Punto de entrada
window.VoiceAssistant.initStorage(() => {
    // Inicializar UI
    window.VoiceAssistant.ui.init();
    
    // Inicializar sub-módulos
    window.VoiceAssistant.speech.recognition.lang = window.VoiceAssistant.configuracion.lang;
    window.VoiceAssistant.speech.initEvents();
    window.VoiceAssistant.tts.initEvents();

    const { ui, speech } = window.VoiceAssistant;

    // Eventos Globales de Interacción
    document.addEventListener('focusin', (event) => {
        const campo = window.VoiceAssistant.obtenerCampoDeTexto(event);
        if (campo) ui.posicionarMicBoton(campo);
    });

    document.addEventListener('mouseover', (event) => {
        const campo = window.VoiceAssistant.obtenerCampoDeTexto(event);
        if (campo) window.VoiceAssistant.campoActivo = campo;
    });

    // Atajo de teclado (Macro)
    document.addEventListener('keydown', (event) => {
        if (!window.VoiceAssistant.configuracion.shortcut) return;
        
        const savedKeys = window.VoiceAssistant.configuracion.shortcut.split(' + ');
        const needsCtrl = savedKeys.includes('Ctrl');
        const needsAlt = savedKeys.includes('Alt');
        const needsShift = savedKeys.includes('Shift');
        const needsMeta = savedKeys.includes('Meta');
        const key = savedKeys[savedKeys.length - 1];

        if (
            event.ctrlKey === needsCtrl &&
            event.altKey === needsAlt &&
            event.shiftKey === needsShift &&
            event.metaKey === needsMeta &&
            event.key.toUpperCase() === key.toUpperCase() &&
            window.VoiceAssistant.campoActivo
        ) {
            event.preventDefault(); 
            
            if (ui.micButton.style.display === 'none' || ui.micButton.style.display === '') {
                ui.posicionarMicBoton(window.VoiceAssistant.campoActivo);
            }
            speech.toggleGrabacion();
        }
    });

    // Ocultar micrófono al hacer clic fuera
    document.addEventListener('mousedown', (event) => {
        // Ignorar si clicamos en el botón de lectura, en el de micrófono o en el input
        if (
            event.target !== window.VoiceAssistant.campoActivo && 
            event.target !== ui.micButton && !ui.micButton.contains(event.target) &&
            event.target !== ui.readerButton && !ui.readerButton.contains(event.target)
        ) {
            ui.micButton.style.display = 'none';
            if (speech.estaGrabando) speech.toggleGrabacion();
        }
    });

    ui.micButton.addEventListener('click', (event) => {
        event.preventDefault();
        speech.toggleGrabacion();
    });
});
