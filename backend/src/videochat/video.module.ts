import { Module } from '@nestjs/common';
import { VideoChatController } from './video.controller';
import { VideoChatService } from './video.service';
import { VideoChatGateway } from './video.gateway';

@Module({
  controllers: [VideoChatController],
  providers: [VideoChatService, VideoChatGateway],
  exports: [VideoChatService],
})
export class VideoChatModule {}
