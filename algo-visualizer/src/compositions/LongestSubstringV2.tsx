import React from 'react';
import {
	Stage,
	InvariantBand,
	Cell,
	Pointer,
	WindowBracket,
	HashBadge,
	CallOut,
	useStep,
	color,
	space,
	type,
} from '../design';
import {run, cellRole, LongestSubstringStep} from '../algorithms/longestSubstring';

const INPUT = 'abcabcbb';
const STEPS = run(INPUT);

const stride = space.cell + space.cellGap;

// Map the algorithm-specific cell role to the design-system CellState.
const roleToState = (role: ReturnType<typeof cellRole>) => {
	if (role === 'conflict') return 'conflict' as const;
	if (role === 'active') return 'active' as const;
	if (role === 'ghost') return 'ghost' as const;
	return 'idle' as const;
};

const PrimaryArea: React.FC<{
	curr: LongestSubstringStep;
	prev: LongestSubstringStep;
	progress: number;
	peak: boolean;
}> = ({curr, prev, progress, peak}) => {
	const width = INPUT.length * stride - space.cellGap;
	const rowLeft = 0;

	return (
		<div
			style={{
				position: 'relative',
				width,
				height: space.cell + 80,
				display: 'flex',
				alignItems: 'center',
			}}
		>
			{/* Window bracket sits above the row. */}
			{curr.right >= 0 && (
				<WindowBracket
					left={curr.left}
					right={curr.right}
					prevLeft={prev.right >= 0 ? prev.left : curr.left}
					prevRight={prev.right >= 0 ? prev.right : curr.right}
					progress={progress}
					cellStride={stride}
				/>
			)}

			{/* Cells. */}
			<div style={{display: 'flex', gap: space.cellGap, position: 'relative'}}>
				{INPUT.split('').map((ch, i) => {
					const role = cellRole(curr, i);
					const prevRole = cellRole(prev, i);
					const focused =
						(i === curr.right && curr.right >= 0) ||
						(peak && i === curr.left);
					return (
						<Cell
							key={i}
							value={ch}
							index={i}
							state={roleToState(role)}
							prevState={roleToState(prevRole)}
							progress={progress}
							focused={focused}
						/>
					);
				})}
			</div>

			{/* L pointer (below row). */}
			<Pointer
				index={curr.left}
				prevIndex={prev.left}
				progress={progress}
				label="L"
				role="left"
				anchor="bottom"
				cellStride={stride}
			/>
			{/* R pointer (below row, offset by -2px more to avoid overlap with L). */}
			{curr.right >= 0 && (
				<Pointer
					index={curr.right}
					prevIndex={prev.right >= 0 ? prev.right : curr.right}
					progress={progress}
					label="R"
					role="right"
					anchor="bottom"
					cellStride={stride}
					offset={44}
				/>
			)}

			{/* Peak callout anchored to the new L position. */}
			{peak && curr.conflictKey !== null && (
				<CallOut
					anchorX={curr.left * stride + space.cell / 2 - rowLeft}
					anchorY={-70}
					text={`'${curr.conflictKey}' 处跳过`}
					visible={progress > 0.1}
					progress={progress}
					direction="up"
				/>
			)}
		</div>
	);
};

const AuxiliaryArea: React.FC<{curr: LongestSubstringStep}> = ({curr}) => {
	const entries = Object.entries(curr.lastSeen).map(([k, v]) => ({
		key: k,
		value: v,
		fresh: k === curr.freshKey,
		conflict: k === curr.conflictKey,
	}));

	return (
		<div
			style={{
				display: 'flex',
				gap: 48,
				alignItems: 'center',
				justifyContent: 'center',
				width: '100%',
			}}
		>
			<HashBadge entries={entries} label="lastSeen" />
			<div
				style={{
					width: 1,
					height: 80,
					backgroundColor: color.struct.stroke,
				}}
			/>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 4,
				}}
			>
				<span
					style={{
						fontSize: 13,
						color: color.text.muted,
						letterSpacing: 2,
						fontFamily: type.family.mono,
						textTransform: 'uppercase',
					}}
				>
					maxLen
				</span>
				<span
					style={{
						fontSize: 44,
						fontFamily: type.family.mono,
						fontWeight: type.weight.bold,
						color: color.role.resolved,
					}}
				>
					{curr.maxLen}
				</span>
			</div>
			<div
				style={{
					width: 1,
					height: 80,
					backgroundColor: color.struct.stroke,
				}}
			/>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 4,
				}}
			>
				<span
					style={{
						fontSize: 13,
						color: color.text.muted,
						letterSpacing: 2,
						fontFamily: type.family.mono,
						textTransform: 'uppercase',
					}}
				>
					window
				</span>
				<span
					style={{
						fontSize: 22,
						fontFamily: type.family.mono,
						color: color.text.primary,
					}}
				>
					[{curr.left}, {curr.right < 0 ? '·' : curr.right}]
				</span>
			</div>
		</div>
	);
};

export const LongestSubstringV2Composition: React.FC = () => {
	const {prev, curr, progress, peak} = useStep(STEPS);

	return (
		<Stage
			problemId="3"
			title="无重复字符的最长子串"
			complexity="O(n) time · O(min(n,Σ)) space"
			invariant={<InvariantBand text="窗口内字符互不重复" />}
			primary={
				<PrimaryArea curr={curr} prev={prev} progress={progress} peak={peak} />
			}
			auxiliary={<AuxiliaryArea curr={curr} />}
			narration={curr.narration}
		/>
	);
};
