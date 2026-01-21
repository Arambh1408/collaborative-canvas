let canvasApp;
let wsClient;

window.onload = () => {
  const canvas = document.getElementById("canvas");

  wsClient = new WebSocketClient("ws://localhost:3000");
  canvasApp = new CanvasApp(canvas);

  document.getElementById("color").onchange = e =>
    canvasApp.color = e.target.value;

  document.getElementById("width").onchange = e =>
    canvasApp.width = e.target.value;

  document.getElementById("undo").onclick = () =>
    wsClient.send({ type: "undo" });

  document.getElementById("redo").onclick = () =>
    wsClient.send({ type: "redo" });
};

function updateUserList(users) {
  const usersDiv = document.getElementById("users");
  usersDiv.innerHTML = "Online:";

  users.forEach(u => {
    const dot = document.createElement("div");
    dot.className = "user";
    dot.style.background = u.color;
    usersDiv.appendChild(dot);
  });
}
