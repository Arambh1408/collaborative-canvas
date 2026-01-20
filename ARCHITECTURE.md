# Architecture Overview

## Data Flow Diagram
1. **User Action**: User draws on canvas (mouse down/move/up).
2. **Client Processing**: Local drawing for responsiveness. Throttled events sent via WebSocket (e.g., 'draw-start', 'draw-move').
3. **Server Broadcast**: Server receives event, adds to global history, broadcasts to all clients in the room.
4. **Client Reception**: Other clients replay the event on their canvas. New clients receive full history on join.
5. **Undo/Redo**: User sends 'undo' event. Server removes last operation from history, broadcasts 'undo' with operation ID. Clients remove the stroke and redraw canvas.

## WebSocket Protocol
Messages are JSON objects. Server assigns unique user IDs and colors on join.
- `join`: Sent by client on connect. Server responds with `user-info` (ID, color) and `init` (full stroke history).
- `draw-start`: {type: 'draw-start', userId, x, y, color, width}
- `draw-move`: {type: 'draw-move', userId, x, y} (throttled to 60fps)
- `draw-end`: {type: 'draw-end', userId}
- `cursor`: {type: 'cursor', userId, x, y} (sent on mouse move, throttled)
- `undo`: {type: 'undo', userId} → Server broadcasts `undo` {operationId}
- `redo`: {type: 'redo', userId} → Server broadcasts `redo` {operationId}
- `user-list`: Broadcast on join/leave: {users: [{id, color}]}

## Undo/Redo Strategy
- Server maintains `operations` array: Each operation is {id: unique, type: 'stroke', path: [points], color, width}.
- On undo: Remove last operation, broadcast `undo` with its ID. Clients filter out that operation and redraw.
- On redo: Re-add the last undone operation (server tracks undone stack), broadcast `redo` with ID. Clients re-add and redraw.
- Conflicts: Operations are sequential by server receipt. If User A undoes while User B draws, the draw happens after undo, maintaining order.
- Global: Undo affects all users equally (removes the last global stroke).

## Performance Decisions
- **Throttling**: Draw-move and cursor events throttled to 60fps using `requestAnimationFrame` to avoid flooding the network.
- **Client-Side Prediction**: Draw locally immediately, then correct via server events if needed (rare).
- **Redrawing**: On undo/redo, redraw entire canvas from history (efficient for <1000 strokes; use offscreen canvas for >1000).
- **Path Optimization**: Strokes stored as arrays of points; rendered as single paths for smoothness.
- **No Libraries**: Raw Canvas API for control; e.g., `beginPath()`, `lineTo()` for efficient drawing.

## Conflict Resolution
- Overlapping: Handled by stroke layering (later strokes draw on top).
- Simultaneous Edits: Server queues events; clients apply in order.
- Undo Conflicts: Global undo ensures consistency—e.g., if User A undoes User B's stroke, it's removed for all. No per-user undo to keep it simple.