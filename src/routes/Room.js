import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import { useParams, useNavigate } from "react-router-dom";
import CallBar from "../callBar/CallBar";
import Chat from "../chat/Chat";
import Video from "../room-call/Video";
import { TbCopyCheckFilled } from "react-icons/tb";
import { v4 as uuidv4 } from 'uuid';
import { useUser } from "../context/UserContext";

const SOCKET_SERVER = process.env.REACT_APP_SOCKET_SERVER || "https://webrtc-app-04ea.onrender.com";

const Room = () => {
    const [peers, setPeers] = useState([]);
    const { myName } = useUser();
    const [userName, setUserName] = useState("");
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [showChat, setShowChat] = useState(false)
    const [messages, setMessages] = useState([]);
    const [messageUnread, setMessageUnread] = useState(0);
    const [maxVideoWidth, setMaxVideoWidth] = useState(300);
    const [maxVideoHeight, setMaxVideoHeight] = useState(200);
    const [isCopied, setIsCopied] = useState(false);
    const [reactions, setReactions] = useState([]);

    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const containerRef = useRef();
    const { roomID } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const symbol = Math.random().toString(36).substring(2, 3)
        const name = myName ? myName : window.outerWidth >= 1920 ? 'Desktop-' + symbol : window.outerWidth >= 1512 ? 'Laptop-' + symbol : 'Mobile-' + symbol;
        setUserName(name);

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
                    userVideo.current.srcObject = stream;
                    socketRef.current.emit("join room", { roomID, userName: name });

                    socketRef.current.on("all users with history", data => {
                        const { users, history } = data;
                        const filteredHistory = history.filter(msg => msg.message !== 'sound-settings' && msg.message !== 'video-settings' && msg.message !== 'reaction-settings' && msg.message !== 'user-left' && msg.message !== 'user-joined');
                        console.log("Chat history:", history,filteredHistory, userName);
                        setMessages(filteredHistory);
                        console.log("All users in room:", users);
                        const peers = [];
                        users.forEach(user => {
                            const peer = createPeer(user.id, socketRef.current.id, stream, name);
                            peersRef.current.push({
                                peerID: user.id,
                                peer,
                                userName: user.userName
                            });
                            peers.push({
                                peer,
                                userName: user.userName
                            });
                        });
                        setPeers(peers);
                    });

                    socketRef.current.on("user joined", payload => {
                        console.log("User joined:", payload);
                        const peer = addPeer(payload.signal, payload.callerID, stream);
                        peersRef.current.push({
                            peerID: payload.callerID,
                            peer,
                            userName: payload.userName
                        });
                        setPeers(users => [...users, { peer, userName: payload.userName }]);
                        setMessages((prevMessages) => {
                            if (prevMessages[prevMessages?.length - 1]?.userName != payload.userName) {
                                return [...prevMessages, {message: 'user-joined', userName: payload.userName}]
                            }
                            return prevMessages;
                            })
                    });

                    socketRef.current.on("receiving returned signal", payload => {
                        const item = peersRef.current.find(p => p.peerID === payload.id);
                        if (item) {
                            item.peer.signal(payload.signal);
                        }
                    });

                    socketRef.current.on("user left", userId => {
                        const peerObj = peersRef.current.find(p => p.peerID === userId);
                        if (peerObj) {
                            peerObj.peer.destroy();
                            peersRef.current = peersRef.current.filter(p => p.peerID !== userId);
                            setPeers(peers => peers.filter(p => p.peerID !== userId));
                        }
                    });

                    socketRef.current.on("room full", () => {
                        alert("Room is full!");
                        navigate("/");
                    });

                    socketRef.current.on('receiveMessage', (data) => {
                        if (data.message === 'sound-settings') {
                            setPeers(peers => {
                                const newPeers = [...peers];
                                
                                newPeers.forEach(peer => {
                                    if (peer.userName === data.userName) {
                                        peer.isMuted = !data.sound;
                                    }
                                });
                                return newPeers;
                            })
                        } else if (data.message === 'video-settings') {
                            setPeers(peers => {
                                const newPeers = [...peers];
                                
                                newPeers.forEach(peer => {
                                    if (peer.userName === data.userName) {
                                        peer.videoOff = !data.video;
                                    }
                                });
                                return newPeers;
                            })
                        } else if (data.message === 'reaction-settings') {
                            const newReaction = `${data.userName} : ${data.reaction}`;
                            setReactions(prevReactions => [...prevReactions, newReaction]);
                            setTimeout(() => {
                                setReactions(prevReactions => prevReactions.filter(reaction => reaction !== newReaction));
                            }, 3000);
                        } else {
                            if (!showChat && data.userName !== userName) {
                                setMessageUnread(prev => prev + 1);
                            }
                            setMessages((prevMessages) => [...prevMessages, data])
                        };
                    });
        
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
                userName : name, 
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

    const sendMessage = (data) => {
        if (data.message) {
            socketRef.current.emit('sendMessage', data);
        }
    };

    const handleSendReaction = (data) => {
        const messageId = uuidv4();
        const messageData = {
            ...data,
            message: 'reaction-settings',
            userName, 
            id: messageId
        };
        socketRef.current.emit('sendMessage', messageData);
    }

    function createPeer(userToSignal, callerID, stream, userName) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", {
                userToSignal,
                callerID,
                signal,
                userName
            });
        });

        peer.on("error", error => {
            console.error("Peer connection error:", error);
        });

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID });
        });

        peer.on("error", error => {
            console.error("Peer connection error:", error);
        });

        peer.on("stream", stream => {
            console.log("Received stream from peer:", stream);
        });

        peer.signal(incomingSignal);
        return peer;
    }

    const toggleMute = () => {
        if (userVideo.current.srcObject) {
            const audioTrack = userVideo.current.srcObject.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            const messageData = {
				message: 'sound-settings',
				userName, 
                sound:audioTrack.enabled
			};
			socketRef.current.emit('sendMessage', messageData);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (userVideo.current.srcObject) {
            const videoTrack = userVideo.current.srcObject.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            const messageData = {
				message: 'video-settings',
				userName, 
                video:videoTrack.enabled
			};
			socketRef.current.emit('sendMessage', messageData);
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const leaveRoom = () => {
        const messageData = {
            message: 'user-left',
            userName, 
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
        navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    }

    useEffect(()=>{
        if (containerRef?.current) {
            const filteredPeers = peers.filter(peer => peer.peer.readable);
            // const maxVideoWidth = (containerRef.current.clientWidth - (showChat ? ( window.innerWidth > 768 ? 332 : 232 ): 32 ))/filteredPeers.length - (16 * (filteredPeers.length -1));
            const maxVideoHeight = ((containerRef.current.clientHeight - 182) / filteredPeers.length) - 2;
            // console.log(maxVideoWidth);
            // setMaxVideoWidth(filteredPeers.length ? maxVideoWidth : containerRef.current.clientWidth);            
            setMaxVideoHeight(maxVideoHeight);
        }
    },[peers, showChat, containerRef?.current])
    
    return (
        <div ref={containerRef} className="flex flex-col min-h-screen overflow-hidden">
            <div className="flex justify-center items-center p-2 sm:p-4 bg-gray-800 h-[76px] sm:h-[116px]">
                <div className={`relative flex items-center justify-center w-[100px] sm:w-[200px] max-h-[60px] sm:max-h-[100px] z-10 bg-transparent ${isVideoEnabled ? 'opacity-100' : 'opacity-0'}`}>
                    <video
                        muted
                        ref={userVideo}
                        autoPlay
                        playsInline
                        className='rounded-lg shadow-lg object-cover sm:w-[200px] max-h-[60px] sm:max-h-[100px]'
                    />
                </div>
                {roomID && 
                    <div className="select-none absolute top-0 h-[76px] sm:h-[116px] left-1  
                                flex flex-col items-center justify-around text-sm sm:text-base sm:left-4">
                        <button 
                            className="flex items-center justify-center bg-gray-400 hover:bg-gray-200 transition-all duration-300 
                                px-2 py-1 rounded-md w-[120px] sm:w-[160px]" 
                            onClick={handleCopyRoomURL}
                        >
                            {isCopied ? <TbCopyCheckFilled className="mr-2" /> : null}
                            {isCopied ? 'Copied' : 'Copy room URL'}
                        </button>
                        <p className="text-white">
                            {userName}
                        </p>
                    </div>
                }
                <div className="flex gap-2">
                </div>
            </div>
            <div ref={containerRef} className={`flex-1 flex justify-center items-center mb-[66px] p-2 sm:p-4 w-full`}>
                <div className="grid grid-cols-1 sm:grid-cols-3 h-full w-full gap-1 sm:gap-4">
                    {peers.map((peerObj, index) => (
                        <Video 
                            key={index} 
                            peer={peerObj.peer}
                            userName={peerObj.userName || `Participant ${index + 1}`}
                            isMuted={peerObj.isMuted}
                            videoOff={peerObj.videoOff}
                            // maxVideoWidth={maxVideoWidth}
                            maxVideoHeight={maxVideoHeight}
                        />
                    ))}
                </div>
                <Chat name={userName} messages={messages} sendMessage={sendMessage} showChat={showChat} />
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
            />
        </div>
    );
};

export default Room;