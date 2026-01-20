class CanvasApp {
    constructor(canvas) {
        if (!canvas) throw new Error('Canvas element not found'); // Error handling
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.operations = []; // Local copy of history
        this.undone = []; // For redo
        this.cursors = {}; // {userId: {x, y}}
        this.isDrawing = false;
        this.currentPath = [];
        this.tool = 'brush'; // Default tool
        this.color = '#000000'; // Default color
        this.width = 5; // Default width
        this.setupEvents();
        this.redraw();
    }

    setupEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.startDraw(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.endDraw());
        this.canvas.addEventListener('mouseout', () => this.endDraw());
        // Throttle cursor updates to ~60fps
        let lastCursor = 0;
        this.canvas.addEventListener('mousemove', (e) => {
            if (Date.now() - lastCursor > 16 && window.wsClient) { // Check if wsClient exists
                window.wsClient.send({type: 'cursor', userId: window.userId, x: e.offsetX, y: e.offsetY});
                lastCursor = Date.now();
            }
        });
    }

    startDraw(e) {
        this.isDrawing = true;
        // Ensure color based on tool
        if (this.tool === 'eraser') {
            this.color = '#ffffff'; // White for erasing
        }
        // Initialize path and operation
        this.currentPath = [{x: e.offsetX, y: e.offsetY}];
        const opId = Date.now() + Math.random(); // Unique ID
        const op = {id: opId, type: 'stroke', path: this.currentPath.slice(), color: this.color, width: this.width};
        this.operations.push(op);
        // Send to server
        if (window.wsClient) {
            window.wsClient.send({type: 'draw-start', id: opId, userId: window.userId, x: e.offsetX, y: e.offsetY, color: this.color, width: this.width});
        }
        this.redraw();
    }

    draw(e) {
        if (!this.isDrawing) return;
        this.currentPath.push({x: e.offsetX, y: e.offsetY});
        // Throttle draw-move to reduce network load
        if (this.currentPath.length % 5 === 0 && window.wsClient) {
            window.wsClient.send({type: 'draw-move', id: this.operations[this.operations.length - 1].id, userId: window.userId, x: e.offsetX, y: e.offsetY});
        }
        this.redraw();
    }

    endDraw() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        if (window.wsClient) {
            window.wsClient.send({type: 'draw-end', id: this.operations[this.operations.length - 1].id, userId: window.userId});
        }
    }

    replayEvent(msg) {
        if (msg.userId === window.userId) return; // Ignore own events
        let op = this.operations.find(o => o.id === msg.id);
        if (!op) {
            // Create new operation if not found
            op = {id: msg.id || Date.now(), type: 'stroke', path: [], color: msg.color, width: msg.width};
            this.operations.push(op);
        }
        if (msg.type === 'draw-start') {
            op.path = [{x: msg.x, y: msg.y}];
        } else if (msg.type === 'draw-move') {
            op.path.push({x: msg.x, y: msg.y});
        }
        this.redraw();
    }

    undoOperation(operationId) {
        const index = this.operations.findIndex(o => o.id === operationId);
        if (index !== -1) {
            this.undone.push(this.operations.splice(index, 1)[0]);
            this.redraw();
        }
    }

    redoOperation(operationId) {
        const op = this.undone.find(o => o.id === operationId);
        if (op) {
            this.operations.push(op);
            this.undone = this.undone.filter(o => o.id !== operationId);
            this.redraw();
        }
    }

    loadHistory(operations) {
        this.operations = operations || [];
        this.redraw();
    }

    updateCursor(userId, x, y) {
        this.cursors[userId] = {x, y};
        this.redraw();
    }

    updateUsers(users) {
        const usersDiv = document.getElementById('users');
        if (!usersDiv) return; // Error handling
        usersDiv.innerHTML = '';
        users.forEach(u => {
            const div = document.createElement('div');
            div.className = 'user';
            div.style.backgroundColor = u.color;
            usersDiv.appendChild(div);
        });
    }

    redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Draw all operations
        this.operations.forEach(op => {
            if (op.type === 'stroke' && op.path.length > 0) {
                this.ctx.strokeStyle = op.color;
                this.ctx.lineWidth = op.width;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.beginPath();
                op.path.forEach((p, i) => {
                    if (i === 0) this.ctx.moveTo(p.x, p.y);
                    else this.ctx.lineTo(p.x, p.y);
                });
                this.ctx.stroke();
            }
        });
        // Draw cursors
        Object.values(this.cursors).forEach(c => {
            this.ctx.fillStyle = 'red';
            this.ctx.beginPath();
            this.ctx.arc(c.x, c.y, 5, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }
}

// Note: Do NOT add instantiation here. It's moved to main.js to avoid DOM errors.