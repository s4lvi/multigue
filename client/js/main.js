// js/main.js

import { initializeGame } from "./game.js";

document.addEventListener("DOMContentLoaded", () => {
  const socket = io(); // Connect to the server
  window.socket = socket; // Make socket accessible globally

  // UI elements
  const menu = document.getElementById("menu");
  const joinServerBtn = document.getElementById("joinServer");
  const playerNameInput = document.getElementById("playerNameInput");

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
  });

  // Load game.js after establishing socket connection
  socket.on("connect", () => {
    console.log("Connected to server.");
    // Initialize the game
    initializeGame();
  });
});
