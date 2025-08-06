# Video Chat Client - Next.js App

This is the frontend client for the Omegle-like video chat application built with Next.js, React, and TypeScript.

## Features

- 🎥 **Real-time Video Chat** - WebRTC-powered video/audio communication
- 💬 **Text Chat** - Send messages during video calls
- 🔄 **Partner Matching** - Random partner matching like Omegle
- 📱 **Responsive Design** - Works on desktop and mobile
- 🎮 **Modern UI** - Clean, intuitive interface
- ⚡ **Real-time Updates** - WebSocket communication

## Getting Started

### Prerequisites

Make sure you have the backend server running on `localhost:3000`. See the backend README for setup instructions.

### Installation

1. **Navigate to client directory:**
   ```bash
   cd /home/hp/Desktop/dating/client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Go to `http://localhost:3000`
   - Click "Start Video Chat" or navigate to `/video-chat`

## How to Use

1. **Start Video Chat:**
   - Click "Start Video Chat" button
   - Allow camera and microphone permissions when prompted

2. **Finding Partners:**
   - The app will automatically look for available partners
   - Wait for someone else to join (or open another browser tab/window to test)

3. **Video Chat Controls:**
   - **Next Partner**: Find a new random partner
   - **Stop Chat**: End the current session
   - **Mute/Unmute**: Toggle your microphone
   - **Turn Off/On Video**: Toggle your camera

4. **Text Chat:**
   - Type messages in the chat box
   - Press Enter or click "Send" to send messages
   - Messages appear in real-time during video calls

## Project Structure

```
client/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global styles
│   └── video-chat/
│       └── page.tsx            # Video chat page
├── components/
│   ├── VideoChat.tsx           # Main video chat component
│   └── VideoChat.module.css    # Component styles
├── hooks/
│   ├── useWebSocket.ts         # WebSocket custom hook
│   └── useWebRTC.ts            # WebRTC custom hook
└── public/                     # Static assets
```

## Key Components

### VideoChat Component (`components/VideoChat.tsx`)
- Main video chat interface
- Handles WebSocket connections
- Manages WebRTC peer connections
- Controls video/audio streams
- Text chat functionality

### Custom Hooks

#### useWebSocket (`hooks/useWebSocket.ts`)
- WebSocket connection management
- Message sending/receiving
- Auto-reconnection logic
- Connection state tracking

#### useWebRTC (`hooks/useWebRTC.ts`)
- WebRTC peer connection setup
- Offer/answer handling
- ICE candidate exchange
- Stream management

## WebSocket Events

The client communicates with the backend through these WebSocket events:

### Outgoing (Client → Server)
- `find_partner` - Start looking for a partner
- `webrtc_offer` - Send WebRTC offer
- `webrtc_answer` - Send WebRTC answer
- `webrtc_ice_candidate` - Send ICE candidate
- `chat_message` - Send text message
- `leave_room` - Leave current room
- `next_partner` - Find new partner

### Incoming (Server → Client)
- `connected` - Connection established
- `waiting_for_partner` - Waiting for match
- `partner_found` - Match found
- `webrtc_offer` - Receive WebRTC offer
- `webrtc_answer` - Receive WebRTC answer
- `webrtc_ice_candidate` - Receive ICE candidate
- `chat_message` - Receive text message
- `partner_disconnected` - Partner left
- `error` - Error message

## Styling

The app uses CSS Modules for component-scoped styling with responsive design:

- **Desktop**: Side-by-side video layout
- **Tablet**: Stacked video layout
- **Mobile**: Optimized controls and chat interface

## Browser Compatibility

- **Chrome/Chromium**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 11+)
- **Edge**: Full support

## Troubleshooting

### Camera/Microphone Not Working
- Ensure you're using HTTPS in production
- Check browser permissions
- Try refreshing the page

### WebSocket Connection Failed
- Make sure backend server is running on `localhost:3000`
- Check browser console for error messages
- Verify WebSocket URL in the component

### Video Not Connecting
- Check STUN server connectivity
- Ensure both users have granted camera/microphone permissions
- Try refreshing both browser windows

## Development

### Adding New Features

1. **New WebSocket Event:**
   - Add event handler in `VideoChat.tsx`
   - Update `handleWebSocketMessage` function
   - Add corresponding backend handler

2. **New UI Component:**
   - Create component in `components/` folder
   - Add corresponding CSS module
   - Import and use in main component

3. **New Hook:**
   - Create hook in `hooks/` folder
   - Follow React hooks patterns
   - Add TypeScript types

### Build for Production

```bash
npm run build
npm start
```

## Technologies Used

- **Next.js 14** - React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **CSS Modules** - Scoped styling
- **WebRTC** - Real-time communication
- **WebSockets** - Real-time messaging

## Future Enhancements

- 🔐 User authentication
- 👥 Group video calls
- 🎨 Custom themes
- 📱 Mobile app version
- 🔊 Audio-only mode
- 📹 Screen sharing
- 🌍 Country-based matching
- 🛡️ Content moderation
