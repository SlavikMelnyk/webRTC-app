import { useRef, useState } from 'react';

export const useScreenRecording = (roomID) => {
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const [isRecording, setIsRecording] = useState(false);

    const startRecording = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: 30 },
                audio: true
            });
    
            const mediaRecorder = new MediaRecorder(screenStream, {
                mimeType: 'video/webm; codecs=vp9,opus'
            });
    
            recordedChunksRef.current = [];
    
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };
    
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `meeting-${roomID}.webm`;
                a.click();
                URL.revokeObjectURL(url);
            };
    
            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
    
            screenStream.getVideoTracks()[0].addEventListener("ended", () => {
                stopRecording();
            });
        } catch (err) {
            console.error("Screen recording error:", err);
            alert("Failed to start screen recording");
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            if (setIsRecording) {
                setIsRecording(false);
            }
        }
    };

    return {
        isRecording,
        mediaRecorderRef,
        startRecording,
        stopRecording
    };
}; 