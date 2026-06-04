window.VoiceAssistant = window.VoiceAssistant || {};

window.VoiceAssistant.tts = {};

window.VoiceAssistant.tts.textoSeleccionadoCache = '';
window.VoiceAssistant.tts.charMap = [];

window.VoiceAssistant.tts.limpiarResaltado = function() {
    if (typeof CSS !== 'undefined' && CSS.highlights) {
        CSS.highlights.delete('tts-lectura');
    }
};

window.VoiceAssistant.tts.mapearSeleccion = function(seleccion) {
    window.VoiceAssistant.tts.charMap = [];
    if (seleccion.rangeCount === 0) return;
    
    const rango = seleccion.getRangeAt(0);
    const textoSeleccionado = seleccion.toString();
    
    const treeWalker = document.createTreeWalker(
        rango.commonAncestorContainer,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                return rango.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
        }
    );

    let textoNodos = [];
    let node;
    while ((node = treeWalker.nextNode())) {
        let start = 0;
        let end = node.textContent.length;
        if (node === rango.startContainer) start = rango.startOffset;
        if (node === rango.endContainer) end = rango.endOffset;
        if (end > start) {
            textoNodos.push({
                node: node,
                localStart: start,
                text: node.textContent.substring(start, end)
            });
        }
    }

    let nodeIndex = 0;
    let currentLocalOffset = 0;

    for (let i = 0; i < textoSeleccionado.length; i++) {
        const char = textoSeleccionado[i];
        let found = false;

        while (nodeIndex < textoNodos.length) {
            const tNode = textoNodos[nodeIndex];
            if (currentLocalOffset >= tNode.text.length) {
                nodeIndex++;
                currentLocalOffset = 0;
                continue;
            }

            const nodeChar = tNode.text[currentLocalOffset];
            if (char === nodeChar) {
                window.VoiceAssistant.tts.charMap[i] = {
                    node: tNode.node,
                    localOffset: tNode.localStart + currentLocalOffset
                };
                currentLocalOffset++;
                found = true;
                break;
            } else if (/\s/.test(char) && !/\s/.test(nodeChar)) {
                if (i > 0) window.VoiceAssistant.tts.charMap[i] = window.VoiceAssistant.tts.charMap[i-1];
                found = true;
                break;
            } else if (!/\s/.test(char) && /\s/.test(nodeChar)) {
                currentLocalOffset++;
                continue; 
            } else {
                if (/\s/.test(char) && /\s/.test(nodeChar)) {
                     window.VoiceAssistant.tts.charMap[i] = {
                        node: tNode.node,
                        localOffset: tNode.localStart + currentLocalOffset
                    };
                    currentLocalOffset++;
                    found = true;
                    break;
                }
                currentLocalOffset++;
            }
        }
        
        if (!found && i > 0 && !window.VoiceAssistant.tts.charMap[i]) {
             window.VoiceAssistant.tts.charMap[i] = window.VoiceAssistant.tts.charMap[i-1];
        }
    }
};

window.VoiceAssistant.tts.findScrollContainer = function(element) {
    let parent = element;
    while (parent && parent !== document.body && parent !== document.documentElement) {
        const style = window.getComputedStyle(parent);
        const overflowY = style.overflowY;
        const isScrollable = overflowY === 'auto' || overflowY === 'scroll';
        if (isScrollable && parent.scrollHeight > parent.clientHeight) {
            return parent;
        }
        parent = parent.parentElement;
    }
    return window;
};

window.VoiceAssistant.tts.resaltarPalabra = function(charIndex, charLength) {
    if (!window.VoiceAssistant.tts.charMap || window.VoiceAssistant.tts.charMap.length === 0) return;
    if (typeof CSS === 'undefined' || !CSS.highlights) return; 

    let startIndex = charIndex;
    let endIndex = charIndex + charLength - 1;

    if (startIndex >= window.VoiceAssistant.tts.charMap.length) return;
    if (endIndex >= window.VoiceAssistant.tts.charMap.length) endIndex = window.VoiceAssistant.tts.charMap.length - 1;

    const startMap = window.VoiceAssistant.tts.charMap[startIndex];
    const endMap = window.VoiceAssistant.tts.charMap[endIndex];

    if (!startMap || !endMap) return;

    try {
        const range = new Range();
        range.setStart(startMap.node, startMap.localOffset);
        range.setEnd(endMap.node, endMap.localOffset + 1);

        const highlight = new Highlight(range);
        CSS.highlights.set('tts-lectura', highlight);

        const rects = range.getClientRects();
        if (rects.length > 0) {
            const rect = rects[0];
            const el = endMap.node.parentElement;
            
            if (el) {
                const scrollContainer = window.VoiceAssistant.tts.findScrollContainer(el);
                const isWindow = scrollContainer === window;
                
                let containerTop = isWindow ? 0 : scrollContainer.getBoundingClientRect().top;
                let containerBottom = isWindow ? window.innerHeight : scrollContainer.getBoundingClientRect().bottom;
                
                const buffer = 100; 
                
                if (rect.bottom > containerBottom - buffer) {
                    scrollContainer.scrollBy({
                        top: Math.max(50, rect.bottom - (containerBottom - buffer)),
                        behavior: 'smooth'
                    });
                } else if (rect.top < containerTop + buffer) {
                    scrollContainer.scrollBy({
                        top: Math.min(-50, rect.top - (containerTop + buffer)),
                        behavior: 'smooth'
                    });
                }
            }
        }
    } catch (e) {
        // Fallback silencioso si el DOM cambió
    }
};

window.VoiceAssistant.tts.detenerLectura = function() {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    const readerButton = window.VoiceAssistant.ui.readerButton;
    if (readerButton) readerButton.classList.remove('leyendo');
    window.VoiceAssistant.tts.limpiarResaltado();
};

window.VoiceAssistant.tts.leerTexto = function(texto) {
    window.VoiceAssistant.tts.detenerLectura();
    if (!texto) return;

    const currentUtterance = new SpeechSynthesisUtterance(texto);
    currentUtterance.lang = window.VoiceAssistant.configuracion.lang;
    
    const readerButton = window.VoiceAssistant.ui.readerButton;
    currentUtterance.onstart = () => readerButton.classList.add('leyendo');
    currentUtterance.onend = () => {
        readerButton.classList.remove('leyendo');
        window.VoiceAssistant.tts.limpiarResaltado();
    };
    currentUtterance.onerror = () => {
        readerButton.classList.remove('leyendo');
        window.VoiceAssistant.tts.limpiarResaltado();
    };
    
    currentUtterance.onboundary = (e) => {
        if (e.name === 'word') {
            let length = e.charLength;
            if (!length) {
                const remaining = texto.substring(e.charIndex);
                const match = remaining.match(/\s|$/);
                length = match ? match.index : remaining.length;
                if (length === 0) length = 1;
            }
            window.VoiceAssistant.tts.resaltarPalabra(e.charIndex, length);
        }
    };
    
    window.speechSynthesis.speak(currentUtterance);
};

window.VoiceAssistant.tts.initEvents = function() {
    const readerButton = window.VoiceAssistant.ui.readerButton;
    
    readerButton.addEventListener('mousedown', (e) => {
        e.preventDefault(); 
        e.stopPropagation();
        if (window.speechSynthesis.speaking) {
            window.VoiceAssistant.tts.detenerLectura();
        } else {
            window.VoiceAssistant.tts.leerTexto(window.VoiceAssistant.tts.textoSeleccionadoCache);
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (e.target === readerButton || readerButton.contains(e.target)) return;

        if (!window.VoiceAssistant.configuracion.readerMode) {
            readerButton.style.display = 'none';
            return;
        }
        
        setTimeout(() => {
            const seleccion = window.getSelection();
            const texto = seleccion.toString().trim();
            
            if (texto.length > 0) {
                window.VoiceAssistant.tts.textoSeleccionadoCache = texto;
                window.VoiceAssistant.tts.mapearSeleccion(seleccion); // Construir mapa de Nodos
                
                readerButton.style.top = `${window.scrollY + e.clientY + 15}px`;
                readerButton.style.left = `${window.scrollX + e.clientX + 10}px`;
                readerButton.style.display = 'flex';
            } else {
                if (!window.speechSynthesis.speaking) {
                    readerButton.style.display = 'none';
                }
            }
        }, 10);
    });

    document.addEventListener('mousedown', (event) => {
        if (event.target !== readerButton && !readerButton.contains(event.target)) {
            if (!window.speechSynthesis.speaking) {
                readerButton.style.display = 'none';
            }
        }
    });
};
