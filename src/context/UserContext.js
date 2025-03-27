import React, { createContext, useState, useContext } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const symbol = Math.random().toString(36).substring(2, 3)
    const [myName, setMyName] = useState(window.outerWidth >= 1920 ? 'Desktop-' + symbol : window.outerWidth >= 1512 ? 'Laptop-' + symbol : 'Mobile-' + symbol);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);

    return (
        <UserContext.Provider value={{ myName, setMyName, isMuted, setIsMuted, isVideoEnabled, setIsVideoEnabled }}>
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