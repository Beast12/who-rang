
const WebSocket = require('ws');

let connectedClients = 0;
let wss;

function initializeWebSocket(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    connectedClients++;
    console.log(`WebSocket client connected. Total clients: ${connectedClients}`);
    
    ws.send(JSON.stringify({
      type: 'connection_status',
      data: { status: 'connected', totalClients: connectedClients }
    }));

    ws.on('close', () => {
      connectedClients--;
      console.log(`WebSocket client disconnected. Total clients: ${connectedClients}`);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;
}

// Broadcast to all WebSocket clients
function broadcast(message) {
  if (wss) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

function getConnectedClients() {
  return connectedClients;
}

module.exports = {
  initializeWebSocket,
  broadcast,
  getConnectedClients
};
