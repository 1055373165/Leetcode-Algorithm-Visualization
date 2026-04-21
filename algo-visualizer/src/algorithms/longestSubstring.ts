import type {BaseStep} from '../design/useStep';

// A faithful step-by-step trace of the sliding-window solution to
// 3. Longest Substring Without Repeating Characters. Running this function
// IS the algorithm — the visualizer consumes its output verbatim, so step
// correctness is guaranteed by the code itself, not by hand-authored data.

export interface LongestSubstringStep extends BaseStep {
	/** Current left boundary (inclusive). */
	left: number;
	/** Current right boundary (inclusive). -1 means "nothing inserted yet". */
	right: number;
	/** char → last index seen. Snapshot at this step. */
	lastSeen: Record<string, number>;
	/** The duplicate char that triggered the jump this step (peak only). */
	conflictKey: string | null;
	/** The char just written/updated at this step (empty string on init). */
	freshKey: string;
	/** Current best length seen so far. */
	maxLen: number;
	/** Previous left, so downstream tween can reason about the jump distance. */
	jumpedFromLeft: number | null;
}

export const run = (input: string): LongestSubstringStep[] => {
	const steps: LongestSubstringStep[] = [];
	const lastSeen: Record<string, number> = {};
	let left = 0;
	let maxLen = 0;

	// Initial state. The viewer sees the string grayed out before any move.
	steps.push({
		emphasis: 'routine',
		narration: '初始：L=0, R=空',
		left: 0,
		right: -1,
		lastSeen: {},
		conflictKey: null,
		freshKey: '',
		maxLen: 0,
		jumpedFromLeft: null,
	});

	for (let right = 0; right < input.length; right++) {
		const ch = input[right];
		const previouslyAt = lastSeen[ch];
		const isConflict = previouslyAt !== undefined && previouslyAt >= left;

		if (isConflict) {
			const oldLeft = left;
			left = previouslyAt + 1;
			lastSeen[ch] = right;
			const currLen = right - left + 1;
			if (currLen > maxLen) maxLen = currLen;
			steps.push({
				emphasis: 'peak',
				narration: `'${ch}' 重复，L 跳至 ${left}`,
				left,
				right,
				lastSeen: {...lastSeen},
				conflictKey: ch,
				freshKey: ch,
				maxLen,
				jumpedFromLeft: oldLeft,
			});
		} else {
			lastSeen[ch] = right;
			const currLen = right - left + 1;
			if (currLen > maxLen) maxLen = currLen;
			steps.push({
				emphasis: 'routine',
				narration: `R 纳入 '${ch}'`,
				left,
				right,
				lastSeen: {...lastSeen},
				conflictKey: null,
				freshKey: ch,
				maxLen,
				jumpedFromLeft: null,
			});
		}
	}

	// Final settle frame so the last peak gets enough dwell time.
	const last = steps[steps.length - 1];
	steps.push({
		...last,
		emphasis: 'routine',
		narration: `答案：maxLen = ${maxLen}`,
		conflictKey: null,
		freshKey: '',
		jumpedFromLeft: null,
	});

	return steps;
};

// A pure-function derivation of the semantic state of a cell in a given
// step. Kept alongside `run` to make the step schema self-describing —
// any visualizer / primitive can ask "what color should index i be?".
export type CellRole = 'idle' | 'active' | 'ghost' | 'conflict';

export const cellRole = (
	step: LongestSubstringStep,
	index: number
): CellRole => {
	if (step.right < 0) return 'idle';
	if (step.conflictKey !== null && index === step.right) return 'conflict';
	if (index >= step.left && index <= step.right) return 'active';
	if (index < step.left && index <= step.right + 0) return 'ghost';
	if (index <= step.right) return 'ghost';
	return 'idle';
};
