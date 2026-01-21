# Real-Time Collaborative Drawing Canvas

A real-time, multi-user drawing application where multiple users can draw simultaneously on a shared canvas with live synchronization, global undo/redo, user indicators, rooms, persistence, and performance metrics.
This project is built without any drawing libraries, using the raw HTML5 Canvas API and WebSockets.

# Features
* Core Features:
- Real-time collaborative drawing
- Brush and eraser tools
- Color picker and stroke width adjustment
- Live cursor positions with user names
- Online user list with unique colors
- Global undo / redo (server-authoritative)
- Conflict-free drawing via server serialization

 * Rooms:
- Multiple isolated drawing rooms
- Join via URL (?room=roomName)
- Private rooms protected with passwords

 * Persistence:
- Automatic save/load per room
- Canvas state survives server restart

* Performance Metrics 
- FPS counter (client-side)
- Network latency display using WebSocket ping/pong

# Tech Stack
* Frontend
- HTML
- CSS
- Vanilla JavaScript

* Backend
- Node.js
- Native WebSockets (ws)
- Express (static file serving)

# No canvas or drawing libraries used 

# Project Structure:
collaborative-canvas/
├── client/
│   ├── index.html
│   ├── style.css
│   ├── canvas.js
│   ├── websocket.js
│   └── main.js
├── server/
│   ├── server.js
│   └── rooms-data.json
├── ARCHITECTURE.md
├── package.json
└── README.md

# Setup Instructions
1. Prerequisites:
   - Node.js (v16+ recommended)
   - npm
2. Install dependencies:
   - npm install(in Terminal)
3. Start the Server:
   - npm start
4. Open in browser
   - http://localhost:3000

# How to Test with Multiple Users:
  * Same Room(Collaboration)
   1. Open browser window #1:
     - http://localhost:3000/?room=design
   2. Open browser window#2(Incognito recommended):
     - http://localhost:3000/?room=design
(~ Both users see the same canvas, cursors, and undo/redo actions.)   

   * Private Rooms(Password-Protected)
     1. Open:
        -http://localhost:3000/?room=secret
     2. Enter a Password(e.g. abc)
     3. Join from another browser using the same password
  (~ Wrong Password = access denied
     Correct Password=allowed)    

# Undo / Redo Behavior
- Undo and redo are global per room
- Actions affect all users
- Server maintains authoritative history
- Redo stack clears on new drawing

# Performance Overlay
- Bottom-right corner shows:
- FPS (frames per second)
- Latency (WebSocket round-trip time)
(These metrics are purely additive and do not affect drawing performance.)

# Architecture Overview
- Server is the single source of truth
- Clients send drawing actions, not canvas pixels
- Server serializes operations to avoid conflicts
- Canvas is redrawn from stroke history
- Undo/redo operates on stroke objects
- Persistence uses JSON storage per room

# Known Limitations / Bugs
- Drawing synchronization is stroke-level, not point-level streaming
- No mobile touch support (mouse events only)
- No shapes, text, or image tools (freehand only)
- No authentication (names are user-provided)
- Persistence uses file storage (not database)
(These were intentional trade-offs to keep the system stable and focused on real-time collaboration.)

# Time Spent on Project
  * Total time: ~3–5 days
    Breakdown:
     - Core drawing + canvas logic: ~1.5 days
     - WebSocket sync + undo/redo: ~1 day
     - Rooms + private rooms + persistence: ~1 day
     - User indicators + cursors + performance metrics: ~0.5–1 day

# Assignment Coverage
- All core requirements completed
- Multiple advanced features implemented
- Bonus features added (rooms, persistence, performance)
- Clean, explainable architecture

# Browser Compatibility
  * Tested on:
     - Chrome
     - Firefox
     - Edge
     - 
#  Live Demo
  *Live Demo
    https://collaborative-canvas-a1pq.onrender.com

### Test Rooms
https://collaborative-canvas-a1pq.onrender.com/?room=demo  
https://collaborative-canvas-a1pq.onrender.com/?room=private



# Final Notes
This project focuses on correctness, synchronization, and real-world architecture decisions rather than UI polish or over-engineering.
