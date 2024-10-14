// server/src/server.js

const http = require("http");
const app = require("./app");
const SocketHandler = require("./services/SocketHandler");
const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize SocketHandler with the server
new SocketHandler(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
