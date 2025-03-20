import React from "react";
import { v1 as uuid } from "uuid";
import { useNavigate } from "react-router-dom";

const CreateRoom = () => {
    const navigate = useNavigate();

    const createNewRoom = () => {
        const id = uuid();
        navigate(`/room/${id}`);
    }

    const calllOneToOne = () => {
        const id = uuid();
        navigate(`/call-to-one`);
    }
    return (
        <div className="flex flex-col text-center items-center justify-center gap-10 min-h-screen">
            <div className="flex flex-col items-center justify-center h-full">
                <h1 className="text-xl mb-4">Create a Conference Room</h1>
                <button 
                    onClick={createNewRoom}
                    className="bg-lime-500 px-2 py-1 rounded-md  hover:bg-lime-300 text-white hover:text-gray-600 transition-all"
                >
                    Create Room
                </button>
                <p className="mt-4 text-gray-700">Share the room URL with others to join the conference</p>
            </div>
            <p className="text-4xl">OR</p>
            <div className="flex flex-col items-center justify-center h-full">
                <button 
                    onClick={calllOneToOne}
                    className="bg-lime-500 px-2 py-1 rounded-md  hover:bg-lime-300 text-white hover:text-gray-600 transition-all"
                >
                    Call One to One
                </button>
            </div>
        </div>
    );
};

export default CreateRoom;