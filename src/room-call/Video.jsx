import React, { useEffect, useRef } from "react";
import { FaRegUser } from "react-icons/fa";
import { FaMicrophoneLinesSlash } from "react-icons/fa6";

const Video = ({
    peer,
    userName,
    isMuted,
    videoOff,
    maxVideoWidth,
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
        <div className='relative flex items-center justify-center w-full h-full rounded-lg'
            style={{
                maxWidth: window.innerWidth > 768 ? maxVideoWidth : 'auto',
                maxHeight: window.innerWidth <= 768 ? maxVideoHeight : 'auto',
            }}
        >
                {videoOff && (
                    <div className="absolute top-0 left-0 flex flex-col justify-center items-center gap-2 text-white text-center w-full h-full">
                        <FaRegUser className="mx-auto" size={40}/>
                        <p>
                            {userName}
                        </p>
                    </div>
                )}
                <video 
                    className="rounded-lg shadow-lg max-w-full max-h-full" 
                    playsInline 
                    autoPlay 
                    ref={ref}
                    style={{ 
                        objectFit: 'contain',
                    }}
                />
                {userName && (
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