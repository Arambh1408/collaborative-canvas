class WebSocketClient {
  constructor(url, joinData) {
    this.ws = new WebSocket(url);
    this.lastPingTime = 0;

    this.ws.onopen = () => {
      
      this.send({
        type: "join",
        ...joinData
      });

      
      setInterval(() => {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.lastPingTime = Date.now();
          this.send({ type: "ping" });
        }
      }, 2000);
    };

    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      
      if (msg.type === "error") {
        alert(msg.message);
        this.ws.close();
        return;
      }

      
      if (msg.type === "pong") {
        const latency = Date.now() - this.lastPingTime;
        const latencyEl = document.getElementById("latency");
        if (latencyEl) latencyEl.textContent = latency;
        return;
      }

      
      if (msg.type === "state") {
        canvasApp.setState(msg.strokes);
        return;
      }

      
      if (msg.type === "users") {
        renderUsers(msg.users);
        return;
      }

      
      if (msg.type === "cursor") {
        canvasApp.updateCursor(msg);
        return;
      }
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
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
  if (!container) return;

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
