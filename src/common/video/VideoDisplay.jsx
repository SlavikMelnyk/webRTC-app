import React, { useEffect, useRef, useState } from "react";
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';
import { backgroundOptions } from "../backgroundOptions";
import { FaRegUser } from "react-icons/fa";

const VideoDisplay = ({
    videoRef,
    canvasRef,
    isBlurred,
    selectedBackground,
    maxHeight,
    maxWidth,
    className = "",
    style = {},
    showEffects = true,
    isVideoEnabled = true,
    hidden = false
}) => {
    const backgroundImageRef = useRef(null);
    const selfieSegmentationRef = useRef(null);
    const frameRef = useRef(null);
    const [hasError, setHasError] = useState(false);

    const stopEffects = () => {
        if (selfieSegmentationRef.current) {
            selfieSegmentationRef.current.close();
            selfieSegmentationRef.current = null;
        }
        if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
        setHasError(false);
    };

    useEffect(() => {
        if (!showEffects || hasError) {
            stopEffects();
            return;
        }

        const videoElement = videoRef.current;
        const canvasElement = canvasRef.current;
        
        if (!videoElement || !canvasElement) return;
        
        const canvasCtx = canvasElement.getContext('2d');

        const selfieSegmentation = new SelfieSegmentation({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
        });

        selfieSegmentationRef.current = selfieSegmentation;

        selfieSegmentation.setOptions({
            modelSelection: 1,
        });

        selfieSegmentation.onResults((results) => {
            if (!canvasElement || !results) return;

            try {
                canvasCtx.save();
                canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            
                canvasCtx.filter = selectedBackground !== 'none' ? 'none' : isBlurred ? 'blur(10px)' : 'none';
                canvasCtx.drawImage(
                    selectedBackground !== 'none' && backgroundImageRef.current ? 
                    backgroundImageRef.current : 
                    results.image, 
                    0, 0, canvasElement.width, canvasElement.height
                );
                
                canvasCtx.globalCompositeOperation = 'destination-out';
                canvasCtx.filter = 'none';
                canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);
            
                canvasCtx.globalCompositeOperation = 'destination-over';
                canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
            
                canvasCtx.restore();
            } catch (error) {
                console.error('Error drawing canvas:', error);
                setHasError(true);
            }
        });

        let errorCount = 0;
        const MAX_ERRORS = 3;
        const ERROR_RESET_TIMEOUT = 5000;
        let errorResetTimeout;

        const onFrame = async () => {
            if (!videoElement || videoElement.paused || videoElement.ended || hasError) {
                return;
            }

            try {
                await selfieSegmentation.send({ image: videoElement });
                errorCount = 0;
                if (errorResetTimeout) {
                    clearTimeout(errorResetTimeout);
                    errorResetTimeout = null;
                }
            } catch (error) {
                errorCount++;
                console.error(`Error processing frame (${errorCount}/${MAX_ERRORS}):`, error);
                
                if (errorCount >= MAX_ERRORS) {
                    console.error('Too many errors, stopping effects');
                    setHasError(true);
                    return;
                }

                if (!errorResetTimeout) {
                    errorResetTimeout = setTimeout(() => {
                        errorCount = 0;
                    }, ERROR_RESET_TIMEOUT);
                }
            }

            if (!hasError) {
                frameRef.current = requestAnimationFrame(onFrame);
            }
        };

        const initializeCanvas = () => {
            if (videoElement && canvasElement) {
                canvasElement.width = videoElement.videoWidth;
                canvasElement.height = videoElement.videoHeight;
                onFrame();
            }
        };

        if (videoElement.readyState >= 2) {
            initializeCanvas();
        } else {
            videoElement.onloadeddata = initializeCanvas;
        }

        return () => {
            stopEffects();
            if (errorResetTimeout) {
                clearTimeout(errorResetTimeout);
            }
        };
    }, [isBlurred, selectedBackground, showEffects, hasError]);

    useEffect(() => {
        if (selectedBackground !== 'none' && showEffects) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = backgroundOptions[selectedBackground];

            img.onload = () => {
                backgroundImageRef.current = img;
                setHasError(false);
            };

            img.onerror = () => {
                console.error('Failed to load background image:', img.src);
                backgroundImageRef.current = null;
                setHasError(true);
            };
        } else {
            backgroundImageRef.current = null;
            setHasError(false);
        }
    }, [selectedBackground, showEffects]);

    return (
        <div className={`relative ${hidden ? 'hidden' : ''}`}>
            {!isVideoEnabled && (
                <div className="absolute z-10 top-0 left-0 flex flex-col justify-center items-center gap-2 text-white text-center w-full h-full">
                    <FaRegUser className="mx-auto" size={60}/>
                </div>
            )}
            <video
                ref={videoRef}
                className={`rounded-lg shadow-lg object-cover ${className} ${isVideoEnabled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{
                    maxHeight,
                    maxWidth,
                    ...style
                }}
                playsInline
                autoPlay
            />
            {showEffects && !hasError && (
                <canvas
                    ref={canvasRef}
                    className={`rounded-lg shadow-lg absolute top-0 left-0 w-full h-full transition-opacity duration-300 ${className}`}
                    style={{
                        maxHeight,
                        maxWidth,
                        ...style
                    }}
                />
            )}
        </div>
    );
};

export default VideoDisplay; 