class WebSocketClient {
    constructor(url) {
        this.ws = new WebSocket(url);
        this.ws.onopen = () => console.log('Connected');
        this.ws.onmessage = (event) => this.handleMessage(JSON.parse(event.data));
        this.ws.onerror = (err) => console.error('WS Error:', err);
        this.ws.onclose = () => console.log('Disconnected');
    }

    send(data) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    handleMessage(msg) {
        switch (msg.type) {
            case 'user-info':
                window.userId = msg.userId;
                window.userColor = msg.color;
                break;
            case 'init':
                if (window.canvasApp) window.canvasApp.loadHistory(msg.operations);
                break;
            case 'draw-start':
            case 'draw-move':
            case 'draw-end':
                if (window.canvasApp) window.canvasApp.replayEvent(msg);
                break;
            case 'cursor':
                if (window.canvasApp) window.canvasApp.updateCursor(msg.userId, msg.x, msg.y);
                break;
            case 'undo':
                console.log('Undo received for operationId:', msg.operationId); // Debug log (remove after testing)
                if (window.canvasApp) window.canvasApp.undoOperation(msg.operationId);
                break;
            case 'redo':
                console.log('Redo received for operationId:', msg.operationId); // Debug log (remove after testing)
                if (window.canvasApp) window.canvasApp.redoOperation(msg.operationId);
                break;
            case 'user-list':
                if (window.canvasApp) window.canvasApp.updateUsers(msg.users);
                break;
        }
    }
}

// Note: Do NOT instantiate here. Moved to main.js to ensure canvasApp is ready.