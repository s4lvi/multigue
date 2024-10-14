// src / index.js;
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./styles/main.css";
import { AudioProvider } from "./AudioContext";

ReactDOM.render(
  <AudioProvider>
    <App />
  </AudioProvider>,
  document.getElementById("root")
);
