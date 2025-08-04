import { Controller, Get, Post, Param, Delete, HttpException, HttpStatus } from "@nestjs/common";
import { VideoChatService } from './video.service';

@Controller('videochat')
export class VideoChatController {
  constructor(private readonly videoChatService: VideoChatService) {}

  @Get('stats')
  getRoomStats() {
    return this.videoChatService.getRoomStats();
  }

  @Get('rooms')
  getActiveRooms() {
    return {
      rooms: this.videoChatService.getActiveRooms(),
      waitingUsers: this.videoChatService.getWaitingUsers().length
    };
  }

  @Get('room/:roomId')
  getRoom(@Param('roomId') roomId: string) {
    const room = this.videoChatService.getRoom(roomId);
    if (!room) {
      throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
    }
    return room;
  }

  @Post('cleanup')
  cleanupRooms() {
    this.videoChatService.cleanupInactiveRooms();
    this.videoChatService.cleanupWaitingUsers();
    return { message: 'Cleanup completed' };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'video-chat'
    };
  }
}