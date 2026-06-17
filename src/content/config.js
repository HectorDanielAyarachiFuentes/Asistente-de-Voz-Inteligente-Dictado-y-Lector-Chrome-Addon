window.VoiceAssistant = window.VoiceAssistant || {};

window.VoiceAssistant.configuracion = {
    lang: 'es-AR',
    shortcut: 'Alt + M',
    sounds: true,
    autoSubmit: true,
    readerMode: true,
    submitCommand: 'enviar mensaje',
    voiceCommandToggle: true,
    activationCommand: 'activar',
    deactivationCommand: 'desactivar'
};

window.VoiceAssistant.initStorage = function(onReady) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(window.VoiceAssistant.configuracion, (items) => {
            window.VoiceAssistant.configuracion = items;
            if (window.VoiceAssistant.configuracion.shortcut && window.VoiceAssistant.configuracion.shortcut.length === 1) {
                window.VoiceAssistant.configuracion.shortcut = 'Alt + ' + window.VoiceAssistant.configuracion.shortcut.toUpperCase();
            }
            if (onReady) onReady();
        });

        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync') {
                for (let [key, { newValue }] of Object.entries(changes)) {
                    window.VoiceAssistant.configuracion[key] = newValue;
                }
                if (window.VoiceAssistant.configuracion.shortcut && window.VoiceAssistant.configuracion.shortcut.length === 1) {
                    window.VoiceAssistant.configuracion.shortcut = 'Alt + ' + window.VoiceAssistant.configuracion.shortcut.toUpperCase();
                }
                window.dispatchEvent(new CustomEvent('VoiceAssistantConfigChanged'));
            }
        });
    } else {
        if (onReady) onReady();
    }
};
