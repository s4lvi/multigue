// server/src/server.js
const http = require("http");
const app = require("./app");
const socketService = require("./services/socketService");
const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.io
socketService.initialize(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
