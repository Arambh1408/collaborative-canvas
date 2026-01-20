class DrawingState {
    constructor() {
        this.operations = []; // Array of drawing operations: {id, type: 'stroke', path: [{x, y}], color, width}
        this.undone = []; // Stack for redo operations
    }

    // Add a new operation (e.g., a stroke)
    addOperation(operation) {
        this.operations.push(operation);
    }

    // Undo the last operation (remove from operations, add to undone)
    undo() {
        if (this.operations.length === 0) return null;
        const operation = this.operations.pop();
        this.undone.push(operation);
        return operation.id; // Return ID for broadcasting
    }

    // Redo the last undone operation
    redo() {
        if (this.undone.length === 0) return null;
        const operation = this.undone.pop();
        this.operations.push(operation);
        return operation.id; // Return ID for broadcasting
    }

    // Get all current operations (for new users or full redraw)
    getOperations() {
        return this.operations;
    }
}

module.exports = { DrawingState };