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
        window.location.href = '/call-to-one';
    }
    return (
        <div className="flex flex-col text-center items-center justify-center gap-10 min-h-screen">
            <div className="flex flex-col items-center justify-center h-full w-fit">
                <h1 className="text-xl mb-4">Create a Conference Room</h1>
                <button 
                    onClick={createNewRoom}
                    className="bg-lime-500 rounded-md  hover:bg-lime-300 text-white hover:text-gray-600 transition-all w-[90vw] sm:w-[400px] h-[50px]"
                >
                    Create
                </button>
                <p className="mt-1 text-start text-sm w-full text-gray-700 max-w-[90vw] sm:max-w-[400px]">*share the room URL with others to join the conference</p>
            </div>
            <p className="text-4xl">OR</p>
            <div className="flex flex-col items-center justify-center h-full w-fit">
                <h1 className="text-xl mb-4">Call One to One</h1>
                <button 
                    onClick={calllOneToOne}
                    className="bg-lime-500 rounded-md  hover:bg-lime-300 text-white hover:text-gray-600 transition-all w-[90vw] sm:w-[400px] h-[50px]"
                >
                    Call
                </button>
                <p className="mt-1 text-start text-sm w-full text-gray-700 max-w-[90vw] sm:max-w-[400px]">*share your ID with other user to join the call</p>
            </div>
        </div>
    );
};

export default CreateRoom;