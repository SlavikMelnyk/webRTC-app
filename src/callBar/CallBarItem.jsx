import React from "react"
import "../App.css"


function CallBarItem({children, label, textColor, onClick, ...props }) {

	return (
		<div className={`relative w-full p-2 flex flex-col items-center text-[${textColor}]`} {...props}>
			{children}
			<p className={`text-sm cursor-pointer select-none `} onClick={onClick}>
				{label}
			</p>
		</div>
	)
}

export default CallBarItem