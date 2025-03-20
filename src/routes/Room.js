import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import { useParams, useNavigate } from "react-router-dom";
import { v1 as uuid } from "uuid";
import CallBar from "../callBar/CallBar";
import Chat from "../chat/Chat";
import { FaRegUser } from "react-icons/fa";
import { FaMicrophoneLinesSlash } from "react-icons/fa6";

const Video = (props) => {
    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);
    if (props.peer.readable === false) {
        return null;
    }

    return (
        <div className="relative w-[300px]">
            {props.videoOff && (
                <div className="absolute top-0 left-0 flex flex-col justify-center items-center gap-2 text-white text-center w-full h-full">
                    <FaRegUser className="mx-auto" size={40}/>
                    <p>
                        {props.userName}
                    </p>
                </div>
            )}
            <video 
                className="rounded-lg shadow-lg" 
                playsInline 
                autoPlay 
                ref={ref}
                style={{ objectFit: 'cover' }}
            />
            {props.userName && (
                <div className='absolute flex items-center gap-1 bottom-2 left-2 text-white bg-black bg-opacity-50  px-2 py-1 rounded '>
                    <span>
                    {props.videoOff ? '' : props.userName}
                    </span>
                    {props.isMuted && <FaMicrophoneLinesSlash className="text-white"/>}
                </div>
            )}
        </div>
    );
}

const videoConstraints = {
    height: window.innerHeight / 2,
    width: window.innerWidth / 2
};

const SOCKET_SERVER = process.env.REACT_APP_SOCKET_SERVER || "https://webrtc-app-04ea.onrender.com";

const Room = () => {
    const [peers, setPeers] = useState([]);
    const [userName, setUserName] = useState("");
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [showChat, setShowChat] = useState(false)
    const [messages, setMessages] = useState([]);
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const { roomID } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const name = prompt("Please enter your name") || "Anonymous";
        setUserName(name);
        console.log("Attempting to connect to:", SOCKET_SERVER);

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
            
            navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true })
                .then(stream => {
                    userVideo.current.srcObject = stream;
                    socketRef.current.emit("join room", { roomID, userName: name });

                    socketRef.current.on("all users", users => {
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
                        navigate("/create-room");
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
                        } else setMessages((prevMessages) => [...prevMessages, data]);
                    });
        
                    return () => {
                        socketRef.current.off('receiveMessage');
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

        return () => {
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
        navigate("/");
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-center items-center p-2 sm:p-4 bg-gray-800">
                <div className={`relative w-[100px] sm:w-[200px] z-10 bg-transparent ${isVideoEnabled ? 'opacity-100' : 'opacity-0'}`}>
                    <video
                        muted
                        ref={userVideo}
                        autoPlay
                        playsInline
                        className='rounded-lg shadow-lg object-cover'
                    />
                    <div className="absolute flex items-center gap-1 bottom-2 left-2 text-white bg-black bg-opacity-50 px-1 py-[2px] rounded text-[10px]">
                        <span>
                            {userName} (You)
                        </span>
                        {isMuted && <FaMicrophoneLinesSlash className="text-white" />}
                    </div>
                </div>
                {roomID && <button className="absolute top-4 right-1 text-sm sm:text-base sm:right-4 text-end bg-gray-400 px-2 py-1 rounded-md" onClick={() => { navigator.clipboard.writeText(window.location.href); }} >
                    Copy room URL
                </button>}
                <div className="flex gap-2">
                <CallBar toggleMute={toggleMute} toggleVideo={toggleVideo} leaveCall={leaveRoom} isMuted={isMuted} isVideoEnabled={isVideoEnabled} showChat={showChat} setShowChat={setShowChat}/>
                {showChat && <Chat name={userName} messages={messages} sendMessage={sendMessage}/>}
                </div>
            </div>
            <div className={`flex-1 flex justify-center p-2 sm:p-4 ${showChat ? 'w-[calc(100%-300px)]' : 'w-full'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {peers.map((peerObj, index) => (
                        <Video 
                            key={index} 
                            peer={peerObj.peer}
                            userName={peerObj.userName || `Participant ${index + 1}`}
                            isMuted={peerObj.isMuted}
                            videoOff={peerObj.videoOff}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Room;