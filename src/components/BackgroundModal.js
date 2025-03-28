import React, { useState } from 'react';
import { FaChevronRight } from "react-icons/fa";

const BackgroundModal = ({ isOpen, onClose, backgrounds, selectedBackground, onSelect }) => {
    const [isClosing, setIsClosing] = useState(false);
    const handleClose = () => {
        setIsClosing(true)
        setTimeout(() => {
            setIsClosing(false)
            onClose()
        }, 500)
    }

    if (!isOpen) return null;

    return (
            <div className={`absolute bg-transparent transition-all duration-500 ${isClosing ? 'animate-fadeOutRight' : 'animate-fadeInRight'}`}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6 px-2">
                        <h3 className="text-xl font-semibold text-gray-900">Choose Background</h3>
                        <button 
                            onClick={handleClose}
                            className=" hover:text-gray-600 transition-colors animate-fadeRight"
                        >
                            <FaChevronRight size={20} />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
                        {Object.entries(backgrounds).map(([key, url]) => (
                            <div 
                                key={key}
                                onClick={() => onSelect(key)}
                                className={`
                                    group relative cursor-pointer rounded-lg overflow-hidden
                                    transition-transform hover:scale-[1.02] hover:shadow-lg
                                    ${selectedBackground === key ? 'ring-2 ring-lime-500' : ''}
                                `}
                            >
                                {url ? (
                                    <img 
                                        src={url} 
                                        alt={key} 
                                        className="w-full h-16 lg:h-36 object-cover aspect-video"

                                    />
                                ) : (
                                    <div
                                        className="w-full bg-gray-200/30 h-16 lg:h-36"
                                    />
                                )}
                                <div className={`
                                    absolute inset-0 flex items-end justify-center
                                    bg-gradient-to-t from-black/50 to-transparent
                                    transition-opacity
                                    ${selectedBackground === key ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                                `}>
                                    <p className="text-white text-center p-3 font-medium">
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
    );
};

export default BackgroundModal; 