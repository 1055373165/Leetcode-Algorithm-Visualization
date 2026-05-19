import React from 'react';
import {
    MedianOfTwoSortedArraysVisualizer,
    MedianStep,
} from '../components/MedianOfTwoSortedArraysVisualizer';

// Demo input. The pivotal example: 1 iteration fails (l2 > r1),
// 2nd iteration succeeds with r1 = +∞ (sentinel at boundary).
// merged = [1,2,3,4,5] -> median = 3.
const nums1Init = [1, 3];
const nums2Init = [2, 4, 5];

// Ensure binary search runs on the shorter array.
let nums1 = nums1Init;
let nums2 = nums2Init;
let swapped = false;
if (nums1.length > nums2.length) {
    [nums1, nums2] = [nums2, nums1];
    swapped = true;
}
const m = nums1.length;
const n = nums2.length;
const halfLeft = Math.floor((m + n + 1) / 2);

const steps: MedianStep[] = [];

const emptyEdges = {
    l1: null as number | null,
    r1: null as number | null,
    l2: null as number | null,
    r2: null as number | null,
    l1LeR2: null as boolean | null,
    l2LeR1: null as boolean | null,
};

// Step 0: init
steps.push({
    nums1,
    nums2,
    halfLeft,
    lo: 0,
    hi: m,
    i1: -1,
    i2: -1,
    ...emptyEdges,
    status: 'init',
    median: null,
    reason: swapped
        ? `Swap so nums1 is the shorter array (m=${m}, n=${n}). Then halfLeft = (m+n+1)/2 = ${halfLeft}.`
        : `nums1 is already the shorter array (m=${m}, n=${n}). halfLeft = (m+n+1)/2 = ${halfLeft}.`,
});

let lo = 0;
let hi = m;
let found = false;
let median: number | null = null;

while (lo <= hi) {
    const i1 = Math.floor((lo + hi) / 2);
    const i2 = halfLeft - i1;

    // Step: pick i1, i2
    steps.push({
        nums1,
        nums2,
        halfLeft,
        lo,
        hi,
        i1,
        i2,
        ...emptyEdges,
        status: 'pick',
        median: null,
        reason: `Pick i1 = ⌊(lo+hi)/2⌋ = ${i1}. Then i2 = halfLeft − i1 = ${halfLeft} − ${i1} = ${i2}. Two cuts collapse to one.`,
    });

    const l1: number | null = i1 > 0 ? nums1[i1 - 1] : null;
    const r1: number | null = i1 < m ? nums1[i1] : null;
    const l2: number | null = i2 > 0 ? nums2[i2 - 1] : null;
    const r2: number | null = i2 < n ? nums2[i2] : null;

    // For comparison, treat null sentinels as ±∞.
    const l1V = l1 === null ? -Infinity : l1;
    const r1V = r1 === null ? Infinity : r1;
    const l2V = l2 === null ? -Infinity : l2;
    const r2V = r2 === null ? Infinity : r2;

    const c1 = l1V <= r2V;
    const c2 = l2V <= r1V;

    // Step: show edges, evaluate checks
    steps.push({
        nums1,
        nums2,
        halfLeft,
        lo,
        hi,
        i1,
        i2,
        l1,
        r1,
        l2,
        r2,
        l1LeR2: c1,
        l2LeR1: c2,
        status: 'check',
        median: null,
        reason:
            c1 && c2
                ? `Both cross-checks pass: left-max ≤ right-min. Cut is valid.`
                : !c1
                    ? `l1 (${l1 === null ? '−∞' : l1}) > r2 (${r2 === null ? '+∞' : r2}). i1 too large → shrink hi.`
                    : `l2 (${l2 === null ? '−∞' : l2}) > r1 (${r1 === null ? '+∞' : r1}). i1 too small → shrink lo.`,
    });

    if (c1 && c2) {
        if ((m + n) % 2 === 1) {
            median = Math.max(l1V, l2V);
        } else {
            median = (Math.max(l1V, l2V) + Math.min(r1V, r2V)) / 2;
        }
        steps.push({
            nums1,
            nums2,
            halfLeft,
            lo,
            hi,
            i1,
            i2,
            l1,
            r1,
            l2,
            r2,
            l1LeR2: c1,
            l2LeR1: c2,
            status: 'found',
            median,
            reason:
                (m + n) % 2 === 1
                    ? `m+n = ${m + n} is odd → median = max(l1, l2) = ${median}.`
                    : `m+n = ${m + n} is even → median = (max(l1,l2) + min(r1,r2)) / 2 = ${median}.`,
        });
        found = true;
        break;
    }

    if (!c1) {
        // i1 too large
        const newHi = i1 - 1;
        steps.push({
            nums1,
            nums2,
            halfLeft,
            lo,
            hi: newHi,
            i1,
            i2,
            l1,
            r1,
            l2,
            r2,
            l1LeR2: c1,
            l2LeR1: c2,
            status: 'shrink-left',
            median: null,
            reason: `Shrink: hi = i1 − 1 = ${newHi}. Search continues in [${lo}, ${newHi}].`,
        });
        hi = newHi;
    } else {
        // i1 too small
        const newLo = i1 + 1;
        steps.push({
            nums1,
            nums2,
            halfLeft,
            lo: newLo,
            hi,
            i1,
            i2,
            l1,
            r1,
            l2,
            r2,
            l1LeR2: c1,
            l2LeR1: c2,
            status: 'shrink-right',
            median: null,
            reason: `Shrink: lo = i1 + 1 = ${newLo}. Search continues in [${newLo}, ${hi}].`,
        });
        lo = newLo;
    }
}

if (!found) {
    // Unreachable in well-formed inputs; keep a fallback step for safety.
    steps.push({
        nums1,
        nums2,
        halfLeft,
        lo,
        hi,
        i1: -1,
        i2: -1,
        ...emptyEdges,
        status: 'init',
        median: null,
        reason: 'No valid cut found (should never happen for sorted inputs).',
    });
}

export const stepsCount = steps.length;

export const MedianOfTwoSortedArraysComposition: React.FC = () => {
    return (
        <MedianOfTwoSortedArraysVisualizer
            steps={steps}
            title="4. Median of Two Sorted Arrays — Partition Binary Search"
        />
    );
};
