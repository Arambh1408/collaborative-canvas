class WebSocketClient {
  constructor(url) {
    this.ws = new WebSocket(url);

    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      switch (msg.type) {
        case "state":
          canvasApp.setState(msg.strokes);
          break;

        case "cursor":
          canvasApp.updateCursor(msg.x, msg.y);
          break;

        default:
          break;
      }
    };
  }

  send(data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}
