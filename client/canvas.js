class CanvasApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.isDrawing = false;
    this.currentStroke = null;
    this.strokes = [];

    this.color = "#000000";
    this.width = 5;

    this.attachEvents();
  }

  attachEvents() {
    this.canvas.addEventListener("mousedown", (e) => this.start(e));
    this.canvas.addEventListener("mousemove", (e) => this.move(e));
    this.canvas.addEventListener("mouseup", () => this.end());
    this.canvas.addEventListener("mouseleave", () => this.end());
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
    const ctx = this.ctx;
    const p = stroke.path;
    if (p.length < 2) return;

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(p[p.length - 2].x, p[p.length - 2].y);
    ctx.lineTo(p[p.length - 1].x, p[p.length - 1].y);
    ctx.stroke();
  }

  applyRemoteStroke(stroke) {
    this.strokes.push(stroke);
    stroke.path.forEach((_, i) => {
      if (i > 0) this.drawSegment(stroke);
    });
  }
}
