'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './VideoChat.module.css';

interface Message {
    text: string;
    isOwn: boolean;
    timestamp: string;
}

interface WebSocketMessage {
    event: string;
    data: any;
}

export default function VideoChat() {
    // State management
    const [status, setStatus] = useState({ message: 'Click "Start Chat" to begin', type: 'disconnected' });
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    // Refs for video elements and WebSocket/WebRTC
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const roomIdRef = useRef<string | null>(null);
    const isInitiatorRef = useRef<boolean>(false);

    const rtcConfiguration: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            // Add TURN servers for mobile devices
            {
                urls: 'turn:relay1.expressturn.com:3478',
                credential: '6BUAdHD6',
                username: 'ef4CRVZS4V8P'
            }
        ],
        iceCandidatePoolSize: 10,
        iceTransportPolicy: 'all' as RTCIceTransportPolicy
    };

    // WebSocket message handler
    const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
        const { event, data } = message;

        switch (event) {
            case 'connected':
                console.log('Connected with ID:', data.userId);
                findPartner();
                break;

            case 'waiting_for_partner':
                setStatus({ message: 'Waiting for partner...', type: 'waiting' });
                roomIdRef.current = data.roomId;
                break;

            case 'partner_found':
                setStatus({ message: 'Partner found! Connecting...', type: 'connected' });
                roomIdRef.current = data.roomId;
                isInitiatorRef.current = data.isInitiator;
                initializeWebRTC();
                break;

            case 'webrtc_offer':
                handleOffer(data.offer);
                break;

            case 'webrtc_answer':
                handleAnswer(data.answer);
                break;

            case 'webrtc_ice_candidate':
                handleIceCandidate(data.candidate);
                break;

            case 'chat_message':
                addMessage(data.message, false, data.timestamp);
                break;

            case 'partner_disconnected':
            case 'partner_left':
                setStatus({ message: 'Partner disconnected', type: 'waiting' });
                resetPeerConnection();
                break;

            case 'error':
                console.error('Server error:', data.message);
                setStatus({ message: 'Error: ' + data.message, type: 'disconnected' });
                break;
        }
    }, []);

    // WebSocket functions
    const connectWebSocket = useCallback(() => {
        wsRef.current = new WebSocket('https://dating-kw95.onrender.com');

        wsRef.current.onopen = () => {
            console.log('WebSocket connected');
        };

        wsRef.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
        };

        wsRef.current.onclose = () => {
            console.log('WebSocket disconnected');
            setStatus({ message: 'Disconnected', type: 'disconnected' });
            resetConnection();
        };

        wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            setStatus({ message: 'Connection error', type: 'disconnected' });
        };
    }, [handleWebSocketMessage]);

    const sendWebSocketMessage = (event: string, data: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ event, data }));
        }
    };

    const findPartner = () => {
        sendWebSocketMessage('find_partner', {});
    };

    // WebRTC functions
    const initializeWebRTC = async () => {
        try {
            peerConnectionRef.current = new RTCPeerConnection(rtcConfiguration);

            // Add connection state monitoring for mobile debugging
            peerConnectionRef.current.onconnectionstatechange = () => {
                console.log('Connection state:', peerConnectionRef.current?.connectionState);
                if (peerConnectionRef.current?.connectionState === 'failed') {
                    console.log('Connection failed, trying to restart ICE');
                    peerConnectionRef.current?.restartIce();
                }
            };

            peerConnectionRef.current.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', peerConnectionRef.current?.iceConnectionState);
            };

            peerConnectionRef.current.onicegatheringstatechange = () => {
                console.log('ICE gathering state:', peerConnectionRef.current?.iceGatheringState);
            };

            // Add local stream
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    if (peerConnectionRef.current) {
                        peerConnectionRef.current.addTrack(track, localStreamRef.current!);
                    }
                });
            }

            // Handle remote stream with mobile-specific handling
            peerConnectionRef.current.ontrack = (event) => {
                console.log('Received remote track:', event.track.kind);
                remoteStreamRef.current = event.streams[0];
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStreamRef.current;
                    // Force play on mobile devices
                    remoteVideoRef.current.play().catch(e => {
                        console.log('Auto-play prevented, user interaction required');
                    });
                }
                setStatus({ message: 'Connected to partner', type: 'connected' });
            };

            // Handle ICE candidates with timeout for mobile
            peerConnectionRef.current.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('Sending ICE candidate:', event.candidate.type);
                    sendWebSocketMessage('webrtc_ice_candidate', {
                        candidate: event.candidate,
                        roomId: roomIdRef.current
                    });
                } else {
                    console.log('ICE gathering completed');
                }
            };

            // Create offer if initiator with mobile-optimized constraints
            if (isInitiatorRef.current) {
                const offerOptions = {
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true,
                    voiceActivityDetection: false // Better for mobile
                };
                
                const offer = await peerConnectionRef.current.createOffer(offerOptions);
                await peerConnectionRef.current.setLocalDescription(offer);
                
                console.log('Created and set local offer');
                sendWebSocketMessage('webrtc_offer', {
                    offer: offer,
                    roomId: roomIdRef.current
                });
            }
        } catch (error) {
            console.error('Error initializing WebRTC:', error);
            setStatus({ message: 'Failed to initialize connection', type: 'disconnected' });
        }
    };

    const handleOffer = async (offer: RTCSessionDescriptionInit) => {
        try {
            console.log('Received offer from partner');
            
            if (!peerConnectionRef.current) {
                await initializeWebRTC();
            }

            if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
                console.log('Set remote description (offer)');
                
                // Create answer with mobile-optimized constraints
                const answerOptions = {
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true,
                    voiceActivityDetection: false
                };
                
                const answer = await peerConnectionRef.current.createAnswer(answerOptions);
                await peerConnectionRef.current.setLocalDescription(answer);
                console.log('Created and set local answer');

                sendWebSocketMessage('webrtc_answer', {
                    answer: answer,
                    roomId: roomIdRef.current
                });
            }
        } catch (error) {
            console.error('Error handling offer:', error);
            setStatus({ message: 'Connection failed', type: 'disconnected' });
        }
    };

    const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
        try {
            if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                console.log('Set remote description (answer)');
            }
        } catch (error) {
            console.error('Error handling answer:', error);
            setStatus({ message: 'Connection failed', type: 'disconnected' });
        }
    };

    const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
        try {
            console.log('Received ICE candidate');
            
            if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('Added ICE candidate');
            } else {
                console.log('Queuing ICE candidate - remote description not set yet');
                // Queue the candidate for later if remote description is not set
                setTimeout(() => {
                    if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
                        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
                            .catch(e => console.error('Error adding queued ICE candidate:', e));
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('Error handling ICE candidate:', error);
        }
    };

    // Media functions
    const getUserMedia = async () => {
        try {
            const constraints = {
                video: {
                    width: { ideal: 640, max: 1280 },
                    height: { ideal: 480, max: 720 },
                    frameRate: { ideal: 15, max: 30 },
                    facingMode: 'user' 
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    // Mobile-specific audio constraints
                    sampleRate: 44100,
                    channelCount: 1
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                // Ensure video plays on mobile
                localVideoRef.current.muted = true; 
                localVideoRef.current.play().catch(e => {
                    console.log('Local video auto-play prevented');
                });
            }


        } catch (error) {
            console.error('Error accessing camera/microphone:', error);
            
            // Try with reduced constraints for older mobile devices
            try {
                const fallbackConstraints = {
                    video: { width: 320, height: 240 },
                    audio: true
                };
                
                const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
                localStreamRef.current = fallbackStream;
                
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = fallbackStream;
                    localVideoRef.current.muted = true;
                }
                
                console.log('Fallback media stream obtained');
            } catch (fallbackError) {
                console.error('Fallback media access also failed:', fallbackError);
                throw error;
            }
        }
    };

    // Chat functions
    const addMessage = (text: string, isOwn: boolean, timestamp?: string) => {
        const newMessage: Message = {
            text,
            isOwn,
            timestamp: timestamp || new Date().toISOString()
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const sendMessage = () => {
        const message = messageInput.trim();

        if (message && roomIdRef.current) {
            sendWebSocketMessage('chat_message', {
                message: message,
                roomId: roomIdRef.current
            });
            addMessage(message, true);
            setMessageInput('');
        }
    };

    // Control functions
    const startChat = async () => {
        try {
            await getUserMedia();
            connectWebSocket();
            setStatus({ message: 'Connecting...', type: 'waiting' });
            setIsConnected(true);
        } catch (error) {
            console.error('Error starting chat:', error);
            setStatus({ message: 'Error accessing camera/microphone', type: 'disconnected' });
        }
    };

    const nextPartner = () => {
        sendWebSocketMessage('next_partner', {});
        resetPeerConnection();
        setStatus({ message: 'Looking for new partner...', type: 'waiting' });
    };

    const stopChat = () => {
        if (wsRef.current) {
            wsRef.current.close();
        }
        resetConnection();
        setStatus({ message: 'Disconnected', type: 'disconnected' });
        setIsConnected(false);
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = isMuted;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => {
                track.enabled = isVideoOff;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    // Reset functions
    const resetPeerConnection = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
    };

    const resetConnection = () => {
        resetPeerConnection();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        roomIdRef.current = null;
        isInitiatorRef.current = false;
        setMessages([]);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            resetConnection();
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.mainContent}>
                <header className={styles.header}>
                    <h1 className={styles.title}>LoveConnect</h1>
                    <p className={styles.subtitle}>Connect • Chat • Fall in Love</p>
                </header>

                <div className={`${styles.status} ${styles[status.type]}`}>
                    <span>{status.message}</span>
                </div>

                <div className={styles.videoContainer}>
                    <div className={`${styles.videoWrapper} ${styles.localVideo}`}>
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className={styles.video}
                        />
                        <div className={styles.videoLabel}>💝 You</div>
                    </div>
                    <div className={`${styles.videoWrapper} ${styles.remoteVideo}`}>
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className={styles.video}
                        />
                        <div className={styles.videoLabel}>💕 Partner</div>
                    </div>
                </div>

                <div className={styles.controls}>
                    <button
                        onClick={startChat}
                        disabled={isConnected}
                        className={`${styles.button} ${styles.primary}`}
                    >
                        🚀 Start Adventure
                    </button>
                    <button
                        onClick={nextPartner}
                        disabled={!isConnected}
                        className={`${styles.button} ${styles.warning}`}
                    >
                        ⭐ Next Match
                    </button>
                    <button
                        onClick={stopChat}
                        disabled={!isConnected}
                        className={`${styles.button} ${styles.danger}`}
                    >
                        ✋ Stop Chat
                    </button>
                    <button
                        onClick={toggleMute}
                        disabled={!isConnected}
                        className={`${styles.button} ${styles.secondary}`}
                    >
                        {isMuted ? '🔊 Unmute' : '🔇 Mute'}
                    </button>
                    <button
                        onClick={toggleVideo}
                        disabled={!isConnected}
                        className={`${styles.button} ${styles.success}`}
                    >
                        {isVideoOff ? '📹 Camera On' : '🚫 Camera Off'}
                    </button>
                </div>

                <div className={styles.chatContainer}>
                    <div className={styles.chatMessages}>
                        {messages.length === 0 && (
                            <div style={{ 
                                textAlign: 'center', 
                                color: 'rgba(255, 255, 255, 0.6)', 
                                marginTop: '50px',
                                fontStyle: 'italic'
                            }}>
                                💬 Start a conversation...
                            </div>
                        )}
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`${styles.message} ${message.isOwn ? styles.own : styles.partner}`}
                            >
                                <small>{new Date(message.timestamp).toLocaleTimeString()}</small>
                                {message.text}
                            </div>
                        ))}
                    </div>
                    <div className={styles.chatInput}>
                        <input
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type your message... 💭"
                            disabled={!isConnected}
                            className={styles.input}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!isConnected || !messageInput.trim()}
                            className={`${styles.button} ${styles.primary}`}
                        >
                            💌 Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
