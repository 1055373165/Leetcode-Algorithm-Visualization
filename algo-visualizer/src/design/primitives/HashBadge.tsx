import React from 'react';
import {color, type} from '../tokens';

export interface HashEntry {
	key: string;
	value: number | string;
	/** True if this entry was just written/updated in the current step. */
	fresh?: boolean;
	/** True if this entry is the reason of a conflict (drives red outline). */
	conflict?: boolean;
}

interface HashBadgeProps {
	entries: HashEntry[];
	/** Title shown above the chips. e.g. "lastSeen" or "count". */
	label?: string;
}

// A compact, pill-shaped rendering of a Map / Dict. Fresh entries carry a
// brighter outline; conflict entries carry a red outline so the viewer can
// immediately trace a window jump to the collision source.
export const HashBadge: React.FC<HashBadgeProps> = ({entries, label}) => {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: 10,
				alignItems: 'center',
			}}
		>
			{label && (
				<span
					style={{
						fontSize: 13,
						color: color.text.muted,
						letterSpacing: 2,
						fontFamily: type.family.mono,
						textTransform: 'uppercase',
					}}
				>
					{label}
				</span>
			)}
			<div
				style={{
					display: 'flex',
					gap: 10,
					flexWrap: 'wrap',
					justifyContent: 'center',
					minHeight: 48,
				}}
			>
				{entries.length === 0 ? (
					<span
						style={{
							fontStyle: 'italic',
							color: color.text.muted,
							fontSize: 16,
							alignSelf: 'center',
						}}
					>
						(empty)
					</span>
				) : (
					entries.map((e) => {
						const outline = e.conflict
							? color.role.conflict
							: e.fresh
							? color.role.active
							: color.struct.stroke;
						const bg = e.conflict
							? 'rgba(248, 113, 113, 0.14)'
							: e.fresh
							? 'rgba(96, 165, 250, 0.14)'
							: color.bg.subtle;

						return (
							<div
								key={e.key}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 8,
									padding: '6px 12px',
									backgroundColor: bg,
									border: `1.5px solid ${outline}`,
									borderRadius: 999,
									fontFamily: type.family.mono,
									fontSize: 18,
									color: color.text.primary,
								}}
							>
								<span style={{color: color.text.secondary}}>
									{e.key}
								</span>
								<span style={{color: color.text.muted}}>→</span>
								<span style={{fontWeight: type.weight.bold}}>
									{e.value}
								</span>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
};
