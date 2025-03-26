import React, { useState } from "react"
import "../App.css"
import { FaMicrophoneLines, FaMicrophoneLinesSlash, FaVideoSlash, FaVideo } from "react-icons/fa6";
import { FaPhoneSlash, FaDesktop } from "react-icons/fa";
import { MdDesktopAccessDisabled } from "react-icons/md";
import { PiChatCircleLight, PiChatCircleSlash } from "react-icons/pi";
import { CiFaceSmile } from "react-icons/ci";
import CallBarItem from "./CallBarItem";
import { emojiReactions } from "./emojiReactions";

function CallBar(
	{
		toggleMute, 
		toggleVideo, 
		leaveCall, 
		isMuted, 
		isVideoEnabled, 
		showChat, 
		setShowChat, 
		messageUnread, 
		sendReaction, 
		reactions,
		isScreenSharing,
		toggleScreenShare
	}) {
	const [isOpening, setIsOpening] = useState(false);
	const [openReaction, setOpenReaction] = useState(false);
	const [openStream, setOpenStream] = useState(false);
	const [isHiding, setIsHiding] = useState(false);

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

	const handleHideReactions = ()=> {
		setIsHiding(true);
		setTimeout(() =>{ 
			setOpenReaction(false)
			setIsHiding(false)
		}, 300);
	}
	const handleHideStream = ()=> {
		setIsHiding(true);
		setTimeout(() =>{ 
			setOpenStream(false)
			setIsHiding(false)
		}, 300);
	}
	
	const handleToggleVideo = () => {
		if (isScreenSharing) {
			toggleScreenShare()
		} else toggleVideo()
	}

	return (
		<div className="absolute bottom-0 left-0 w-full bg-white text-center flex justify-around shadow-md">
			<CallBarItem 
				label={isMuted? 'Unmute' : 'Mute'}
				onClick={toggleMute}
				tooltipText={isMuted ? 'Click to unmute' : 'Click to mute'}
			>
				<button onClick={toggleMute}>
					{isMuted ? <FaMicrophoneLinesSlash size={30} />  : <FaMicrophoneLines size={30} />}
				</button>
			</CallBarItem>
			<CallBarItem 
				label={isScreenSharing ? 'Stop sharing' : isVideoEnabled ? 'Stop camera' : 'Show camera'}
				onClick={toggleVideo}
				onMouseEnter={() => setOpenStream(true)} 
				onMouseLeave={handleHideStream}
				onContextMenu={(e) =>{ 
					e.preventDefault(); 
					setOpenStream(true)
				}}
			>
				{openStream && !isScreenSharing ? ( 
					<div className={`absolute select-none -top-[40px] sm:-top-[35px]  bg-gray-200 w-[200px] sm:w-fit rounded-lg ${isHiding ? 'animate-fadeOutBottom' : 'animate-fadeInTop'}`}>
						<div className="grid grid-cols-2 gap-2">
							<button className="flex justify-center items-center p-1 hover:bg-gray-300 rounded-md" onClick={toggleScreenShare}>
								<FaDesktop size={20} />
							</button>
							<button className="flex justify-center items-center p-1 hover:bg-gray-300 rounded-md" onClick={toggleVideo}>
								{isVideoEnabled ? <FaVideoSlash size={30} /> : <FaVideo size={30} />}
							</button>
						</div>
					</div>
					) : null}
				<button onClick={handleToggleVideo}>
					{isScreenSharing ? <MdDesktopAccessDisabled size={30} /> : isVideoEnabled ? <FaVideoSlash size={30} /> : <FaVideo size={30} />}
				</button>
			</CallBarItem>
			<CallBarItem 
				label='Leave'
				onClick={leaveCall}
				textColor="#FF0000"
				tooltipText='Click to leave the call'
			>
				<button onClick={leaveCall}>
					<FaPhoneSlash size={30}/>
				</button>
			</CallBarItem>
			<CallBarItem 
				label='Reaction'
				onClick={() => handleReaction(emojiReactions[0].emoji)}
				onMouseEnter={() => setOpenReaction(true)} 
				onMouseLeave={handleHideReactions}
				onContextMenu={(e) =>{ 
					e.preventDefault(); 
					setOpenReaction(true)
				}}
			>
				{openReaction ? ( 
					<div className={`absolute select-none -top-[130px] sm:-top-[125px]  bg-gray-200 w-[200px] sm:w-fit rounded-lg ${isHiding ? 'animate-fadeOutBottom' : 'animate-fadeInTop'}`}>
						<div className="grid grid-cols-6 gap-1">
							{emojiReactions.map((item, index) => (
								<button key={index} onClick={() => handleReaction(item.emoji)} className="p-1 hover:bg-gray-300 rounded-md">
									{item.emoji}
								</button>
							))}
						</div>
						<p>Click to send reaction</p>
					</div>
					) : null}
				<button className="relative" onClick={() => handleReaction(emojiReactions[0].emoji)}>
					<CiFaceSmile size={30}/>
				</button>
				{reactions.map((reaction, index) => (
					<div className="absolute -top-[30px] left-1/2 translate-x-1/2 flex items-center text-lg text-gray-600 animate-fadeInBottom bg-gray-200 px-2 rounded-md" key={index}>{reaction}</div>
				))}
			</CallBarItem>
			<CallBarItem 
				label='Chat'
				onClick={handleShowChat}
				tooltipText={showChat ? 'Click to close chat' : 'Click to open chat'}
			>
				<button className="relative" onClick={handleShowChat}>
					{((messageUnread && !showChat) || isOpening === 'closing') ? <div className={`absolute -right-1 w-4 h-4 text-[11px] text-white bg-red-500 rounded-full ${isOpening === 'closing' ? 'animate-fadeOutBottom' : 'animate-fadeInTop'}`}>{messageUnread || null}</div> : null}
					{showChat ? <PiChatCircleSlash size={30}/> : <PiChatCircleLight size={30} />}
				</button>
			</CallBarItem>
		</div>
	)
}

export default CallBar