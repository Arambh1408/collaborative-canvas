let canvasApp;
let wsClient;

window.onload = () => {
  const canvas = document.getElementById("canvas");

  const name = prompt("Enter your name") || "Guest";

  canvasApp = new CanvasApp(canvas);
  wsClient = new WebSocketClient("ws://localhost:3000", name);

  document.getElementById("color").onchange = e =>
    canvasApp.color = e.target.value;

  document.getElementById("width").onchange = e =>
    canvasApp.width = e.target.value;

  document.getElementById("undo").onclick = () =>
    wsClient.send({ type: "undo" });

  document.getElementById("redo").onclick = () =>
    wsClient.send({ type: "redo" });
};
