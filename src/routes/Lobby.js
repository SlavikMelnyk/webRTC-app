import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { FaMicrophoneLines, FaMicrophoneLinesSlash, FaVideoSlash, FaVideo } from "react-icons/fa6";
import { useEffect, useRef, useState } from "react";

const Lobby = () => {
    const { myName, setMyName, isMuted, setIsMuted, isVideoEnabled, setIsVideoEnabled } = useUser();
    const { roomID } = useParams();
    const navigate = useNavigate();

    const userVideo = useRef(null);
    const containerRef = useRef(null);

    const [name, setName] = useState('');
    const [maxVideoWidth, setMaxVideoWidth] = useState(100);
  
    const handleJoin = () => {
        if (myName === '') {
            setMyName(name);
        }
        navigate(`/room/${roomID}`)
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

    useEffect(()=>{
        const symbol = Math.random().toString(36).substring(2, 3)
        setName(window.outerWidth >= 1920 ? 'Desktop-' + symbol : window.outerWidth >= 1512 ? 'Laptop-' + symbol : 'Mobile-' + symbol);
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                userVideo.current.srcObject = stream;
            })
    },[])

    if (containerRef?.current) {
        new ResizeObserver(() => setMaxVideoWidth(containerRef.current?.clientHeight * 0.9)).observe(containerRef.current);
    }
    return (
        <div 
            ref={containerRef} 
            className="flex flex-col lg:flex-row p-4 lg:p-20 items-center justify-around gap-10 min-h-screen w-full"
        >
            <video
                muted
                ref={userVideo}
                autoPlay
                playsInline
                className='rounded-lg shadow-lg object-cover w-full'
                style={{
                    maxWidth: maxVideoWidth,
                }}
            />
            <div className="flex flex-col items-center justify-center h-full w-full gap-4">
                <h1 className="text-xl font-semibold">Please configure your stream before join to the room</h1>
                <h3>Your room ID: {roomID}</h3>
                <input
                    type="text" 
                    value={myName}
                    placeholder={name}
                    onChange={(e) => setMyName(e.target.value)}
                    className="p-2 border rounded-md w-[90vw] sm:w-[400px] h-[50px]"
                />
                <div className="flex gap-2">
                    <button onClick={toggleMute}>
                        {isMuted ? <FaMicrophoneLinesSlash size={30} />  : <FaMicrophoneLines size={30} />}
                    </button>
                    <button onClick={toggleVideo}>
                        {!isVideoEnabled ? <FaVideoSlash size={30} /> : <FaVideo size={30} />}
                    </button>
                </div>
                <button 
                    onClick={handleJoin}
                    className="bg-lime-500 rounded-md  hover:bg-lime-300 text-white hover:text-gray-600 transition-all w-[90vw] sm:w-[400px] h-[50px]"
                >
                    Join
                </button>
            </div>
        </div>
    );
};

export default Lobby;