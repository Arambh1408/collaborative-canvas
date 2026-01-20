class CanvasApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.isDrawing = false;
    this.currentStroke = null;
    this.strokes = [];

    this.cursors = {}; // { userId: { x, y } }

    this.color = "#000000";
    this.width = 5;

    this.attachEvents();
  }

  attachEvents() {
    this.canvas.addEventListener("mousedown", (e) => this.start(e));
    this.canvas.addEventListener("mousemove", (e) => this.move(e));
    this.canvas.addEventListener("mouseup", () => this.end());
    this.canvas.addEventListener("mouseleave", () => this.end());

    // cursor tracking (throttled)
    let lastSent = 0;
    this.canvas.addEventListener("mousemove", (e) => {
      const now = Date.now();
      if (now - lastSent > 30) {
        wsClient.send({
          type: "cursor",
          x: e.offsetX,
          y: e.offsetY
        });
        lastSent = now;
      }
    });
  }

  start(e) {
    this.isDrawing = true;

    this.currentStroke = {
      id: crypto.randomUUID(),
      color: this.color,
      width: this.width,
      path: [{ x: e.offsetX, y: e.offsetY }]
    };

    wsClient.send({
      type: "stroke:start",
      stroke: this.currentStroke
    });
  }

  move(e) {
    if (!this.isDrawing) return;

    const point = { x: e.offsetX, y: e.offsetY };
    this.currentStroke.path.push(point);

    wsClient.send({
      type: "stroke:move",
      id: this.currentStroke.id,
      point
    });

    this.drawSegment(this.currentStroke);
  }

  end() {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    wsClient.send({
      type: "stroke:end",
      id: this.currentStroke.id
    });

    this.currentStroke = null;
  }

  drawSegment(stroke) {
    const p = stroke.path;
    if (p.length < 2) return;

    this.ctx.strokeStyle = stroke.color;
    this.ctx.lineWidth = stroke.width;
    this.ctx.lineCap = "round";

    this.ctx.beginPath();
    this.ctx.moveTo(p[p.length - 2].x, p[p.length - 2].y);
    this.ctx.lineTo(p[p.length - 1].x, p[p.length - 1].y);
    this.ctx.stroke();
  }

  applyRemoteStroke(stroke) {
    this.strokes.push(stroke);
    stroke.path.forEach((_, i) => {
      if (i > 0) this.drawSegment(stroke);
    });
  }

  updateCursor(userId, x, y) {
    this.cursors[userId] = { x, y };
    this.redraw();
  }

  redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // redraw strokes
    this.strokes.forEach(stroke => {
      stroke.path.forEach((_, i) => {
        if (i > 0) this.drawSegment(stroke);
      });
    });

    // draw cursors
    Object.values(this.cursors).forEach(c => {
      this.ctx.fillStyle = "red";
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
}
