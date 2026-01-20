const express = require('express');
const WebSocket = require('ws');
const { RoomManager } = require('./rooms');
const { DrawingState } = require('./drawing-state');

const app = express();
app.use(express.static('client'));
const server = app.listen(3000, () => console.log('Server on 3000'));
const wss = new WebSocket.Server({ server });

const roomManager = new RoomManager();

wss.on('connection', (ws) => {
    const userId = Date.now().toString();
    const color = '#' + Math.floor(Math.random()*16777215).toString(16); // Random color
    const room = roomManager.getRoom('default'); // Single room
    room.addUser(userId, color, ws);

    ws.send(JSON.stringify({type: 'user-info', userId, color}));
    ws.send(JSON.stringify({type: 'init', operations: room.drawingState.operations}));
    room.broadcast({type: 'user-list', users: room.getUsers()});

    ws.on('message', (data) => {
        const msg = JSON.parse(data);
        msg.userId = userId; // Ensure userId
        room.handleMessage(msg);
    });

    ws.on('close', () => {
        room.removeUser(userId);
        room.broadcast({type: 'user-list', users: room.getUsers()});
    });
});