// client/src/components/ErrorBoundary.js

import React from "react";
import { Html } from "@react-three/drei";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state to render fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI using Html
      return (
        <Html center>
          <h1>Something went wrong.</h1>
        </Html>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
