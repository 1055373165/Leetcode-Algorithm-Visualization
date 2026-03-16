import React from 'react';
import {FindDuplicateVisualizer, FindDuplicateStep} from '../components/FindDuplicateVisualizer';

const nums = [1, 2, 3, 4, 2];
const steps: FindDuplicateStep[] = [];

// Floyd's Algo
let slow = 0;
let fast = 0;

// Phase 1
steps.push({
    nums, slow, fast, phase: 'phase1',
    description: "Phase 1: Start at index 0. Slow moves 1 step, Fast moves 2 steps."
});

// Do one step first before loop check to simulate do-while or initial move
let safety = 0;
while (safety < 100) {
    safety++;
    slow = nums[slow];
    fast = nums[nums[fast]];
    
    steps.push({
        nums, slow, fast, phase: 'phase1',
        description: `Move: Slow -> ${slow}, Fast -> ${fast}. Checking match...`
    });

    if (slow === fast) {
        steps.push({
            nums, slow, fast, phase: 'phase1',
            description: `Intersection found at index ${slow}! End of Phase 1.`
        });
        break;
    }
}

// Phase 2
fast = 0; // Reset fast to head, move as slow pointer
steps.push({
    nums, slow, fast, phase: 'phase2',
    description: "Phase 2: Reset Fast to 0 (Start). Both move 1 step at a time."
});

safety = 0;
while (slow !== fast && safety < 100) {
    safety++;
    slow = nums[slow];
    fast = nums[fast];
    
    steps.push({
        nums, slow, fast, phase: 'phase2',
        description: `Move: Slow -> ${slow}, Slow2 -> ${fast} (Fast treated as Slow2). Checking match...`
    });
}

steps.push({
    nums, slow, fast, phase: 'found',
    description: `Match found at index ${slow}! This is the duplicate number.`
});


export const FindDuplicateComposition: React.FC = () => {
    return (
        <FindDuplicateVisualizer
            steps={steps}
            title="287. Find the Duplicate Number"
        />
    );
};
