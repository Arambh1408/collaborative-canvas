class CanvasApp {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.operations = []; // Local copy of history
        this.undone = []; // For redo
        this.cursors = {}; // {userId: {x, y}}
        this.isDrawing = false;
        this.currentPath = [];
        this.tool = 'brush';
        this.color = '#000000';
        this.width = 5;
        this.setupEvents();
        this.redraw();
    }

    setupEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.startDraw(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.endDraw());
        this.canvas.addEventListener('mouseout', () => this.endDraw());
        // Throttle cursor updates
        let lastCursor = 0;
        this.canvas.addEventListener('mousemove', (e) => {
            if (Date.now() - lastCursor > 16) { // ~60fps
                window.wsClient.send({type: 'cursor', userId: window.userId, x: e.offsetX, y: e.offsetY});
                lastCursor = Date.now();
            }
        });
    }

    startDraw(e) {
        this.isDrawing = true;
        this.currentPath = [{x: e.offsetX, y: e.offsetY}];
        const op = {id: Date.now() + Math.random(), type: 'stroke', path: this.currentPath, color: this.color, width: this.width};
        this.operations.push(op);
        window.wsClient.send({type: 'draw-start', userId: window.userId, x: e.offsetX, y: e.offsetY, color: this.color, width: this.width});
        this.redraw();
    }

    draw(e) {
        if (!this.isDrawing) return;
        this.currentPath.push({x: e.offsetX, y: e.offsetY});
        // Throttle draw-move
        if (this.currentPath.length % 5 === 0) {
            window.wsClient.send({type: 'draw-move', userId: window.userId, x: e.offsetX, y: e.offsetY});
        }
        this.redraw();
    }

    endDraw() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        window.wsClient.send({type: 'draw-end', userId: window.userId});
    }

    replayEvent(msg) {
        if (msg.userId === window.userId) return; // Ignore own events
        const op = this.operations.find(o => o.id === msg.id);
        if (!op) {
            // New operation
            const newOp = {id: msg.id || Date.now(), type: 'stroke', path: [], color: msg.color, width: msg.width};
            this.operations.push(newOp);
            op = newOp;
        }
        if (msg.type === 'draw-start') op.path = [{x: msg.x, y: msg.y}];
        else if (msg.type === 'draw-move') op.path.push({x: msg.x, y: msg.y});
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
        this.operations = operations;
        this.redraw();
    }

    updateCursor(userId, x, y) {
        this.cursors[userId] = {x, y};
        this.redraw();
    }

    updateUsers(users) {
        const usersDiv = document.getElementById('users');
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
        this.operations.forEach(op => {
            if (op.type === 'stroke') {
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

window.canvasApp = new CanvasApp(document.getElementById('canvas'));