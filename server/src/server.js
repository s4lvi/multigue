// server/src/server.js
const http = require("http");
const app = require("./app");
const socketService = require("./services/socketService");
//const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.io
socketService.initialize(server);

// Connect to MongoDB
// mongoose
//   .connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => {
//     console.log("MongoDB connected");
//     server.listen(PORT, () => {
//       console.log(`Server is running on port ${PORT}`);
//     });
//   })
//   .catch((err) => console.error(err));

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
