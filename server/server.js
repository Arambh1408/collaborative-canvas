const express = require("express");
const WebSocket = require("ws");
const crypto = require("crypto");

const app = express();
app.use(express.static("client"));

const server = app.listen(3000);
const wss = new WebSocket.Server({ server });

let strokes = [];
let undone = [];
let users = {}; // userId -> { name, color, ws }

function randomColor() {
  return `hsl(${Math.random() * 360}, 70%, 50%)`;
}

wss.on("connection", (ws) => {
  const userId = crypto.randomUUID();

  ws.on("message", (data) => {
    const msg = JSON.parse(data);

    if (msg.type === "join") {
      users[userId] = {
        name: msg.name,
        color: randomColor(),
        ws
      };

      broadcast({
        type: "users",
        users: Object.entries(users).map(([id, u]) => ({
          id,
          name: u.name,
          color: u.color
        }))
      });

      ws.send(JSON.stringify({ type: "state", strokes }));
    }

    if (msg.type === "stroke") {
      strokes.push(msg.stroke);
      undone = [];
      broadcast({ type: "state", strokes });
    }

    if (msg.type === "undo") {
      if (strokes.length) undone.push(strokes.pop());
      broadcast({ type: "state", strokes });
    }

    if (msg.type === "redo") {
      if (undone.length) strokes.push(undone.pop());
      broadcast({ type: "state", strokes });
    }

    if (msg.type === "cursor") {
      const u = users[userId];
      if (!u) return;

      broadcast({
        type: "cursor",
        userId,
        name: u.name,
        color: u.color,
        x: msg.x,
        y: msg.y
      });
    }
  });

  ws.on("close", () => {
    delete users[userId];
    broadcast({
      type: "users",
      users: Object.entries(users).map(([id, u]) => ({
        id,
        name: u.name,
        color: u.color
      }))
    });
  });
});

function broadcast(msg) {
  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) {
      c.send(JSON.stringify(msg));
    }
  });
}
