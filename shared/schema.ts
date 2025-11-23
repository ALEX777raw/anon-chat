import { z } from "zod";

export const messageSchema = z.object({
  id: z.string(),
  roomCode: z.string(),
  username: z.string(),
  text: z.string(),
  timestamp: z.number(),
});

export const roomSchema = z.object({
  code: z.string(),
  createdAt: z.number(),
  lastActivity: z.number(),
  userCount: z.number(),
});

export const userPresenceSchema = z.object({
  username: z.string(),
  joinedAt: z.number(),
});

export const createRoomSchema = z.object({
  code: z.string().length(8).regex(/^[A-Z0-9]+$/),
});

export const joinRoomSchema = z.object({
  code: z.string().length(8).regex(/^[A-Z0-9]+$/),
  username: z.string().min(1).max(30).optional(),
});

export const sendMessageSchema = z.object({
  roomCode: z.string().length(8),
  username: z.string().min(1).max(30),
  text: z.string().min(1).max(1000),
});

export type Message = z.infer<typeof messageSchema>;
export type Room = z.infer<typeof roomSchema>;
export type CreateRoom = z.infer<typeof createRoomSchema>;
export type JoinRoom = z.infer<typeof joinRoomSchema>;
export type SendMessage = z.infer<typeof sendMessageSchema>;
export type UserPresence = z.infer<typeof userPresenceSchema>;
