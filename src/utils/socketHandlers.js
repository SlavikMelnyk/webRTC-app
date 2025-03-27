import Peer from "simple-peer";

export const setupSocketHandlers = (
    socketRef,
    userVideo,
    stream,
    userName,
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
    selectedBackground
) => {
    socketRef.current.on("all users with history", data => {
        const { users, history } = data;
        const filteredHistory = history.filter(msg => msg.message !== 'sound-settings' && msg.message !== 'video-settings' && msg.message !== 'reaction-settings' && msg.message !== 'user-left' && msg.message !== 'user-joined');
        console.log("Chat history:", history, filteredHistory, userName);
        setMessages(filteredHistory);
        console.log("All users in room:", users);
        const peers = [];
        users.forEach(user => {
            const peer = createPeer(socketRef, user.id, socketRef.current.id, stream, userName, isMuted, isVideoEnabled, isBlurred, selectedBackground);
            peersRef.current.push({
                peerID: user.id,
                peer,
                userName: user.userName,
                isMuted: user.isMuted,
                videoOff: !user.isVideoEnabled,
                isBlurred: user.isBlurred,
                selectedBackground: user.selectedBackground
            });
            peers.push({
                peer,
                userName: user.userName,
                isMuted: user.isMuted,
                videoOff: !user.isVideoEnabled,
                isBlurred: user.isBlurred,
                selectedBackground: user.selectedBackground
            });
        });
        setPeers(peers);
    });

    socketRef.current.on("user joined", payload => {
        console.log("User joined:", payload);
        const peer = addPeer(socketRef, payload.signal, payload.callerID, stream);
        peersRef.current.push({
            peerID: payload.callerID,
            peer,
            userName: payload.userName,
            isMuted: payload.isMuted,
            videoOff: !payload.isVideoEnabled,
            isBlurred: payload.isBlurred,
            selectedBackground: payload.selectedBackground
        });
        setPeers(users => [...users, { 
            peer, 
            userName: payload.userName, 
            isMuted: payload.isMuted,
            videoOff: !payload.isVideoEnabled,
            isBlurred: payload.isBlurred,
            selectedBackground: payload.selectedBackground
        }]);
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
        }
    });
};

function createPeer(socketRef, userToSignal, callerID, stream, userName, isMuted, isVideoEnabled, isBlurred, selectedBackground) {
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
            userName,
            isMuted,
            isVideoEnabled,
            isBlurred,
            selectedBackground
        });
    });

    peer.on("error", error => {
        console.error("Peer connection error:", error);
    });

    return peer;
}

function addPeer(socketRef, incomingSignal, callerID, stream) {
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