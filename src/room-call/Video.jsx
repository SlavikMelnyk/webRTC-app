import React, { useEffect, useRef } from "react";
import { FaRegUser } from "react-icons/fa";
import { FaMicrophoneLinesSlash } from "react-icons/fa6";

const Video = ({
    peer,
    userName,
    isMuted,
    videoOff,
    maxVideoHeight 
}) => {
    const ref = useRef();
    
    useEffect(() => {
        peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);
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
                <video 
                    className="rounded-lg shadow-lg" 
                    playsInline 
                    autoPlay 
                    ref={ref}
                    style={{
                        maxHeight: maxVideoHeight,
                    }}
                /> 
                {(userName || isMuted)  && (
                    <div className='absolute flex items-center gap-1 top-2 left-2 text-white bg-black bg-opacity-50  px-2 py-1 rounded '>
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