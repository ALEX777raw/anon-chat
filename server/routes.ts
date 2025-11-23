import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { sendMessageSchema } from "../shared/schema";

interface WebSocketClient extends WebSocket {
  roomCode?: string;
  username?: string;
  userId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  const clients = new Map<string, Set<WebSocketClient>>();

  const broadcastToRoom = (roomCode: string, message: unknown, excludeClient?: WebSocketClient) => {
    const roomClients = clients.get(roomCode);
    if (!roomClients) return;

    const messageStr = JSON.stringify(message);
    Array.from(roomClients).forEach((client) => {
      if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  };

  wss.on("connection", (ws: WebSocketClient) => {
    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "join") {
          const { roomCode, username } = message;

          if (!roomCode || typeof roomCode !== "string" || roomCode.length !== 8) {
            ws.send(
              JSON.stringify({
                type: "error",
                error: "Invalid room code",
              }),
            );
            return;
          }

          let room = await storage.getRoom(roomCode);
          if (!room) {
            room = await storage.createRoom(roomCode);
          }

          const finalUsername = username || "Anonymous";

          ws.roomCode = roomCode;
          ws.username = finalUsername;
          ws.userId = randomUUID();

          if (!clients.has(roomCode)) {
            clients.set(roomCode, new Set());
          }
          clients.get(roomCode)!.add(ws);

          await storage.incrementUserCount(roomCode);
          await storage.updateRoomActivity(roomCode);
          await storage.addUser(roomCode, finalUsername);

          const messages = await storage.getMessages(roomCode);
          const users = await storage.getUsers(roomCode);

          ws.send(
            JSON.stringify({
              type: "history",
              messages,
            }),
          );
          ws.send(
            JSON.stringify({
              type: "users",
              users,
            }),
          );

          broadcastToRoom(roomCode, {
            type: "user_joined",
            username: ws.username,
            users,
          });
        } else if (message.type === "typing") {
          const { roomCode, username, isTyping } = message;
          if (!roomCode || !username) {
            return;
          }

          broadcastToRoom(
            roomCode,
            {
              type: "typing",
              username,
              isTyping,
            },
            ws,
          );
        } else if (message.type === "message") {
          const validation = sendMessageSchema.safeParse(message);

          if (!validation.success) {
            ws.send(
              JSON.stringify({
                type: "error",
                error: "Invalid message format",
              }),
            );
            return;
          }

          const { roomCode, username, text } = validation.data;

          const room = await storage.getRoom(roomCode);
          if (!room) {
            ws.send(
              JSON.stringify({
                type: "error",
                error: "Room does not exist",
              }),
            );
            return;
          }

          const newMessage = await storage.addMessage({
            roomCode,
            username: username || "Anonymous",
            text,
            timestamp: Date.now(),
          });

          await storage.updateRoomActivity(roomCode);

          const messageData = {
            type: "message",
            message: newMessage,
          };

          ws.send(JSON.stringify(messageData));
          broadcastToRoom(roomCode, messageData, ws);
        }
      } catch (error) {
        console.error("WebSocket error:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            error: "Failed to process message",
          }),
        );
      }
    });

    ws.on("close", async () => {
      if (ws.roomCode) {
        const roomClients = clients.get(ws.roomCode);
        if (roomClients) {
          roomClients.delete(ws);
          if (roomClients.size === 0) {
            clients.delete(ws.roomCode);
          }
        }

        await storage.decrementUserCount(ws.roomCode);

        if (ws.username) {
          await storage.removeUser(ws.roomCode, ws.username);
          const users = await storage.getUsers(ws.roomCode);

          broadcastToRoom(ws.roomCode, {
            type: "user_left",
            username: ws.username,
            users,
          });
        }
      }
    });
  });

  const INACTIVE_THRESHOLD = 30 * 60 * 1000;
  const CLEANUP_INTERVAL = 5 * 60 * 1000;

  setInterval(async () => {
    const inactiveRooms = await storage.getInactiveRooms(INACTIVE_THRESHOLD);
    for (const roomCode of inactiveRooms) {
      await storage.deleteRoom(roomCode);
      console.log(`Cleaned up inactive room: ${roomCode}`);
    }
  }, CLEANUP_INTERVAL);

  return httpServer;
}
