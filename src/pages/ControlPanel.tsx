"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

export default function ControlPanel() {
  const [serverRunning, setServerRunning] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  useEffect(() => {
    socket.on("serverStatus", ({ connected }) => {
      setBackendConnected(connected);
    });

    socket.on("localServerStatus", setServerRunning);

    return () => {
      socket.off("serverStatus");
      socket.off("localServerStatus");
    };
  }, []);

  const toggleServer = () => {
    socket.emit("toggleLocalServer");
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Control Panel</h1>
      <p>Local Server Status: {serverRunning ? "Running" : "Stopped"}</p>
      <p>Backend Server Connection: {backendConnected ? "Connected" : "Disconnected"}</p>
      <button onClick={toggleServer} disabled={!backendConnected}>
        {serverRunning ? "Stop Server" : "Start Server"}
      </button>
    </div>
  );
}
