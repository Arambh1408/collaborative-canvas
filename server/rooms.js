const { DrawingState } = require('./drawing-state');

class Room {
    constructor(id) {
        this.id = id;
        this.users = {}; // {userId: {color, ws}}
        this.drawingState = new DrawingState();
    }

    addUser(userId, color, ws) {
        this.users[userId] = {color, ws};
    }

    removeUser(userId) {
        delete this.users[userId];
    }

    getUsers() {
        return Object.keys(this.users).map(id => ({id, color: this.users[id].color}));
    }

    broadcast(msg) {
        Object.values(this.users).forEach(user => {
            if (user.ws.readyState === WebSocket.OPEN) {
                user.ws.send(JSON.stringify(msg));
            }
        });
    }

    handleMessage(msg) {
        switch (msg.type) {
            case 'join':
                // Already handled in server.js
                break;
            case 'draw-start':
                const op = {id: Date.now() + Math.random(), type: 'stroke', path: [{x: msg.x, y: msg.y}], color: msg.color, width: msg.width};
                this.drawingState.addOperation(op);
                this.broadcast({type: 'draw-start', id: op.id, ...msg});
                break;
            case 'draw-move':
                // Find the operation and add to path
                const operation = this.drawingState.operations.find(o => o.id === msg.id);
                if (operation) operation.path.push({x: msg.x, y: msg.y});
                this.broadcast(msg);
                break;
            case 'draw-end':
                this.broadcast(msg);
                break;
            case 'cursor':
                this.broadcast(msg);
                break;
            case 'undo':
                const undoneId = this.drawingState.undo();
                if (undoneId) this.broadcast({type: 'undo', operationId: undoneId});
                break;
            case 'redo':
                const redoneId = this.drawingState.redo();
                if (redoneId) this.broadcast({type: 'redo', operationId: redoneId});
                break;
        }
    }
}

class RoomManager {
    constructor() {
        this.rooms = {};
    }

    getRoom(id) {
        if (!this.rooms[id]) {
            this.rooms[id] = new Room(id);
        }
        return this.rooms[id];
    }
}

module.exports = { RoomManager };