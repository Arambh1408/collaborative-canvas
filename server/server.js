const express = require("express");
const WebSocket = require("ws");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.static("client"));

const server = app.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);

const wss = new WebSocket.Server({ server });

/* =========================
   PERSISTENCE
========================= */

const DATA_FILE = path.join(__dirname, "rooms-data.json");

function loadRoomsFromDisk() {
  if (!fs.existsSync(DATA_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveRoomsToDisk() {
  const data = {};
  Object.entries(rooms).forEach(([id, room]) => {
    data[id] = {
      strokes: room.strokes,
      undone: room.undone,
      password: room.password
    };
  });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/* =========================
   ROOMS
========================= */

const rooms = {};
const persistedRooms = loadRoomsFromDisk();

function getRoom(roomId, password = null) {
  if (!rooms[roomId]) {
    const persisted = persistedRooms[roomId] || {};
    rooms[roomId] = {
      strokes: persisted.strokes || [],
      undone: persisted.undone || [],
      password: persisted.password || password,
      users: {}
    };
  }
  return rooms[roomId];
}

function randomColor() {
  return `hsl(${Math.random() * 360}, 70%, 50%)`;
}

function broadcast(room, msg) {
  Object.values(room.users).forEach(u => {
    if (u.ws.readyState === WebSocket.OPEN) {
      u.ws.send(JSON.stringify(msg));
    }
  });
}

function broadcastUsers(room) {
  broadcast(room, {
    type: "users",
    users: Object.entries(room.users).map(([id, u]) => ({
      id,
      name: u.name,
      color: u.color
    }))
  });
}

/* =========================
   CONNECTION
========================= */

wss.on("connection", (ws) => {
  const userId = crypto.randomUUID();
  let room = null;

  ws.on("message", (data) => {
    const msg = JSON.parse(data);

    /* -------- JOIN ROOM -------- */
    if (msg.type === "join") {
  const roomId = msg.room;
  const providedPassword = msg.password || null;

  // 1️⃣ Check persisted room
  const persisted = persistedRooms[roomId];

  if (persisted && persisted.password !== providedPassword) {
    ws.send(JSON.stringify({
      type: "error",
      message: "Invalid room password"
    }));
    ws.close();
    return;
  }

  // 2️⃣ Check in-memory room
  if (rooms[roomId] && rooms[roomId].password !== providedPassword) {
    ws.send(JSON.stringify({
      type: "error",
      message: "Invalid room password"
    }));
    ws.close();
    return;
  }

  // 3️⃣ Create or get room ONLY AFTER validation
  room = getRoom(roomId, providedPassword);

  room.users[userId] = {
    name: msg.name,
    color: randomColor(),
    ws
  };

  ws.send(JSON.stringify({
    type: "state",
    strokes: room.strokes
  }));

  broadcastUsers(room);
  saveRoomsToDisk();
  return;
}


    if (!room) return;

    /* -------- DRAW -------- */
    if (msg.type === "stroke") {
      room.strokes.push(msg.stroke);
      room.undone = [];
      broadcast(room, { type: "state", strokes: room.strokes });
      saveRoomsToDisk();
    }

    /* -------- UNDO -------- */
    if (msg.type === "undo") {
      if (room.strokes.length > 0) {
        room.undone.push(room.strokes.pop());
        broadcast(room, { type: "state", strokes: room.strokes });
        saveRoomsToDisk();
      }
    }

    /* -------- REDO -------- */
    if (msg.type === "redo") {
      if (room.undone.length > 0) {
        room.strokes.push(room.undone.pop());
        broadcast(room, { type: "state", strokes: room.strokes });
        saveRoomsToDisk();
      }
    }

    /* -------- CURSOR -------- */
    if (msg.type === "cursor") {
      const u = room.users[userId];
      if (!u) return;

      broadcast(room, {
        type: "cursor",
        userId,
        name: u.name,
        color: u.color,
        x: msg.x,
        y: msg.y
      });
    }
  });

  ws.on("close", () => {
    if (!room) return;

    delete room.users[userId];
    broadcastUsers(room);

    if (Object.keys(room.users).length === 0) {
      saveRoomsToDisk();
    }
  });
});
