// client/src/App.js

import React, { useState, useRef, useEffect } from "react";
import Game from "./components/Game";
import Chat from "./components/Chat"; // Import Chat component
import { Canvas } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import io from "socket.io-client";
import ErrorBoundary from "./components/ErrorBoundary";
import BackgroundMusic from "./components/BackgroundMusic";
import HealthBar from "./components/HealthBar";

// Initialize Socket.io connection
const socket = io(process.env.REACT_APP_SOCKET_URL || "/");

const App = () => {
  // State variables for user registration and game state
  const [username, setUsername] = useState("");
  const [registered, setRegistered] = useState(false);
  const [player, setPlayer] = useState(null);
  const [dungeon, setDungeon] = useState(null);
  const [initialItems, setInitialItems] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false); // State for chat visibility
  const [health, setHealth] = useState(100);
  const [mana, setMana] = useState(100);
  const [players, setPlayers] = useState({});
  const [npcs, setNPCs] = useState({});
  const [weapon, setWeapon] = useState(null);

  const chatRef = useRef(null); // Ref for Chat component to manage messages

  // Handle user registration by emitting 'register' event to the server
  const handleRegister = () => {
    if (username.trim() !== "") {
      socket.emit("register", { username });
    }
  };

  // Function to add messages to the Chat component
  const addChatMessage = (msg) => {
    if (chatRef.current && chatRef.current.addMessage) {
      chatRef.current.addMessage(msg);
    }
  };

  // Callback function to open chat, passed to Game.js
  const handleOpenChat = () => {
    console.log("Opening chat.");
    setIsChatOpen(true);
  };

  // Handle 'initialState' event from the server to set up the initial game state
  useEffect(() => {
    const handleInitialState = (data) => {
      setPlayer(data.player);
      setDungeon(data.dungeon);
      setInitialItems(data.items);
      console.log("initial items", data.items);
      setPlayers(data.players);
      console.log("initial players", data.players);
      setNPCs(
        data.npcs.reduce((acc, npc) => {
          acc[npc.id] = npc;
          return acc;
        }, {})
      );
      setRegistered(true);
      console.log("Initial State Received:", data);
      console.log("Player Initial Position:", data.player.position);
    };

    socket.on("initialState", handleInitialState);

    // Optional: Handle registration errors if the server emits any
    const handleRegistrationError = (message) => {
      alert(message);
    };

    socket.on("registrationError", handleRegistrationError);

    // Cleanup event listeners on unmount
    return () => {
      socket.off("initialState", handleInitialState);
      socket.off("registrationError", handleRegistrationError);
    };
  }, []);

  return (
    <div>
      {/* Registration Screen */}
      {!registered ? (
        <div
          className="login"
          style={{
            textAlign: "center",
            marginTop: "100px",
          }}
        >
          <h2>Welcome to MULTIGUE</h2>
          <input
            type="text"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "16px",
              width: "200px",
            }}
          />
          <button
            onClick={handleRegister}
            style={{
              padding: "10px 20px",
              marginLeft: "10px",
              fontSize: "16px",
            }}
          >
            Join Game
          </button>
        </div>
      ) : (
        /* Game Interface */
        <div
          className="game-container"
          style={{
            width: "100vw",
            height: "100vh",
            position: "relative", // To position Chat absolutely
          }}
        >
          {/* Background Music */}
          <BackgroundMusic />

          {/* Chat Component */}
          <Chat
            ref={chatRef}
            socket={socket}
            isOpen={isChatOpen}
            onClose={() => {
              console.log("Closing chat.");
              setIsChatOpen(false);
            }}
          />

          {/* Health and Mana Bars */}
          <HealthBar health={health} mana={mana} />

          {/* 3D Game Canvas */}
          <div
            className="canvas-wrapper"
            style={{
              width: "100%",
              height: "100%",
            }}
          >
            <Canvas shadows>
              <ErrorBoundary>
                <React.Suspense
                  fallback={
                    <Html center>
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          color: "white",
                        }}
                      >
                        Loading...
                      </div>
                    </Html>
                  }
                >
                  <Game
                    socket={socket}
                    player={player}
                    dungeon={dungeon}
                    initialItems={initialItems}
                    addChatMessage={addChatMessage}
                    onRequestChat={handleOpenChat}
                    setHealth={setHealth}
                    setMana={setMana}
                    setWeapon={setWeapon}
                    initialPlayers={players}
                    initialNPCs={npcs} // Pass initial NPCs to Game component
                  />
                </React.Suspense>
              </ErrorBoundary>
            </Canvas>
          </div>

          {/* Crosshair for Aim */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 999,
              pointerEvents: "none", // Ensures the crosshair doesn't block other interactions
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "2px",
                height: "100%",
                backgroundColor: "white",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "2px",
                backgroundColor: "white",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
