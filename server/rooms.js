const { DrawingState } = require("./drawing-state");
const WebSocket = require("ws");

class Room {
  constructor(id) {
    this.id = id;
    this.users = {}; 
    this.drawingState = new DrawingState();
  }

  addUser(userId, color, ws) {
    this.users[userId] = { color, ws };
  }

  removeUser(userId) {
    delete this.users[userId];
  }

  getUsers() {
    return Object.entries(this.users).map(([id, u]) => ({
      id,
      color: u.color
    }));
  }

  broadcast(msg) {
    const data = JSON.stringify(msg);
    Object.values(this.users).forEach(user => {
      if (user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(data);
      }
    });
  }

  handleMessage(msg) {
    switch (msg.type) {

      

      case "stroke:start": {
        
        this.drawingState.addStroke(msg.stroke);

        this.broadcast({
          type: "stroke:start",
          stroke: msg.stroke
        });
        break;
      }

      case "stroke:move": {
        const stroke = this.drawingState.strokes.find(
          s => s.id === msg.id
        );

        if (stroke) {
          stroke.path.push(msg.point);
          this.broadcast(msg);
        }
        break;
      }

      case "stroke:end": {
        this.broadcast(msg);
        break;
      }


      case "cursor": {
        const user = this.users[msg.userId];
        if (!user) return;

        this.broadcast({
          type: "cursor",
          userId: msg.userId,
          x: msg.x,
          y: msg.y,
          color: user.color
        });
        break;
      }

      

      case "undo": {
        const undone = this.drawingState.undo();
        console.log("UNDO:", undone);
        if (undone) {
          this.broadcast({
            type: "undo",
            strokeId: undone.id
          });
        }
        break;
      }

      case "redo": {
        const redone = this.drawingState.redo();
        console.log("REDO", redone);
        if (redone) {
          this.broadcast({
            type: "redo",
            stroke: redone
          });
        }
        break;
      }
    }
  }
}

class RoomManager {
  constructor() {
    this.rooms = {};
  }

  getRoom(id) {
    if (!this.rooms[id]) {
      this.rooms[id] = new Room(id);
    }
    return this.rooms[id];
  }
}

module.exports = { RoomManager };
