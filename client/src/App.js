// client/src/App.js

import React, { useState, Suspense, useRef } from "react";
import Game from "./components/Game";
import Chat from "./components/Chat"; // Import Chat component
import { Canvas } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import io from "socket.io-client";
import ErrorBoundary from "./components/ErrorBoundary";

const socket = io(process.env.REACT_APP_SOCKET_URL || "/");

const App = () => {
  const [username, setUsername] = useState("");
  const [registered, setRegistered] = useState(false);
  const [player, setPlayer] = useState(null);
  const [dungeon, setDungeon] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false); // State for chat

  const chatRef = useRef(null); // Ref for Chat component

  const handleRegister = () => {
    if (username.trim() !== "") {
      socket.emit("register", { username }, (response) => {
        if (response.status === "ok") {
          setPlayer(response.player);
          setDungeon(response.dungeon);
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
                    addChatMessage={addChatMessage}
                    onRequestChat={handleOpenChat} // Pass the callback
                  />
                </Suspense>
              </ErrorBoundary>
            </Canvas>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
