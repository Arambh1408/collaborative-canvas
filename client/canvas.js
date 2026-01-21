class CanvasApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.strokes = [];
    this.currentStroke = null;
    this.isDrawing = false;

    this.cursors = {}; // userId -> { x, y, color }

    this.color = "#000000";
    this.width = 5;

    this.attachEvents();
  }

  attachEvents() {
    this.canvas.addEventListener("mousedown", e => this.start(e));
    this.canvas.addEventListener("mousemove", e => this.move(e));
    this.canvas.addEventListener("mouseup", () => this.end());

    // cursor tracking
    this.canvas.addEventListener("mousemove", e => {
      wsClient.send({
        type: "cursor",
        x: e.offsetX,
        y: e.offsetY
      });
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
  }

  move(e) {
    if (!this.isDrawing) return;

    this.currentStroke.path.push({
      x: e.offsetX,
      y: e.offsetY
    });

    this.redraw();
  }

  end() {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    wsClient.send({
      type: "stroke",
      stroke: this.currentStroke
    });

    this.currentStroke = null;
  }

  setState(strokes) {
    this.strokes = strokes;
    this.redraw();
  }

  updateCursor(userId, x, y, color) {
    this.cursors[userId] = { x, y, color };
    this.redraw();
  }

  redraw(showPreview = false) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.strokes.forEach(s => this.drawStroke(s));

    if ( this.currentStroke) {
      this.drawStroke(this.currentStroke);
    }

    // draw cursors
    Object.values(this.cursors).forEach(c => {
      this.ctx.fillStyle = c.color;
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  drawStroke(stroke) {
    const p = stroke.path;
    if (p.length < 2) return;

    this.ctx.strokeStyle = stroke.color;
    this.ctx.lineWidth = stroke.width;
    this.ctx.lineCap = "round";

    this.ctx.beginPath();
    this.ctx.moveTo(p[0].x, p[0].y);
    for (let i = 1; i < p.length; i++) {
      this.ctx.lineTo(p[i].x, p[i].y);
    }
    this.ctx.stroke();
  }
}
