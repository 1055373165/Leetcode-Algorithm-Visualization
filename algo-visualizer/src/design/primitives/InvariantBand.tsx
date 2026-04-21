import React from 'react';
import {color, type} from '../tokens';

interface InvariantBandProps {
	/** Max 12 Chinese chars / 24 English chars. A terse persistent claim. */
	text: string;
	/** Optional decorative glyph rendered left of the text. */
	glyph?: React.ReactNode;
}

// A persistent strip at the top of the stage that states what is ALWAYS
// true during the algorithm's execution. It does not blink, does not fade,
// does not update per step. If the invariant changes shape per step, your
// invariant is wrong — find the real one.
export const InvariantBand: React.FC<InvariantBandProps> = ({text, glyph}) => {
	return (
		<div
			style={{
				height: '100%',
				backgroundColor: color.invariant.bg,
				border: `1px solid ${color.invariant.stroke}`,
				borderRadius: 6,
				padding: '8px 20px',
				display: 'flex',
				alignItems: 'center',
				gap: 14,
			}}
		>
			<span
				style={{
					fontSize: 11,
					color: color.invariant.accent,
					letterSpacing: 2,
					fontFamily: type.family.mono,
					textTransform: 'uppercase',
				}}
			>
				Invariant
			</span>
			<div
				style={{
					width: 1,
					height: 18,
					backgroundColor: color.invariant.stroke,
				}}
			/>
			{glyph && (
				<div style={{display: 'flex', alignItems: 'center'}}>{glyph}</div>
			)}
			<span
				style={{
					fontSize: type.size.invariant,
					color: color.invariant.text,
					fontFamily: type.family.mono,
					fontWeight: type.weight.medium,
				}}
			>
				{text}
			</span>
		</div>
	);
};
