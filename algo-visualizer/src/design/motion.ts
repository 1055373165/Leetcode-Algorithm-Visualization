// Motion primitives for algorithm visualizers.
// The design contract (see DESIGN.md) demands that adjacent steps be
// interpolated, not snap-cut. These helpers exist to make that easy
// and consistent across every visualizer.

export type Easing = (t: number) => number;

export const easing: Record<string, Easing> = {
	linear: (t) => t,
	easeInQuad: (t) => t * t,
	easeOutQuad: (t) => 1 - (1 - t) * (1 - t),
	easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
	easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
	easeInOutCubic: (t) =>
		t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
	// An elastic-ish pop used for conflict moments. Overshoots slightly.
	easeOutBack: (t) => {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
	},
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const tween = (
	from: number,
	to: number,
	progress: number,
	ease: Easing = easing.easeOutCubic
): number => {
	const t = ease(clamp01(progress));
	return from + (to - from) * t;
};

// Linearly interpolate an integer index (allowing fractional values).
// Callers multiply by cellWidth to obtain a tween-able x coordinate.
export const tweenIndex = (
	fromIdx: number,
	toIdx: number,
	progress: number,
	ease: Easing = easing.easeOutCubic
): number => tween(fromIdx, toIdx, progress, ease);

const hexToRgb = (hex: string): [number, number, number] => {
	const h = hex.replace('#', '');
	const full =
		h.length === 3
			? h
					.split('')
					.map((c) => c + c)
					.join('')
			: h;
	const r = parseInt(full.slice(0, 2), 16);
	const g = parseInt(full.slice(2, 4), 16);
	const b = parseInt(full.slice(4, 6), 16);
	return [r, g, b];
};

const rgbToHex = (r: number, g: number, b: number): string => {
	const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
	return (
		'#' +
		[clamp(r), clamp(g), clamp(b)]
			.map((v) => v.toString(16).padStart(2, '0'))
			.join('')
	);
};

export const tweenColor = (
	fromHex: string,
	toHex: string,
	progress: number,
	ease: Easing = easing.linear
): string => {
	const t = ease(clamp01(progress));
	const [r1, g1, b1] = hexToRgb(fromHex);
	const [r2, g2, b2] = hexToRgb(toHex);
	return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
};

// Given a list of frame-duration pairs, resolve which step the current
// frame falls into and the progress (0..1) within the tween region of it.
// The tween region is the first `tweenFrames` frames of each step; after
// that, the step is "settled" (progress = 1).
export type StepTiming = {
	stepIndex: number;
	progress: number; // 0..1 within the tween region (1 if already settled)
	settled: boolean; // true if we are past the tween region of this step
	framesIntoStep: number;
};

export const resolveStepTiming = (
	durations: number[],
	tweenFrames: number,
	frame: number
): StepTiming => {
	let acc = 0;
	for (let i = 0; i < durations.length; i++) {
		const d = durations[i];
		if (frame < acc + d) {
			const framesIntoStep = frame - acc;
			const progress =
				tweenFrames <= 0 ? 1 : Math.min(1, framesIntoStep / tweenFrames);
			return {
				stepIndex: i,
				progress,
				settled: framesIntoStep >= tweenFrames,
				framesIntoStep,
			};
		}
		acc += d;
	}
	// Past the last step — hold on it.
	return {
		stepIndex: durations.length - 1,
		progress: 1,
		settled: true,
		framesIntoStep: 0,
	};
};
