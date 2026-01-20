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
                window.canvasApp.loadHistory(msg.operations);
                break;
            case 'draw-start':
            case 'draw-move':
            case 'draw-end':
                window.canvasApp.replayEvent(msg);
                break;
            case 'cursor':
                window.canvasApp.updateCursor(msg.userId, msg.x, msg.y);
                break;
            case 'undo':
                window.canvasApp.undoOperation(msg.operationId);
                break;
            case 'redo':
                window.canvasApp.redoOperation(msg.operationId);
                break;
            case 'user-list':
                window.canvasApp.updateUsers(msg.users);
                break;
        }
    }
}

window.wsClient = new WebSocketClient('ws://localhost:3000');