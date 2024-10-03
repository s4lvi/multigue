// utils/logger.js
const logger = {
  log: (message) => {
    console.log(`[LOG] ${message}`);
  },
  error: (message) => {
    console.error(`[ERROR] ${message}`);
  },
  message: (player, message) => {
    console.log(`[CHAT] ${player}: ${message}`);
  },
};

export default logger;
