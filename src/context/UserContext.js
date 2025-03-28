import React, { createContext, useState, useContext } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [myName, setMyName] = useState('');
    const [isMuted, setIsMuted] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isBlurred, setIsBlurred] = useState(true);
    const [selectedBackground, setSelectedBackground] = useState('none');
    return (
        <UserContext.Provider value={{ myName, setMyName, isMuted, setIsMuted, isVideoEnabled, setIsVideoEnabled, isBlurred, setIsBlurred, selectedBackground, setSelectedBackground }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}; 