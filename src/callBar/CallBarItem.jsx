import React, { useState } from "react"
import "../App.css"


function CallBarItem({children, label, textColor, onClick, tooltipText, ...props }) {
	const [isHovered, setIsHovered] = useState(false);
	const [isHidding, setIsHidding] = useState(false);
	const handleHideTooltip = ()=> {
		setIsHidding(true);
		setTimeout(() =>{ 
			setIsHovered(false)
			setIsHidding(false)
		}, 300);
	}

	return (
		<div 
			className={`relative w-full p-2 flex flex-col items-center text-[${textColor}]`} 
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={handleHideTooltip}
			{...props}
		>
			{children}
			{tooltipText && isHovered ? <div className={`absolute select-none -top-[20px] bg-gray-200 w-[200px] px-2 sm:w-fit rounded-lg ${isHidding ? 'animate-fadeOutBottom' : 'animate-fadeInTop'}`}>
				{tooltipText}
			</div> : null}
			<p className='text-sm cursor-pointer select-none' onClick={onClick}>
				{label}
			</p>
		</div>
	)
}

export default CallBarItem