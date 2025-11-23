const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss');

// --- Config ---
const PORT = process.env.PORT || 3000;
const MAX_MSG_LENGTH = 2000;
const RATE_LIMIT_MS = 1000;
const MAX_MSGS_PER_SEC = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ROOM_TTL_MS = 30 * 60 * 1000; // 30 минут

// --- Storage ---
class MemStorage {
    constructor() {
        this.rooms = new Map(); // roomId -> { code, createdAt, lastActivity, userCount }
        this.messages = new Map(); // roomId -> [Message]
        this.users = new Map(); // roomId -> Set(username)
    }

    createRoom(code) {
        const now = Date.now();
        const room = { code, createdAt: now, lastActivity: now, userCount: 0 };
        this.rooms.set(code, room);
        this.messages.set(code, []);
        this.users.set(code, new Set());
        return room;
    }

    getRoom(code) {
        return this.rooms.get(code);
    }

    deleteRoom(code) {
        this.rooms.delete(code);
        this.messages.delete(code);
        this.users.delete(code);
    }

    updateRoomActivity(code) {
        const room = this.rooms.get(code);
        if (room) room.lastActivity = Date.now();
    }

    incrementUserCount(code) {
        const room = this.rooms.get(code);
        if (room) room.userCount += 1;
    }

    decrementUserCount(code) {
        const room = this.rooms.get(code);
        if (room) room.userCount = Math.max(0, room.userCount - 1);
    }

    addMessage(message) {
        const newMessage = { ...message, id: uuidv4() };
        const list = this.messages.get(message.roomId) || [];
        list.push(newMessage);
        this.messages.set(message.roomId, list);
        return newMessage;
    }

    getMessages(roomId) {
        return this.messages.get(roomId) || [];
    }

    addUser(roomId, username) {
        if (!this.users.has(roomId)) this.users.set(roomId, new Set());
        this.users.get(roomId).add(username);
    }

    removeUser(roomId, username) {
        const set = this.users.get(roomId);
        if (!set) return;
        set.delete(username);
    }

    getUsers(roomId) {
        return Array.from(this.users.get(roomId) || []);
    }

    getInactiveRooms(thresholdMs) {
        const now = Date.now();
        const inactive = [];
        for (const [code, room] of this.rooms.entries()) {
            if (room.userCount === 0 && now - room.lastActivity > thresholdMs) {
                inactive.push(code);
            }
        }
        return inactive;
    }
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 8 * 1024 * 1024,
    pingTimeout: 60000,
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const storage = new MemStorage();
const rateLimits = new Map(); // socketId -> { count, expires }

// --- Middleware ---
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// --- Rate limit helpers ---
setInterval(() => {
    const now = Date.now();
    rateLimits.forEach((value, key) => {
        if (value.expires < now) rateLimits.delete(key);
    });
}, 10000);

function checkRateLimit(socketId) {
    const now = Date.now();
    let record = rateLimits.get(socketId);
    if (!record || record.expires < now) {
        record = { count: 0, expires: now + RATE_LIMIT_MS };
    }
    if (record.count >= MAX_MSGS_PER_SEC) {
        rateLimits.set(socketId, record);
        return false;
    }
    record.count += 1;
    rateLimits.set(socketId, record);
    return true;
}

// --- Utils ---
function sanitizeName(name) {
    return xss(String(name || '')).trim().slice(0, 30);
}

function sanitizeText(text) {
    return xss(String(text || '')).trim().slice(0, MAX_MSG_LENGTH);
}

function generateRoomCode(existing) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без O, I, 1
    let code = '';
    do {
        code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    } while (existing.has(code));
    return code;
}

function validateRoomId(roomId) {
    return typeof roomId === 'string' && roomId.length === 8;
}

function validateFilePayload(payload) {
    if (!payload || typeof payload !== 'object') return false;
    const { data, mime, name, size } = payload;
    if (typeof data !== 'string' || data.length === 0) return false;
    if (size && typeof size !== 'number') return false;
    if (size && size > MAX_FILE_SIZE) return false;
    if (mime && typeof mime !== 'string') return false;
    if (name && typeof name !== 'string') return false;
    const approxSize = Buffer.byteLength(data, 'base64');
    if (approxSize > MAX_FILE_SIZE * 1.37) return false;
    return true;
}

// --- Socket.IO ---
io.on('connection', (socket) => {
    console.log(`[Connect] ${socket.id}`);

    socket.on('create_room', () => {
        if (!checkRateLimit(socket.id)) return;
        const code = generateRoomCode(storage.rooms);
        storage.createRoom(code);
        socket.emit('room_created', code);
    });

    socket.on('join', (roomId) => {
        try {
            if (!validateRoomId(roomId)) {
                socket.emit('error_msg', 'Некорректный код комнаты');
                return;
            }

            const room = storage.getRoom(roomId);
            if (!room) {
                socket.emit('error_msg', 'Комната не найдена или удалена');
                return;
            }

            // Если уже был в комнате — очистим
            const prev = socket.data.user;
            if (prev) {
                storage.removeUser(prev.roomId, prev.username);
            }

            socket.join(roomId);
            storage.incrementUserCount(roomId);
            storage.updateRoomActivity(roomId);

            const username = `Guest-${Math.floor(1000 + Math.random() * 9000)}`;
            socket.data.user = { roomId, username };
            storage.addUser(roomId, username);

            const history = storage.getMessages(roomId).slice(-50);
            const users = storage.getUsers(roomId);
            socket.emit('joined', { roomId, username, history, users });
            io.to(roomId).emit('users', users);
            io.to(roomId).emit('system_msg', `${username} вошел в чат`);
        } catch (err) {
            console.error('[Join Error]', err);
            socket.emit('error_msg', 'Внутренняя ошибка при входе');
        }
    });

    socket.on('typing', (state) => {
        const user = socket.data.user;
        if (!user) return;
        io.to(user.roomId).emit('typing', {
            username: user.username,
            isTyping: !!state
        });
    });

    socket.on('rename', (newName) => {
        const user = socket.data.user;
        if (!user) return;
        const nextName = sanitizeName(newName);
        if (!nextName) {
            socket.emit('error_msg', 'Имя не может быть пустым');
            return;
        }
        const room = storage.getRoom(user.roomId);
        if (!room) return;
        const currentUsers = new Set(storage.getUsers(user.roomId));
        if (currentUsers.has(nextName) && nextName !== user.username) {
            socket.emit('error_msg', 'Такой ник уже занят в этой комнате');
            return;
        }
        storage.removeUser(user.roomId, user.username);
        storage.addUser(user.roomId, nextName);
        user.username = nextName;
        const usersList = storage.getUsers(user.roomId);
        socket.emit('rename_ok', { username: nextName, users: usersList });
        io.to(user.roomId).emit('users', usersList);
        io.to(user.roomId).emit('system_msg', `${nextName} обновил ник`);
    });

    socket.on('chat_message', (payload) => {
        try {
            const user = socket.data.user;
            if (!user) return;
            if (!checkRateLimit(socket.id)) {
                socket.emit('system_msg', 'Слишком быстро! Подождите немного.');
                return;
            }
            if (!payload || typeof payload !== 'object') return;
            const text = sanitizeText(payload.text);
            if (!text) return;

            const room = storage.getRoom(user.roomId);
            if (!room) return;

            const msg = {
                id: uuidv4(),
                username: user.username,
                type: 'text',
                text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isMine: false
            };

            storage.addMessage({ roomId: user.roomId, ...msg });
            storage.updateRoomActivity(user.roomId);

            socket.broadcast.to(user.roomId).emit('message', msg);
            msg.isMine = true;
            socket.emit('message', msg);
        } catch (err) {
            console.error('[Message Error]', err);
        }
    });

    socket.on('file_message', (payload) => {
        try {
            const user = socket.data.user;
            if (!user) return;
            if (!checkRateLimit(socket.id)) {
                socket.emit('system_msg', 'Слишком быстро! Подождите немного.');
                return;
            }
            if (!validateFilePayload(payload)) {
                socket.emit('error_msg', 'Некорректный файл');
                return;
            }

            const room = storage.getRoom(user.roomId);
            if (!room) return;

            const fileMsg = {
                id: uuidv4(),
                username: user.username,
                type: 'file',
                data: payload.data,
                mime: payload.mime || 'application/octet-stream',
                name: payload.name || 'file',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isMine: false
            };

            storage.addMessage({ roomId: user.roomId, ...fileMsg });
            storage.updateRoomActivity(user.roomId);

            socket.broadcast.to(user.roomId).emit('file_message', fileMsg);
            fileMsg.isMine = true;
            socket.emit('file_message', fileMsg);
        } catch (err) {
            console.error('[File Error]', err);
        }
    });

    socket.on('disconnect', () => {
        try {
            const user = socket.data.user;
            if (user) {
                storage.decrementUserCount(user.roomId);
                storage.updateRoomActivity(user.roomId);
                storage.removeUser(user.roomId, user.username);
                io.to(user.roomId).emit('users', storage.getUsers(user.roomId));
                io.to(user.roomId).emit('system_msg', `${user.username} покинул чат`);
            }
            rateLimits.delete(socket.id);
            console.log(`[Disconnect] ${socket.id}`);
        } catch (err) {
            console.error('[Disconnect Error]', err);
        }
    });
});

// Room GC
setInterval(() => {
    const inactive = storage.getInactiveRooms(ROOM_TTL_MS);
    inactive.forEach((code) => {
        storage.deleteRoom(code);
        console.log(`Room ${code} deleted (inactive)`);
    });
}, 5 * 60 * 1000);

// Global fallbacks
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION at', promise, 'reason:', reason);
});

server.listen(PORT, () => {
    console.log(`Secure server running on http://localhost:${PORT}`);
});
