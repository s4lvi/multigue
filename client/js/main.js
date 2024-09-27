// js/main.js

import { initializeGame } from "./game.js";

document.addEventListener("DOMContentLoaded", () => {
  const socket = io(); // Connect to the server
  window.socket = socket; // Make socket accessible globally

  // UI elements
  const menu = document.getElementById("menu");
  const joinServerBtn = document.getElementById("joinServer");
  const playerNameInput = document.getElementById("playerNameInput");

  const chatMessages = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");

  // Handle joining the game
  joinServerBtn.addEventListener("click", () => {
    const name = playerNameInput.value.trim();
    if (name === "") {
      alert("Please enter your name.");
      return;
    }
    menu.style.display = "none";
    document.getElementById("gameUI").style.display = "block";
    socket.emit("playerJoined", { name });
    window.playerName = name;
  });

  // Load game.js after establishing socket connection
  socket.on("connect", () => {
    console.log("Connected to server.");
    // Initialize the game
    initializeGame();
  });

  // Chat Functionality
  chatInput.addEventListener("keydown", (event) => {
    event.stopPropagation(); // Prevent Phaser from capturing the event
    console.log("keydown");
    if (event.key === "Enter" && chatInput.value.trim() !== "") {
      const message = {
        id: socket.id,
        text: chatInput.value.trim(),
      };
      socket.emit("chatMessage", message);
      chatInput.value = "";
      chatInput.blur();
    }
  });
  socket.on("chatMessage", (message) => {
    const msgDiv = document.createElement("div");
    msgDiv.textContent = `${message.text}`;
    if (message.type !== "player") {
      msgDiv.style.color = "#aaa";
    }
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
});
