window.VoiceAssistant = window.VoiceAssistant || {};

window.VoiceAssistant.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

window.VoiceAssistant.reproducirSonido = function(encendido) {
    if (!window.VoiceAssistant.configuracion.sounds) return;
    
    const ctx = window.VoiceAssistant.audioCtx;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.type = 'sine';
    
    if (encendido) {
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // Sube a A5
    } else {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1); // Baja a A4
    }
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
};
