import { createServer } from "node:http";
import express from "express";
import { Server } from "socket.io";
import { registerRoomHandlers } from "./handlers/room";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

io.on("connection", (socket) => {
  console.log(`socket connected: ${socket.id}`);

  registerRoomHandlers(io, socket);

  socket.on("disconnect", (reason) => {
    console.log(`socket disconnected: ${socket.id} - ${reason}`);
  });
});

const PORT = process.env.PORT ?? 4000;

httpServer.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
