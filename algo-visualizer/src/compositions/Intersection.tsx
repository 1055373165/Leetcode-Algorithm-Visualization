import React from 'react';
import {IntersectionVisualizer, IntersectionStep, ListNode} from '../components/IntersectionVisualizer';

// List A: a1(4) -> a2(1) -> c1(8) -> c2(4) -> c3(5)
// List B: b1(5) -> b2(6) -> b3(1) -> c1(8) -> c2(4) -> c3(5)

const c3: ListNode = {id: 'c3', val: 5, nextId: null};
const c2: ListNode = {id: 'c2', val: 4, nextId: 'c3'};
const c1: ListNode = {id: 'c1', val: 8, nextId: 'c2'};

const a2: ListNode = {id: 'a2', val: 1, nextId: 'c1'};
const a1: ListNode = {id: 'a1', val: 4, nextId: 'a2'};

const b3: ListNode = {id: 'b3', val: 1, nextId: 'c1'};
const b2: ListNode = {id: 'b2', val: 6, nextId: 'b3'};
const b1: ListNode = {id: 'b1', val: 5, nextId: 'b2'};

const listA = [a1, a2, c1, c2, c3];
const listB = [b1, b2, b3, c1, c2, c3];

// Helper to simulate
const steps: IntersectionStep[] = [];

// Simulation Logic
let currA: ListNode | null = a1;
let currB: ListNode | null = b1;
let hasSwitchedA = false;
let hasSwitchedB = false;

// Step 0: Init
steps.push({
    listA, listB, pA: currA?.id || null, pB: currB?.id || null,
    description: "Start: pA at headA, pB at headB.",
    highlightIntersection: false
});

// Run simulation loop limited to prevent infinite
for (let i = 0; i < 20; i++) {
    const pAId = currA ? currA.id : 'null';
    const pBId = currB ? currB.id : 'null';
    
    // Check match
    if (currA === currB && currA !== null) {
        steps.push({
            listA, listB, pA: pAId, pB: pBId,
            description: `Match found! Intersection at node with value ${currA.val}.`,
            highlightIntersection: true
        });
        break;
    }

    // Move
    const nextA = currA ? (currA.nextId ? (listA.find(n => n.id === currA!.nextId) || listB.find(n => n.id === currA!.nextId) || null) : null) : null; 
    // Logic error in looking up next node if lists are mixed in `listA/B` arrays above? 
    // Actually nextId points to ID. We can find by ID.
    const findNode = (id: string | null) => listA.find(n => n.id === id) || listB.find(n => n.id === id) || null;
    
    let nextANode = currA ? findNode(currA.nextId) : null;
    let nextBNode = currB ? findNode(currB.nextId) : null;

    let desc = `pA: ${currA?.val ?? 'null'}, pB: ${currB?.val ?? 'null'}. `;

    // Prepare NEXT state logic
    // If currA is null, switch to headB
    // If currB is null, switch to headA
    
    // BUT we visualize "Move to next".
    // So the current step shows WHERE WE ARE.
    
    // Logic to update for NEXT frame/iteration
    if (currA === null && !hasSwitchedA) {
        currA = b1;
        hasSwitchedA = true;
        desc += "pA reached end, switching to headB.";
    } else if (currA === null && hasSwitchedA) {
        // End of second traversal
        break; 
    } else {
        currA = nextANode;
    }

    if (currB === null && !hasSwitchedB) {
        currB = a1;
        hasSwitchedB = true;
        desc += "pB reached end, switching to headA.";
    } else if (currB === null && hasSwitchedB) {
         break;
    } else {
        currB = nextBNode;
    }
    
    // Push step for the *result* of the move? Or push step *before* move?
    // Let's push step reflecting the state *after* the move decides where to go.
    // Wait, the loop started with pushing Step 0 (initial).
    
    steps.push({
        listA, listB, pA: currA?.id || null, pB: currB?.id || null,
        description: desc || "Moving pointers forward.",
        highlightIntersection: false
    });
} 

export const IntersectionComposition: React.FC = () => {
    return (
        <IntersectionVisualizer
            steps={steps}
            title="160. Intersection of Linked Lists: Two Pointers"
        />
    );
};
