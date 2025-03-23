import express from "express";
import { Server as SocketServer } from "socket.io";
import http from "http";
import { io as ClientSocket } from "socket.io-client";
import { Server as LocalServer } from "socket.io";

const PORT_MAIN = 3000;
const PORT_BACKEND = 5000;
const PORT_LOCAL = 4000;
const BACKEND_URL = `http://localhost:${PORT_BACKEND}`;

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, { cors: { origin: "*" } });

const backendSocket = ClientSocket(BACKEND_URL);
let isLocalServerRunning = false;
let localServer = null;

backendSocket.on("connect", () => {
  console.log("Connected to backend server");
  io.emit("serverStatus", { connected: true });
});

backendSocket.on("disconnect", () => {
  console.log("Disconnected from backend server");
  io.emit("serverStatus", { connected: false });
});

backendSocket.on("text", (data) => {
  setTimeout(() => {
    io.emit("text", data);
  }, 50)
});

backendSocket.on("serverState", (state) => {
  console.log("Received serverState from backend:", state);
  io.emit("serverState", state);
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.emit("serverStatus", { connected: backendSocket.connected });
  socket.emit("localServerStatus", isLocalServerRunning);

  socket.on("requestText", () => {
    backendSocket.emit("requestText");
  });

  socket.on("toggleLocalServer", () => {
    if (isLocalServerRunning) {
      if (localServer) {
        localServer.close(() => {
          console.log("Local server stopped");
          isLocalServerRunning = false;
          io.emit("localServerStatus", false);
        });
      }
    } else {
      localServer = http.createServer();
      const localIo = new LocalServer(localServer, { cors: { origin: "*" } });
      localIo.on("connection", (client) => {
        console.log("Client connected to local server:", client.id);
        client.on("disconnect", () => console.log("Client disconnected"));
      });
      localServer.listen(PORT_LOCAL, () => {
        console.log("Local server started on port", PORT_LOCAL);
        isLocalServerRunning = true;
        io.emit("localServerStatus", true);
      });
    }
  });

  socket.on("disconnect", () => console.log("Client disconnected"));
});

server.listen(PORT_MAIN, () => console.log(`Proxy server running on port ${PORT_MAIN}`));