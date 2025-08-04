import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { VideoChatModule } from './videochat/video.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [AuthModule, VideoChatModule],
  controllers: [AppController],
  providers: [AppService, PrismaService]
})
export class AppModule {}
