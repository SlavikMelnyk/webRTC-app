import React, { useState } from "react"
import "../App.css"


function CallBarItem({
	children, 
	label, 
	textColor, 
	onClick, 
	tooltipText, 
	fromLobby = false,
	...props 
}) {
	const [isHovered, setIsHovered] = useState(false);
	const [isHidding, setIsHidding] = useState(false);
	const handleHideTooltip = ()=> {
		setIsHidding(true);
		setTimeout(() =>{ 
			setIsHovered(false)
			setIsHidding(false)
		}, 300);
	}

	const handleShowTooltip = ()=> {
		setIsHovered(true)
		setTimeout(() => {
			handleHideTooltip()
		}, 3000);
	}

	return (
		<div 
			className={`relative w-full p-2 flex flex-col items-center text-[${textColor}]`} 
			onMouseEnter={handleShowTooltip}
			onMouseLeave={handleHideTooltip}
			{...props}
		>
			{children}
			{tooltipText && isHovered ? <div className={`absolute hidden sm:block select-none bg-gray-200 w-[200px] px-2 sm:w-fit rounded-lg text-center 
				${fromLobby ? 'bottom-[40px]' : '-top-[20px]'}
				${isHidding ? 'animate-fadeOutBottom' : 'animate-fadeInTop'}`}>
				{tooltipText}
			</div> : null}
			<p className='text-xs sm:text-sm cursor-pointer select-none' onClick={onClick}>
				{label}
			</p>
		</div>
	)
}

export default CallBarItem