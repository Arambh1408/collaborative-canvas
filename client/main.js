let canvasApp;
let wsClient;

window.onload = () => {
  const canvas = document.getElementById("canvas");

  const name = prompt("Enter your name") || "Guest";

  const params = new URLSearchParams(window.location.search);
  const room = params.get("room") || "main";

  const password = prompt("Room password (leave blank if none)") || null;

  
  canvasApp = new CanvasApp(canvas);

  
  wsClient = new WebSocketClient("ws://localhost:3000", {
    name,
    room,
    password
  });

  

  document.getElementById("color").onchange = (e) => {
    canvasApp.color = e.target.value;
  };

  document.getElementById("width").onchange = (e) => {
    canvasApp.width = e.target.value;
  };

  document.getElementById("undo").onclick = () => {
    wsClient.send({ type: "undo" });
  };

  document.getElementById("redo").onclick = () => {
    wsClient.send({ type: "redo" });
  };

  document.getElementById("eraser").onclick = () => {
    canvasApp.tool = "eraser";
  };

  document.getElementById("brush").onclick = () => {
    canvasApp.tool = "brush";
  };

  
  let frames = 0;
  let lastTime = performance.now();

  function fpsLoop() {
    frames++;
    const now = performance.now();

    if (now - lastTime >= 1000) {
      const fpsEl = document.getElementById("fps");
      if (fpsEl) fpsEl.textContent = frames;

      frames = 0;
      lastTime = now;
    }

    requestAnimationFrame(fpsLoop);
  }

  requestAnimationFrame(fpsLoop);
};
