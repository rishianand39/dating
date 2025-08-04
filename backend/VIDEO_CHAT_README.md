# Video Chat Backend - Omegle-like Implementation

This is a complete video chat backend similar to Omegle, built with NestJS and WebSockets (ws library).

## Features

- **Random Partner Matching**: Users are automatically matched with random partners
- **WebRTC Video/Audio**: Real-time video and audio communication
- **Text Chat**: Built-in text messaging during video calls
- **Room Management**: Automatic room creation and cleanup
- **WebSocket Communication**: Real-time signaling for WebRTC
- **HTTP API**: REST endpoints for monitoring and management

## Architecture

### Components

1. **VideoChatGateway** (`video.gateway.ts`)
   - WebSocket server handling real-time communication
   - WebRTC signaling (offers, answers, ICE candidates)
   - User matching and room management
   - Heartbeat mechanism for connection monitoring

2. **VideoChatService** (`video.service.ts`)
   - Business logic for room and user management
   - Partner matching algorithm
   - Room cleanup and maintenance

3. **VideoChatController** (`video.controller.ts`)
   - HTTP REST API endpoints
   - System monitoring and statistics
   - Manual cleanup operations

4. **VideoChatModule** (`video.module.ts`)
   - Module configuration and dependency injection

## API Endpoints

### HTTP REST API

```
GET /videochat/stats           # Get system statistics
GET /videochat/rooms           # Get active rooms and waiting users
GET /videochat/room/:roomId    # Get specific room details
POST /videochat/cleanup        # Manual cleanup of inactive rooms
GET /videochat/health          # Health check endpoint
```

### WebSocket Events

#### Client → Server

```javascript
// Connect and find a partner
{ event: 'find_partner', data: {} }

// WebRTC Signaling
{ event: 'webrtc_offer', data: { offer: RTCSessionDescription, roomId: string } }
{ event: 'webrtc_answer', data: { answer: RTCSessionDescription, roomId: string } }
{ event: 'webrtc_ice_candidate', data: { candidate: RTCIceCandidate, roomId: string } }

// Chat messages
{ event: 'chat_message', data: { message: string, roomId: string } }

// Room management
{ event: 'leave_room', data: {} }
{ event: 'next_partner', data: {} }
```

#### Server → Client

```javascript
// Connection status
{ event: 'connected', data: { userId: string, message: string } }
{ event: 'waiting_for_partner', data: { roomId: string } }
{ event: 'partner_found', data: { roomId: string, partnerId: string, isInitiator: boolean } }

// WebRTC Signaling
{ event: 'webrtc_offer', data: { offer: RTCSessionDescription, from: string } }
{ event: 'webrtc_answer', data: { answer: RTCSessionDescription, from: string } }
{ event: 'webrtc_ice_candidate', data: { candidate: RTCIceCandidate, from: string } }

// Chat messages
{ event: 'chat_message', data: { message: string, from: string, timestamp: string } }

// Partner events
{ event: 'partner_disconnected', data: { message: string, roomId: string } }
{ event: 'partner_left', data: { message: string, roomId: string } }

// Errors
{ event: 'error', data: { message: string } }
```

## Installation

1. **Install dependencies**:
   ```bash
   npm install @nestjs/websockets @nestjs/platform-ws ws uuid @types/uuid @types/ws
   ```

2. **Start the server**:
   ```bash
   npm run start:dev
   ```

3. **Server will run on**:
   - HTTP API: `http://localhost:3000`
   - WebSocket: `ws://localhost:8080`

## Usage

### Backend Testing

1. **Check system status**:
   ```bash
   curl http://localhost:3000/videochat/health
   curl http://localhost:3000/videochat/stats
   ```

2. **View active rooms**:
   ```bash
   curl http://localhost:3000/videochat/rooms
   ```

### Client Implementation

A complete HTML/JavaScript demo client is provided in `/public/video-chat-demo.html`. To use it:

1. Open the file in a web browser
2. Click "Start Chat" to begin
3. Allow camera/microphone permissions
4. Wait for partner matching
5. Enjoy video chat!

### WebSocket Client Example

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
    // Find a partner
    ws.send(JSON.stringify({
        event: 'find_partner',
        data: {}
    }));
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('Received:', message);
    
    // Handle different events
    switch (message.event) {
        case 'partner_found':
            // Initialize WebRTC connection
            initializeWebRTC(message.data);
            break;
        case 'webrtc_offer':
            // Handle WebRTC offer
            handleOffer(message.data.offer);
            break;
        // ... handle other events
    }
};
```

## WebRTC Integration

The system provides WebRTC signaling but doesn't handle the actual WebRTC connections. Clients need to:

1. **Initialize RTCPeerConnection**:
   ```javascript
   const peerConnection = new RTCPeerConnection({
       iceServers: [
           { urls: 'stun:stun.l.google.com:19302' }
       ]
   });
   ```

2. **Handle signaling through WebSocket**:
   - Send offers/answers through WebSocket
   - Exchange ICE candidates
   - Manage connection state

3. **Add local media streams**:
   ```javascript
   const stream = await navigator.mediaDevices.getUserMedia({
       video: true,
       audio: true
   });
   stream.getTracks().forEach(track => {
       peerConnection.addTrack(track, stream);
   });
   ```

## Configuration

### WebSocket Port

The WebSocket server runs on port 8080 by default. Change it in `video.gateway.ts`:

```typescript
@WebSocketGateway({
  port: 8080,  // Change this port
  transports: ['websocket'],
})
```

### Room Cleanup

Automatic cleanup intervals can be configured in the service:

```typescript
// Clean up inactive rooms older than 30 minutes
videoChatService.cleanupInactiveRooms(30);

// Clean up users waiting longer than 10 minutes
videoChatService.cleanupWaitingUsers(10);
```

## Security Considerations

1. **STUN/TURN Servers**: For production, use your own STUN/TURN servers
2. **Rate Limiting**: Implement rate limiting for WebSocket connections
3. **Authentication**: Add user authentication before allowing video chat
4. **Content Moderation**: Implement reporting and moderation features
5. **HTTPS/WSS**: Use secure connections in production

## Monitoring

The system provides several monitoring endpoints:

- **Health Check**: `/videochat/health`
- **Statistics**: `/videochat/stats` - Shows total rooms, active rooms, waiting users
- **Active Rooms**: `/videochat/rooms` - Lists all active rooms and waiting users

## Scaling

For production use, consider:

1. **Redis**: Store room and user data in Redis for multi-instance support
2. **Load Balancing**: Use sticky sessions for WebSocket connections
3. **Message Queue**: Use Redis pub/sub for cross-instance communication
4. **Database**: Store user sessions and chat history
5. **CDN**: Serve static assets through CDN

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**:
   - Check if port 8080 is open
   - Verify WebSocket URL format
   - Check firewall settings

2. **Video/Audio Not Working**:
   - Ensure HTTPS for getUserMedia in production
   - Check camera/microphone permissions
   - Verify STUN server connectivity

3. **Partner Not Found**:
   - Check WebSocket connection status
   - Verify room matching logic
   - Check server logs for errors

### Debug Mode

Enable debug logging by setting log level in the gateway:

```typescript
private logger: Logger = new Logger('VideoChatGateway');
```

View logs in the console for detailed debugging information.
