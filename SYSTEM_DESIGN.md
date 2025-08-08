# Video Chat Application - System Design Document

## 📋 Executive Summary

This document outlines the architecture design for an Omegle-like video chat application built with modern web technologies. The system enables random video chat connections between users through real-time WebSocket communication and WebRTC peer-to-peer media streaming.

## 🎯 System Objectives

### Primary Goals
- **Real-time Communication**: Instant video/audio chat between random users
- **Scalability**: Support thousands of concurrent users
- **Low Latency**: Minimize connection and media latency
- **User Experience**: Simple, intuitive interface similar to Omegle
- **Reliability**: Robust error handling and connection management

### Success Metrics
- **Connection Time**: < 3 seconds from "Start Chat" to video
- **Concurrent Users**: Support 1000+ simultaneous connections
- **Uptime**: 99.9% availability
- **User Retention**: > 80% complete successful connections

## 🏗️ System Architecture

### Architecture Pattern: **Event-Driven Microservices**

The application follows a modern event-driven architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Next.js    │  │   React     │  │   CSS       │          │
│  │  Frontend   │  │ Components  │  │  Modules    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  WebSocket  │  │   Video     │  │    HTTP     │          │
│  │   Gateway   │  │   Service   │  │ Controller  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Rooms      │  │ User-Room   │  │  Waiting    │          │
│  │   Map       │  │  Mapping    │  │   Queue     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Technical Stack

### Frontend Stack
| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| **Next.js** | 14.x | React Framework | SSR, routing, optimization |
| **React** | 18.x | UI Library | Component-based, hooks |
| **TypeScript** | 5.x | Type Safety | Better developer experience |
| **CSS Modules** | Latest | Styling | Scoped styles, no conflicts |
| **WebRTC** | Native | Media Streaming | Browser-native P2P video |

### Backend Stack  
| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| **NestJS** | 11.x | Node.js Framework | Scalable, modular architecture |
| **TypeScript** | 5.x | Type Safety | Consistent with frontend |
| **WebSocket/ws** | Latest | Real-time Communication | Low-level WebSocket control |
| **UUID** | Latest | User Identification | Unique user session IDs |

### Infrastructure
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Web Server** | Express (via NestJS) | HTTP request handling |
| **WebSocket Server** | ws library | Real-time signaling |
| **Memory Storage** | JavaScript Map/Array | In-memory data structures |
| **STUN Servers** | Google STUN | NAT traversal for WebRTC |

## 🔄 Core Components Deep Dive

### 1. WebSocket Gateway (`video.gateway.ts`)

**Responsibilities:**
- Manage WebSocket connections and lifecycle
- Handle real-time message routing
- Coordinate WebRTC signaling
- Maintain connection health (heartbeat)

**Key Methods:**
```typescript
handleConnection()      // New user connects
handleDisconnect()      // User disconnects  
handleFindPartner()     // Partner matching request
handleWebRTCOffer()     // WebRTC offer forwarding
handleChatMessage()     // Text message routing
```

**Design Patterns:**
- **Observer Pattern**: Event-driven message handling
- **Mediator Pattern**: Central communication hub
- **Strategy Pattern**: Different handling for different message types

### 2. Video Chat Service (`video.service.ts`)

**Responsibilities:**
- Room creation and management
- User matching algorithm (FIFO queue)
- Data persistence in memory
- Cleanup and maintenance operations

**Core Algorithm - Partner Matching:**
```typescript
async findOrCreateRoom(userId: string): Promise<Room> {
  // 1. Check if someone is waiting
  const waitingUser = this.waitingUsers.find(...)
  
  if (waitingUser) {
    // 2. Create room with both users
    return createRoomWithUsers([waitingUser, userId])
  } else {
    // 3. Add user to waiting queue
    return createSingleUserRoom(userId)
  }
}
```

**Design Patterns:**
- **Repository Pattern**: Data access abstraction
- **Factory Pattern**: Room creation
- **Queue Pattern**: FIFO waiting list

### 3. HTTP Controller (`video.controller.ts`)

**Responsibilities:**
- Admin and monitoring endpoints
- System health checks
- Statistics and analytics
- Manual operations (cleanup)

**API Endpoints:**
- `GET /videochat/health` - Health check
- `GET /videochat/stats` - System statistics
- `GET /videochat/rooms` - Active rooms list
- `POST /videochat/cleanup` - Manual cleanup

## 📊 Data Models

### Core Entities

```typescript
interface Room {
  id: string              // Unique room identifier
  users: string[]         // Array of user IDs (max 2)
  createdAt: Date        // Room creation timestamp
  isActive: boolean      // Room status flag
}

interface WaitingUser {
  userId: string         // User identifier
  joinedAt: Date        // When user started waiting
}

interface ExtendedWebSocket extends WebSocket {
  userId?: string       // Attached user ID
  roomId?: string      // Current room ID
  isAlive?: boolean    // Heartbeat status
}
```

### Data Storage Strategy

**Current: In-Memory Storage**
```typescript
private rooms: Map<string, Room> = new Map()
private userRoomMap: Map<string, string> = new Map()  
private waitingUsers: WaitingUser[] = []
```

**Advantages:**
- Ultra-fast access (O(1) lookup)
- No external dependencies
- Simple implementation

**Limitations:**
- Single instance only
- Data lost on restart
- Memory usage grows with users

**Future: Redis-Based Storage**
```typescript
// Distributed storage for multiple instances
await redis.hset('rooms', roomId, JSON.stringify(room))
await redis.sadd('waiting_users', userId)
await redis.publish('user_matched', { user1, user2, roomId })
```

## 🔄 Communication Protocols

### WebSocket Message Protocol

**Message Structure:**
```json
{
  "event": "event_name",
  "data": {
    "key": "value"
  }
}
```

**Client → Server Events:**
- `find_partner` - Start partner search
- `webrtc_offer` - WebRTC connection offer
- `webrtc_answer` - WebRTC connection answer  
- `webrtc_ice_candidate` - ICE candidate for NAT traversal
- `chat_message` - Text message during call
- `leave_room` - Leave current room
- `next_partner` - Find new partner

**Server → Client Events:**
- `connected` - Connection established with user ID
- `waiting_for_partner` - User added to waiting queue
- `partner_found` - Match found, initiate WebRTC
- `webrtc_*` - WebRTC signaling responses
- `chat_message` - Text message from partner
- `partner_disconnected` - Partner left/disconnected
- `error` - Error message

### WebRTC Signaling Flow

```
1. User A & B matched by server
2. Server notifies both users: partner_found
3. User A (initiator) creates WebRTC offer
4. A sends offer to server → server forwards to B
5. B creates answer and sends to server → server forwards to A
6. Both users exchange ICE candidates via server
7. Direct P2P connection established (bypassing server)
8. Video/audio streams flow directly between users
```

## 🚀 Performance Considerations

### Scalability Metrics

**Single Instance Capacity:**
- **WebSocket Connections**: ~10,000 concurrent
- **Memory Usage**: ~1GB for 10,000 users
- **CPU Usage**: Moderate (mostly I/O bound)
- **Network**: Signaling only (media is P2P)

**Bottleneck Analysis:**
1. **WebSocket Connection Limit**: Solved by horizontal scaling
2. **Memory Storage**: Solved by Redis migration
3. **Single Point of Failure**: Solved by load balancing
4. **Geographic Latency**: Solved by regional deployments

### Performance Optimizations

**Frontend Optimizations:**
- Component memoization with `React.memo`
- Debounced user inputs
- WebSocket connection pooling
- CSS-in-JS for dynamic styling

**Backend Optimizations:**  
- Efficient data structures (Map vs Object)
- Connection pooling for database
- Heartbeat mechanism for dead connection cleanup
- Message batching for high-frequency events

## 🔒 Security Architecture

### Current Security Measures

**Transport Security:**
- HTTPS in production (TLS 1.3)
- WSS for secure WebSocket connections
- SRTP for WebRTC media encryption

**Application Security:**
- CORS configuration for cross-origin requests
- Input validation on all WebSocket messages
- User session isolation
- Automatic cleanup of abandoned sessions

**Network Security:**
- Rate limiting (future enhancement)
- DDoS protection via CDN
- Secure STUN/TURN server configuration

### Security Threats & Mitigations

| Threat | Risk Level | Mitigation |
|--------|------------|------------|
| **DDoS Attack** | High | Rate limiting, CDN protection |
| **Man-in-the-Middle** | Medium | HTTPS/WSS/SRTP encryption |
| **User Impersonation** | Low | Session-based user IDs |
| **Data Injection** | Medium | Input validation, sanitization |
| **Resource Exhaustion** | Medium | Connection limits, cleanup |

## 📈 Scalability Design

### Horizontal Scaling Strategy

**Phase 1: Single Instance (Current)**
```
[ Users ] ──→ [ NestJS Server ] ──→ [ Memory Storage ]
```

**Phase 2: Load Balanced Multiple Instances**
```
[ Users ] ──→ [ Load Balancer ] ──→ [ NestJS Instance 1 ]
                     ↓                      ↓
                     └──→ [ NestJS Instance 2 ] ──→ [ Redis Cluster ]
                     └──→ [ NestJS Instance 3 ]
```

**Phase 3: Microservices Architecture**
```
[ Users ] ──→ [ API Gateway ] ──→ [ Auth Service ]
                     ↓              [ Matching Service ]
                     └──→ [ WebSocket Service ]
                     └──→ [ Analytics Service ]
                             ↓
                     [ Redis Cluster ]
                     [ PostgreSQL ]
```

### Database Migration Strategy

**Current: In-Memory**
```typescript
Map<string, Room>     // Fast but not persistent
Array<WaitingUser>    // Simple but not scalable
```

**Phase 1: Redis Cache**
```typescript
await redis.hset('rooms', roomId, roomData)
await redis.lpush('waiting_users', userId)
```

**Phase 2: Persistent Database**
```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY,
  users TEXT[],
  created_at TIMESTAMP,
  is_active BOOLEAN
);

CREATE TABLE user_sessions (
  user_id UUID PRIMARY KEY, 
  room_id UUID,
  connected_at TIMESTAMP
);
```

## 🔧 Deployment Architecture

### Development Environment
```
Local Machine:
├── Frontend: localhost:3000 (Next.js dev server)
├── Backend: localhost:3000 (NestJS with hot reload)
├── WebSocket: Same port as backend
└── Storage: In-memory (development only)
```

### Production Environment
```
Cloud Infrastructure:
├── Load Balancer (Nginx/CloudFlare)
├── Application Servers (2+ instances)
├── Redis Cluster (3+ nodes)
├── Monitoring (Prometheus + Grafana)
└── CDN (Static assets)
```

### CI/CD Pipeline
```
1. Code Push → GitHub
2. Automated Tests → Jest/Cypress
3. Build → Docker Container
4. Deploy → Kubernetes/Docker Swarm
5. Health Check → Automated verification
6. Rollback → If deployment fails
```

## 🔍 Monitoring & Observability

### Key Metrics to Track

**Business Metrics:**
- Active concurrent users
- Successful connection rate
- Average session duration
- User retention rate

**Technical Metrics:**
- WebSocket connection count
- Memory usage per instance
- CPU utilization
- Network bandwidth
- Error rates by type

**Real-time Dashboards:**
```
Grafana Dashboard:
├── User Activity (connections, matches, disconnects)
├── System Health (CPU, memory, network)
├── Error Tracking (connection failures, WebRTC issues)
└── Performance (latency, throughput)
```

### Alerting Strategy
```
Critical Alerts:
├── Server Down (immediate notification)
├── High Error Rate (>5% in 5 minutes)
├── Memory Usage (>80% for 10 minutes)
└── Connection Failures (>50 failures/minute)

Warning Alerts:
├── Slow Response Time (>2 seconds)
├── High CPU Usage (>70% for 15 minutes)
└── Unusual Traffic Patterns
```

## 🔄 Future Enhancements

### Short-term (1-3 months)
- [ ] Redis integration for multi-instance support
- [ ] User authentication system
- [ ] Rate limiting and abuse prevention
- [ ] Mobile-responsive improvements
- [ ] Audio-only chat mode

### Medium-term (3-6 months)
- [ ] Group video chat (3-4 users)
- [ ] Screen sharing capability
- [ ] Chat history persistence
- [ ] User preferences and filters
- [ ] Content moderation tools

### Long-term (6+ months)
- [ ] Mobile native apps (React Native)
- [ ] AI-powered user matching
- [ ] Virtual backgrounds
- [ ] Bandwidth optimization
- [ ] Global CDN deployment

## 📋 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Server Overload** | Medium | High | Auto-scaling, load balancing |
| **WebRTC Connection Issues** | High | Medium | Fallback TURN servers |
| **Security Vulnerabilities** | Low | High | Regular security audits |
| **Third-party Dependencies** | Low | Medium | Vendor diversification |
| **Regulatory Compliance** | Medium | High | Legal review, privacy policies |

## 📚 Conclusion

This architecture provides a solid foundation for an Omegle-like video chat application with:

✅ **Scalable Design**: From single instance to distributed system
✅ **Modern Technology Stack**: React, NestJS, WebRTC, TypeScript  
✅ **Real-time Performance**: WebSocket + WebRTC for optimal speed
✅ **Security First**: HTTPS, WSS, input validation
✅ **Monitoring Ready**: Comprehensive metrics and alerting
✅ **Future-Proof**: Clear migration path for scaling

The system is designed to handle thousands of concurrent users while maintaining sub-second connection times and high reliability. The modular architecture allows for easy maintenance, testing, and feature additions as the platform grows.
