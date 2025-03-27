import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import CallBar from "../callBar/CallBar";
import Chat from "../chat/Chat";
import Video from "../room-call/Video";
import { TbCopyCheckFilled } from "react-icons/tb";
import { v4 as uuidv4 } from 'uuid';
import { useUser } from "../context/UserContext";
import { setupSocketHandlers } from "../utils/socketHandlers";
import { useIsMobile } from "../utils/isMobile";

const SOCKET_SERVER = process.env.REACT_APP_SOCKET_SERVER || "https://webrtc-app-04ea.onrender.com";

const Room = () => {
    const { myName, isMuted, setIsMuted, isVideoEnabled, setIsVideoEnabled } = useUser();
    const {isMobile} = useIsMobile();
    const { roomID } = useParams();
    const navigate = useNavigate();

    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const containerRef = useRef();
    const containeкResizeRef = useRef();

    const [peers, setPeers] = useState([]);
    const [filteredPeers, setFilteredPeers] = useState([]);
    const [showChat, setShowChat] = useState(false)
    const [messages, setMessages] = useState([]);
    const [messageUnread, setMessageUnread] = useState(0);
    const [userVideoHeight, setUserVideoHeight] = useState(100);
    const [maxVideoHeight, setMaxVideoHeight] = useState(200);
    const [isCopied, setIsCopied] = useState(false);
    const [reactions, setReactions] = useState([]);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const sendMessage = (data) => {
        if (data.message || data.file) {
            socketRef.current.emit('sendMessage', data);
        }
    };

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

    const replaceVideoTrack = (newTrack) => {
        peersRef.current.forEach(({ peer }) => {
            const sender = peer._pc.getSenders().find(s => s.track.kind === 'video');
            if (sender) sender.replaceTrack(newTrack);
        });
    };

    const toggleMute = () => {
        if (userVideo.current.srcObject) {
            const audioTrack = userVideo.current.srcObject.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            const messageData = {
				message: 'sound-settings',
				userName: myName, 
                sound:audioTrack.enabled
			};
			socketRef.current.emit('sendMessage', messageData);
            setIsMuted(!isMuted);
        }
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
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            const videoTrack = stream.getVideoTracks()[0];
    
            userVideo.current.srcObject.getTracks().forEach(track => track.stop()); // Stop current screen sharing tracks
            userVideo.current.srcObject = stream;
    
            peersRef.current.forEach(({ peer }) => {
                const sender = peer._pc.getSenders().find(s => s.track?.kind === "video");
                if (sender) sender.replaceTrack(videoTrack);
            });
    
            setIsScreenSharing(false);
        } catch (err) {
            console.error("Error stopping screen share and switching back to camera:", err);
        }
    };

    const toggleVideo = () => {
        if (isScreenSharing) {
            setIsScreenSharing(false);
        } else if (userVideo.current.srcObject) {
            const videoTrack = userVideo.current.srcObject.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            const messageData = {
				message: 'video-settings',
				userName: myName,  
                video:videoTrack.enabled
			};
			socketRef.current.emit('sendMessage', messageData);
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const leaveRoom = () => {
        const messageData = {
            message: 'user-left',
            userName: myName, 
        };
        socketRef.current.emit('sendMessage', messageData);
        
        if (userVideo.current?.srcObject) {
            userVideo.current.srcObject.getTracks().forEach(track => track.stop());
        }
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

    const handleCopyRoomURL = () => {
        if (isCopied) return;
        navigator.clipboard.writeText(window.location.href.replace('room', 'lobby'));
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    }

    useEffect(() => {
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
                    audioTrack.enabled = !isMuted;
                    videoTrack.enabled = isVideoEnabled;

                    userVideo.current.srcObject = stream;
                    socketRef.current.emit("join room", { roomID, userName: myName });

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
                        setReactions
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
                userVideo.current.srcObject = stream;
                replaceVideoTrack(stream);
            })();
        } else {
            (async () => {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                userVideo.current.srcObject = stream;
            })();
        }
    }, [isScreenSharing]);

    useEffect(()=>{
        if (containerRef?.current) {
            const filterPeers = peers.filter(peer => peer.peer.readable);
            setFilteredPeers(filterPeers);
            const maxVideoHeight = ((containerRef.current.clientHeight - 176) / filterPeers.length) - 5;        
            setMaxVideoHeight(isMobile ? maxVideoHeight : containerRef.current.clientHeight - 66);
        }
    },[peers, showChat, containerRef?.current, userVideoHeight])

    if (containeкResizeRef?.current) {
        new ResizeObserver(() => setUserVideoHeight(containeкResizeRef.current?.clientHeight * 0.9)).observe(containeкResizeRef.current);
    }
    
    return (
        <div className="flex flex-col min-h-screen overflow-hidden">
            <div ref={containeкResizeRef} className="flex justify-center items-center p-2 sm:p-4 bg-gray-800 resize-y overflow-hidden h-[76px] sm:h-[116px] min-h-[76px] sm:min-h-[116px]">
                <div className={`relative flex items-center justify-center z-10 bg-transparent ${isVideoEnabled ? 'opacity-100' : 'opacity-0'}`}>
                    <video
                        muted
                        ref={userVideo}
                        autoPlay
                        playsInline
                        className='rounded-lg shadow-lg object-cover'
                        style={{height: userVideoHeight}}
                    />
                </div>
                {roomID && 
                    <div 
                        className="select-none absolute top-0 left-1 flex flex-col items-center justify-around text-sm sm:text-base sm:left-4"
                        style={{height: userVideoHeight}}
                    >
                        <button 
                            className="flex items-center justify-center bg-gray-400 hover:bg-gray-200 transition-all duration-300 
                                px-2 py-1 rounded-md w-[120px] sm:w-[160px]" 
                            onClick={handleCopyRoomURL}
                        >
                            {isCopied ? <TbCopyCheckFilled className="mr-2" /> : null}
                            {isCopied ? 'Copied' : 'Copy room URL'}
                        </button>
                        <p className="text-white">
                            {myName}
                        </p>
                    </div>
                }
            </div>
            <div ref={containerRef} className={`flex-1 flex justify-center sm:items-center mb-[66px] p-2 sm:p-4 w-full`}>
                <div className="grid h-full w-full gap-1 sm:gap-4"                    
                    style={!isMobile ? {
                        gridTemplateColumns: `repeat(${filteredPeers.length}, 1fr)`
                    } : {}}
                >
                    {peers.map((peerObj, index) => (
                        <Video 
                            key={index} 
                            peer={peerObj.peer}
                            userName={peerObj.userName || `Participant ${index + 1}`}
                            isMuted={peerObj.isMuted}
                            videoOff={peerObj.videoOff}
                            maxVideoHeight={maxVideoHeight}
                        />
                    ))}
                </div>
                <Chat name={myName} messages={messages} sendMessage={sendMessage} showChat={showChat} />
            </div>
            <CallBar 
                toggleMute={toggleMute} 
                isMuted={isMuted} 
                toggleVideo={toggleVideo} 
                isVideoEnabled={isVideoEnabled} 
                leaveCall={leaveRoom} 
                showChat={showChat} 
                setShowChat={handleOpenChat} 
                messageUnread={messageUnread}
                sendReaction={handleSendReaction}
                reactions={reactions}
                isScreenSharing={isScreenSharing}
                toggleScreenShare={toggleScreenShare}
            />
        </div>
    );
};

export default Room;