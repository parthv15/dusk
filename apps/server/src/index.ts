import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

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

  socket.on("disconnect", (reason) => {
    console.log(`socket disconnected: ${socket.id} - ${reason}`);
  });
});

const PORT = process.env.PORT ?? 4000;

httpServer.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
