import {useCurrentFrame, useVideoConfig} from 'remotion';
import {motion as motionTokens} from './tokens';
import {resolveStepTiming} from './motion';

export type Emphasis = 'routine' | 'peak';

export interface BaseStep {
	emphasis: Emphasis;
	narration: string;
}

export interface StepView<S extends BaseStep> {
	// The step we are transitioning *from* (previous step, or current at frame 0).
	prev: S;
	// The step we are transitioning *to* (the "current" logical step).
	curr: S;
	// Progress of the tween between prev and curr, in [0, 1].
	// Becomes 1 once the tween region is over.
	progress: number;
	// True if we are past the tween region of this step.
	settled: boolean;
	// Index of the current step in the input array.
	index: number;
	// True if this is a peak step (drives timing + callout visibility).
	peak: boolean;
}

const stepFrames = (emphasis: Emphasis): number =>
	emphasis === 'peak' ? motionTokens.peakFrames : motionTokens.routineFrames;

export const totalFrames = (steps: readonly BaseStep[]): number => {
	return steps.reduce((acc, s) => acc + stepFrames(s.emphasis), 0);
};

// Read the current frame and resolve which step we are in, plus the
// (prev, curr, progress) triple needed for interpolation.
// See DESIGN.md §Motion for the tween contract.
export const useStep = <S extends BaseStep>(steps: readonly S[]): StepView<S> => {
	const frame = useCurrentFrame();
	const {fps: _fps} = useVideoConfig();
	const durations = steps.map((s) => stepFrames(s.emphasis));

	const timing = resolveStepTiming(durations, motionTokens.tweenFrames, frame);

	const curr = steps[timing.stepIndex];
	const prev = timing.stepIndex === 0 ? curr : steps[timing.stepIndex - 1];

	return {
		prev,
		curr,
		progress: timing.progress,
		settled: timing.settled,
		index: timing.stepIndex,
		peak: curr.emphasis === 'peak',
	};
};
