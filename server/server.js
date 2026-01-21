const express = require("express");
const WebSocket = require("ws");
const crypto = require("crypto");

const app = express();
app.use(express.static("client"));

const server = app.listen(3000, () =>
  console.log("Server on 3000")
);

const wss = new WebSocket.Server({ server });

const strokes = [];

// simple bright color generator
function randomColor() {
  return `hsl(${Math.floor(Math.random() * 360)}, 80%, 50%)`;
}

wss.on("connection", (ws) => {
  const userId = crypto.randomUUID();
  const color = randomColor();

  // send existing canvas (optional; safe to keep)
  ws.send(JSON.stringify({
    type: "init",
    strokes
  }));

  ws.on("message", (data) => {
    const msg = JSON.parse(data);

    // drawing
    if (msg.type === "stroke:start") {
      strokes.push(msg.stroke);
      broadcast({
        type: "stroke",
        stroke: msg.stroke
      }, ws);
    }

    if (msg.type === "stroke:move") {
      const stroke = strokes.find(s => s.id === msg.id);
      if (stroke) stroke.path.push(msg.point);
    }

    // cursor (ephemeral)
    if (msg.type === "cursor") {
      broadcast({
        type: "cursor",
        userId,
        color,
        x: msg.x,
        y: msg.y
      }, ws);
    }
  });
});

function broadcast(msg, sender) {
  wss.clients.forEach(c => {
    if (c !== sender && c.readyState === WebSocket.OPEN) {
      c.send(JSON.stringify(msg));
    }
  });
}
