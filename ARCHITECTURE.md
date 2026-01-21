# Architecture – Real-Time Collaborative Canvas
This document explains the internal architecture, data flow, and design decisions behind the Real-Time Collaborative Drawing Canvas.
The system is designed to be server-authoritative, conflict-free, and easy to reason about under concurrent usage.

1. Data Flow Diagram (Conceptual)
  Below is the logical flow of drawing events from a user action to canvas rendering across all clients.

                  User Input (Mouse / Tool)
                            ↓
                  Client Canvas (stroke object)
                            ↓
                  WebSocket Message (stroke / undo / redo)
                            ↓
                  Server (Room State Manager)
                            ↓
                  Server updates authoritative state
                            ↓
                  Broadcast updated state to all clients in room
                            ↓
                  Clients redraw canvas from stroke history
* Key Idea
- Clients do not sync pixels
- Clients sync intent (strokes)
- The server is the single source of truth

2. WebSocket Protocol
All real-time communication is handled via native WebSockets (ws).

* Messages Sent by Client:
Type                 Purpose
join	        Join a room with optional password
stroke	        Submit a completed stroke
undo	        Request global undo
redo	        Request global redo
cursor	        Send live cursor position
ping	        Latency measurement


* Messages Sent by Server:
Type	          Purpose
state	        Full authoritative canvas state
users	        Online users list
cursor	        Broadcast cursor position
error	        Invalid password / access denied
pong	        Latency response

(~ Example: Stroke Message
     {
      "type": "stroke",
      "stroke": {
      "id": "uuid",
      "tool": "brush",
      "color": "#000000",
      "width": 5,
      "path": [{ "x": 10, "y": 20 }, { "x": 30, "y": 40 }]
         }
       }
)


3. Undo / Redo Strategy (Global & Server-Authoritative)
Undo and redo are implemented globally per room, not per user.

  * Server State per Room
    {
      strokes: [],   // active strokes
      undone: [],    // redo stack
      users: {},
      password: null
    }

  * Undo Logic
   - Client sends undo
   - Server pops the last stroke from strokes
   - Stroke is pushed to undone
   - Server broadcasts updated state

  * Redo Logic
   - Client sends redo
   - Server pops from undone
   - Stroke is restored to strokes
   - Server broadcasts updated state

  * Why this works
   - Prevents desynchronization
   - All clients see the same canvas
   - No race conditions

4. Performance Decisions
  * Stroke-Level Synchronization
   - Only completed strokes are sent
   - Avoids high-frequency mouse event flooding
   - Simplifies undo/redo logic

  * Trade-off:
   - Not true point-by-point streaming
   - Chosen intentionally for correctness and stability

  * Canvas Redraw Strategy
  - Canvas is fully redrawn from stroke history
  - Canvas API is fast for moderate stroke counts
  - Simpler than maintaining pixel diffs

  * Performance Metrics (Bonus)
   - FPS measured via requestAnimationFrame
   - Latency measured using WebSocket ping → pong
   - Metrics are read-only overlays, not affecting logic

5. Conflict Resolution
  * Problem
    Multiple users may draw simultaneously or overlap strokes.

  * Solution
   -  Server serialization
   - All operations are processed sequentially
   - Draw order determines visual stacking
   - No shared mutable client state

  * Why this is sufficient
   - Drawing operations are visually commutative
   - Last stroke naturally appears on top
   - Avoids complex CRDT logic

# Room Isolation & Security
 - Each room maintains independent state
 - Private rooms enforce server-side password validation
 - Invalid password → connection rejected before state is sent

# Persistence Strategy
 - Room state is saved as JSON on disk
 - Data is saved:
    - on every mutation
    - when last user leaves a room
 - State is restored on server restart
(This ensures durability without a database.)

# Architectural Principles Followed
 - Server-authoritative design
 - Deterministic state updates
 - Minimal client responsibility
 - Additive feature extensions (no breaking changes)
 - Clear separation of concerns