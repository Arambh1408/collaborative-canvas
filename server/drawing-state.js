class DrawingState {
  constructor() {
    this.strokes = [];
    this.undone = [];
  }

  addStroke(stroke) {
    this.strokes.push(stroke);
    this.undone = []; // clear redo stack on new draw
  }

  undo() {
    if (this.strokes.length === 0) return null;
    const stroke = this.strokes.pop();
    this.undone.push(stroke);
    return stroke;
  }

  redo() {
    if (this.undone.length === 0) return null;
    const stroke = this.undone.pop();
    this.strokes.push(stroke);
    return stroke;
  }

  getState() {
    return this.strokes;
  }
}

module.exports = { DrawingState };
