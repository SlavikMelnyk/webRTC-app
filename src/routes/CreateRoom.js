import React from "react";
import { v1 as uuid } from "uuid";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const CreateRoom = () => {
    const navigate = useNavigate();
    const { myName, setMyName } = useUser();

    const createNewRoom = () => {
        const id = uuid();
        navigate(`/lobby/${id}/conference`);
    }

    const createNewAudience = () => {
        const id = uuid();
        navigate(`/lobby/${id}/audience`);
    }

    const calllOneToOne = () => {
        window.location.href = '/call-to-one';
    }

    return (
        <div className="flex flex-col text-center items-center justify-center gap-10 min-h-screen">
            <div className="flex flex-col items-center justify-center h-full w-fit">
                <h1 className="text-xl mb-4">Please enter your name</h1>
                <input 
                    type="text" 
                    value={myName} 
                    onChange={(e) => setMyName(e.target.value)}
                    className="mb-4 p-2 border rounded-md w-[90vw] sm:w-[400px] h-[50px]"
                />
            </div>
            <div className="flex items-center justify-center h-full w-full gap-4 sm:gap-40">
                <div>
                    <h1 className="text-xl mb-4">Create a Audience Room</h1>
                    <button 
                        onClick={createNewAudience}
                        className="bg-lime-500 rounded-md  hover:bg-lime-300 text-white hover:text-gray-600 transition-all w-[40vw] sm:w-[400px] h-[50px]"
                    >
                        Create Audience
                    </button>
                    <p className="mt-1 text-start text-sm w-full text-gray-700 max-w-[90vw] sm:max-w-[400px]">*only users with permission can speak in the audience room</p>
                </div>
                <div>
                    <h1 className="text-xl mb-4">Create a Conference Room</h1>
                    <button 
                        onClick={createNewRoom}
                        className="bg-lime-500 rounded-md  hover:bg-lime-300 text-white hover:text-gray-600 transition-all w-[40vw] sm:w-[400px] h-[50px]"
                    >
                        Create Conference
                    </button>
                    <p className="mt-1 text-start text-sm w-full text-gray-700 max-w-[90vw] sm:max-w-[400px]">*all users can speak in the conference room</p>
                </div>
            </div>
            {/* <p className="text-4xl">OR</p>
            <div className="flex flex-col items-center justify-center h-full w-fit">
                <h1 className="text-xl mb-4">Call One to One</h1>
                <button 
                    onClick={calllOneToOne}
                    className="bg-lime-500 rounded-md  hover:bg-lime-300 text-white hover:text-gray-600 transition-all w-[90vw] sm:w-[400px] h-[50px]"
                >
                    Call
                </button>
                <p className="mt-1 text-start text-sm w-full text-gray-700 max-w-[90vw] sm:max-w-[400px]">*share your ID with other user to join the call</p>
            </div> */}
        </div>
    );
};

export default CreateRoom;