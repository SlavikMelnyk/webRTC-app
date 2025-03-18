import React from "react"
import "../App.css"
import { FaMicrophoneLines, FaMicrophoneLinesSlash, FaVideoSlash, FaVideo } from "react-icons/fa6";
import { FaPhoneSlash } from "react-icons/fa";

function CallBar({toggleMute, toggleVideo, leaveCall, isMuted, isVideoEnabled } ) {
	return (
		<div className="absolute bottom-0 left-0 w-full bg-white bg-opacity-80 flex justify-around p-4 shadow-md">
			<button onClick={toggleMute}>
				{isMuted ? <FaMicrophoneLinesSlash size={30} color="black"/>  : <FaMicrophoneLines size={30} color="black"/>}
			</button>
			<button onClick={toggleVideo}>
				{isVideoEnabled ? <FaVideoSlash size={30} color="black"/> : <FaVideo size={30} color="black"/>}
			</button>
			<button onClick={leaveCall}>
				<FaPhoneSlash size={30} color="red"/>
			</button>
		</div>
	)
}

export default CallBar