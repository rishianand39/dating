# Video Chat Application - Architecture Design

## 🏗️ High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                              │
├─────────────────────────────────────────────────────────────────┤
│  Next.js Frontend (Port 3000)                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   User A        │  │   User B        │  │   User C        │  │
│  │   Browser       │  │   Browser       │  │   Browser       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│           │                     │                     │          │
│           │  HTTP/WebSocket     │                     │          │
│           │     Requests        │                     │          │
└───────────┼─────────────────────┼─────────────────────┼──────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVER TIER                               │
├─────────────────────────────────────────────────────────────────┤
│  NestJS Backend (Port 3000)                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                WebSocket Gateway                             │  │
│  │  - User Connection Management                               │  │
│  │  - Room Management & Partner Matching                      │  │
│  │  - WebRTC Signaling (Offer/Answer/ICE)                    │  │
│  │  - Real-time Chat Messages                                 │  │
│  └─────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                Video Chat Service                           │  │
│  │  - Room Creation & Management                               │  │
│  │  - User Matching Algorithm                                  │  │
│  │  - Waiting Queue Management                                 │  │
│  │  - Cleanup & Maintenance                                    │  │
│  └─────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                HTTP REST Controller                         │  │
│  │  - Health Checks                                            │  │
│  │  - System Statistics                                        │  │
│  │  - Admin Operations                                         │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
            │                     │                     │
            │   WebRTC P2P        │                     │
            │   Video/Audio       │                     │
            │                     │                     │
┌───────────▼─────────────────────▼─────────────────────▼──────────┐
│                     DATA TIER                                   │
├─────────────────────────────────────────────────────────────────┤
│  In-Memory Storage                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │    Rooms        │  │  User-Room      │  │  Waiting        │  │
│  │     Map         │  │    Mapping      │  │    Users        │  │
│  │  Map<id,Room>   │  │ Map<user,room>  │  │   Array[]       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 System Flow Diagram

```
User A Journey:
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Opens     │───▶│   Connects to   │───▶│   Sends         │
│   Browser   │    │   WebSocket     │    │ find_partner    │
└─────────────┘    └─────────────────┘    └─────────────────┘
                           │                        │
                           ▼                        ▼
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Assigned   │◀───│   Server        │───▶│   Added to      │
│  User ID    │    │   Response      │    │ Waiting Queue   │
└─────────────┘    └─────────────────┘    └─────────────────┘

User B Journey:
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Opens     │───▶│   Connects to   │───▶│   Sends         │
│   Browser   │    │   WebSocket     │    │ find_partner    │
└─────────────┘    └─────────────────┘    └─────────────────┘
                           │                        │
                           ▼                        ▼
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Assigned   │◀───│   Server        │───▶│   Matched with  │
│  User ID    │    │   Response      │    │   User A        │
└─────────────┘    └─────────────────┘    └─────────────────┘
                           │                        │
                           ▼                        ▼
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Both Users  │◀───│   Room Created  │───▶│   WebRTC        │
│  Notified   │    │   with 2 Users  │    │  Signaling      │
└─────────────┘    └─────────────────┘    └─────────────────┘
       │                                           │
       ▼                                           ▼
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Video Call │◀───│   Direct P2P    │◀───│   ICE Exchange  │
│  Established│    │   Connection    │    │   Complete      │
└─────────────┘    └─────────────────┘    └─────────────────┘
```

## 🏛️ Component Architecture

### Frontend (Next.js Client)

```
client/
├── app/
│   ├── layout.tsx                 # Root layout with metadata
│   ├── page.tsx                   # Landing page with video chat link
│   ├── globals.css                # Global styles
│   └── video-chat/
│       └── page.tsx               # Video chat page route
├── components/
│   ├── VideoChat.tsx              # Main video chat component
│   └── VideoChat.module.css       # Component-scoped styles
└── hooks/
    ├── useWebSocket.ts            # WebSocket connection management
    └── useWebRTC.ts               # WebRTC peer connection handling
```

**Component Hierarchy:**
```
App Layout
├── Home Page
│   └── Link to Video Chat
└── Video Chat Page
    └── VideoChat Component
        ├── Video Streams (Local & Remote)
        ├── Control Buttons
        ├── Chat Interface
        ├── Status Display
        ├── useWebSocket Hook
        └── useWebRTC Hook
```

### Backend (NestJS Server)

```
backend/src/
├── app.module.ts                  # Root module with imports
├── main.ts                        # Application bootstrap
├── videochat/
│   ├── video.module.ts            # Video chat module
│   ├── video.gateway.ts           # WebSocket gateway
│   ├── video.service.ts           # Business logic service
│   └── video.controller.ts        # HTTP REST controller
└── auth/                          # Authentication module
    ├── auth.module.ts
    ├── auth.service.ts
    └── auth.controller.ts
```

**Module Dependencies:**
```
AppModule
├── AuthModule
│   ├── AuthController
│   └── AuthService
├── VideoChatModule
│   ├── VideoChatGateway (WebSocket)
│   ├── VideoChatService (Business Logic)
│   └── VideoChatController (HTTP)
└── PrismaService (Database)
```

## 🔄 Data Flow Architecture

### WebSocket Communication Flow

```
Client                    Gateway                   Service
  │                         │                         │
  │──── find_partner ──────▶│                         │
  │                         │─── findOrCreateRoom ───▶│
  │                         │◀── Room object ────────│
  │◀── waiting_for_partner ─│                         │
  │                         │                         │
  │──── webrtc_offer ──────▶│                         │
  │                         │─── forwardToPartner ───▶│
  │                         │                         │
  │◀─── webrtc_answer ─────│◀─── partner response ───│
  │                         │                         │
  │──── chat_message ──────▶│                         │
  │                         │─── forwardToPartner ───▶│
```

### Room Management Data Flow

```
User State Transitions:

1. DISCONNECTED
   │
   ▼ (connect WebSocket)
   │
2. CONNECTED
   │
   ▼ (send find_partner)
   │
3. WAITING ──────┐
   │             │
   ▼ (partner    │ (timeout/leave)
   │  found)     │
   │             ▼
4. MATCHED ◀─────┘
   │
   ▼ (WebRTC established)
   │
5. IN_CALL
   │
   ▼ (next_partner/disconnect)
   │
6. DISCONNECTED
```

### Memory Storage Architecture

```
VideoChatService Data Structures:

┌─────────────────────────┐
│     rooms: Map          │
│  ┌─────────────────────┐│
│  │ "room-123" ─────────││
│  │   ├─ id: "room-123" ││
│  │   ├─ users: ["A","B"]││
│  │   ├─ createdAt: Date ││
│  │   └─ isActive: true  ││
│  └─────────────────────┘│
└─────────────────────────┘

┌─────────────────────────┐
│   userRoomMap: Map      │
│  ┌─────────────────────┐│
│  │ "user-A" ──────────▶││
│  │ "room-123"          ││
│  │ "user-B" ──────────▶││
│  │ "room-123"          ││
│  └─────────────────────┘│
└─────────────────────────┘

┌─────────────────────────┐
│   waitingUsers: Array   │
│  ┌─────────────────────┐│
│  │ [                   ││
│  │   {                 ││
│  │     userId: "C",    ││
│  │     joinedAt: Date  ││
│  │   }                 ││
│  │ ]                   ││
│  └─────────────────────┘│
└─────────────────────────┘
```

## 🌐 Network Architecture

### Communication Protocols

```
Protocol Stack:

Application Layer:
├── HTTP REST API (Admin/Monitoring)
├── WebSocket (Real-time Signaling)
└── WebRTC (Direct P2P Media)

Transport Layer:
├── TCP (HTTP/WebSocket)
└── UDP (WebRTC Media)

Network Layer:
├── IPv4/IPv6
└── STUN/TURN (NAT Traversal)
```

### WebRTC Signaling Sequence

```
User A                Gateway               User B
  │                     │                     │
  │─── offer ─────────▶│                     │
  │                     │─── offer ─────────▶│
  │                     │                     │
  │                     │◀── answer ─────────│
  │◀── answer ─────────│                     │
  │                     │                     │
  │─── ICE candidate ──▶│                     │
  │                     │─── ICE candidate ──▶│
  │                     │                     │
  │◀── ICE candidate ───│◀── ICE candidate ───│
  │                     │                     │
  │═══════════ Direct P2P Connection ═══════│
  │          (Video/Audio Streams)           │
```

## 🔧 Technical Architecture

### Technology Stack

```
Frontend:
├── Next.js 14 (React Framework)
├── React 18 (UI Library)
├── TypeScript (Type Safety)
├── CSS Modules (Styling)
├── WebRTC APIs (Media)
└── WebSocket API (Real-time)

Backend:
├── NestJS (Node.js Framework)
├── TypeScript (Type Safety)
├── WebSocket/ws (Real-time)
├── UUID (User Identification)
└── Express (HTTP Server)

Protocols:
├── HTTP/HTTPS (REST API)
├── WebSocket/WSS (Signaling)
├── WebRTC (Media Streaming)
└── STUN (NAT Traversal)
```

### Security Architecture

```
Security Layers:

1. Transport Security:
   ├── HTTPS (Production)
   ├── WSS (Secure WebSocket)
   └── SRTP (Secure RTP for WebRTC)

2. Application Security:
   ├── CORS Configuration
   ├── Input Validation
   ├── Rate Limiting (Future)
   └── Authentication (Future)

3. Network Security:
   ├── Firewall Rules
   ├── STUN Server Security
   └── NAT Traversal
```

## 📊 Scalability Architecture

### Current Architecture (Single Instance)

```
Single Server Instance:
┌─────────────────────────┐
│      NestJS Server      │
│  ┌─────────────────────┐│
│  │   WebSocket         ││
│  │   Gateway           ││
│  │  ┌─────────────────┐││
│  │  │ In-Memory       │││
│  │  │ Storage         │││
│  │  │ ├─ Rooms        │││
│  │  │ ├─ Users        │││
│  │  │ └─ Waiting      │││
│  │  └─────────────────┘││
│  └─────────────────────┘│
└─────────────────────────┘
```

### Scalable Architecture (Future)

```
Multi-Instance with Redis:
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Instance 1    │  │   Instance 2    │  │   Instance 3    │
│   (WebSocket)   │  │   (WebSocket)   │  │   (WebSocket)   │
└─────────┬───────┘  └─────────┬───────┘  └─────────┬───────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
          ┌────────────────────▼────────────────────┐
          │            Redis Cluster                │
          │  ┌─────────────────────────────────────┐│
          │  │        Shared State:               ││
          │  │  ├─ Rooms                         ││
          │  │  ├─ User Sessions                 ││
          │  │  ├─ Waiting Queue                 ││
          │  │  └─ Pub/Sub Messaging             ││
          │  └─────────────────────────────────────┘│
          └─────────────────────────────────────────┘
```

## 🔄 Deployment Architecture

### Development Environment

```
Local Development:
├── Backend: localhost:3000
├── Frontend: localhost:3000 (Next.js dev)
├── WebSocket: localhost:3000
└── Database: In-memory
```

### Production Environment (Recommended)

```
Production Stack:
┌─────────────────────────────────────────┐
│              Load Balancer              │
│           (Nginx/CloudFlare)           │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┼─────────┐
    │                   │
┌───▼───┐           ┌───▼───┐
│ App 1 │           │ App 2 │
│(Sticky│           │Session│
│Session│           │)      │
└───┬───┘           └───┬───┘
    │                   │
    └─────────┬─────────┘
              │
    ┌─────────▼─────────┐
    │   Redis Cluster   │
    │ (Session Storage) │
    └───────────────────┘
```

## 📈 Performance Architecture

### Connection Management

```
Connection Lifecycle:
1. WebSocket Connection: ~1ms
2. User ID Assignment: ~1ms  
3. Partner Matching: ~5ms
4. WebRTC Negotiation: ~200-500ms
5. Media Stream: ~100-300ms
Total Connection Time: ~300-800ms
```

### Memory Usage Estimation

```
Per User Memory:
├── WebSocket Connection: ~8KB
├── User Object: ~1KB
├── Room Object: ~2KB (shared)
└── Waiting Queue Entry: ~0.5KB

Concurrent Users Capacity:
├── 1000 users: ~11MB
├── 10000 users: ~110MB
├── 100000 users: ~1.1GB
```

### Bottlenecks & Solutions

```
Potential Bottlenecks:
1. WebSocket Connections
   └─ Solution: Horizontal scaling + Redis

2. Memory Usage (In-memory storage)
   └─ Solution: Redis external storage

3. CPU Usage (WebRTC signaling)
   └─ Solution: Load balancing

4. Network Bandwidth
   └─ Solution: CDN + Regional servers
```

This architecture design provides a solid foundation for an Omegle-like video chat application with clear separation of concerns, scalability considerations, and modern web technologies. The modular design allows for easy maintenance and future enhancements.
