import React from 'react';
import {AbsoluteFill} from 'remotion';
import {color, type, space, layout} from './tokens';

interface StageProps {
	/** Problem ID (e.g. "3"). Prefixed with "LC" in the header. */
	problemId: string;
	/** Problem title. */
	title: string;
	/** Optimal time/space complexity badge (e.g. "O(n) time · O(k) space"). */
	complexity: string;
	/** The persistent invariant band (typically an <InvariantBand />). */
	invariant: React.ReactNode;
	/** The dominant data structure. Occupies ~50% of vertical space. */
	primary: React.ReactNode;
	/** Auxiliary structure (hash, stack, dp table). Empty ok if not needed. */
	auxiliary?: React.ReactNode;
	/** Terse narration, max ~12 Chinese chars. */
	narration: string;
	/** Optional callout node overlaid on top of the stage. */
	callout?: React.ReactNode;
}

// Stage is the unified layout shell for every V2 visualizer.
// See DESIGN.md §Stage for the layout contract.
export const Stage: React.FC<StageProps> = ({
	problemId,
	title,
	complexity,
	invariant,
	primary,
	auxiliary,
	narration,
	callout,
}) => {
	return (
		<AbsoluteFill
			style={{
				backgroundColor: color.bg.canvas,
				color: color.text.primary,
				fontFamily: type.family.sans,
				padding: space.pagePad,
				display: 'flex',
				flexDirection: 'column',
				gap: 14,
				position: 'relative',
			}}
		>
			{/* Header */}
			<div
				style={{
					height: `${layout.header * 100}%`,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					borderBottom: `1px solid ${color.struct.stroke}`,
					paddingBottom: 10,
				}}
			>
				<div style={{display: 'flex', alignItems: 'baseline', gap: 14}}>
					<span
						style={{
							fontFamily: type.family.mono,
							fontSize: type.size.invariant,
							color: color.text.muted,
							letterSpacing: 1,
						}}
					>
						LC {problemId}
					</span>
					<h1
						style={{
							fontSize: type.size.header,
							fontWeight: type.weight.bold,
							margin: 0,
							color: color.text.primary,
						}}
					>
						{title}
					</h1>
				</div>
				<span
					style={{
						fontFamily: type.family.mono,
						fontSize: type.size.label,
						color: color.text.secondary,
						letterSpacing: 0.5,
					}}
				>
					{complexity}
				</span>
			</div>

			{/* Invariant band */}
			<div
				style={{
					height: `${layout.invariant * 100}%`,
					minHeight: 48,
				}}
			>
				{invariant}
			</div>

			{/* Primary area */}
			<div
				style={{
					flex: 1,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					position: 'relative',
					minHeight: 0,
				}}
			>
				{primary}
			</div>

			{/* Auxiliary area */}
			<div
				style={{
					height: `${layout.auxiliary * 100}%`,
					minHeight: 120,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				{auxiliary ?? null}
			</div>

			{/* Narration strip */}
			<div
				style={{
					height: `${layout.narration * 100}%`,
					minHeight: 56,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					borderTop: `1px solid ${color.struct.stroke}`,
					paddingTop: 10,
				}}
			>
				<span
					style={{
						fontSize: type.size.narration,
						fontFamily: type.family.mono,
						color: color.text.primary,
						letterSpacing: 1,
					}}
				>
					{narration}
				</span>
			</div>

			{/* Callout overlay */}
			{callout}
		</AbsoluteFill>
	);
};
