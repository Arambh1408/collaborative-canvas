class CanvasApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.strokes = [];
    this.currentStroke = null;
    this.isDrawing = false;

    this.cursors = {}; // userId -> { x, y, name, color }

    this.color = "#000000";
    this.width = 5;

    this.tool = "brush"; // "brush" | "eraser"

    this.attachEvents();
  }

  attachEvents() {
    this.canvas.addEventListener("mousedown", e => this.start(e));
    this.canvas.addEventListener("mousemove", e => this.move(e));
    this.canvas.addEventListener("mouseup", () => this.end());
    this.canvas.addEventListener("mouseleave", () => this.end());

    // live cursor
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
      tool: this.tool,          // ✅ STORE TOOL
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

  updateCursor({ userId, x, y, name, color }) {
    this.cursors[userId] = { x, y, name, color };
    this.redraw();
  }

  redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // draw strokes
    this.strokes.forEach(s => this.drawStroke(s));
    if (this.currentStroke) this.drawStroke(this.currentStroke);

    // draw cursors + names
    Object.values(this.cursors).forEach(c => {
      this.ctx.fillStyle = c.color;
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.font = "12px Arial";
      this.ctx.fillText(c.name, c.x + 6, c.y - 6);
    });
  }

  drawStroke(stroke) {
    const p = stroke.path;
    if (p.length < 2) return;

    // 🔴 ERASER
    if (stroke.tool === "eraser") {
      this.ctx.globalCompositeOperation = "destination-out";
      this.ctx.lineWidth = stroke.width * 2;
    } 
    // 🖊 BRUSH
    else {
      this.ctx.globalCompositeOperation = "source-over";
      this.ctx.strokeStyle = stroke.color;
      this.ctx.lineWidth = stroke.width;
    }

    this.ctx.lineCap = "round";

    this.ctx.beginPath();
    this.ctx.moveTo(p[0].x, p[0].y);
    for (let i = 1; i < p.length; i++) {
      this.ctx.lineTo(p[i].x, p[i].y);
    }
    this.ctx.stroke();

    // reset
    this.ctx.globalCompositeOperation = "source-over";
  }
}
