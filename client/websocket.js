class WebSocketClient {
  constructor(url) {
    this.ws = new WebSocket(url);

    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "stroke") {
        canvasApp.applyRemoteStroke(msg.stroke);
      }
    };
  }

  send(data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}
