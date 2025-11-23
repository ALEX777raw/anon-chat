import { randomUUID } from "crypto";
import type { Message, Room, UserPresence } from "../shared/schema";

export interface IStorage {
  createRoom(code: string): Promise<Room>;
  getRoom(code: string): Promise<Room | undefined>;
  deleteRoom(code: string): Promise<void>;
  updateRoomActivity(code: string): Promise<void>;
  incrementUserCount(code: string): Promise<void>;
  decrementUserCount(code: string): Promise<void>;

  addMessage(message: Omit<Message, "id">): Promise<Message>;
  getMessages(roomCode: string): Promise<Message[]>;

  addUser(roomCode: string, username: string): Promise<void>;
  removeUser(roomCode: string, username: string): Promise<void>;
  getUsers(roomCode: string): Promise<UserPresence[]>;

  getInactiveRooms(inactiveThresholdMs: number): Promise<string[]>;
}

export class MemStorage implements IStorage {
  private rooms: Map<string, Room>;
  private messages: Map<string, Message[]>;
  private users: Map<string, UserPresence[]>;

  constructor() {
    this.rooms = new Map();
    this.messages = new Map();
    this.users = new Map();
  }

  async createRoom(code: string): Promise<Room> {
    const now = Date.now();
    const room: Room = {
      code,
      createdAt: now,
      lastActivity: now,
      userCount: 0,
    };
    this.rooms.set(code, room);
    this.messages.set(code, []);
    return room;
  }

  async getRoom(code: string): Promise<Room | undefined> {
    return this.rooms.get(code);
  }

  async deleteRoom(code: string): Promise<void> {
    this.rooms.delete(code);
    this.messages.delete(code);
    this.users.delete(code);
  }

  async updateRoomActivity(code: string): Promise<void> {
    const room = this.rooms.get(code);
    if (room) {
      room.lastActivity = Date.now();
    }
  }

  async incrementUserCount(code: string): Promise<void> {
    const room = this.rooms.get(code);
    if (room) {
      room.userCount += 1;
    }
  }

  async decrementUserCount(code: string): Promise<void> {
    const room = this.rooms.get(code);
    if (room) {
      room.userCount = Math.max(0, room.userCount - 1);
    }
  }

  async addMessage(message: Omit<Message, "id">): Promise<Message> {
    const newMessage: Message = {
      ...message,
      id: randomUUID(),
    };

    const roomMessages = this.messages.get(message.roomCode) || [];
    roomMessages.push(newMessage);
    this.messages.set(message.roomCode, roomMessages);

    return newMessage;
  }

  async getMessages(roomCode: string): Promise<Message[]> {
    return this.messages.get(roomCode) || [];
  }

  async addUser(roomCode: string, username: string): Promise<void> {
    const roomUsers = this.users.get(roomCode) || [];
    const existingUser = roomUsers.find((u) => u.username === username);

    if (!existingUser) {
      roomUsers.push({
        username,
        joinedAt: Date.now(),
      });
      this.users.set(roomCode, roomUsers);
    }
  }

  async removeUser(roomCode: string, username: string): Promise<void> {
    const roomUsers = this.users.get(roomCode) || [];
    const filteredUsers = roomUsers.filter((u) => u.username !== username);
    this.users.set(roomCode, filteredUsers);
  }

  async getUsers(roomCode: string): Promise<UserPresence[]> {
    return this.users.get(roomCode) || [];
  }

  async getInactiveRooms(inactiveThresholdMs: number): Promise<string[]> {
    const now = Date.now();
    const inactiveRooms: string[] = [];

    Array.from(this.rooms.entries()).forEach(([code, room]) => {
      if (now - room.lastActivity > inactiveThresholdMs && room.userCount === 0) {
        inactiveRooms.push(code);
      }
    });

    return inactiveRooms;
  }
}

export const storage = new MemStorage();
