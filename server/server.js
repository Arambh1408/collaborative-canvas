const express = require("express");
const WebSocket = require("ws");

const app = express();
app.use(express.static("client"));

const server = app.listen(3000, () =>
  console.log("Server running on 3000")
);

const wss = new WebSocket.Server({ server });

let strokes = [];
let undone = [];

wss.on("connection", (ws) => {
  // Send initial state
  ws.send(JSON.stringify({
    type: "state",
    strokes
  }));

  ws.on("message", (data) => {
    const msg = JSON.parse(data);

    /* ================= DRAW ================= */

    if (msg.type === "stroke") {
      strokes.push(msg.stroke);
      undone = [];
      broadcastState();
    }

    /* ================= UNDO ================= */

    if (msg.type === "undo") {
      if (strokes.length > 0) {
        undone.push(strokes.pop());
        broadcastState();
      }
    }

    /* ================= REDO ================= */

    if (msg.type === "redo") {
      if (undone.length > 0) {
        strokes.push(undone.pop());
        broadcastState();
      }
    }

    /* ================= CURSOR ================= */

    if (msg.type === "cursor") {
      broadcast({
        type: "cursor",
        x: msg.x,
        y: msg.y
      });
    }
  });
});

function broadcastState() {
  broadcast({
    type: "state",
    strokes
  });
}

function broadcast(msg) {
  const data = JSON.stringify(msg);
  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) {
      c.send(data);
    }
  });
}
