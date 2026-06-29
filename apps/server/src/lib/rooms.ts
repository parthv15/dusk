import redis from "./redis.js";

const ROOM_TTL_SECONDS = 60 * 60 * 4; // 4 hours
const ROOM_KEY = (roomId: string) => `room:${roomId}`;
const ROOM_PARTICIPANTS_KEY = (roomId: string) => `room:${roomId}:participants`;

export type RoomState = {
  roomId: string;
  createdAt: number;
  videoId: string | null;
  playing: boolean;
  timestamp: number;
};

export async function createRoom(roomId: string): Promise<RoomState> {
  const state: RoomState = {
    roomId,
    createdAt: Date.now(),
    videoId: null,
    playing: false,
    timestamp: 0,
  };

  await redis.hset(ROOM_KEY(roomId), flattenState(state));
  await redis.expire(ROOM_KEY(roomId), ROOM_TTL_SECONDS);

  return state;
}

export async function getRoom(roomId: string): Promise<RoomState | null> {
  const data = await redis.hgetall(ROOM_KEY(roomId));
  if (!data || Object.keys(data).length === 0) return null;
  return parseState(data);
}

export async function roomExists(roomId: string): Promise<boolean> {
  return (await redis.exists(ROOM_KEY(roomId))) === 1;
}

export async function addParticipant(roomId: string, socketId: string): Promise<void> {
  await redis.sadd(ROOM_PARTICIPANTS_KEY(roomId), socketId);
  await redis.expire(ROOM_PARTICIPANTS_KEY(roomId), ROOM_TTL_SECONDS);
}

export async function removeParticipant(roomId: string, socketId: string): Promise<void> {
  await redis.srem(ROOM_PARTICIPANTS_KEY(roomId), socketId);
}

export async function getParticipants(roomId: string): Promise<string[]> {
  return redis.smembers(ROOM_PARTICIPANTS_KEY(roomId));
}

export async function getRoomCount(roomId: string): Promise<number> {
  return redis.scard(ROOM_PARTICIPANTS_KEY(roomId));
}

export async function refreshTTL(roomId: string): Promise<void> {
  await redis.expire(ROOM_KEY(roomId), ROOM_TTL_SECONDS);
  await redis.expire(ROOM_PARTICIPANTS_KEY(roomId), ROOM_TTL_SECONDS);
}

function flattenState(state: RoomState): Record<string, string | number> {
  return {
    roomId: state.roomId,
    createdAt: state.createdAt,
    videoId: state.videoId ?? "",
    playing: state.playing ? "1" : "0",
    timestamp: state.timestamp,
  };
}

function parseState(data: Record<string, string>): RoomState {
  return {
    roomId: data.roomId,
    createdAt: Number(data.createdAt),
    videoId: data.videoId || null,
    playing: data.playing === "1",
    timestamp: Number(data.timestamp),
  };
}
