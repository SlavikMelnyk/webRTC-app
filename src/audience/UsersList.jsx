import React, { useEffect, useState } from 'react';
import { RxCrossCircled } from "react-icons/rx";
import { FaMicrophoneLines, FaMicrophoneLinesSlash } from "react-icons/fa6";

const UsersList = ({ users, showList, kickUser, addPermission}) => {
    const [isClosing, setIsClosing] = useState(null);
    const [hoveredUser, setHoveredUser] = useState(null);

    const handleRemoveUser = (user) => {
        kickUser(user.userName);
    }

    useEffect(()=>{
        if (showList) {
            setIsClosing(null);
        } else {
            setIsClosing('closing');
            setTimeout(() => {
                setIsClosing('closed');
            }, 500);
        }
    },[showList])

    if (isClosing === 'closed') {
        return null;
    }
    
    return (
        <div className={`absolute z-10 top-[10px] left-1 sm:left-[10px] bg-white text-center rounded-md w-[200px] sm:w-[300px] h-fit p-2 flex flex-col gap-2 ${isClosing === 'closing' ? 'animate-fadeOutLeft' : 'animate-fadeInLeft'}`} style={{ maxHeight: 'calc(100% - 86px)' }}>
            <div className='flex justify-between items-center text-lg'>
                Users in this audience {users.length > 0 ? `(${users.length})` : ''}: 
            </div>
            {users.map((user, index) => {
                return (
                    <div 
                        key={index} 
                        className='select-none flex items-center gap-2'
                    >
                        <div
                            onClick={() => handleRemoveUser(user)} 
                            className='flex justify-between items-center p-2 bg-gray-200 rounded-md text-transparent hover:text-red-500 cursor-pointer w-full'
                        >
                            <span className='text-black'>
                                {user.userName}
                            </span>
                            <span>
                                <RxCrossCircled size={20} />
                            </span>
                        </div>
                        {!user.isMuted ? (
                            <div 
                                onMouseEnter={() => setHoveredUser(user.userName)}
                                onMouseLeave={() => setHoveredUser(null)}
                                onClick={() => addPermission(user.userName)}
                                className='cursor-pointer hover:text-red-500'
                            >
                                {hoveredUser === user.userName ? (
                                    <FaMicrophoneLinesSlash size={20} />
                                ) : (
                                    <FaMicrophoneLines size={20} />
                                )}
                            </div>
                        ) : null}
                    </div>
                )
            })}
        </div>
    );
};

export default UsersList; 
