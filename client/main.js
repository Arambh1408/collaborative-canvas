// Wait for DOM to load before attaching events and initializing
window.addEventListener('load', () => {
    // Initialize WebSocket client first
    window.wsClient = new WebSocketClient('ws://localhost:3000');
    
    // Initialize canvas app after WebSocket
    const canvasElement = document.getElementById('canvas');
    if (canvasElement) {
        window.canvasApp = new CanvasApp(canvasElement);
    } else {
        console.error('Canvas element not found');
    }
    
    // Send join message
    if (window.wsClient) {
        window.wsClient.send({type: 'join'});
    }
    
    // Attach event listeners only after initialization
    const brushBtn = document.getElementById('brush');
    const eraserBtn = document.getElementById('eraser');
    const colorPicker = document.getElementById('color');
    const widthSlider = document.getElementById('width');
    const undoBtn = document.getElementById('undo');
    const redoBtn = document.getElementById('redo');
    
    if (brushBtn && window.canvasApp) {
        brushBtn.onclick = () => {
            window.canvasApp.tool = 'brush';
            // Reset color to the picker's value when switching to brush
            if (colorPicker) {
                window.canvasApp.color = colorPicker.value;
            }
        };
    }
    
    if (eraserBtn && window.canvasApp) {
        eraserBtn.onclick = () => {
            window.canvasApp.tool = 'eraser';
            // Set to white for erasing, but don't change the picker
            window.canvasApp.color = '#ffffff';
        };
    }
    
    if (colorPicker && window.canvasApp) {
        colorPicker.onchange = (e) => {
            if (window.canvasApp.tool !== 'eraser') {
                window.canvasApp.color = e.target.value;
            }
        };
    }
    
    if (widthSlider && window.canvasApp) {
        widthSlider.onchange = (e) => {
            window.canvasApp.width = e.target.value;
        };
    }
    
    if (undoBtn && window.wsClient) {
        undoBtn.onclick = () => {
            window.wsClient.send({type: 'undo', userId: window.userId});
        };
    }
    
    if (redoBtn && window.wsClient) {
        redoBtn.onclick = () => {
            window.wsClient.send({type: 'redo', userId: window.userId});
        };
    }
});