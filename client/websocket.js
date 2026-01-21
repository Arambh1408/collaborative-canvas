class WebSocketClient {
  constructor(url) {
    this.ws = new WebSocket(url);

    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "stroke") {
        canvasApp.applyRemoteStroke(msg.stroke);
      }

      if (msg.type === "cursor") {
        canvasApp.updateCursor(
          msg.userId,
          msg.x,
          msg.y,
          msg.color
        );
      }
    };
  }

  send(data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}
