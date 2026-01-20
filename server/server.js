const express = require("express");
const WebSocket = require("ws");

const app = express();
app.use(express.static("client"));

const server = app.listen(3000, () =>
  console.log("Server on 3000")
);

const wss = new WebSocket.Server({ server });

const strokes = [];

wss.on("connection", (ws) => {
  // Send existing canvas
  ws.send(JSON.stringify({
    type: "init",
    strokes
  }));

  ws.on("message", (data) => {
    const msg = JSON.parse(data);

    if (msg.type === "stroke:start") {
      strokes.push(msg.stroke);
      broadcast({
        type: "stroke",
        stroke: msg.stroke
      });
    }

    if (msg.type === "stroke:move") {
      const stroke = strokes.find(s => s.id === msg.id);
      if (stroke) stroke.path.push(msg.point);
      broadcast({ type: "noop" });
    }
  });
});

function broadcast(msg) {
  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) {
      c.send(JSON.stringify(msg));
    }
  });
}
