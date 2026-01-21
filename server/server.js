const express = require("express");
const WebSocket = require("ws");
const crypto = require("crypto");

const app = express();
app.use(express.static("client"));

const server = app.listen(3000, () =>
  console.log("Server running on 3000")
);

const wss = new WebSocket.Server({ server });

let strokes = [];
let undone = [];
let users = {}; // socketId -> name

wss.on("connection", (ws) => {
  const id = crypto.randomUUID();

  ws.on("message", (data) => {
    const msg = JSON.parse(data);

    if (msg.type === "join") {
      users[id] = msg.name;
      broadcastUsers();
      ws.send(JSON.stringify({ type: "state", strokes }));
      return;
    }

    if (msg.type === "stroke") {
      strokes.push(msg.stroke);
      undone = [];
      broadcastState();
    }

    if (msg.type === "undo" && strokes.length) {
      undone.push(strokes.pop());
      broadcastState();
    }

    if (msg.type === "redo" && undone.length) {
      strokes.push(undone.pop());
      broadcastState();
    }

    if (msg.type === "cursor") {
      broadcast({
        type: "cursor",
        x: msg.x,
        y: msg.y
      });
    }
  });

  ws.on("close", () => {
    delete users[id];
    broadcastUsers();
  });
});

function broadcastState() {
  broadcast({ type: "state", strokes });
}

function broadcastUsers() {
  broadcast({
    type: "users",
    users: Object.values(users)
  });
}

function broadcast(msg ) {
  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN ) {
      c.send(JSON.stringify(msg));
    }
  });
}
