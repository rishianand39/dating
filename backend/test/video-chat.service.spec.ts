import { Test, TestingModule } from '@nestjs/testing';
import { VideoChatService } from '../src/videochat/video.service';

describe('VideoChatService', () => {
  let service: VideoChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VideoChatService],
    }).compile();

    service = module.get<VideoChatService>(VideoChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create room for new user', async () => {
    const userId = 'test-user-1';
    const room = await service.findOrCreateRoom(userId);
    
    expect(room).toBeDefined();
    expect(room.users).toContain(userId);
    expect(room.users.length).toBe(1);
    expect(room.isActive).toBe(true);
  });

  it('should match two users in the same room', async () => {
    const user1 = 'test-user-1';
    const user2 = 'test-user-2';
    
    // First user creates room
    const room1 = await service.findOrCreateRoom(user1);
    expect(room1.users.length).toBe(1);
    
    // Second user joins the same room
    const room2 = await service.findOrCreateRoom(user2);
    expect(room2.id).toBe(room1.id);
    expect(room2.users.length).toBe(2);
    expect(room2.users).toContain(user1);
    expect(room2.users).toContain(user2);
  });

  it('should handle user leaving room', () => {
    const userId = 'test-user-1';
    const roomId = 'test-room-1';
    
    // Simulate user in room
    service['rooms'].set(roomId, {
      id: roomId,
      users: [userId],
      createdAt: new Date(),
      isActive: true
    });
    service['userRoomMap'].set(userId, roomId);
    
    // User leaves
    service.leaveRoom(userId, roomId);
    
    // Room should be deleted as it's empty
    expect(service.getRoom(roomId)).toBeUndefined();
    expect(service.getUserRoom(userId)).toBeUndefined();
  });

  it('should provide room statistics', () => {
    const stats = service.getRoomStats();
    
    expect(stats).toHaveProperty('totalRooms');
    expect(stats).toHaveProperty('activeRooms');
    expect(stats).toHaveProperty('waitingUsers');
    expect(stats).toHaveProperty('connectedUsers');
  });
});
