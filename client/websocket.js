class WebSocketClient {
  constructor(url) {
    this.ws = new WebSocket(url);

    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "init") {
        window.userId = msg.userId;
        canvasApp.setState(msg.strokes);
        updateUserList(msg.users);
      }

      if (msg.type === "state" ) {
        canvasApp.setState(msg.strokes);
      }


      if (msg.type === "cursor" ) {
        canvasApp.updateCursor(
          msg.userId,
          msg.x,
          msg.y,
          msg.color
        );
      }

      if (msg.type === "user-list") {
        updateUserList(msg.users);
      }
    };
  }

  send(data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}
