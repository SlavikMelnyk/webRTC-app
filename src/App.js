import React, { useEffect, useRef, useState } from "react"
import Peer from "simple-peer"
import io from "socket.io-client"
import "./App.css"


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
	const [ errorMessage, setErrorMessage ] = useState("")
	const myVideo = useRef()
	const userVideo = useRef()
	const connectionRef= useRef()

	useEffect(() => {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true })
			.then((stream) => {
				setStream(stream);
				if (myVideo.current) {
					setTimeout(() => {
						myVideo.current.srcObject = stream;
					}, 100);
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
			setName(data.name)
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
			connectionRef.current?.destroy()
		} else {
			console.error("No active connection to leave.")
		}
	}

	return (
		<>
			<h1 style={{ textAlign: "center", color: '#fff' }}>Zoomish</h1>
		<div className="container">
			<div className="video-container">
				<div className="video">
					{stream &&  <video playsInline ref={myVideo} autoPlay style={{ width: "300px" }} />}
				</div>
				<div className="video">
					{callAccepted && !callEnded ?
						<video playsInline ref={userVideo} autoPlay style={{ width: "300px"}} />:
						<ol className="step-list">
							<li>Please copy other user-id and paste it to ID to call input.</li>
							<li>Click the Call button, and wait for the user to answer.</li>
							<li>Enjoy the speaking.</li>
						</ol>
					}
				</div>
			</div>
			<div className="myId">
				
				<input
					id="filled-basic"
					placeholder="Name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					style={{ marginBottom: "20px" }}
					/>
				{errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
				{me && <button className="copy-button" onClick={() => { navigator.clipboard.writeText(me); }} >
					Copy UserID
				</button>}
				<input
					id="filled-basic"
					placeholder="ID to call"
					value={idToCall}
					onChange={(e) => setIdToCall(e.target.value)}
				/>
				<div className="call-button">
					{callAccepted && !callEnded ? (
						<button  color="secondary" onClick={leaveCall}>
							End Call
						</button>
					) : (
						<button aria-label="call" onClick={() => callUser(idToCall)} disabled={!idToCall}>
							Call
						</button>
					)}
				</div>
			</div>
			<div>
				{receivingCall && !callAccepted ? (
						<div className="caller">
						<h1 >{name} is calling...</h1>
						<button onClick={answerCall}>
							Answer
						</button>
					</div>
				) : null}
			</div>
		</div>
		</>
	)
}

export default App