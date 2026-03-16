import React from 'react';
import {MergeSortedListsVisualizer, MergeSortedListsStep, ListNode} from '../components/MergeSortedListsVisualizer';

// L1: 1 -> 2 -> 4
// L2: 1 -> 3 -> 4

const l1_3: ListNode = {id: 'l1_3', val: 4, nextId: null};
const l1_2: ListNode = {id: 'l1_2', val: 2, nextId: 'l1_3'};
const l1_1: ListNode = {id: 'l1_1', val: 1, nextId: 'l1_2'};

const l2_3: ListNode = {id: 'l2_3', val: 4, nextId: null};
const l2_2: ListNode = {id: 'l2_2', val: 3, nextId: 'l2_3'};
const l2_1: ListNode = {id: 'l2_1', val: 1, nextId: 'l2_2'};

const dummy: ListNode = {id: 'dummy', val: -1, nextId: null};

const steps: MergeSortedListsStep[] = [];

// Simulation State
let list1 = [l1_1, l1_2, l1_3];
let list2 = [l2_1, l2_2, l2_3];
let result = [dummy];

// Init
steps.push({
    list1: [...list1], list2: [...list2], result: [...result], compareNodes: [],
    action: 'finish', description: "Start: Two sorted lists. Result starts with Dummy node."
});

// Loop
while (list1.length > 0 && list2.length > 0) {
    const n1 = list1[0];
    const n2 = list2[0];
    
    // Compare
    steps.push({
        list1: [...list1], list2: [...list2], result: [...result], compareNodes: [n1.id, n2.id],
        action: 'compare', description: `Compare ${n1.val} vs ${n2.val}.`
    });

    if (n1.val <= n2.val) {
        // Take L1
        list1 = list1.slice(1);
        result = [...result, n1];
        steps.push({
            list1: [...list1], list2: [...list2], result: [...result], compareNodes: [],
            action: 'append_l1', description: `${n1.val} <= ${n2.val}. Append node ${n1.val} from L1 to Result.`
        });
    } else {
        // Take L2
        list2 = list2.slice(1);
        result = [...result, n2];
        steps.push({
            list1: [...list1], list2: [...list2], result: [...result], compareNodes: [],
            action: 'append_l2', description: `${n2.val} < ${n1.val}. Append node ${n2.val} from L2 to Result.`
        });
    }
}

// Append remaining
if (list1.length > 0) {
    steps.push({
        list1: [...list1], list2: [...list2], result: [...result], compareNodes: [],
        action: 'finish', description: "L2 is empty. Append remaining L1 nodes to Result."
    });
    result = [...result, ...list1];
    list1 = [];
}
if (list2.length > 0) {
    steps.push({
        list1: [...list1], list2: [...list2], result: [...result], compareNodes: [],
        action: 'finish', description: "L1 is empty. Append remaining L2 nodes to Result."
    });
    result = [...result, ...list2];
    list2 = [];
}

// Final
steps.push({
    list1: [], list2: [], result: [...result], compareNodes: [],
    action: 'finish', description: "Merge complete. Return Result.next."
});


export const MergeSortedListsComposition: React.FC = () => {
    return (
        <MergeSortedListsVisualizer
            steps={steps}
            title="21. Merge Two Sorted Lists: Dummy Node"
        />
    );
};
