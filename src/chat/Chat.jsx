import React, { useEffect, useRef, useState } from 'react';
import { SiGooglemessages } from "react-icons/si";
import { FiPaperclip, FiFile } from "react-icons/fi";
import { v4 as uuidv4 } from 'uuid';
const Chat = ({ name, messages, sendMessage, showChat }) => {
    const inputRef = useRef();
    const messagesRef = useRef();
    const [message, setMessage] = useState('');
    const [isClosing, setIsClosing] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [tooltip, setTooltip] = useState(null);

    const handleSendMessage = () => {
        const messageId = uuidv4();
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        sendMessage({ message, userName: name, id: messageId, timestamp, file: selectedFile });
        setMessage('');
        setSelectedFile(null);
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];        
        setSelectedFile({file, name: file?.name, type: file?.type});
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
                    messages.map((msg, index) => {
                        let fileToDownload;
                        let fileToDownloadName;
                        if (msg?.file?.file instanceof ArrayBuffer) {
                            const blob = new Blob([msg.file.file]);
                            fileToDownload = new File([blob], msg.file.name, { type: msg.file.type });
                            const fileName = fileToDownload?.name.split('.')[0];
                            const fileType = fileToDownload?.name.split('.')[1];
                            fileToDownloadName = fileName.length > 20 ? fileName.slice(0, 20) + `...${fileType}` : fileName + `.${fileType}`;
                        }
                        return (
                            <div 
                                key={index} 
                                style={{ 
                                    maxHeight: 'calc(100% - 114px)', 
                                    overflowY: 'auto' 
                                }} 
                                onClick={()=> console.log(msg)}
                            >
                                {tooltip?.index === index && fileToDownloadName.includes('...') && tooltip.text && (
                                    <div 
                                        className='fixed z-20 h-fit w-fit bg-black/80 text-white  text-xs sm:text-sm p-2 rounded-md'
                                        style={{ top: `${tooltip.y + 10}px`, left: `${tooltip.x - 100}px` }}
                                    >
                                        {tooltip.text}
                                    </div>
                                )}
                                {msg.message === 'user-left' ? (
                                    <div className='flex flex-col w-full items-center'>
                                        <p className='px-1 italic text-red-400'>{msg.userName} left the room</p>
                                    </div>
                                ) : msg.message === 'user-joined' ? (
                                    <div className='flex flex-col w-full items-center'>
                                        <p className='px-1 italic text-green-500'>{msg.userName} joined the room</p>
                                    </div>
                                ) : name === msg.userName ? (
                                    <div className='flex  flex-col w-full items-end text-end'>
                                        <p className='px-1 font-bold'>{msg.userName}</p>
                                        <div className='flex flex-col w-fit bg-gray-200 rounded-md px-2'>
                                            <span>{msg.message}</span>
                                            {fileToDownload && 
                                                <div className='flex gap-1'>
                                                    <FileIcon fileToDownload={fileToDownload} setTooltip={setTooltip} index={index}/>
                                                    <span className='italic text-black/50'>{fileToDownloadName}</span>
                                                </div>
                                            }
                                            <span className='text-gray-400 italic text-xs'>{msg.timestamp}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className='flex flex-col w-full items-start text-start'>
                                        <p className='px-1 font-bold'>{msg.userName}</p>
                                        <div className='flex flex-col w-fit bg-gray-200 rounded-md px-2'>
                                            <span>{msg.message}</span>
                                            {fileToDownload && 
                                                <div className='flex gap-1'>
                                                    <FileIcon fileToDownload={fileToDownload} setTooltip={setTooltip} index={index}/>
                                                    <span className='italic text-black/50'>{fileToDownloadName}</span>
                                                </div>
                                            }
                                            <span className='text-gray-400 italic text-xs'>{msg.timestamp}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className='opacity-60 mt-1' onClick={handleFocusInput}>Please send first message...</div>
                )}
            </div>
            {selectedFile && <div className='flex items-center gap-1 px-2 border-t mt-1'><FiFile />{selectedFile.name.length > 20 && !selectedFile.name.slice(0, 20).includes('.')  ? selectedFile.name.slice(0, 20) + `...${selectedFile.type.split('/')[1]}` : selectedFile.name}</div>}
            <div className='flex border px-2 rounded-b-md gap-1 mt-1'>
                <input
                    type="file"
                    onChange={handleFileChange}
                    className='hidden'
                    id="fileInput"
                />
                <label htmlFor="fileInput" className='cursor-pointer flex items-center justify-center'>
                    <FiPaperclip size={22} />
                </label>
                <input
                    ref={inputRef}
                    className='py-1 focus:outline-none w-full'
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                />
                <button className='disabled:opacity-50' onClick={handleSendMessage} disabled={message.length === 0 && !selectedFile}>
                    <SiGooglemessages size={25} />
                </button>
            </div>
        </div>
    );
};

export default Chat; 

const FileIcon = ({ fileToDownload, setTooltip, index }) => {
    if (!fileToDownload || !(fileToDownload instanceof File || fileToDownload instanceof Blob)) {
        return null;
    }

    return (
        <a href={URL.createObjectURL(fileToDownload)} download={fileToDownload.name} className='flex items-center text-blue-500 py-1'
            onMouseEnter={(e) => {
                setTooltip({ text: fileToDownload?.name, index, x: e.clientX, y: e.clientY });
            }}
            onMouseLeave={() => setTooltip(null)}
            onContextMenu={(e) => {
                    setTooltip({ text: fileToDownload?.name, index, x: e.clientX, y: e.clientY });
            }}
        >
            <FiFile />
        </a>
    );
}