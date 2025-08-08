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
    const [status, setStatus] = useState({ message: 'Disconnected - Click "Start Chat" to begin', type: 'disconnected' });
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

    const rtcConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
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
        peerConnectionRef.current = new RTCPeerConnection(rtcConfiguration);

        // Add local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peerConnectionRef.current?.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle remote stream
        peerConnectionRef.current.ontrack = (event) => {
            remoteStreamRef.current = event.streams[0];
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStreamRef.current;
            }
            setStatus({ message: 'Connected to partner', type: 'connected' });
        };

        // Handle ICE candidates
        peerConnectionRef.current.onicecandidate = (event) => {
            if (event.candidate) {
                sendWebSocketMessage('webrtc_ice_candidate', {
                    candidate: event.candidate,
                    roomId: roomIdRef.current
                });
            }
        };

        // Create offer if initiator
        if (isInitiatorRef.current) {
            const offer = await peerConnectionRef.current.createOffer();
            await peerConnectionRef.current.setLocalDescription(offer);
            sendWebSocketMessage('webrtc_offer', {
                offer: offer,
                roomId: roomIdRef.current
            });
        }
    };

    const handleOffer = async (offer: RTCSessionDescriptionInit) => {
        if (!peerConnectionRef.current) {
            await initializeWebRTC();
        }

        await peerConnectionRef.current!.setRemoteDescription(offer);
        const answer = await peerConnectionRef.current!.createAnswer();
        await peerConnectionRef.current!.setLocalDescription(answer);

        sendWebSocketMessage('webrtc_answer', {
            answer: answer,
            roomId: roomIdRef.current
        });
    };

    const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
        if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(answer);
        }
    };

    const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
        if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(candidate);
        }
    };

    // Media functions
    const getUserMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error('Error accessing camera/microphone:', error);
            throw error;
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
            <h1>Omegle-like Video Chat</h1>

            <div className={`${styles.status} ${styles[status.type]}`}>
                {status.message}
            </div>

            <div className={styles.videoContainer}>
                <div className={styles.videoWrapper}>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        className={styles.video}
                    />
                    <div className={styles.videoLabel}>You</div>
                </div>
                <div className={styles.videoWrapper}>
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        className={styles.video}
                    />
                    <div className={styles.videoLabel}>Partner</div>
                </div>
            </div>

            <div className={styles.controls}>
                <button
                    onClick={startChat}
                    disabled={isConnected}
                    className={`${styles.button} ${styles.primary}`}
                >
                    Start Chat
                </button>
                <button
                    onClick={nextPartner}
                    disabled={!isConnected}
                    className={`${styles.button} ${styles.warning}`}
                >
                    Next Partner
                </button>
                <button
                    onClick={stopChat}
                    disabled={!isConnected}
                    className={`${styles.button} ${styles.danger}`}
                >
                    Stop Chat
                </button>
                <button
                    onClick={toggleMute}
                    disabled={!isConnected}
                    className={`${styles.button} ${styles.secondary}`}
                >
                    {isMuted ? 'Unmute' : 'Mute'}
                </button>
                <button
                    onClick={toggleVideo}
                    disabled={!isConnected}
                    className={`${styles.button} ${styles.secondary}`}
                >
                    {isVideoOff ? 'Turn On Video' : 'Turn Off Video'}
                </button>
            </div>

            <div className={styles.chatContainer}>
                <div className={styles.chatMessages}>
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`${styles.message} ${message.isOwn ? styles.own : styles.partner}`}
                        >
                            <small>{new Date(message.timestamp).toLocaleTimeString()}</small>
                            <br />
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
                        placeholder="Type a message..."
                        disabled={!isConnected}
                        className={styles.input}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!isConnected}
                        className={`${styles.button} ${styles.primary}`}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
