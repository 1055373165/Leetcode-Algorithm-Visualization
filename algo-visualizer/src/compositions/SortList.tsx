import React from 'react';
import {SortListVisualizer, SortListStep, ListSegment, ListNode} from '../components/SortListVisualizer';

// Input: 4 -> 2 -> 1 -> 3
 const n4: ListNode = {id: 'n4', val: 4, nextId: 'n2'};
 const n2: ListNode = {id: 'n2', val: 2, nextId: 'n1'};
 const n1: ListNode = {id: 'n1', val: 1, nextId: 'n3'};
 const n3: ListNode = {id: 'n3', val: 3, nextId: null};

 const steps: SortListStep[] = [];
 
 // We need to simulate the recursion state manually for visualizer
 // Stack of segments? 
 // Let's hardcode the key frames of the recursion tree
 
 // Level 0: [4, 2, 1, 3]
 // Level 1: [4, 2]         [1, 3]
 // Level 2: [4]    [2]     [1]    [3]
 // Level 1 Merge: [2, 4]   [1, 3]
 // Level 0 Merge: [1, 2, 3, 4]

 const seg0: ListSegment = {nodes: [n4, n2, n1, n3], depth: 0, offsetX: 0, label: "Root"};
 
 // Init
 steps.push({
     segments: [seg0], activeSegmentId: null, action: 'split',
     description: "Start Sort List: [4, 2, 1, 3]. Split into halves."
 });

 // Split L1
 const seg1_L: ListSegment = {nodes: [n4, n2], depth: 1, offsetX: -200, label: "Left"};
 const seg1_R: ListSegment = {nodes: [n1, n3], depth: 1, offsetX: 200, label: "Right"};
 
 steps.push({
     segments: [seg0, seg1_L, seg1_R], activeSegmentId: null, action: 'split',
     description: "Split into Left [4, 2] and Right [1, 3]."
 });

 // Recurse Left [4, 2] -> Split [4], [2]
 const seg2_LL: ListSegment = {nodes: [n4], depth: 2, offsetX: -300, label: "L-Left"};
 const seg2_LR: ListSegment = {nodes: [n2], depth: 2, offsetX: -100, label: "L-Right"};
 
 steps.push({
     segments: [seg0, seg1_L, seg1_R, seg2_LL, seg2_LR], activeSegmentId: null, action: 'split',
     description: "Recursively split [4, 2] -> [4] and [2]. Base cases reached."
 });
 
 // Merge [4], [2] -> [2, 4]
 const seg1_L_Sorted: ListSegment = {nodes: [n2, n4], depth: 1, offsetX: -200, label: "Left Sorted"};
 
 steps.push({
     segments: [seg0, seg1_L_Sorted, seg1_R, seg2_LL, seg2_LR], activeSegmentId: null, action: 'merge_process',
     description: "Merge [4] and [2] -> [2, 4]. Left half sorted."
 });

 // Recurse Right [1, 3] -> Split [1], [3]
 const seg2_RL: ListSegment = {nodes: [n1], depth: 2, offsetX: 100, label: "R-Left"};
 const seg2_RR: ListSegment = {nodes: [n3], depth: 2, offsetX: 300, label: "R-Right"};

 steps.push({
    segments: [seg0, seg1_L_Sorted, seg1_R, seg2_RL, seg2_RR], activeSegmentId: null, action: 'split',
    description: "Recursively split [1, 3] -> [1] and [3]. Base cases reached."
});

// Merge [1], [3] -> [1, 3]
const seg1_R_Sorted: ListSegment = {nodes: [n1, n3], depth: 1, offsetX: 200, label: "Right Sorted"};

steps.push({
    segments: [seg0, seg1_L_Sorted, seg1_R_Sorted, seg2_RL, seg2_RR], activeSegmentId: null, action: 'merge_process',
    description: "Merge [1] and [3] -> [1, 3]. Right half sorted."
});

// Final Merge [2, 4] and [1, 3] -> [1, 2, 3, 4]
const seg0_Sorted: ListSegment = {nodes: [n1, n2, n3, n4], depth: 0, offsetX: 0, label: "Root Sorted"};

steps.push({
    segments: [seg0_Sorted, seg1_L_Sorted, seg1_R_Sorted], activeSegmentId: null, action: 'finish',
    description: "Final Merge: [2, 4] and [1, 3] -> [1, 2, 3, 4]. Sort Complete."
});

export const SortListComposition: React.FC = () => {
    return (
        <SortListVisualizer
            steps={steps}
            title="148. Sort List: Merge Sort"
        />
    );
};
