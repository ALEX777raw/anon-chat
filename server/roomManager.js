const { v4: uuidv4 } = require('uuid');

class RoomManager {
    constructor() {
        // Хранилище: roomId -> { created: Date, users: Set }
        this.rooms = new Map();
        // Хранилище пользователей: socketId -> { roomId, username }
        this.users = new Map();
    }

    createRoom() {
        const roomId = uuidv4().split('-')[0]; // Короткий ID
        this.rooms.set(roomId, {
            createdAt: new Date(),
            users: new Set() // Храним ID сокетов
        });
        return roomId;
    }

    joinRoom(socketId, roomId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return { error: 'Комната не найдена или удалена' };
        }

        // Генерируем случайное имя "Guest-XXXX"
        const username = `Guest-${Math.floor(1000 + Math.random() * 9000)}`;
        
        room.users.add(socketId);
        this.users.set(socketId, { roomId, username });

        return { 
            username, 
            usersCount: room.users.size 
        };
    }

    leaveRoom(socketId) {
        const user = this.users.get(socketId);
        if (!user) return null;

        const { roomId, username } = user;
        const room = this.rooms.get(roomId);

        if (room) {
            room.users.delete(socketId);
            // Если комната пуста — удаляем её сразу (или можно оставить таймер)
            if (room.users.size === 0) {
                this.rooms.delete(roomId);
                console.log(`Room ${roomId} deleted (empty)`);
            }
        }

        this.users.delete(socketId);
        return { roomId, username };
    }

    getUser(socketId) {
        return this.users.get(socketId);
    }

    /**
     * Сборщик мусора: удаляет пустые или слишком старые комнаты.
     * @param {number} maxAgeMs - максимальный возраст комнаты в миллисекундах.
     * @returns {number} количество удаленных комнат.
     */
    cleanupRooms(maxAgeMs = 2 * 60 * 60 * 1000) { // по умолчанию 2 часа
        const now = Date.now();
        let removed = 0;

        for (const [roomId, room] of this.rooms.entries()) {
            const isEmpty = room.users.size === 0;
            const isTooOld = now - room.createdAt.getTime() > maxAgeMs;

            if (isEmpty || isTooOld) {
                this.rooms.delete(roomId);
                removed += 1;
                console.log(`Room ${roomId} removed by GC (${isEmpty ? 'empty' : 'expired'})`);
            }
        }

        return removed;
    }
}

module.exports = RoomManager;
