import React, { useEffect, useRef, useState } from "react"
import Peer from "simple-peer"
import io from "socket.io-client"
import CallBar from "../callBar/CallBar";
import CallAnswer from "../call-one-to-one/CallAnswer";
import CallInput from "../call-one-to-one/CallInput";
import Chat from '../chat/Chat';
import { FaRegUser } from "react-icons/fa";
import { FaMicrophoneLinesSlash } from "react-icons/fa6";

const SOCKET_SERVER = process.env.REACT_APP_SOCKET_SERVER || "https://webrtc-app-04ea.onrender.com";
function CallToOne() {
	const [ me, setMe ] = useState("")
	const [ stream, setStream ] = useState()
	const [ receivingCall, setReceivingCall ] = useState(false)
	const [ caller, setCaller ] = useState("")
	const [ callerSignal, setCallerSignal ] = useState()
	const [ callAccepted, setCallAccepted ] = useState(false)
	const [ idToCall, setIdToCall ] = useState("")
	const [ callEnded, setCallEnded] = useState(false)
	const [ showChat, setShowChat] = useState(false)
	const [ name, setName ] = useState("")
	const [ userName, setUserName ] = useState("")
    const [messages, setMessages] = useState([]);
    const [messageUnread, setMessageUnread] = useState(0);

	const [ errorMessage, setErrorMessage ] = useState("")
	const [isMuted, setIsMuted] = useState(false)
	const [isVideoEnabled, setIsVideoEnabled] = useState(true)
	const [secUserVideoEnabled, setSecUserVideoEnabled] = useState(true);
	const [secUserSoundEnabled, setSecUserSoundEnabled] = useState(true);
	const [secUserLeft, setSecUserLeft] = useState(false);

	const socketRef = useRef();
	const myVideo = useRef()
	const userVideo = useRef()
	const connectionRef= useRef()

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

		if (navigator.mediaDevices) {			
			navigator.mediaDevices.getUserMedia({ video: true, audio: true })
				.then((stream) => {
					setStream(stream);
					if (myVideo.current) {
							myVideo.current.srcObject = stream;
					} else {
						console.error("myVideo reference is not set yet");
					}
					setName(stream.id)
				})
				.catch((error) => {
					console.error("Error accessing media devices.", error);
				});
		}

		socketRef.current.on("me", (id) => {
				setMe(id)
			})

		socketRef.current.on("callUser", (data) => {
			setReceivingCall(true)
			setCaller(data.from)
			setUserName(data.name)
			setCallerSignal(data.signal)
		})

		socketRef.current.on('receiveMessage', (data) => {
			if (data.message === 'video-settings') {
				if (data.userName === userName) {
					setSecUserVideoEnabled(prev => !prev)
				}
			} else if (data.message === 'sound-settings') {
				if (data.userName === userName) {
					setSecUserSoundEnabled(prev => !prev)
				}
			} else if (data.message === 'userLeft-settings') {
				if (data.userName === userName) {
					setSecUserLeft(true);
					setCallEnded(true)
					handleNullState();
					setTimeout(() => {
						setSecUserLeft(false);
					}, 3000);
				}
			} else {
				if (!showChat && data.userName !== name) {
					setMessageUnread(prev => prev + 1);
				}
				setMessages((prevMessages) => [...prevMessages, data])
			};
			});

			return () => {
				socketRef.current.off('receiveMessage');
			};
	}, [userName])


	const handleNullState = ()=>{	
		setIdToCall('');
		setUserName('');
		setIsMuted(false);
		setIsVideoEnabled(true);
		setMessages([]);
		setShowChat(false);
		setSecUserVideoEnabled(true);
		setSecUserSoundEnabled(true);
	}
    const sendMessage = (data) => {
		if (data.message) {
			const messageData = {
				...data,
				to: caller || idToCall
			};
			if (!socketRef.current?.connected) {
				console.error('Socket is not connected!');
				return;
			}	
			socketRef.current.emit('sendMessage', messageData);
		}
	};

	const callUser = (id) => {
		if (!name) {
			setErrorMessage("Please enter your name before calling.");
			return;
		}
		setErrorMessage("");
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socketRef.current.emit("callUser", {
				userToCall: id,
				signalData: data,
				from: me,
				name: name
			})
		})
		peer.on("stream", (stream) => {
			if (userVideo.current) {
				setTimeout(() => {
					userVideo.current.srcObject = stream;
				}, 100);
			} else {
				console.error("userVideo reference is not set yet.");
			}
		})
		socketRef.current.on("callAccepted", (data) => {
			setCallAccepted(true)
			setUserName(data.userName)
			peer.signal(data.signal)
		})

		connectionRef.current = peer
	}

	const answerCall =() =>  {
		setCallAccepted(true)
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socketRef.current.emit("answerCall", { 
				signal: data, 
				to: caller, 
				userName: name
			})
		})
		peer.on("stream", (stream) => {
			if (userVideo.current) {
				setTimeout(() => {
					userVideo.current.srcObject = stream;
				}, 100);
			} else {
				console.error("userVideo reference is not set yet.");
			}
		})

		peer.signal(callerSignal)
		connectionRef.current = peer
	}

	const leaveCall = () => {
		setShowChat(false)
		setCallEnded(true)
		if (connectionRef.current) {
			const messageData = {
                message: 'userLeft-settings',
                userName: name
            };
            socketRef.current.emit('sendMessage', messageData);
			connectionRef.current?.destroy()
		} else {
			console.error("No active connection to leave.")
		}
	}

	const toggleMute = () => {
		if (stream) {
			stream.getAudioTracks().forEach(track => {
				track.enabled = !track.enabled;
			})
			const messageData = {
				message: 'sound-settings',
				userName: name
			};
			socketRef.current.emit('sendMessage', messageData);
		}
		setIsMuted(prev => !prev);
	}

	const toggleVideo = () => {
		setIsVideoEnabled(prev => !prev);
		const messageData = {
            message: 'video-settings',
            userName: name
        };
        socketRef.current.emit('sendMessage', messageData);
		if (stream) {
			stream.getVideoTracks().forEach(track => {
				track.enabled = !track.enabled;
			});
		}
	}

	return (
		<div className="w-full min-h-[100vh] relative flex flex-col">
			<div className="relative top-0 left-0 flex flex-col sm:flex-row justify-center sm:justify-around items-center w-full h-full flex-grow">
				{callAccepted && !callEnded && 
					<div className="absolute top-0 left-0 flex justify-center bg-black w-full h-full">
						{!secUserVideoEnabled && 
							<div className="absolute top-0 left-0 flex flex-col justify-center items-center gap-2 text-white text-center w-full h-full">
								<FaRegUser className="mx-auto" size={40}/>
								<p>
									{userName} was stopped his stream
								</p>
							</div>
						}
						{!secUserSoundEnabled && 
							<div className="absolute bottom-[74px] left-2 p-2 bg-gray-400 rounded-md">
								<FaMicrophoneLinesSlash color="white" size={25}/>
							</div>
						}
						<video 
							playsInline 
							ref={userVideo} 
							autoPlay
							style={{ height: "100%" }}
							className={`object-contain ${!secUserVideoEnabled ? 'opacity-0' : ''}`}
						/> 
					</div>
				}
				<div
					className={`w-fit ${(!callAccepted || callEnded) ? ' sm:w-[600px] sm:h-[450px]'  : 'absolute bottom-[76px] !w-[100px] sm:!w-[300px] sm:h-[225px] right-[10px]'}`}
				>	
					{isMuted && isVideoEnabled &&
						<div className="absolute bottom-2 right-2 p-1 sm:p-2 bg-gray-400 rounded-md">
							<FaMicrophoneLinesSlash className="w-3 h-3 sm:w-5 sm:h-5" color="white"/>
						</div>
					}
					{stream && 
						<video 
							muted
							playsInline 
							ref={myVideo} 
							autoPlay 
							style={{ 
								zIndex:10,
								width:(!callAccepted || callEnded) ? '600px' : isVideoEnabled ? "300px" : "0px" 
							}} 
						/>
						}
				</div>
				{receivingCall && !callAccepted && (
					<CallAnswer answerCall={answerCall} name={userName} />
				)}
				{(!callAccepted || callEnded) && !(receivingCall && !callAccepted) && 
					<CallInput
						name={name}
						setName={setName}
						errorMessage={errorMessage}
						me={me}
						idToCall={idToCall}
						setIdToCall={setIdToCall}
						callUser={callUser}
					/>
				}
				{secUserLeft && <div className="absolute top-0 sm:bottom-[62px] w-full h-[40px] bg-gray-400 p-2 text-white text-center transition-all">User Left the call</div>}
			</div>
			{callAccepted && !callEnded && (
				<CallBar toggleMute={toggleMute} toggleVideo={toggleVideo} leaveCall={leaveCall} isMuted={isMuted} isVideoEnabled={isVideoEnabled} showChat={showChat} setShowChat={setShowChat} messageUnread={messageUnread}/>
			)}
			{showChat && <Chat name={name} messages={messages} sendMessage={sendMessage}/>}
		</div>
	)
}

export default CallToOne