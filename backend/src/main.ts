import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerMiddleware } from '@src/middleware/logger.middleware';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable WebSocket support
  app.useWebSocketAdapter(new WsAdapter(app));
  
  // Enable CORS for video chat
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  // app.use(new LoggerMiddleware().use);
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`WebSocket server is also running on the same port`);
}
bootstrap();
