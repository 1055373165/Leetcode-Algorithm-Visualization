import {AbsoluteFill, useVideoConfig} from 'remotion';
import React from 'react';

export const BASE_VIDEO_WIDTH = 1280;
export const BASE_VIDEO_HEIGHT = 720;

export const HiDpiCanvas: React.FC<{
	backgroundColor: string;
	children: React.ReactNode;
}> = ({backgroundColor, children}) => {
	const {width, height} = useVideoConfig();
	const scale = Math.min(width / BASE_VIDEO_WIDTH, height / BASE_VIDEO_HEIGHT);
	const left = (width - BASE_VIDEO_WIDTH * scale) / 2;
	const top = (height - BASE_VIDEO_HEIGHT * scale) / 2;

	return (
		<AbsoluteFill style={{backgroundColor}}>
			<div
				style={{
					position: 'absolute',
					left,
					top,
					width: BASE_VIDEO_WIDTH,
					height: BASE_VIDEO_HEIGHT,
					transform: `scale(${scale})`,
					transformOrigin: 'top left',
				}}
			>
				{children}
			</div>
		</AbsoluteFill>
	);
};
