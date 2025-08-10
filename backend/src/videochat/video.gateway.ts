import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'ws';
import * as WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { VideoChatService } from './video.service';

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  roomId?: string;
  isAlive?: boolean;
}

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class VideoChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('VideoChatGateway');

  constructor(private videoChatService: VideoChatService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    
    // Setup heartbeat to detect disconnected clients
    const interval = setInterval(() => {
      server.clients.forEach((ws: ExtendedWebSocket) => {
        if (ws.isAlive === false) {
          ws.terminate();
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    server.on('close', () => {
      clearInterval(interval);
    });
  }

  handleConnection(client: ExtendedWebSocket, ...args: any[]) {
    const userId = uuidv4();
    client.userId = userId;
    client.isAlive = true;

    this.logger.log(`Client connected: ${userId}`);
    
    // Setup pong handler for heartbeat
    client.on('pong', () => {
      client.isAlive = true;
    });

    // Send welcome message
    this.sendToClient(client, 'connected', { userId, message: 'Connected to video chat' });
  }

  handleDisconnect(client: ExtendedWebSocket) {
    this.logger.log(`Client disconnected: ${client.userId}`);
    
    if (client.roomId && client.userId) {
      this.videoChatService.leaveRoom(client.userId, client.roomId);
      this.notifyRoomPartner(client.roomId, client.userId, 'partner_disconnected');
    }
    
    if (client.userId) {
      this.videoChatService.removeWaitingUser(client.userId);
    }
  }

  @SubscribeMessage('find_partner')
  async handleFindPartner(@ConnectedSocket() client: ExtendedWebSocket) {
    if (!client.userId) {
      this.sendToClient(client, 'error', { message: 'User ID not found' });
      return;
    }

    this.logger.log(`User ${client.userId} looking for partner`);
    
    try {
      const room = await this.videoChatService.findOrCreateRoom(client.userId);
      
      if (room.users.length === 1) {
        // First user in room, waiting for partner
        client.roomId = room.id;
        this.sendToClient(client, 'waiting_for_partner', { roomId: room.id });
      } else if (room.users.length === 2) {
        // Second user joined, notify both users
        client.roomId = room.id;
        
        const partnerId = room.users.find(id => id !== client.userId);
        if (partnerId) {
          const partner = this.findClientByUserId(partnerId);
          if (partner) {
            partner.roomId = room.id;
            
            // Notify both users that match is found
            this.sendToClient(client, 'partner_found', { 
              roomId: room.id, 
              partnerId: partner.userId,
              isInitiator: true 
            });
            
            this.sendToClient(partner, 'partner_found', { 
              roomId: room.id, 
              partnerId: client.userId,
              isInitiator: false 
            });
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error finding partner for ${client.userId}:`, error);
      this.sendToClient(client, 'error', { message: 'Failed to find partner' });
    }
  }

  @SubscribeMessage('webrtc_offer')
  handleWebRTCOffer(
    @ConnectedSocket() client: ExtendedWebSocket,
    @MessageBody() data: { offer: any; roomId: string }
  ) {
    this.logger.log(`WebRTC offer from ${client.userId} in room ${data.roomId}`);
    this.forwardToRoomPartner(client, data.roomId, 'webrtc_offer', { 
      offer: data.offer,
      from: client.userId 
    });
  }

  @SubscribeMessage('webrtc_answer')
  handleWebRTCAnswer(
    @ConnectedSocket() client: ExtendedWebSocket,
    @MessageBody() data: { answer: any; roomId: string }
  ) {
    this.logger.log(`WebRTC answer from ${client.userId} in room ${data.roomId}`);
    this.forwardToRoomPartner(client, data.roomId, 'webrtc_answer', { 
      answer: data.answer,
      from: client.userId 
    });
  }

  @SubscribeMessage('webrtc_ice_candidate')
  handleICECandidate(
    @ConnectedSocket() client: ExtendedWebSocket,
    @MessageBody() data: { candidate: any; roomId: string }
  ) {
    this.logger.log(`ICE candidate from ${client.userId} in room ${data.roomId}`);
    
    // Add delay for mobile devices to ensure proper ICE candidate processing
    setTimeout(() => {
      this.forwardToRoomPartner(client, data.roomId, 'webrtc_ice_candidate', { 
        candidate: data.candidate,
        from: client.userId 
      });
    }, 100); // Small delay helps with mobile WebRTC timing
  }

  @SubscribeMessage('chat_message')
  handleChatMessage(
    @ConnectedSocket() client: ExtendedWebSocket,
    @MessageBody() data: { message: string; roomId: string }
  ) {
    this.logger.log(`Chat message from ${client.userId} in room ${data.roomId}`);
    this.forwardToRoomPartner(client, data.roomId, 'chat_message', {
      message: data.message,
      from: client.userId,
      timestamp: new Date().toISOString()
    });
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@ConnectedSocket() client: ExtendedWebSocket) {
    if (client.roomId && client.userId) {
      this.logger.log(`User ${client.userId} leaving room ${client.roomId}`);
      
      this.videoChatService.leaveRoom(client.userId, client.roomId);
      this.notifyRoomPartner(client.roomId, client.userId, 'partner_left');
      
      client.roomId = undefined;
      this.sendToClient(client, 'left_room', { message: 'You left the room' });
    }
  }

  @SubscribeMessage('connection_state')
  handleConnectionState(
    @ConnectedSocket() client: ExtendedWebSocket,
    @MessageBody() data: { state: string; roomId: string }
  ) {
    this.logger.log(`Connection state ${data.state} from ${client.userId} in room ${data.roomId}`);
    
    // Forward connection state to partner for debugging
    this.forwardToRoomPartner(client, data.roomId, 'partner_connection_state', {
      state: data.state,
      from: client.userId
    });
  }

  @SubscribeMessage('next_partner')
  async handleNextPartner(@ConnectedSocket() client: ExtendedWebSocket) {
    // Leave current room if any
    if (client.roomId && client.userId) {
      this.videoChatService.leaveRoom(client.userId, client.roomId);
      this.notifyRoomPartner(client.roomId, client.userId, 'partner_left');
      client.roomId = undefined;
    }

    // Find new partner
    this.handleFindPartner(client);
  }

  private findClientByUserId(userId: string): ExtendedWebSocket | undefined {
    for (const client of this.server.clients) {
      if ((client as ExtendedWebSocket).userId === userId) {
        return client as ExtendedWebSocket;
      }
    }
    return undefined;
  }

  private forwardToRoomPartner(
    sender: ExtendedWebSocket,
    roomId: string,
    event: string,
    data: any
  ) {
    const room = this.videoChatService.getRoom(roomId);
    if (!room) return;

    const partnerId = room.users.find(id => id !== sender.userId);
    if (partnerId) {
      const partner = this.findClientByUserId(partnerId);
      if (partner) {
        this.sendToClient(partner, event, data);
      }
    }
  }

  private notifyRoomPartner(roomId: string, leavingUserId: string, event: string) {
    const room = this.videoChatService.getRoom(roomId);
    if (!room) return;

    const partnerId = room.users.find(id => id !== leavingUserId);
    if (partnerId) {
      const partner = this.findClientByUserId(partnerId);
      if (partner) {
        partner.roomId = undefined;
        this.sendToClient(partner, event, { 
          message: 'Your partner has disconnected',
          roomId 
        });
      }
    }
  }

  private sendToClient(client: ExtendedWebSocket, event: string, data: any) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ event, data }));
    }
  }
}
