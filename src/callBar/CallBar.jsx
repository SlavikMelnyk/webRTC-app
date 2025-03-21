import React from "react"
import "../App.css"
import { FaMicrophoneLines, FaMicrophoneLinesSlash, FaVideoSlash, FaVideo } from "react-icons/fa6";
import { FaPhoneSlash } from "react-icons/fa";
import { PiChatCircleLight, PiChatCircleSlash } from "react-icons/pi";

function CallBar({toggleMute, toggleVideo, leaveCall, isMuted, isVideoEnabled, showChat, setShowChat, messageUnread } ) {
	const handleShowChat = () =>{
		setShowChat(prev => !prev)
	}
	return (
		<div className="absolute bottom-0 left-0 w-full bg-white  flex justify-around p-2 shadow-md">
			<div className="w-[25%] flex flex-col items-center">
				<button onClick={toggleMute}>
					{isMuted ? <FaMicrophoneLinesSlash size={30} />  : <FaMicrophoneLines size={30} />}
				</button>
				<p className="text-sm cursor-pointer select-none" onClick={toggleMute}>
					{isMuted? 'Unmute' : 'Mute'}
				</p>
			</div>
			<div className="w-[25%] flex flex-col items-center">
				<button onClick={toggleVideo}>
					{isVideoEnabled ? <FaVideoSlash size={30} /> : <FaVideo size={30} />}
				</button>
				<p className="text-sm cursor-pointer select-none" onClick={toggleVideo}>{isVideoEnabled ? 'Stop camera' : 'Show camera'}</p>
			</div>
			<div className="text-[#FF0000] w-[25%] flex flex-col items-center">				
				<button onClick={leaveCall}>
					<FaPhoneSlash size={30}/>
				</button>
				<p className="text-sm cursor-pointer select-none" onClick={leaveCall}>Leave</p>
			</div>
			<div className="relative w-[25%] flex flex-col items-center">
				<button className="relative" onClick={handleShowChat}>
					{messageUnread && !showChat ? <div className="absolute right-0 top-0 w-3 h-3 bg-red-500 rounded-full"/> : null}
					{showChat ? <PiChatCircleSlash size={30}/> : <PiChatCircleLight size={30} />}
				</button>
				<p className="text-sm cursor-pointer select-none" onClick={handleShowChat}>Chat</p>
			</div>
		</div>
	)
}

export default CallBar