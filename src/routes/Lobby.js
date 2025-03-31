import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { FaMicrophoneLines, FaMicrophoneLinesSlash, FaVideoSlash, FaVideo, FaRegImage } from "react-icons/fa6";
import { MdOutlineBlurOff, MdOutlineBlurOn } from "react-icons/md";
import { useEffect, useRef, useState } from "react";
import { backgroundOptions } from "../common/backgroundOptions";
import BackgroundModal from '../components/BackgroundModal';
import VideoDisplay from '../common/video/VideoDisplay';
import CallBarItem from "../callBar/CallBarItem";
import { FaChevronLeft } from "react-icons/fa";

const Lobby = () => {
    const { myName, setMyName, isMuted, setIsMuted, isVideoEnabled, setIsVideoEnabled, isBlurred, setIsBlurred, selectedBackground, setSelectedBackground, creatorAudience, setCreatorAudience } = useUser();
    const { roomID, type } = useParams();
    const navigate = useNavigate();

    const userVideo = useRef(null);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const streamRef = useRef(null);

    const [name, setName] = useState('');
    const [maxVideoWidth, setMaxVideoWidth] = useState(100);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleJoin = () => {
        if (myName === '') {
            setMyName(name);
        }
        if (type === 'audience') {
            navigate(`/audience/${roomID}`)
        } else navigate(`/room/${roomID}`)
    }

    const toggleMute = () => {
        const audioTrack = streamRef.current?.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        const videoTrack = streamRef.current?.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const toggleBlur = () => {
        setIsBlurred(prev => !prev);
        setSelectedBackground('none');
    }

    useEffect(() => {
        const symbol = Math.random().toString(36).substring(2, 3)
        setName(window.outerWidth >= 1920 ? 'Desktop-' + symbol : window.outerWidth >= 1512 ? 'Laptop-' + symbol : 'Mobile-' + symbol);

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            const audioTrack = stream.getAudioTracks()[0];
            const videoTrack = stream.getVideoTracks()[0];
            audioTrack.enabled = !isMuted;
            videoTrack.enabled = isVideoEnabled;
            
            streamRef.current = stream;
            userVideo.current.srcObject = stream;
        });

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        if (containerRef.current) {
            const observer = new ResizeObserver(() =>
                setMaxVideoWidth(containerRef.current?.clientHeight)
            );
            observer.observe(containerRef.current);
            return () => observer.disconnect();
        }
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative flex flex-col lg:flex-row p-4 lg:p-20 items-center justify-around gap-10 min-h-screen w-full overflow-auto"
        >
            <button onClick={() => navigate('/')} className="absolute top-4 left-4 hover:text-gray-600 transition-colors animate-fadeRight">
                <FaChevronLeft size={30} />
            </button>
            <div className="relative w-full flex items-center justify-center" style={{ maxWidth: maxVideoWidth }}>
                <VideoDisplay
                    videoRef={userVideo}
                    canvasRef={canvasRef}
                    isBlurred={isBlurred}
                    selectedBackground={selectedBackground}
                    maxWidth={window.innerWidth * 0.5}
                    isVideoEnabled={isVideoEnabled}
                />
            </div>
            <div className="relative flex items-center justify-center h-full w-full ">
                <div className={`flex flex-col items-center justify-center gap-4 ${isModalOpen ? 'opacity-0' : 'opacity-100'}`}>
                    <h1 className='text-xl text-center font-semibold transition-all'>
                        Please configure your stream before joining the room
                    </h1>
                    <input
                        type="text"
                        value={myName}
                        placeholder={name}
                        onChange={(e) => setMyName(e.target.value)}
                        className='p-2 border rounded-md w-[90vw] sm:w-[400px] h-[50px] transition-all'
                    />
                    <div className='relative flex gap-2 transition-all'>
                        <CallBarItem
                            tooltipText={isMuted ? 'Unmute' : 'Mute'}
                            fromLobby
                        >
                            <button onClick={toggleMute}>
                                {isMuted ? <FaMicrophoneLinesSlash size={30} /> : <FaMicrophoneLines size={30} />}
                            </button>
                        </CallBarItem>
                        <CallBarItem
                            tooltipText={isVideoEnabled ? 'Disable Video' : 'Enable Video'}
                            fromLobby
                        >
                            <button onClick={toggleVideo}>
                                {!isVideoEnabled ? <FaVideoSlash size={30} /> : <FaVideo size={30} />}
                            </button>
                        </CallBarItem>
                        <CallBarItem
                            tooltipText={isBlurred ? 'Disable Blur' : 'Enable Blur'}
                            fromLobby
                        >
                            <button onClick={toggleBlur}>
                                {isBlurred ? <MdOutlineBlurOn size={30} /> : <MdOutlineBlurOff size={30} />}
                            </button>
                        </CallBarItem>
                        <CallBarItem
                            tooltipText={'Select Background'}
                            fromLobby
                        >
                            <button onClick={() => setIsModalOpen(true)}>
                                <FaRegImage size={30} /> 
                            </button>
                        </CallBarItem>
                    </div>
                    <button
                        onClick={handleJoin}
                        className='bg-lime-500 rounded-md hover:bg-lime-300 text-white hover:text-gray-600 w-[90vw] sm:w-[400px] h-[50px] transition-all'
                    >
                        Join
                    </button>
                    {type === 'audience' && <div className="flex items-center gap-2">
                        <span>Creator Audience: </span>
                        <input type="checkbox" className="w-5 h-5" checked={creatorAudience} onChange={() => setCreatorAudience(prev => !prev)} />
                    </div>}
                </div>
                <BackgroundModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    backgrounds={backgroundOptions}
                    selectedBackground={selectedBackground}
                    onSelect={setSelectedBackground}
                    userVideo={userVideo}
                />
            </div>
        </div>
    );
};

export default Lobby;
