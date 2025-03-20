import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import { useParams, useNavigate } from "react-router-dom";

const Video = (props) => {
    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);

    return (
        <div className="relative w-[300px]">
            <video 
                className="rounded-lg shadow-lg" 
                playsInline 
                autoPlay 
                ref={ref}
                style={{ objectFit: 'cover' }}
            />
            {props.userName && (
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                    {props.userName}
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
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (userVideo.current.srcObject) {
            const videoTrack = userVideo.current.srcObject.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const leaveRoom = () => {
        navigate("/");
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900">
            <div className="flex justify-between items-center p-4 bg-gray-800">
                <h1 className="text-white text-xl">Room: {roomID}</h1>
                <div className="flex gap-2">
                    <button
                        onClick={toggleMute}
                        className={`p-2 rounded ${isMuted ? 'bg-red-500' : 'bg-green-500'}`}
                    >
                        {isMuted ? 'Unmute' : 'Mute'}
                    </button>
                    <button
                        onClick={toggleVideo}
                        className={`p-2 rounded ${!isVideoEnabled ? 'bg-red-500' : 'bg-green-500'}`}
                    >
                        {isVideoEnabled ? 'Turn Off Video' : 'Turn On Video'}
                    </button>
                    <button
                        onClick={leaveRoom}
                        className="bg-red-500 p-2 rounded"
                    >
                        Leave Room
                    </button>
                </div>
            </div>
            <div className="flex-1 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative w-[300px]">
                        <video
                            muted
                            ref={userVideo}
                            autoPlay
                            playsInline
                            className="rounded-lg shadow-lg w-100 object-cover"
                        />
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                            {userName} (You)
                        </div>
                    </div>
                    {peers.map((peerObj, index) => (
                        <Video 
                            key={index} 
                            peer={peerObj.peer}
                            userName={peerObj.userName || `Participant ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Room;