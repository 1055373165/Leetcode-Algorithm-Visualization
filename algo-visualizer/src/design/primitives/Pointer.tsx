import React from 'react';
import {color, type, space, z} from '../tokens';
import {tween, easing} from '../motion';

export type PointerRole = 'left' | 'right' | 'slow' | 'fast' | 'mid' | 'i';

interface PointerProps {
	/** Index this pointer is at currently (can be fractional for tweening). */
	index: number;
	/** Previous index for tweening between steps. Defaults to index. */
	prevIndex?: number;
	/** Tween progress 0..1. */
	progress?: number;
	/** Label to render (L/R/i/mid/slow/fast). */
	label: string;
	role: PointerRole;
	/** "top" places arrow pointing down; "bottom" places arrow pointing up. */
	anchor?: 'top' | 'bottom';
	/** Width of a single cell (including gap). */
	cellStride: number;
	/** Distance from anchor edge of the row to the pointer label, in px. */
	offset?: number;
}

// A pointer that slides to its index via easing.
// Position = index * cellStride; since index can be a float, we tween.
export const Pointer: React.FC<PointerProps> = ({
	index,
	prevIndex,
	progress = 1,
	label,
	role,
	anchor = 'bottom',
	cellStride,
	offset = 16,
}) => {
	const from = prevIndex ?? index;
	const x = tween(from, index, progress, easing.easeOutCubic) * cellStride;
	const hex = color.pointer[role];

	const arrow =
		anchor === 'top' ? (
			// Pointing down: a triangle with a flat top.
			<div
				style={{
					width: 0,
					height: 0,
					borderLeft: '7px solid transparent',
					borderRight: '7px solid transparent',
					borderTop: `10px solid ${hex}`,
				}}
			/>
		) : (
			<div
				style={{
					width: 0,
					height: 0,
					borderLeft: '7px solid transparent',
					borderRight: '7px solid transparent',
					borderBottom: `10px solid ${hex}`,
				}}
			/>
		);

	return (
		<div
			style={{
				position: 'absolute',
				left: x + space.cell / 2,
				transform: 'translateX(-50%)',
				[anchor === 'top' ? 'top' : 'bottom']: -offset,
				display: 'flex',
				flexDirection: anchor === 'top' ? 'column' : 'column-reverse',
				alignItems: 'center',
				gap: 4,
				zIndex: z.pointer,
			}}
		>
			{arrow}
			<span
				style={{
					fontFamily: type.family.mono,
					fontSize: type.size.label,
					fontWeight: type.weight.bold,
					color: hex,
					letterSpacing: 1,
				}}
			>
				{label}
			</span>
		</div>
	);
};
