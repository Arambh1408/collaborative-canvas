class WebSocketClient {
  constructor(url) {
    this.ws = new WebSocket(url);

    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "state") {
        canvasApp.setState(msg.strokes);
      }

      if (msg.type === "cursor") {
        canvasApp.updateCursor(msg.x, msg.y);
      }
    };
  }

  send(data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}
