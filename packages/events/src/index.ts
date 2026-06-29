// Shared Socket.io event names and payload types for frontend and server.

export const DUSK_EVENTS = {
  // Room
  ROOM_JOIN: "dusk:room:join",
  ROOM_LEAVE: "dusk:room:leave",
  ROOM_STATE: "dusk:room:state",

  // Playback
  PLAYBACK_PLAY: "dusk:playback:play",
  PLAYBACK_PAUSE: "dusk:playback:pause",
  PLAYBACK_SEEK: "dusk:playback:seek",
  PLAYBACK_VIDEO_CHANGE: "dusk:playback:video_change",

  // WebRTC signaling
  SIGNAL_OFFER: "dusk:signal:offer",
  SIGNAL_ANSWER: "dusk:signal:answer",
  SIGNAL_ICE: "dusk:signal:ice",
} as const;

export type RoomJoinPayload = {
  roomId: string;
};

export type RoomStatePayload = {
  roomId: string;
  participants: string[];
  videoId: string | null;
  playing: boolean;
  timestamp: number;
};

export type PlaybackPlayPayload = {
  timestamp: number;
};

export type PlaybackPausePayload = {
  timestamp: number;
};

export type PlaybackSeekPayload = {
  timestamp: number;
};

export type PlaybackVideoChangePayload = {
  videoId: string;
};

export type SignalPayload = {
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
};
