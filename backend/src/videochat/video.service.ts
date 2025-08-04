import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface Room {
  id: string;
  users: string[];
  createdAt: Date;
  isActive: boolean;
}

export interface WaitingUser {
  userId: string;
  joinedAt: Date;
}

@Injectable()
export class VideoChatService {
  private logger: Logger = new Logger('VideoChatService');
  private rooms: Map<string, Room> = new Map();
  private waitingUsers: WaitingUser[] = [];
  private userRoomMap: Map<string, string> = new Map();

  async findOrCreateRoom(userId: string): Promise<Room> {
    this.logger.log(`Finding or creating room for user: ${userId}`);

    // Check if there's a waiting user
    const waitingUserIndex = this.waitingUsers.findIndex(user => user.userId !== userId);
    
    if (waitingUserIndex !== -1) {
      // Match with waiting user
      const waitingUser = this.waitingUsers[waitingUserIndex];
      this.waitingUsers.splice(waitingUserIndex, 1);

      // Create room with both users
      const roomId = uuidv4();
      const room: Room = {
        id: roomId,
        users: [waitingUser.userId, userId],
        createdAt: new Date(),
        isActive: true,
      };

      this.rooms.set(roomId, room);
      this.userRoomMap.set(waitingUser.userId, roomId);
      this.userRoomMap.set(userId, roomId);

      this.logger.log(`Created room ${roomId} with users: ${waitingUser.userId}, ${userId}`);
      return room;
    } else {
      // Add user to waiting list and create room
      this.waitingUsers.push({
        userId,
        joinedAt: new Date(),
      });

      const roomId = uuidv4();
      const room: Room = {
        id: roomId,
        users: [userId],
        createdAt: new Date(),
        isActive: true,
      };

      this.rooms.set(roomId, room);
      this.userRoomMap.set(userId, roomId);

      this.logger.log(`User ${userId} added to waiting list, created room ${roomId}`);
      return room;
    }
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  leaveRoom(userId: string, roomId: string): void {
    this.logger.log(`User ${userId} leaving room ${roomId}`);

    const room = this.rooms.get(roomId);
    if (room) {
      // Remove user from room
      room.users = room.users.filter(id => id !== userId);
      
      // If room is empty, delete it
      if (room.users.length === 0) {
        this.rooms.delete(roomId);
        this.logger.log(`Deleted empty room ${roomId}`);
      } else {
        // Mark room as inactive if only one user left
        room.isActive = false;
      }
    }

    // Remove user from room mapping
    this.userRoomMap.delete(userId);
    
    // Remove from waiting list if present
    this.removeWaitingUser(userId);
  }

  removeWaitingUser(userId: string): void {
    const index = this.waitingUsers.findIndex(user => user.userId === userId);
    if (index !== -1) {
      this.waitingUsers.splice(index, 1);
      this.logger.log(`Removed user ${userId} from waiting list`);
    }
  }

  getUserRoom(userId: string): string | undefined {
    return this.userRoomMap.get(userId);
  }

  getActiveRooms(): Room[] {
    return Array.from(this.rooms.values()).filter(room => room.isActive);
  }

  getWaitingUsers(): WaitingUser[] {
    return [...this.waitingUsers];
  }

  getRoomStats(): {
    totalRooms: number;
    activeRooms: number;
    waitingUsers: number;
    connectedUsers: number;
  } {
    const totalRooms = this.rooms.size;
    const activeRooms = this.getActiveRooms().length;
    const waitingUsers = this.waitingUsers.length;
    const connectedUsers = this.userRoomMap.size;

    return {
      totalRooms,
      activeRooms,
      waitingUsers,
      connectedUsers,
    };
  }

  // Clean up old inactive rooms (call this periodically)
  cleanupInactiveRooms(maxAgeMinutes: number = 30): void {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    
    for (const [roomId, room] of this.rooms.entries()) {
      if (!room.isActive && room.createdAt < cutoffTime) {
        // Clean up user mappings
        room.users.forEach(userId => {
          this.userRoomMap.delete(userId);
        });
        
        this.rooms.delete(roomId);
        this.logger.log(`Cleaned up inactive room ${roomId}`);
      }
    }
  }

  // Clean up old waiting users (call this periodically)
  cleanupWaitingUsers(maxWaitMinutes: number = 10): void {
    const cutoffTime = new Date(Date.now() - maxWaitMinutes * 60 * 1000);
    
    this.waitingUsers = this.waitingUsers.filter(user => {
      if (user.joinedAt < cutoffTime) {
        this.logger.log(`Cleaned up waiting user ${user.userId} (waited too long)`);
        return false;
      }
      return true;
    });
  }
}
