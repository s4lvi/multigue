// client/src/components/Chat.js

import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";

const Chat = forwardRef(({ socket, isOpen, onClose }, ref) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    addMessage: (msg) => {
      setMessages((prev) => [...prev, msg]);
    },
  }));

  // Listen for incoming chat messages from the server
  useEffect(() => {
    socket.on("chatMessage", (data) => {
      setMessages((prev) => [...prev, `${data.username}: ${data.message}`]);
    });

    return () => {
      socket.off("chatMessage");
    };
  }, [socket]);

  // Send message to server and update local messages
  const sendMessage = () => {
    if (input.trim() !== "") {
      socket.emit("chatMessage", input);
      setInput("");
    }
    // Close chat after sending
    handleClose();
  };

  // Handle key presses for sending or canceling
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  // Automatically focus the input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  // Scroll to the latest message when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleClose = () => {
    onClose();
    // Dispatch custom event to notify Game.js
    window.dispatchEvent(new Event("chatClosed"));
  };

  return (
    <div
      className="chat-container"
      style={{
        position: "fixed",
        bottom: "20px",
        left: "180px",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        padding: "10px",
        borderRadius: "5px",
        color: "white",
        width: "300px",
        maxHeight: "300px",
        overflowY: "auto",
        zIndex: 1000, // Ensure it stays on top
      }}
    >
      <div
        className="messages"
        style={{
          flexGrow: 1,
          marginBottom: "10px",
          overflowY: "auto",
          maxHeight: "200px",
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx}>{msg}</div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {isOpen && (
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%",
            padding: "5px",
            borderRadius: "3px",
            border: "none",
            outline: "none",
          }}
        />
      )}
      {/* <button
        onClick={handleClose}
        style={{
          marginTop: "5px",
          padding: "5px 10px",
          borderRadius: "3px",
          border: "none",
          backgroundColor: "#ff4d4d",
          color: "white",
          cursor: "pointer",
        }}
      >
        Close
      </button> */}
    </div>
  );
});

export default Chat;
