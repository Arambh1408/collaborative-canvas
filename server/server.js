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

wss.on("connection", (ws) => {
  // send initial state
  ws.send(JSON.stringify({
    type: "state",
    strokes
  }));

  ws.on("message", (data) => {
    const msg = JSON.parse(data);

    if (msg.type === "stroke") {
      strokes.push(msg.stroke);
      undone = [];
      broadcastState();
    }

    if (msg.type === "undo") {
      if (strokes.length > 0) {
        undone.push(strokes.pop());
        broadcastState();
      }
    }

    if (msg.type === "redo") {
      if (undone.length > 0) {
        strokes.push(undone.pop());
        broadcastState();
      }
    }

    if (msg.type === "cursor") {
      broadcast({
        type: "cursor",
        x: msg.x,
        y: msg.y
      }, ws);
    }
  });
});

function broadcastState() {
  broadcast({
    type: "state",
    strokes
  });
}

function broadcast(msg, except = null) {
  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN && c !== except) {
      c.send(JSON.stringify(msg));
    }
  });
}
