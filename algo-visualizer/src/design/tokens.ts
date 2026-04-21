// Design tokens for algorithm visualizers.
// This is the single source of truth for color, typography, spacing, and z-layers.
// All visualizers MUST reference these tokens instead of hardcoding values.
// See DESIGN.md for the semantic contract behind each token.

export const color = {
	bg: {
		canvas: '#0f1117',
		surface: '#1b1f2a',
		subtle: '#242a38',
	},
	role: {
		idle: '#394150',
		active: '#60a5fa',
		resolved: '#34d399',
		conflict: '#f87171',
		ghost: '#4b5563',
		pivot: '#fbbf24',
	},
	pointer: {
		left: '#60a5fa',
		right: '#f87171',
		slow: '#34d399',
		fast: '#c084fc',
		mid: '#fbbf24',
		i: '#c084fc',
	},
	struct: {
		stroke: '#475569',
		focus: '#f8fafc',
		windowFill: 'rgba(251, 191, 36, 0.14)',
		windowStroke: '#fbbf24',
	},
	text: {
		primary: '#f8fafc',
		secondary: '#cbd5e1',
		muted: '#64748b',
	},
	invariant: {
		bg: '#1e293b',
		stroke: '#334155',
		text: '#e2e8f0',
		accent: '#34d399',
	},
	callout: {
		bg: '#fef3c7',
		stroke: '#f59e0b',
		text: '#78350f',
	},
} as const;

export const type = {
	family: {
		sans: "'Inter', 'PingFang SC', 'Hiragino Sans GB', system-ui, sans-serif",
		mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
	},
	size: {
		header: 36,
		invariant: 20,
		value: 30,
		index: 14,
		narration: 26,
		callout: 18,
		label: 16,
	},
	weight: {
		regular: 400,
		medium: 500,
		bold: 700,
	},
} as const;

export const space = {
	cell: 64,
	cellGap: 10,
	sectionGap: 36,
	pagePad: 48,
	bracketHeight: 6,
	bracketThickness: 3,
	stroke: 1.5,
	strokeFocus: 2.5,
} as const;

export const motion = {
	// Duration of the tween between two consecutive steps, in frames (at 30fps).
	tweenFrames: 12,
	// Routine step total length (including tween).
	routineFrames: 48,
	// Peak step total length (including tween).
	peakFrames: 90,
	// Easing names resolved in motion.ts.
	easing: {
		positional: 'easeOutCubic',
		opacity: 'easeInOutQuad',
		color: 'linear',
	},
} as const;

export const z = {
	bg: 0,
	ghost: 5,
	data: 10,
	bracket: 15,
	pointer: 20,
	focus: 25,
	callout: 30,
	overlay: 40,
} as const;

// Layout grid as percentages of the 1280x720 canvas.
// Keep fractions small and human-readable; see Stage.tsx for application.
export const layout = {
	header: 0.08,
	invariant: 0.07,
	primary: 0.5,
	auxiliary: 0.22,
	narration: 0.08,
	// Remaining 5% is distributed as gaps.
} as const;
