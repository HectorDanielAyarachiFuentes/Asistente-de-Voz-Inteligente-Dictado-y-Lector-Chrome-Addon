window.VoiceAssistant = window.VoiceAssistant || {};

window.VoiceAssistant.ui = {};

window.VoiceAssistant.ui.init = function() {
    // Crear el botón del micrófono
    const micButton = document.createElement('button');
    micButton.className = 'btn-microfono-dictado';
    micButton.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    `;
    document.body.appendChild(micButton);
    window.VoiceAssistant.ui.micButton = micButton;

    // Crear el botón de lector de texto
    const readerButton = document.createElement('button');
    readerButton.className = 'btn-lector-texto';
    readerButton.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
      </svg>
    `;
    document.body.appendChild(readerButton);
    window.VoiceAssistant.ui.readerButton = readerButton;
};

window.VoiceAssistant.ui.posicionarMicBoton = function(elemento) {
    window.VoiceAssistant.campoActivo = elemento;
    const rect = elemento.getBoundingClientRect();
    const topPos = window.scrollY + rect.top;
    const leftPos = window.scrollX + rect.left;
    
    const micButton = window.VoiceAssistant.ui.micButton;
    micButton.style.top = `${topPos + (rect.height / 2) - 18}px`; 
    micButton.style.left = `${Math.max(10, leftPos - 45)}px`; 
    micButton.style.display = 'flex';
};
