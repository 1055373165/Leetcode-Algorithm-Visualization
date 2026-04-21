import React from 'react';
import {color, type, space, z} from '../tokens';
import {tweenColor} from '../motion';

export type CellState =
	| 'idle'
	| 'active'
	| 'resolved'
	| 'conflict'
	| 'ghost'
	| 'pivot';

interface CellProps {
	value: string | number;
	index?: number;
	/** Semantic state — maps 1:1 to color.role. */
	state: CellState;
	/** From-state for tweening; if set, color interpolates during progress. */
	prevState?: CellState;
	/** Tween progress 0..1. Ignored if prevState is undefined. */
	progress?: number;
	/** True if this cell is the current focus; adds heavy stroke. */
	focused?: boolean;
	/** Show the index label beneath the cell. Default true. */
	showIndex?: boolean;
	/** Size override. Defaults to tokens.space.cell. */
	size?: number;
}

const stateColor: Record<CellState, string> = {
	idle: color.role.idle,
	active: color.role.active,
	resolved: color.role.resolved,
	conflict: color.role.conflict,
	ghost: color.role.ghost,
	pivot: color.role.pivot,
};

// Atomic data unit. Every value in every algorithm lives in a Cell.
// The only public axis for customization is `state` — pick the semantic
// role, and color/stroke fall out automatically. See DESIGN.md §Primitives.
export const Cell: React.FC<CellProps> = ({
	value,
	index,
	state,
	prevState,
	progress = 1,
	focused = false,
	showIndex = true,
	size = space.cell,
}) => {
	const fromHex = stateColor[prevState ?? state];
	const toHex = stateColor[state];
	const bg = prevState && prevState !== state ? tweenColor(fromHex, toHex, progress) : toHex;

	const isGhost = state === 'ghost';
	const stroke = focused
		? color.struct.focus
		: isGhost
		? color.struct.stroke
		: 'transparent';
	const strokeWidth = focused ? space.strokeFocus : space.stroke;

	return (
		<div
			style={{
				width: size,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 4,
				zIndex: focused ? z.focus : z.data,
			}}
		>
			<div
				style={{
					width: size,
					height: size,
					backgroundColor: bg,
					border: `${strokeWidth}px solid ${stroke}`,
					borderRadius: 8,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontFamily: type.family.mono,
					fontSize: type.size.value,
					fontWeight: type.weight.bold,
					color: color.text.primary,
					opacity: isGhost ? 0.5 : 1,
					boxShadow: focused
						? `0 0 0 4px rgba(248, 250, 252, 0.08)`
						: 'none',
					transition: 'none',
				}}
			>
				{value}
			</div>
			{showIndex && index !== undefined && (
				<span
					style={{
						fontSize: type.size.index,
						color: color.text.muted,
						fontFamily: type.family.mono,
					}}
				>
					{index}
				</span>
			)}
		</div>
	);
};
