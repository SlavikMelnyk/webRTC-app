import React, { useEffect, useRef } from "react";
import { FaRegUser } from "react-icons/fa";
import { FaMicrophoneLinesSlash } from "react-icons/fa6";
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';

const Video = ({
    peerObj,
    maxVideoHeight 
}) => {
    const { videoOff, isMuted, userName, peer, isBlurred } = peerObj;
    const ref = useRef();
    const canvasRef = useRef();
    
    useEffect(() => {
        peer.on("stream", stream => {
            ref.current.srcObject = stream;

            if (isBlurred && !videoOff) {
                const videoElement = ref.current;
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
                
                    canvasCtx.filter = 'blur(10px)';
                    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
                    
                    canvasCtx.globalCompositeOperation = 'destination-out';
                    canvasCtx.filter = 'none';
                    canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);
                
                    canvasCtx.globalCompositeOperation = 'destination-over';
                    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
                
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
            }
        })
    }, [isBlurred, videoOff]);
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
                    className={`rounded-lg cover shadow-lg w-full h-full ${!videoOff ? 'opacity-100' : 'opacity-0'}`}
                    playsInline 
                    autoPlay 
                    ref={ref}
                    style={{
                        maxHeight: maxVideoHeight,
                        width: 'auto',
                    }}
                /> 
                <canvas
                    ref={canvasRef}
                    className={`rounded-lg cover shadow-lg absolute w-full h-full transition-opacity duration-300 ${isBlurred ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    style={{
                        maxHeight: maxVideoHeight,
                        width: 'auto',
                    }}
                />
                {(!videoOff || isMuted)  && (
                    <div className='absolute flex items-center gap-1 top-2 left-2 text-white bg-black bg-opacity-50  px-2 py-1 rounded'>
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