window.VoiceAssistant = window.VoiceAssistant || {};

window.VoiceAssistant.speech = {};

window.VoiceAssistant.speech.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
// Al poner continuous en false, Chrome cerrará automáticamente el ciclo cuando hagas una pausa.
// Nuestro evento onend lo reiniciará al instante, garantizando que el motor de Google jamás se congele.
window.VoiceAssistant.speech.recognition.continuous = false;
window.VoiceAssistant.speech.recognition.interimResults = true;

window.VoiceAssistant.speech.estaGrabando = false;
window.VoiceAssistant.speech.longitudInterinaAnterior = 0;

window.VoiceAssistant.speech.procesarPuntuacion = function(texto) {
    return texto
        .replace(/\b(punto)\b/gi, '.')
        .replace(/\b(coma)\b/gi, ',')
        .replace(/\b(nueva línea)\b/gi, '\n')
        .replace(/\b(signo de interrogación)\b/gi, '?')
        .replace(/\s+([.,?])/g, '$1');
};

window.VoiceAssistant.speech.retrocederSeleccion = function(caracteres) {
    if (caracteres <= 0) return;
    const sel = window.getSelection();
    for (let i = 0; i < caracteres; i++) {
        sel.modify("extend", "backward", "character");
    }
};

window.VoiceAssistant.speech.toggleGrabacion = function() {
    const rec = window.VoiceAssistant.speech.recognition;
    const micButton = window.VoiceAssistant.ui.micButton;
    
    if (window.VoiceAssistant.speech.estaGrabando) {
        rec.stop();
        micButton.classList.remove('grabando');
        window.VoiceAssistant.speech.longitudInterinaAnterior = 0;
        window.VoiceAssistant.reproducirSonido(false);
    } else {
        window.VoiceAssistant.speech.longitudInterinaAnterior = 0;
        try {
            rec.start();
        } catch (e) {
            console.warn("Recognition already started", e);
        }
        micButton.classList.add('grabando');
        window.VoiceAssistant.reproducirSonido(true);
    }
    window.VoiceAssistant.speech.estaGrabando = !window.VoiceAssistant.speech.estaGrabando;
};

window.VoiceAssistant.speech.initEvents = function() {
    const rec = window.VoiceAssistant.speech.recognition;
    
    // Sincronizar el idioma
    window.addEventListener('VoiceAssistantConfigChanged', () => {
        rec.lang = window.VoiceAssistant.configuracion.lang;
    });

    rec.onresult = (event) => {
        const campoActivo = window.VoiceAssistant.campoActivo;
        if (!campoActivo) return;

        let textoInterino = '';
        let textoFinal = '';

        let fraseFinalizada = false;
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                textoFinal += event.results[i][0].transcript;
                fraseFinalizada = true;
            } else {
                textoInterino += event.results[i][0].transcript;
            }
        }

        let debeEnviar = false;

        const { autoSubmit, submitCommand } = window.VoiceAssistant.configuracion;
        if (textoFinal !== '' && autoSubmit && submitCommand) {
            const comandoEscapado = submitCommand.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regexEnviar = new RegExp(comandoEscapado + '\\.?$', 'i');
            if (regexEnviar.test(textoFinal)) {
                debeEnviar = true;
                textoFinal = textoFinal.replace(regexEnviar, '').trim();
            }
        }

        const textoBase = textoFinal !== '' ? textoFinal + (textoFinal.length > 0 && !debeEnviar ? " " : "") : textoInterino;
        const textoAInsertar = window.VoiceAssistant.speech.procesarPuntuacion(textoBase);

        if (textoAInsertar !== '') {
            if (campoActivo.isContentEditable) {
                campoActivo.focus();
                window.VoiceAssistant.speech.retrocederSeleccion(window.VoiceAssistant.speech.longitudInterinaAnterior);
                document.execCommand('insertText', false, textoAInsertar);
            } else {
                const start = (campoActivo.selectionEnd || 0) - window.VoiceAssistant.speech.longitudInterinaAnterior;
                const end = campoActivo.selectionEnd || 0;
                const text = campoActivo.value || "";
                
                campoActivo.value = text.substring(0, start) + textoAInsertar + text.substring(end);
                campoActivo.selectionStart = campoActivo.selectionEnd = start + textoAInsertar.length;
                
                campoActivo.dispatchEvent(new Event('input', { bubbles: true }));
                campoActivo.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            // Forzar el auto-scroll hacia abajo para seguir la lectura/escritura
            campoActivo.scrollTop = campoActivo.scrollHeight;
            
            if (textoFinal !== '' || debeEnviar) {
                window.VoiceAssistant.speech.longitudInterinaAnterior = 0;
            } else {
                window.VoiceAssistant.speech.longitudInterinaAnterior = textoAInsertar.length;
            }
        }

        if (debeEnviar) {
            if (window.VoiceAssistant.speech.estaGrabando) {
                window.VoiceAssistant.speech.toggleGrabacion();
            }
            
            setTimeout(() => {
                const enterDown = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, keyCode: 13, key: 'Enter' });
                campoActivo.dispatchEvent(enterDown);
            }, 100);
        }
    };

    rec.onerror = (event) => {
        console.error("Dictado Rápido - Error: ", event.error);
        if (event.error === 'not-allowed') {
            alert("¡Permiso de micrófono denegado!\n\nPermite el acceso al Micrófono.");
            if (window.VoiceAssistant.speech.estaGrabando) {
                window.VoiceAssistant.speech.toggleGrabacion();
            }
        }
    };

    rec.onend = () => {
        if (window.VoiceAssistant.speech.estaGrabando) {
            try {
                window.VoiceAssistant.speech.longitudInterinaAnterior = 0;
                rec.start();
            } catch (e) {
                console.error(e);
            }
        } else {
            window.VoiceAssistant.ui.micButton.classList.remove('grabando');
        }
    };
};
