import { DUSK_EVENTS } from "@dusk/events";
import type { Server, Socket } from "socket.io";
import {
  addParticipant,
  createRoom,
  getParticipants,
  getRoom,
  getRoomCount,
  refreshTTL,
  removeParticipant,
  roomExists,
} from "../lib/rooms";

type JoinPayload = { roomId: string };

export function registerRoomHandlers(io: Server, socket: Socket): void {
  socket.on(DUSK_EVENTS.ROOM_JOIN, async (payload: JoinPayload) => {
    const { roomId } = payload;

    let room = await getRoom(roomId);
    if (!room) {
      room = await createRoom(roomId);
      console.log(`room created: ${roomId}`);
    }

    await socket.join(roomId);
    await addParticipant(roomId, socket.id);
    await refreshTTL(roomId);

    const participants = await getParticipants(roomId);
    console.log(`socket ${socket.id} joined room ${roomId} (${participants.length} participants)`);

    // Send current room state to the joining client
    socket.emit(DUSK_EVENTS.ROOM_STATE, {
      roomId: room.roomId,
      participants,
      videoId: room.videoId,
      playing: room.playing,
      timestamp: room.timestamp,
    });

    // Notify others in the room
    socket.to(roomId).emit(DUSK_EVENTS.ROOM_STATE, {
      roomId: room.roomId,
      participants,
      videoId: room.videoId,
      playing: room.playing,
      timestamp: room.timestamp,
    });
  });

  socket.on(DUSK_EVENTS.ROOM_LEAVE, async (payload: JoinPayload) => {
    const { roomId } = payload;
    await handleLeave(io, socket, roomId);
  });

  socket.on("disconnecting", async () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;
      await handleLeave(io, socket, roomId);
    }
  });
}

async function handleLeave(io: Server, socket: Socket, roomId: string): Promise<void> {
  if (!(await roomExists(roomId))) return;

  await socket.leave(roomId);
  await removeParticipant(roomId, socket.id);

  const count = await getRoomCount(roomId);
  const participants = await getParticipants(roomId);

  console.log(`socket ${socket.id} left room ${roomId} (${count} remaining)`);

  io.to(roomId).emit(DUSK_EVENTS.ROOM_STATE, {
    roomId,
    participants,
    videoId: null,
    playing: false,
    timestamp: 0,
  });
}
