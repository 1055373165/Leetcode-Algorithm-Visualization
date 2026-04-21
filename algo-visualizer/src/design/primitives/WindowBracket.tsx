import React from 'react';
import {color, space, z} from '../tokens';
import {tween, easing} from '../motion';

interface WindowBracketProps {
	/** Current left index (may be fractional during tween). */
	left: number;
	/** Current right index. */
	right: number;
	/** Previous left for tweening. */
	prevLeft?: number;
	/** Previous right for tweening. */
	prevRight?: number;
	progress?: number;
	cellStride: number;
	/** Height of the brackets' vertical arms. */
	armHeight?: number;
}

// A structural bracket that physically encloses the current window range.
// The window stops being a "set of highlighted cells" and becomes an
// object with an outside and an inside. See DESIGN.md §Structural containers.
export const WindowBracket: React.FC<WindowBracketProps> = ({
	left,
	right,
	prevLeft,
	prevRight,
	progress = 1,
	cellStride,
	armHeight = 18,
}) => {
	const l = tween(prevLeft ?? left, left, progress, easing.easeOutCubic);
	const r = tween(prevRight ?? right, right, progress, easing.easeOutCubic);

	const leftX = l * cellStride;
	const rightX = r * cellStride + space.cell;
	const width = Math.max(0, rightX - leftX);

	return (
		<div
			style={{
				position: 'absolute',
				left: leftX,
				top: -armHeight - 8,
				width,
				height: armHeight + 4,
				pointerEvents: 'none',
				zIndex: z.bracket,
			}}
		>
			{/* Horizontal top rail */}
			<div
				style={{
					position: 'absolute',
					bottom: 0,
					left: 0,
					right: 0,
					height: space.bracketThickness,
					backgroundColor: color.struct.windowStroke,
					borderRadius: 1,
				}}
			/>
			{/* Left arm, pointing down */}
			<div
				style={{
					position: 'absolute',
					bottom: 0,
					left: 0,
					width: space.bracketThickness,
					height: armHeight,
					backgroundColor: color.struct.windowStroke,
					borderRadius: 1,
				}}
			/>
			{/* Right arm */}
			<div
				style={{
					position: 'absolute',
					bottom: 0,
					right: 0,
					width: space.bracketThickness,
					height: armHeight,
					backgroundColor: color.struct.windowStroke,
					borderRadius: 1,
				}}
			/>
		</div>
	);
};
