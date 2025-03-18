import React from 'react';

const CallInput = ({ name, setName, errorMessage, me, idToCall, setIdToCall, callUser }) => {
    const disabledCall = idToCall.length !==20 || !me;
    return (
        <div className="flex flex-col h-fit sm:rounded bg-gradient-to-r from-gray-300 to-indigo-200 p-8 justify-center items-center">
            <div className='flex w-full items-center justify-between gap-4 mb-5'>
                <div>
                    <input
                        id="filled-basic"
                        className='px-2 py-1 rounded'
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    {((errorMessage && !name) || !me) && <div className='text-[#FF0000] mt-1'>{me ? errorMessage : 'Server is not running now' }</div>}
                </div>
                {me && <button className="text-center bg-gray-400 px-2 py-1 rounded-md " onClick={() => { navigator.clipboard.writeText(me); }} >
                    Copy your UserID
                </button>}
            </div>
            <div className='flex w-full items-center justify-between gap-4 mb-5'>
                <input
                    id="filled-basic"
                    className='px-2 py-1 rounded'
                    placeholder="ID to call"
                    value={idToCall}
                    onChange={(e) => setIdToCall(e.target.value)}
                />
                <button className="bg-lime-500 w-full px-2 py-1 rounded-md disabled:opacity-50" aria-label="call" onClick={() => callUser(idToCall)} disabled={disabledCall}>
                    Call
                </button>
            </div>
        </div>
    );
};

export default CallInput; 