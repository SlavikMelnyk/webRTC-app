import React from "react";
import { v1 as uuid } from "uuid";
import { useNavigate } from "react-router-dom";

const CreateRoom = () => {
    const navigate = useNavigate();

    function create() {
        const id = uuid();
        navigate(`/room/${id}`);
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-2xl mb-4">Create a Conference Room</h1>
            <button 
                onClick={create}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                Create Room
            </button>
            <p className="mt-4 text-gray-600">Share the room URL with others to join the conference</p>
        </div>
    );
};

export default CreateRoom;