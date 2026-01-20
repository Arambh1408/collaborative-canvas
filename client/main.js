document.getElementById('brush').onclick = () => window.canvasApp.tool = 'brush';
document.getElementById('eraser').onclick = () => {
    window.canvasApp.tool = 'eraser';
    window.canvasApp.color = '#ffffff'; // White for erase
};
document.getElementById('color').onchange = (e) => window.canvasApp.color = e.target.value;
document.getElementById('width').onchange = (e) => window.canvasApp.width = e.target.value;
document.getElementById('undo').onclick = () => window.wsClient.send({type: 'undo', userId: window.userId});
document.getElementById('redo').onclick = () => window.wsClient.send({type: 'redo', userId: window.userId});

// Send join on load
window.addEventListener('load', () => {
    window.wsClient.send({type: 'join'});
});