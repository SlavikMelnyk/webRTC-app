import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { FaMicrophoneLines, FaMicrophoneLinesSlash, FaVideoSlash, FaVideo, FaRegImage } from "react-icons/fa6";
import { MdOutlineBlurOff, MdOutlineBlurOn } from "react-icons/md";
import { useEffect, useRef, useState } from "react";
import { backgroundOptions } from "../common/backgroundOptions";
import BackgroundModal from '../components/BackgroundModal';

const Lobby = () => {
    const { myName, setMyName, isMuted, setIsMuted, isVideoEnabled, setIsVideoEnabled, isBlurred, setIsBlurred, selectedBackground, setSelectedBackground } = useUser();
    const { roomID } = useParams();
    const navigate = useNavigate();

    const userVideo = useRef(null);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const streamRef = useRef(null);

    const [name, setName] = useState('');
    const [maxVideoWidth, setMaxVideoWidth] = useState(100);
    const backgroundImageRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleJoin = () => {
        if (myName === '') {
            setMyName(name);
        }
        navigate(`/room/${roomID}`)
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

    useEffect(() => {
        const symbol = Math.random().toString(36).substring(2, 3)
        setName(window.outerWidth >= 1920 ? 'Desktop-' + symbol : window.outerWidth >= 1512 ? 'Laptop-' + symbol : 'Mobile-' + symbol);

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            streamRef.current = stream;
            userVideo.current.srcObject = stream;
            userVideo.current.play();

            const videoElement = userVideo.current;
            const canvasElement = canvasRef.current;
            const canvasCtx = canvasElement.getContext('2d');

            const selfieSegmentation = new SelfieSegmentation({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
            });

            selfieSegmentation.setOptions({
                modelSelection: 1, 
            });

            selfieSegmentation.onResults((results) => {
                canvasCtx.save();
                canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            
                if (isBlurred) {
                    canvasCtx.filter = selectedBackground === 'none' ? 'blur(10px)' : 'none';
                    canvasCtx.drawImage(selectedBackground !== 'none' ? backgroundImageRef.current :results.image, 0, 0, canvasElement.width, canvasElement.height);
                    
                    canvasCtx.globalCompositeOperation = 'destination-out';
                    canvasCtx.filter = 'none';
                    canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);
                
                    canvasCtx.globalCompositeOperation = 'destination-over';
                    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
                } else {
                    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
                }
            
                canvasCtx.restore();
            });

            const onFrame = async () => {
                if (!videoElement.paused && !videoElement.ended) {
                    await selfieSegmentation.send({ image: videoElement });
                }
                requestAnimationFrame(onFrame);
            };

            videoElement.onloadeddata = () => {
                canvasElement.width = videoElement.videoWidth;
                canvasElement.height = videoElement.videoHeight;
                onFrame();
            };
        });

        return () => {
            streamRef.current?.getTracks().forEach(track => track.stop());
        };
    }, [selectedBackground]);

    useEffect(() => {
        if (selectedBackground !== 'none') {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = backgroundOptions[selectedBackground];

            img.onload = () => {
                backgroundImageRef.current = img;
            };

            img.onerror = () => {
                console.error('Failed to load background image:', img.src);
                backgroundImageRef.current = null;
            };
        } else {
            backgroundImageRef.current = null;
        }
    }, [selectedBackground]);

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
            className="flex flex-col lg:flex-row p-4 lg:p-20 items-center justify-around gap-10 min-h-screen w-full overflow-auto"
        >
            <div className="relative w-full flex items-center justify-center" style={{ maxWidth: maxVideoWidth }}>
                <video
                    ref={userVideo}
                    muted
                    playsInline
                    className="rounded-lg shadow-lg object-cover w-full h-auto"
                    style={{
                        maxWidth: window.innerWidth * 0.5,
                    }}
                />
                <canvas
                    ref={canvasRef}
                    className={`rounded-lg shadow-lg object-cover w-full h-auto absolute transition-opacity duration-300 ${isBlurred ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    style={{
                        maxWidth: window.innerWidth * 0.5,
                    }}
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
                    <div className='flex gap-2 transition-all'>
                        <button onClick={toggleMute}>
                            {isMuted ? <FaMicrophoneLinesSlash size={30} /> : <FaMicrophoneLines size={30} />}
                        </button>
                        <button onClick={toggleVideo}>
                            {!isVideoEnabled ? <FaVideoSlash size={30} /> : <FaVideo size={30} />}
                        </button>
                        <button onClick={() => setIsBlurred(!isBlurred)}>
                            {isBlurred ? <MdOutlineBlurOn size={30} /> : <MdOutlineBlurOff size={30} />}
                        </button>
                        {isBlurred && <button onClick={() => setIsModalOpen(true)}>
                            <FaRegImage size={30} /> 
                        </button>}
                    </div>
                    <button
                    onClick={handleJoin}
                    className='bg-lime-500 rounded-md hover:bg-lime-300 text-white hover:text-gray-600 w-[90vw] sm:w-[400px] h-[50px] transition-all'
                    >
                        Join
                    </button>
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
