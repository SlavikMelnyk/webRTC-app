import React from "react"
import "../App.css"


function CallAnswer({answerCall, name} ) {
	return (
		<div className="flex flex-col mt-24 items-center justify-center gap-4 text-center text-white">
			<div className="flex gap-2 items-center">
				<h1 className="font-bold text-xl">{name}</h1> 
				<span>
					is calling...
				</span>
			</div>
			<button className="z-10 bg-lime-500 px-2 py-1 rounded-md cursor-pointer hover:bg-lime-400" onClick={answerCall}>
				Answer
			</button>
		</div>
	)
}

export default CallAnswer