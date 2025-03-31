import React, { useEffect, useRef } from "react";
import { FaRegUser } from "react-icons/fa";
import { FaMicrophoneLinesSlash } from "react-icons/fa6";
import VideoDisplay from "../components/VideoDisplay";

const Video = ({
    peerObj,
    maxVideoHeight 
}) => {
    const { videoOff, isMuted, userName, peer, isBlurred, selectedBackground, isScreenSharing } = peerObj;
    const videoRef = useRef();
    const canvasRef = useRef();

    useEffect(() => {
        peer.on("stream", stream => {
            videoRef.current.srcObject = stream;
        });
    }, [peer]);

    if (peer.readable === false) {
        return null;
    }
    
    return (
        <div className='relative flex items-center justify-center w-full h-full rounded-lg select-none'>
            {videoOff && (
                <div className="absolute top-0 left-0 flex flex-col justify-center items-center gap-2 text-white text-center w-full h-full">
                    <FaRegUser className="mx-auto" size={40}/>
                    <p>
                        {userName}
                    </p>
                </div>
            )}
            <VideoDisplay
                videoRef={videoRef}
                canvasRef={canvasRef}
                isBlurred={isBlurred && !videoOff}
                selectedBackground={selectedBackground}
                maxHeight={maxVideoHeight}
                className={`${!videoOff ? 'opacity-100' : 'opacity-0'}`}
                showEffects={!isScreenSharing}
            />
            {(!videoOff || isMuted) && (
                <div className='absolute flex items-center gap-1 top-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded'>
                    <span>
                        {videoOff ? '' : userName}
                    </span>
                    {isMuted && <FaMicrophoneLinesSlash className="text-white"/>}
                </div>
            )}
        </div>
    );
}

export default Video;