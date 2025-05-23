import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import CallBar from "../callBar/CallBar";
import Chat from "../chat/Chat";
import Video from "../room-call/Video";
import { v4 as uuidv4 } from 'uuid';
import { useUser } from "../context/UserContext";
import { setupSocketHandlers } from "../utils/socketHandlers";
import { useIsMobile } from "../utils/isMobile";
import { useScreenRecording } from '../hooks/useScreenRecording';
import VideoDisplay from '../common/video/VideoDisplay';
import UsersList from "../audience/UsersList";
import { FaMicrophoneLines } from "react-icons/fa6";

const SOCKET_SERVER = process.env.REACT_APP_SOCKET_SERVER || "https://webrtc-app-04ea.onrender.com";

const Audience = () => {
    const navigate = useNavigate();
    const { roomID } = useParams();
    const { myName, isMuted, setIsMuted, isVideoEnabled, setIsVideoEnabled, isBlurred, selectedBackground, creatorAudience, setIsRaisedHand } = useUser();
    const { isRecording, startRecording, stopRecording } = useScreenRecording(roomID);
    const {isMobile} = useIsMobile();

    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const containerRef = useRef();
    const containeкResizeRef = useRef();
    const canvasRef = useRef();

    const [peers, setPeers] = useState([]);
    const [filteredPeers, setFilteredPeers] = useState([]);
    const [showChat, setShowChat] = useState(false)
    const [showUsersList, setShowUsersList] = useState(false)
    const [messages, setMessages] = useState([]);
    const [messageUnread, setMessageUnread] = useState(0);
    const [userVideoHeight, setUserVideoHeight] = useState(100);
    const [maxVideoHeight, setMaxVideoHeight] = useState(200);
    const [reactions, setReactions] = useState([]);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const handleSendReaction = (data) => {
        const messageId = uuidv4();
        const messageData = {
            ...data,
            message: 'reaction-settings',
            userName: myName, 
            id: messageId
        };
        socketRef.current.emit('sendMessage', messageData);
    }

    const handleRaiseHand = (raise) => {
        setIsRaisedHand(raise);
        const messageId = uuidv4();
        const messageData = {
            reaction: '✋',
            type: raise ? 'raise' : 'lower', 
            message: 'reaction-settings',
            userName: myName, 
            id: messageId
        };
        socketRef.current.emit('sendMessage', messageData);
    }

    const replaceVideoTrack = (newTrack) => {
        peersRef.current.forEach(({ peer }) => {
            const sender = peer._pc.getSenders().find(s => s.track.kind === 'video');
            if (sender) sender.replaceTrack(newTrack);
        });
    };

    const toggleMute = () => {
            const audioTrack = userVideo.current.srcObject.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            const messageData = {
				message: 'sound-settings',
				userName: myName, 
                sound:audioTrack.enabled
			};
			socketRef.current.emit('sendMessage', messageData);
            setIsMuted(!isMuted);
    };
    
    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    
                const screenTrack = screenStream.getVideoTracks()[0];
                screenTrack.onended = () => {
                    stopScreenShare();
                };
    
                const sender = userVideo.current.srcObject.getVideoTracks()[0];
                userVideo.current.srcObject.removeTrack(sender);
                userVideo.current.srcObject.addTrack(screenTrack);
    
                peersRef.current.forEach(({ peer }) => {
                    const sender = peer._pc.getSenders().find(s => s.track.kind === "video");
                    if (sender) sender.replaceTrack(screenTrack);
                });
                
                const messageData = {
                    message: 'sharing-settings',
                    userName: myName,  
                    sharing:true
                };
                socketRef.current.emit('sendMessage', messageData);
                setIsScreenSharing(true);
            } catch (err) {
                console.error("Screen sharing error:", err);
            }
        } else {
            stopScreenShare();
        }
    };
    
    const stopScreenShare = async () => {        
        try {
            const oldStream = userVideo.current.srcObject;
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const videoTrack = stream.getVideoTracks()[0];
            videoTrack.enabled = isVideoEnabled;
            
            const audioTrack = oldStream.getAudioTracks()[0];
            if (audioTrack) {
                stream.addTrack(audioTrack);
            }

            oldStream.getTracks().forEach(track => {
                if (track.kind === 'video') track.stop();
            });
            userVideo.current.srcObject = stream;
            replaceVideoTrack(videoTrack);

            const messageData = {
                message: 'sharing-settings',
                userName: myName,  
                sharing: false
            };
            socketRef.current.emit('sendMessage', messageData);
            setIsScreenSharing(false);
        } catch (err) {
            console.error("Error stopping screen share and switching back to camera:", err);
        }
    };

    const toggleVideo = () => {
        if (isScreenSharing) {
            const messageData = {
                message: 'sharing-settings',
                userName: myName,  
                sharing: false
            };
            socketRef.current.emit('sendMessage', messageData);
            setIsScreenSharing(false);
        } else if (userVideo.current.srcObject) {
            const videoTrack = userVideo.current.srcObject.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                const messageData = {
                    message: 'video-settings',
                    userName: myName,  
                    video: videoTrack.enabled
                };
                socketRef.current.emit('sendMessage', messageData);
                setIsVideoEnabled(!isVideoEnabled);
            }
        }
    };

    const addPermission = (userName) => {
        const messageData = {
            message: 'add-permission',
            userName  
        };
        socketRef.current.emit('sendMessage', messageData);
    }

    const leaveRoom = (byCreator = false) => {
        if (!byCreator) {
            const messageData = {
                message: 'user-left',
                userName: myName, 
            };
        socketRef.current.emit('sendMessage', messageData);}
        
        if (userVideo.current?.srcObject) {
            userVideo.current.srcObject.getTracks().forEach(track => track.stop());
        }
        stopRecording();
        peersRef.current.forEach(({ peer }) => {
            if (peer) {
                peer.destroy();
            }
        });

        navigate("/");
    };

    const handleOpenChat = () => {
        setShowChat(prev => {
            if (prev) {
                setTimeout(() => {
                    return !prev
                }, 500);
            } return !prev
        });
        setMessageUnread(0);
    }

    const handleOpenUsersList = () => {
        setShowUsersList(prev => {
            if (prev) {
                setTimeout(() => {
                    return !prev
                }, 500);
            } return !prev
        });
    }

    const kickUser = (userName) => {
        setPeers(peers => peers.filter(peer => peer.userName !== userName));
        const messageData = {
            message: 'user-kicked',
            userName, 
        };
        socketRef.current.emit('sendMessage', messageData);
    };

    useEffect(() => {
        if (!creatorAudience) {
            setIsMuted(true)
        }
        if (!myName) {
            navigate(`/lobby/${roomID}/audience`);
        }
        socketRef.current = io(SOCKET_SERVER, {
            transports: ['websocket', 'polling'],
            upgrade: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
            withCredentials: true
        });

        socketRef.current.on("connect", () => {
            console.log("Connected to socket server with ID:", socketRef.current.id);
            
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(stream => {
                    const audioTrack = stream.getAudioTracks()[0];
                    const videoTrack = stream.getVideoTracks()[0];
                    audioTrack.enabled = creatorAudience;
                    videoTrack.enabled = creatorAudience;

                    userVideo.current.srcObject = stream;
                    socketRef.current.emit("join room", { roomID, userName: myName, isMuted, isVideoEnabled, isBlurred, selectedBackground, creatorAudience });

                    setupSocketHandlers(
                        socketRef,
                        userVideo,
                        stream,
                        myName,
                        roomID,
                        setPeers,
                        peersRef,
                        setMessages,
                        showChat,
                        setMessageUnread,
                        navigate,
                        setReactions,
                        isMuted, 
                        isVideoEnabled, 
                        isBlurred,
                        selectedBackground,
                        creatorAudience,
                        leaveRoom,
                        toggleMute,
                        handleRaiseHand,
                    );

                    return () => {
                        socketRef.current.off('receiveMessage');
                        socketRef.current.off('user left');
                    };
                })
                .catch(err => {
                    console.error("Error accessing media devices:", err);
                    alert("Unable to access camera/microphone");
                });
        });

        socketRef.current.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
            alert("Failed to connect to server. Please try again.");
        });

        socketRef.current.on("disconnect", () => {
            console.log("Disconnected from server");
        });

        const handleBeforeUnload = () => {
            stopRecording();
            const messageData = {
                message: 'user-left',
                userName : myName, 
            };
            socketRef.current.emit('sendMessage', messageData);
            socketRef.current.emit('user left', socketRef.current.id);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload());
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (userVideo.current?.srcObject) {
                userVideo.current.srcObject.getTracks().forEach(track => track.stop());
            }
            peersRef.current.forEach(({ peer }) => {
                if (peer) {
                    peer.destroy();
                }
            });
        };
    }, [roomID]);

    useEffect(() => {
        if (isScreenSharing) {
            (async () => {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const oldStream = userVideo.current.srcObject;
                const audioTrack = oldStream.getAudioTracks()[0];
                stream.addTrack(audioTrack);
                userVideo.current.srcObject = stream;
                replaceVideoTrack(stream.getVideoTracks()[0]);
            })();
        } else {
            (async () => {
                try {
                    const oldStream = userVideo.current.srcObject;
                    if (!oldStream) return;

                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    const videoTrack = stream.getVideoTracks()[0];
                    videoTrack.enabled = isVideoEnabled;
                    
                    const audioTrack = oldStream.getAudioTracks()[0];
                    if (audioTrack) {
                        stream.addTrack(audioTrack);
                    }

                    userVideo.current.srcObject = stream;
                    replaceVideoTrack(videoTrack);
                } catch (err) {
                    console.error("Error getting user media:", err);
                }
            })();
        }
    }, [isScreenSharing]);

    useEffect(()=>{
        if (containerRef?.current) {
            const filterPeers = peers.filter(peer => peer.peer.readable);
            setFilteredPeers(filterPeers);
            const maxVideoHeight = ((containerRef.current.clientHeight - 176) / filterPeers.length) - 5;        
            setMaxVideoHeight(isMobile ? maxVideoHeight : containerRef.current.clientHeight);
        }
    },[peers, showChat, containerRef?.current, userVideoHeight])

    if (containeкResizeRef?.current) {
        new ResizeObserver(() => setUserVideoHeight(containeкResizeRef.current?.clientHeight * 0.9)).observe(containeкResizeRef.current);
    }
    
    return (
        <div className="flex flex-col min-h-screen overflow-hidden">
            <div ref={containerRef} className={`flex-1 flex justify-center sm:items-center mb-[66px] p-2 sm:p-4 w-full`}>
                <div className="flex h-full w-full gap-1 sm:gap-4">
                    {creatorAudience ? (
                        <div className={`relative w-full h-full flex items-center justify-center z-10 bg-transparent ${isVideoEnabled ? 'opacity-100' : 'opacity-0'}`}>
                            <VideoDisplay
                                videoRef={userVideo}
                                canvasRef={canvasRef}
                                isBlurred={isBlurred}
                                selectedBackground={selectedBackground}
                                maxHeight={maxVideoHeight}
                                showEffects={!isScreenSharing}
                            />
                        </div>
                    ) : (
                        <VideoDisplay
                            videoRef={userVideo}
                            canvasRef={canvasRef}
                            hidden
                        />
                    )}
                    {!creatorAudience ? peers.filter(peer => peer.creatorAudience).map((peerObj, index) => {
                        return (
                            <Video 
                                key={index} 
                                peerObj={peerObj}
                                maxVideoHeight={maxVideoHeight}
                            />
                        );
                    }) : null}
                </div>
                {!creatorAudience && !isMuted && <FaMicrophoneLines className="absolute bottom-[76px] sm:bottom-[80px] left-4" size={40}/>}
                {creatorAudience && <UsersList users={filteredPeers} showList={showUsersList} kickUser={kickUser} addPermission={addPermission}/>}
                <Chat socketRef={socketRef} name={myName} messages={messages} showChat={showChat} />
            </div>
            <CallBar 
                toggleMute={toggleMute} 
                toggleVideo={toggleVideo} 
                leaveCall={leaveRoom} 
                showChat={showChat} 
                setShowChat={handleOpenChat} 
                messageUnread={messageUnread}
                sendReaction={handleSendReaction}
                reactions={reactions}
                isScreenSharing={isScreenSharing}
                toggleScreenShare={toggleScreenShare}
                raiseHand={handleRaiseHand}
                isRecording={isRecording}
                stopRecording={stopRecording}
                startRecording={startRecording}
                showUsersList={showUsersList}
                handleOpenUsersList={handleOpenUsersList}
                type='audience'
                addPermission={addPermission}
            />
        </div>
    );
};

export default Audience;