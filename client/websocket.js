class WebSocketClient {
  constructor(url, joinData) {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.send({
        type: "join",
        ...joinData
      });
    };

    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "error") {
        alert(msg.message);
        this.ws.close();
        return;
      }

      if (msg.type === "state") {
        canvasApp.setState(msg.strokes);
      }

      if (msg.type === "users") {
        renderUsers(msg.users);
      }

      if (msg.type === "cursor") {
        canvasApp.updateCursor(msg);
      }
    };
  }

  send(data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

function renderUsers(users) {
  const container = document.getElementById("users");
  container.innerHTML = "Online:";

  users.forEach(u => {
    const dot = document.createElement("span");
    dot.className = "user-dot";
    dot.style.background = u.color;

    const name = document.createElement("span");
    name.className = "user-name";
    name.textContent = u.name;

    container.appendChild(dot);
    container.appendChild(name);
  });
}
