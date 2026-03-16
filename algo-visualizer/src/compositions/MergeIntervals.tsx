import React from 'react';
import {MergeIntervalsVisualizer, MergeIntervalsStep, Interval} from '../components/MergeIntervalsVisualizer';

const intervals: Interval[] = [[1, 3], [2, 6], [8, 10], [15, 18]];
// Expected: [[1, 6], [8, 10], [15, 18]]

const steps: MergeIntervalsStep[] = [];
let merged: Interval[] = [];
let currentMerged: Interval | null = null;

// Init
steps.push({
    sortedIntervals: intervals, currentIndex: -1, merged: [...merged], currentMerged,
    action: 'start', description: "Start: Sort intervals by start time. (Example is already sorted)."
});

// Start with first
if (intervals.length > 0) {
    currentMerged = intervals[0];
    steps.push({
        sortedIntervals: intervals, currentIndex: 0, merged: [...merged], currentMerged: [...currentMerged],
        action: 'start', description: `Initialize: Start with first interval [${currentMerged[0]}, ${currentMerged[1]}].`
    });
}

for (let i = 1; i < intervals.length; i++) {
    const nextInterval = intervals[i];
    
    // Check
    steps.push({
        sortedIntervals: intervals, currentIndex: i, merged: [...merged], currentMerged: [...currentMerged!],
        action: 'check', 
        description: `Check next interval [${nextInterval[0]}, ${nextInterval[1]}]. Does it overlap with [${currentMerged![0]}, ${currentMerged![1]}]?`
    });

    if (nextInterval[0] <= currentMerged![1]) {
        // Merge
        currentMerged![1] = Math.max(currentMerged![1], nextInterval[1]);
        steps.push({
            sortedIntervals: intervals, currentIndex: i, merged: [...merged], currentMerged: [...currentMerged!],
            action: 'merge', 
            description: `Overlap! (${nextInterval[0]} <= ${currentMerged![1]}). Merge and extend end to ${currentMerged![1]}.`
        });
    } else {
        // Push and New
        merged.push(currentMerged!);
        let oldMerged = [...currentMerged!];
        currentMerged = nextInterval;
        steps.push({
            sortedIntervals: intervals, currentIndex: i, merged: [...merged], currentMerged: [...currentMerged!],
            action: 'push', 
            description: `No overlap. Add [${oldMerged[0]}, ${oldMerged[1]}] to result. Start new merged interval [${currentMerged[0]}, ${currentMerged[1]}].`
        });
    }
}

// Final push
if (currentMerged) {
    merged.push(currentMerged);
    steps.push({
        sortedIntervals: intervals, currentIndex: intervals.length, merged: [...merged], currentMerged: null, // clear active to show it moved
        action: 'finish', 
        description: `End of list. Add final interval [${currentMerged[0]}, ${currentMerged[1]}] to result.`
    });
}

export const MergeIntervalsComposition: React.FC = () => {
    return (
        <MergeIntervalsVisualizer
            steps={steps}
            title="56. Merge Intervals: Sorting + Linear Scan"
        />
    );
};
