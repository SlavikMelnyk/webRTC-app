import React, { useState } from "react"
import "../App.css"
import { FaMicrophoneLines, FaMicrophoneLinesSlash, FaVideoSlash, FaVideo } from "react-icons/fa6";
import { FaPhoneSlash } from "react-icons/fa";
import { PiChatCircleLight, PiChatCircleSlash } from "react-icons/pi";
import { CiFaceSmile } from "react-icons/ci";

function CallBar({toggleMute, toggleVideo, leaveCall, isMuted, isVideoEnabled, showChat, setShowChat, messageUnread, sendReaction, reactions }) {
	const [isOpening, setIsOpening] = useState(false);
	const [openReaction, setOpenReaction] = useState(false);
	const emojiReactions = [
		{ name: 'smile', emoji: '😀' },
		{ name: 'thumb', emoji: '👍' },
		{ name: 'heart', emoji: '❤️' },
		{ name: 'OK', emoji: '👌' }
	];

	const handleShowChat = () =>{
		setShowChat(prev => !prev);
		if (!showChat && messageUnread) {
			setIsOpening('closing');
			setTimeout(() => {
				setIsOpening('closed');
			}, 300);
		}
	}
	const handleReaction = (reaction) => {		
		sendReaction({ reaction });
		setOpenReaction(false);
	}
	return (
		<div className="absolute bottom-0 left-0 w-full bg-white text-center flex justify-around p-2 shadow-md">
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
			<div 
				className="relative w-[25%] h-full flex flex-col items-center" 
				onMouseEnter={() => setOpenReaction(true)} 
				onMouseLeave={() => setOpenReaction(false)}
				onContextMenu={(e) =>{ 
					e.preventDefault(); 
					setOpenReaction(true)
				}}
			>
				{openReaction ? ( 
					<div className="absolute -top-[70px] sm:-top-[33px] bg-gray-200 w-fit rounded-lg animate-fadeInTop">
						{emojiReactions.map((item, index) => (
							<button key={index} onClick={() => handleReaction(item.emoji)} className="p-1">
								{item.emoji}
							</button>
						))}
					</div>
					) : null}
				<button className="relative" onClick={() => handleReaction(emojiReactions[0].emoji)}>
					<CiFaceSmile size={30}/>
				</button>
				<p className="text-sm cursor-pointer select-none">Reaction</p>
				{reactions.map((reaction, index) => (
					<div className="absolute -top-[30px] left-1/2 translate-x-1/2 flex items-center text-lg text-gray-600 animate-fadeInBottom bg-gray-200 px-2 rounded-md" key={index}>{reaction}</div>
				))}
			</div>
			<div className="relative w-[25%] flex flex-col items-center">
				<button className="relative" onClick={handleShowChat}>
					{((messageUnread && !showChat) || isOpening === 'closing') ? <div className={`absolute -right-1 w-4 h-4 text-[11px] text-white bg-red-500 rounded-full ${isOpening === 'closing' ? 'animate-fadeOutBottom' : 'animate-fadeInTop'}`}>{messageUnread || null}</div> : null}
					{showChat ? <PiChatCircleSlash size={30}/> : <PiChatCircleLight size={30} />}
				</button>
				<p className="text-sm cursor-pointer select-none" onClick={handleShowChat}>Chat</p>
			</div>
		</div>
	)
}

export default CallBar