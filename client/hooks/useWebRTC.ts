import { useRef, useCallback } from 'react';

export interface UseWebRTCProps {
  onRemoteStream: (stream: MediaStream) => void;
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onConnectionStateChange?: (state: string) => void;
}

export const useWebRTC = ({ onRemoteStream, onIceCandidate, onConnectionStateChange }: UseWebRTCProps) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  
  const rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const initializePeerConnection = useCallback((localStream: MediaStream) => {
    peerConnectionRef.current = new RTCPeerConnection(rtcConfiguration);

    // Add local stream
    localStream.getTracks().forEach(track => {
      peerConnectionRef.current?.addTrack(track, localStream);
    });

    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      onRemoteStream(event.streams[0]);
    };

    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };

    // Handle connection state changes
    peerConnectionRef.current.onconnectionstatechange = () => {
      if (peerConnectionRef.current && onConnectionStateChange) {
        onConnectionStateChange(peerConnectionRef.current.connectionState);
      }
    };

    return peerConnectionRef.current;
  }, [onRemoteStream, onIceCandidate, onConnectionStateChange]);

  const createOffer = async (): Promise<RTCSessionDescriptionInit | null> => {
    if (!peerConnectionRef.current) return null;
    
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    return offer;
  };

  const createAnswer = async (offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | null> => {
    if (!peerConnectionRef.current) return null;
    
    await peerConnectionRef.current.setRemoteDescription(offer);
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);
    return answer;
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

  const closePeerConnection = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  return {
    initializePeerConnection,
    createOffer,
    createAnswer,
    handleAnswer,
    handleIceCandidate,
    closePeerConnection,
    peerConnection: peerConnectionRef.current
  };
};
