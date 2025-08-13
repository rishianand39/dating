# Debugging Setup Guide

## 🚀 Available Debug Configurations

### 1. **Debug NestJS Backend**
- Installs dependencies and starts the NestJS server in debug mode
- Perfect for debugging your WebSocket gateway and API endpoints
- Breakpoints work in all TypeScript files

### 2. **Debug NestJS Backend (no deps install)**
- Quick start without installing dependencies
- Use when deps are already installed

### 3. **Debug Next.js Client**
- Starts the Next.js development server in debug mode
- Great for debugging React components and client-side code

### 4. **Debug Next.js Client (no deps install)**
- Quick start without installing dependencies

### 5. **Debug Full Stack**
- Runs both backend and frontend simultaneously
- Perfect for debugging the entire application flow

### 6. **Attach to NestJS**
- Attaches to an already running NestJS process
- Use when you start the server manually with `npm run start:debug`

### 7. **Debug WebSocket Gateway Tests**
- Runs Jest tests specifically for video chat functionality
- Great for TDD and testing WebSocket connections

## 🎯 How to Debug Your WebSocket Gateway

### Setting Breakpoints in video.gateway.ts

1. **Open** `backend/src/videochat/video.gateway.ts`
2. **Click** on the line number where you want to pause execution
3. **Red dots** will appear indicating breakpoints

### Recommended Breakpoints for WebSocket Debugging:

```typescript
// Line 54: When a client connects
handleConnection(client: ExtendedWebSocket, ...args: any[]) {
  const userId = uuidv4(); // 👈 BREAKPOINT HERE
  
// Line 79: When finding a partner
async handleFindPartner(@ConnectedSocket() client: ExtendedWebSocket) {
  if (!client.userId) { // 👈 BREAKPOINT HERE
  
// Line 125: WebRTC offer handling
handleWebRTCOffer(...) {
  this.logger.log(`WebRTC offer from ${client.userId}`); // 👈 BREAKPOINT HERE
  
// Line 245: Message forwarding
private forwardToRoomPartner(...) {
  const room = this.videoChatService.getRoom(roomId); // 👈 BREAKPOINT HERE
```

## 🛠️ Debugging Steps

### 1. Start Debugging
- Press `F5` or go to **Run and Debug** view
- Select **"Debug NestJS Backend"**
- The server will start and wait for connections

### 2. Test WebSocket Connection
- Open your browser to the frontend
- Click "Start Chat" 
- The breakpoint in `handleConnection` should trigger

### 3. Debug Partner Matching
- Open two browser tabs/windows
- Both click "Start Chat"
- Breakpoints in `handleFindPartner` will trigger

### 4. Examine Variables
- **Hover** over variables to see their values
- Use the **Debug Console** to evaluate expressions
- **Call Stack** shows the execution flow

## 🔍 Debug Console Commands

In the Debug Console, you can run:

```javascript
// Check connected clients
this.server.clients.size

// Check a client's properties
client.userId
client.roomId
client.isAlive

// Check room state
this.videoChatService.getRoom(roomId)

// Check waiting users
this.videoChatService.getWaitingUsers()
```

## 📱 Testing WebSocket Messages

You can test WebSocket messages using the browser's developer console:

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3000');

// Send find partner message
ws.send(JSON.stringify({
  event: 'find_partner',
  data: {}
}));

// Listen for messages
ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

## 🚨 Common Debugging Scenarios

### 1. **Connection Issues**
- Set breakpoint in `handleConnection`
- Check if `client.userId` is assigned
- Verify WebSocket connection state

### 2. **Partner Matching Problems**
- Breakpoint in `handleFindPartner`
- Check `room.users.length`
- Verify `findClientByUserId` returns valid client

### 3. **WebRTC Signaling Issues**
- Breakpoints in `handleWebRTCOffer`, `handleWebRTCAnswer`
- Check if messages are forwarded correctly
- Verify room and partner IDs

### 4. **Message Forwarding Problems**
- Breakpoint in `forwardToRoomPartner`
- Check if partner is found
- Verify WebSocket `readyState`

## 💡 Pro Tips

1. **Use Conditional Breakpoints**: Right-click breakpoint → Add condition
   ```typescript
   client.userId === 'specific-user-id'
   ```

2. **Log Points**: Add logging without stopping execution
   ```typescript
   console.log('User connected:', client.userId)
   ```

3. **Watch Expressions**: Monitor variables continuously
   - Add `this.server.clients.size` to watch list

4. **Step Through Code**: Use F10 (Step Over) and F11 (Step Into)

## 🔧 Troubleshooting

### If debugging doesn't start:
1. Check if port 3000 is available
2. Run `npm install` in backend folder
3. Verify TypeScript compilation

### If breakpoints are ignored:
1. Make sure source maps are enabled
2. Check if the file path is correct
3. Restart the debug session

Happy debugging! 🐛✨
