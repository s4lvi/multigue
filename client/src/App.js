// client/src/App.js

import React, { useState, Suspense, useRef } from "react";
import Game from "./components/Game";
import Chat from "./components/Chat"; // Import Chat component
import { Canvas } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import io from "socket.io-client";
import ErrorBoundary from "./components/ErrorBoundary";
import BackgroundMusic from "./components/BackgroundMusic";
import HealthBar from "./components/HealthBar";

const socket = io(process.env.REACT_APP_SOCKET_URL || "/");

const App = () => {
  const [username, setUsername] = useState("");
  const [registered, setRegistered] = useState(false);
  const [player, setPlayer] = useState(null);
  const [dungeon, setDungeon] = useState(null);
  const [initialItems, setInitialItems] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false); // State for chat
  const [health, setHealth] = useState(100);
  const [players, setPlayers] = useState({});
  const [weapon, setWeapon] = useState(null);

  const chatRef = useRef(null); // Ref for Chat component

  const handleRegister = () => {
    if (username.trim() !== "") {
      socket.emit("register", { username }, (response) => {
        if (response.status === "ok") {
          setPlayer(response.player);
          setDungeon(response.dungeon);
          setInitialItems(response.items);
          setPlayers(response.players);
          setRegistered(true);

          // Log player's initial position for debugging
          console.log("Player Initial Position:", response.player.position);
        } else {
          alert(response.message);
        }
      });
    }
  };

  // Function to add messages to Chat
  const addChatMessage = (msg) => {
    if (chatRef.current && chatRef.current.addMessage) {
      chatRef.current.addMessage(msg);
    }
  };

  // Callback function to open chat, to be passed to Game.js
  const handleOpenChat = () => {
    console.log("Opening chat.");
    setIsChatOpen(true);
  };

  return (
    <div>
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
        <div
          className="game-container"
          style={{
            width: "100vw",
            height: "100vh",
            position: "relative", // To position Chat absolutely
          }}
        >
          <BackgroundMusic />
          {/* Render Chat outside the Canvas */}
          <Chat
            ref={chatRef}
            socket={socket}
            isOpen={isChatOpen}
            onClose={() => {
              console.log("Closing chat.");
              setIsChatOpen(false);
            }}
          />
          <HealthBar
            health={
              health
              //players[localId]?.stats.health || 100
            }
          />

          <div
            className="canvas-wrapper"
            style={{
              width: "100%",
              height: "100%",
            }}
          >
            <Canvas>
              <ErrorBoundary>
                <Suspense
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
                    setWeapon={setWeapon}
                    initialPlayers={players} // Pass the callback
                  />
                </Suspense>
              </ErrorBoundary>
            </Canvas>
          </div>
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
