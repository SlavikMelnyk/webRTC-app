import React, { useEffect, useRef, useState } from 'react';
import { SiGooglemessages } from "react-icons/si";

const Chat = ({ name, messages, sendMessage, showChat }) => {
    const inputRef = useRef();
    const messagesRef = useRef();
    const [message, setMessage] = useState('');
    const [isClosing, setIsClosing] = useState(null);

    const handleSendMessage = () => {
        sendMessage({ message, userName: name });
        setMessage('');
        handleFocusInput();
    }

    const handleFocusInput = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    }

    useEffect(()=>{
        if (showChat) {
            setIsClosing(null);
            setTimeout(() => {
                if (messagesRef.current) {
                    messagesRef.current.scrollTo({
                        top: messagesRef.current.scrollHeight,
                        behavior: 'smooth'
                    });

                }
            }, 200);
        } else {
            setIsClosing('closing');
            setTimeout(() => {
                setIsClosing('closed');
            }, 500);
        }
    },[showChat])

    useEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [messages]);
    
    if (isClosing === 'closed') {
        return null;
    }
    
    return (
        <div className={`absolute z-10 top-[10px] right-1 sm:right-[10px] bg-white text-center rounded-md w-[200px] sm:w-[300px] h-fit ${isClosing === 'closing' ? 'animate-fadeOutRight' : 'animate-fadeInRight'}`} style={{ maxHeight: 'calc(100% - 86px)', display: 'flex', flexDirection: 'column' }}>
            <div ref={messagesRef} className='px-2 flex-grow overflow-y-auto'>
                {messages.length > 0 ? (
                    messages.map((msg, index) => (
                        <div key={index} style={{ maxHeight: 'calc(100% - 114px)', overflowY: 'auto' }} >
                            {msg.message === 'user-left' ? (
                                <div className='flex flex-col w-full items-center'>
                                    <p className='px-1 italic text-gray-500'>{msg.userName} left the room</p>
                                </div>
                            ) : name === msg.userName ? (
                                <div className='flex flex-col w-full items-end'>
                                    <p className='px-1 font-bold'>{msg.userName}</p>
                                    <span className='w-fit bg-gray-200 rounded-md px-2'>{msg.message}</span>
                                </div>
                            ) : (
                                <div className='flex flex-col w-full items-start'>
                                    <p className='px-1 font-bold'>{msg.userName}</p>
                                    <span className='w-fit bg-gray-300 rounded-md px-2'>{msg.message}</span>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className='opacity-60 mt-1' onClick={handleFocusInput}>Please send first message...</div>
                )}
            </div>
            <div className='flex border px-2 rounded-b-md gap-1 mt-1'>
                <input
                    ref={inputRef}
                    className='py-1 focus:outline-none w-full'
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                />
                <button onClick={handleSendMessage}>
                    <SiGooglemessages size={25} />
                </button>
            </div>
        </div>
    );
};

export default Chat; 