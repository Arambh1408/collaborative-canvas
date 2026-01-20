# Real-Time Collaborative Drawing Canvas

A multi-user drawing app with real-time synchronization, built with Node.js and native WebSockets.

## Setup
1. Install dependencies: `npm install`
2. Start the server: `npm start`
3. Open `http://localhost:3000` in your browser.

## Testing with Multiple Users
- Open multiple browser tabs/windows pointing to `http://localhost:3000`.
- Each tab represents a user (anonymous, with auto-assigned colors).
- Draw simultaneously: Changes sync in real-time.
- Test undo/redo: Draw something, then press Undo— it removes the last global stroke for all users.
- Test cursors: Move your mouse over the canvas; other users see your cursor.
- Test conflict: Two users drawing in the same area—later strokes overlay earlier ones. Undo resolves by removing the global last stroke.

## Known Limitations/Bugs
- No mobile touch support (bonus not implemented).
- High latency (>200ms) may cause slight desync in fast drawing; mitigated by client-side prediction.
- Undo/redo is global and removes the most recent stroke (not per-user), which may feel unfair but matches the "global" requirement.
- No persistence: Canvas resets on server restart.
- Eraser is implemented as drawing with white color (simple, but doesn't "erase" pixels perfectly—use Undo for precise removal).
- Tested on Chrome/Firefox; Safari may have minor cursor issues.

## Time Spent
~4 days total.