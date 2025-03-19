import React, { useEffect, useRef, useState } from "react"
import Peer from "simple-peer"
import io from "socket.io-client"
import "./App.css"
import CallBar from "./callBar/CallBar";
import CallAnswer from "./common/CallAnswer";
import CallInput from "./callInput/CallInput";
import Chat from './chat/Chat';
import { FaRegUser } from "react-icons/fa";
import { FaMicrophoneLinesSlash } from "react-icons/fa6";

const socket = io.connect('https://webrtc-app-04ea.onrender.com')
function App() {
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

	const [ errorMessage, setErrorMessage ] = useState("")
	const [isMuted, setIsMuted] = useState(false)
	const [isVideoEnabled, setIsVideoEnabled] = useState(true)
	const [secUserVideoEnabled, setSecUserVideoEnabled] = useState(true);
	const [secUserSoundEnabled, setSecUserSoundEnabled] = useState(true);
	const myVideo = useRef()
	const userVideo = useRef()
	const connectionRef= useRef()

	useEffect(() => {
		if (navigator.mediaDevices) {			
			navigator.mediaDevices.getUserMedia({ video: true, audio: true })
				.then((stream) => {
					setStream(stream);
					if (myVideo.current) {
							myVideo.current.srcObject = stream;
					} else {
						console.error("myVideo reference is not set yet");
					}
				})
				.catch((error) => {
					console.error("Error accessing media devices.", error);
				});
		}

		socket.on("me", (id) => {
				setMe(id)
			})

		socket.on("callUser", (data) => {
			setReceivingCall(true)
			setCaller(data.from)
			setUserName(data.name)
			setCallerSignal(data.signal)
		})

		socket.on('receiveMessage', (data) => {
			if (data.message === 'video-settings') {
				if (data.userName === userName) {
					setSecUserVideoEnabled(prev => !prev)
				}
			} else if (data.message === 'sound-settings') {
				if (data.userName === userName) {
					setSecUserSoundEnabled(prev => !prev)
				}
			} else setMessages((prevMessages) => [...prevMessages, data]);
			});

			return () => {
				socket.off('receiveMessage');
			};
	}, [userName])

    const sendMessage = (data) => {
        if (data.message) {
            socket.emit('sendMessage', data);
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
			socket.emit("callUser", {
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
		socket.on("callAccepted", (data) => {
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
			socket.emit("answerCall", { 
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
			// connectionRef.current = null
			connectionRef.current?.destroy()
		} else {
			console.error("No active connection to leave.")
		}
	}

	const toggleMute = () => {
		if (stream) {
			stream.getAudioTracks().forEach(track => {
				track.enabled = !track.enabled;
			});
		}
		const messageData = {
            message: 'sound-settings',
            userName: name
        };
        socket.emit('sendMessage', messageData);
		setIsMuted(prev => !prev);
	}

	const toggleVideo = () => {
		setIsVideoEnabled(prev => !prev);
		const messageData = {
            message: 'video-settings',
            userName: name
        };
        socket.emit('sendMessage', messageData);
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
							className={`object-contain ${!secUserVideoEnabled && 'opacity-0'}`}
						/> 
					</div>
				}
				<div
					className={`w-fit ${(!callAccepted || callEnded) ? 'w-[600px] h-[450px]'  : 'absolute bottom-[76px] !w-[100px] sm:!w-[300px] sm:h-[225px] right-[10px]'}`}
				>	
					{isMuted && isVideoEnabled &&
						<div className="absolute bottom-2 right-2 p-1 sm:p-2 bg-gray-400 rounded-md">
							<FaMicrophoneLinesSlash className="w-3 h-3 sm:w-5 sm:h-5" color="white"/>
						</div>
					}
					{stream && 
						<video 
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
			</div>
			{callAccepted && !callEnded && (
				<CallBar toggleMute={toggleMute} toggleVideo={toggleVideo} leaveCall={leaveCall} isMuted={isMuted} isVideoEnabled={isVideoEnabled} showChat={showChat} setShowChat={setShowChat}/>
			)}
			{showChat && <Chat name={name} messages={messages} sendMessage={sendMessage}/>}
		</div>
	)
}

export default App