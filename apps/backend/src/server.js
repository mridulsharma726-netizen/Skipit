const http = require('http');
const app = require('./app');
const config = require('./config/env');
const { initWebSocketServer } = require('./modules/chat/chat.ws');

const server = http.createServer(app);

// Initialize real-time chat WebSocket server attached to the HTTP server
initWebSocketServer(server);

const PORT = config.port;

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SkipIt 3.0 Backend Engine running on port ${PORT}`);
  console.log(`📡 Real-Time Chat WebSocket ready on ws://localhost:${PORT}`);
  console.log(`🔗 REST API Base: http://localhost:${PORT}/api/v1`);
  console.log(`🛡️  Model: 0% Commission | Peer-to-Peer Direct Rental`);
  console.log(`=======================================================`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[SkipIt Server] SIGTERM signal received. Closing HTTP server gracefully.');
  server.close(() => {
    console.log('[SkipIt Server] HTTP and WebSocket server closed.');
    process.exit(0);
  });
});
