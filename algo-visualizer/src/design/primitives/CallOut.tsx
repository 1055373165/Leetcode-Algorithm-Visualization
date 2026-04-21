import React from 'react';
import {color, type, z} from '../tokens';
import {tween, easing} from '../motion';

interface CallOutProps {
	/** Absolute x (px) inside the stage. */
	anchorX: number;
	/** Absolute y (px) inside the stage. */
	anchorY: number;
	/** Short annotation, max ~12 Chinese chars. */
	text: string;
	/** Show/hide driven by caller (typically only during peak steps). */
	visible: boolean;
	/** Progress within the peak step, drives fade-in. */
	progress?: number;
	/** Which side of anchor to point from. Defaults 'up' (bubble above element). */
	direction?: 'up' | 'down';
}

// Anchored annotation bubble. Appears only during peak steps.
// See DESIGN.md §Primitives — routine steps must NOT show a callout.
export const CallOut: React.FC<CallOutProps> = ({
	anchorX,
	anchorY,
	text,
	visible,
	progress = 1,
	direction = 'up',
}) => {
	if (!visible) return null;

	const opacity = tween(0, 1, progress, easing.easeOutCubic);
	const translateY = tween(direction === 'up' ? 12 : -12, 0, progress, easing.easeOutCubic);

	const above = direction === 'up';

	return (
		<div
			style={{
				position: 'absolute',
				left: anchorX,
				top: anchorY + (above ? -60 : 20),
				transform: `translate(-50%, ${translateY}px)`,
				opacity,
				zIndex: z.callout,
				pointerEvents: 'none',
			}}
		>
			<div
				style={{
					backgroundColor: color.callout.bg,
					border: `2px solid ${color.callout.stroke}`,
					color: color.callout.text,
					padding: '6px 14px',
					borderRadius: 8,
					fontFamily: type.family.mono,
					fontSize: type.size.callout,
					fontWeight: type.weight.bold,
					whiteSpace: 'nowrap',
					boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
				}}
			>
				{text}
			</div>
			<div
				style={{
					position: 'absolute',
					left: '50%',
					[above ? 'bottom' : 'top']: -8,
					transform: 'translateX(-50%)',
					width: 0,
					height: 0,
					borderLeft: '8px solid transparent',
					borderRight: '8px solid transparent',
					[above ? 'borderTop' : 'borderBottom']: `10px solid ${color.callout.stroke}`,
				}}
			/>
		</div>
	);
};
