document.addEventListener('DOMContentLoaded', () => {
    const langSelect = document.getElementById('lang');
    const shortcutInput = document.getElementById('shortcut');
    const soundsCheck = document.getElementById('sounds');
    const autoSubmitCheck = document.getElementById('autoSubmit');
    const readerModeCheck = document.getElementById('readerMode');
    const submitCommandInput = document.getElementById('submitCommand');
    const voiceCommandToggleCheck = document.getElementById('voiceCommandToggle');
    const activationCommandInput = document.getElementById('activationCommand');
    const deactivationCommandInput = document.getElementById('deactivationCommand');
    const statusMsg = document.getElementById('status');

    let saveTimeout;
    let loaded = false;

    // Cargar ajustes guardados
    chrome.storage.sync.get({
        lang: 'es-AR',
        shortcut: 'Alt + M',
        sounds: true,
        autoSubmit: true,
        readerMode: true,
        submitCommand: 'enviar mensaje',
        voiceCommandToggle: false,
        activationCommand: 'activar',
        deactivationCommand: 'desactivar'
    }, (items) => {
        langSelect.value = items.lang;
        
        // El shortcut de storage es "Alt + M", extraemos solo la letra para el input visual
        let atajoGrabado = items.shortcut || 'Alt + M';
        if (atajoGrabado.length === 1) { // Por si acaso quedó la versión muy antigua
            atajoGrabado = 'Alt + ' + atajoGrabado.toUpperCase();
        }
        
        const partes = atajoGrabado.split('+');
        const letra = partes[partes.length - 1].trim().toUpperCase();
        shortcutInput.value = letra;
        
        soundsCheck.checked = items.sounds;
        autoSubmitCheck.checked = items.autoSubmit;
        readerModeCheck.checked = items.readerMode;
        submitCommandInput.value = items.submitCommand;
        
        if(voiceCommandToggleCheck) voiceCommandToggleCheck.checked = items.voiceCommandToggle;
        if(activationCommandInput) activationCommandInput.value = items.activationCommand;
        if(deactivationCommandInput) deactivationCommandInput.value = items.deactivationCommand;

        setTimeout(() => { loaded = true; }, 100);
    });

    // Función para guardar (con debounce para no saturar)
    const guardarAjustes = () => {
        if (!loaded) return;
        clearTimeout(saveTimeout);
        
        // Construimos el atajo real para pasarlo al content script
        let letraVisual = shortcutInput.value.trim().toUpperCase();
        if (!letraVisual) letraVisual = 'M'; // Fallback
        const shortcutReal = 'Alt + ' + letraVisual;

        chrome.storage.sync.set({
            lang: langSelect.value,
            shortcut: shortcutReal,
            sounds: soundsCheck.checked,
            autoSubmit: autoSubmitCheck.checked,
            readerMode: readerModeCheck.checked,
            submitCommand: submitCommandInput.value.trim(),
            voiceCommandToggle: voiceCommandToggleCheck ? voiceCommandToggleCheck.checked : false,
            activationCommand: activationCommandInput ? activationCommandInput.value.trim() : 'activar',
            deactivationCommand: deactivationCommandInput ? deactivationCommandInput.value.trim() : 'desactivar'
        }, () => {
            statusMsg.classList.add('show');
            saveTimeout = setTimeout(() => {
                statusMsg.classList.remove('show');
            }, 2000);
        });
    };

    // Escuchar cambios
    langSelect.addEventListener('change', guardarAjustes);
    soundsCheck.addEventListener('change', guardarAjustes);
    autoSubmitCheck.addEventListener('change', guardarAjustes);
    readerModeCheck.addEventListener('change', guardarAjustes);
    submitCommandInput.addEventListener('input', guardarAjustes);
    if(voiceCommandToggleCheck) voiceCommandToggleCheck.addEventListener('change', guardarAjustes);
    if(activationCommandInput) activationCommandInput.addEventListener('input', guardarAjustes);
    if(deactivationCommandInput) deactivationCommandInput.addEventListener('input', guardarAjustes);

    // Grabador de Atajo Limpio (Solo recibe 1 letra o número)
    shortcutInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') return; // Permitir navegar
        e.preventDefault();
        
        const key = e.key;
        // Solo aceptamos letras o números (1 solo caracter)
        if (key.length === 1 && /[a-zA-Z0-9]/.test(key)) {
            shortcutInput.value = key.toUpperCase();
            guardarAjustes();
        }
    });
    
    // Evitar pegar textos raros
    shortcutInput.addEventListener('paste', (e) => e.preventDefault());

    // Lógica para pestañas (Tabs)
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.add('active');
        });
    });
});
