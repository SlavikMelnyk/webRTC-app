import React, { useEffect, useRef, useState } from "react"
import Peer from "simple-peer"
import io from "socket.io-client"
import "./App.css"
import CallBar from "./callBar/CallBar";
import CallAnswer from "./common/CallAnswer";
import CallInput from "./callInput/CallInput";

const socket = io.connect('http://localhost:5001')
function App() {
	const [ me, setMe ] = useState("")
	const [ stream, setStream ] = useState()
	const [ receivingCall, setReceivingCall ] = useState(false)
	const [ caller, setCaller ] = useState("")
	const [ callerSignal, setCallerSignal ] = useState()
	const [ callAccepted, setCallAccepted ] = useState(false)
	const [ idToCall, setIdToCall ] = useState("")
	const [ callEnded, setCallEnded] = useState(false)
	const [ name, setName ] = useState("")
	const [ userName, setUserName ] = useState("")

	const [ errorMessage, setErrorMessage ] = useState("")
	const [isMuted, setIsMuted] = useState(false)
	const [isVideoEnabled, setIsVideoEnabled] = useState(true)
	const myVideo = useRef()
	const userVideo = useRef()
	const connectionRef= useRef()

	useEffect(() => {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true })
			.then((stream) => {
				setStream(stream);
				if (myVideo.current) {
					myVideo.current.srcObject = stream;
				} else {
					console.error("myVideo reference is not set yet.");
				}
			})
			.catch((error) => {
				console.error("Error accessing media devices.", error);
			});

	socket.on("me", (id) => {
			setMe(id)
		})

		socket.on("callUser", (data) => {
			setReceivingCall(true)
			setCaller(data.from)
			setUserName(data.name)
			setCallerSignal(data.signal)
		})
	}, [])

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
		socket.on("callAccepted", (signal) => {
			setCallAccepted(true)
			peer.signal(signal)
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
			socket.emit("answerCall", { signal: data, to: caller })
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
		setCallEnded(true)
		if (connectionRef.current) {
			if (stream) {
				stream.getVideoTracks().forEach(track => {
					track.enabled = !track.enabled;
				});
			}
			connectionRef.current = null
			// connectionRef.current?.destroy()
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
		setIsMuted(prev => !prev);
	}

	const toggleVideo = () => {
		setIsVideoEnabled(prev => !prev);
		if (stream) {
			stream.getVideoTracks().forEach(track => {
				track.enabled = !track.enabled;
			});
		}
	}

	return (
		<div className="w-full min-h-[100vh] relative flex flex-col">
			<h1 className="text-center text-white text-xl bg-black">{callAccepted ? userName : 'Zoomish'}</h1>
			<div className="relative top-0 left-0 flex flex-row justify-around items-center w-full h-full flex-grow">
				{callAccepted && !callEnded && 
					<div className="absolute top-0 left-0 flex justify-center bg-black w-full h-full">
						<video 
							playsInline 
							ref={userVideo} 
							autoPlay
							style={{ height: "100%" }}
							className="object-fill"
						/> 
					</div>
				}
				<div
					className={`w-fit ${(!callAccepted || callEnded) ? 'w-[600px] h-[450px]'  : 'absolute bottom-[62px] right-0'}`}
				>	
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
				{(!callAccepted || callEnded) && !receivingCall && 
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
				<CallBar toggleMute={toggleMute} toggleVideo={toggleVideo} leaveCall={leaveCall} isMuted={isMuted} isVideoEnabled={isVideoEnabled} />
			)}
		</div>
	)
}

export default App