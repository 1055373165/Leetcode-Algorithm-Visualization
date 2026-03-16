import React from 'react';
import {LRUVisualizer, LRUStep, LRUNode} from '../components/LRUVisualizer';

const CAPACITY = 3;

// Helper to create nodes
const n = (k: number, v: number): LRUNode => ({key: k, value: v, id: `node-${k}`});

const STEPS: LRUStep[] = [
    {
        nodes: [],
        description: "Init LRU Cache with Capacity = 3.",
        capacity: CAPACITY,
        operation: "new LRUCache(3)"
    },
    // put(1, 1)
    {
        nodes: [n(1, 1)],
        description: "put(1, 1): Cache empty. Add new node to Head.",
        capacity: CAPACITY,
        operation: "put(1, 1)",
        nodeHighlights: [`node-1`],
        mapHighlights: [1]
    },
    // put(2, 2)
    {
        nodes: [n(2, 2), n(1, 1)],
        description: "put(2, 2): Add to Head. Previous Head (1) moves back.",
        capacity: CAPACITY,
        operation: "put(2, 2)",
        nodeHighlights: [`node-2`],
        mapHighlights: [2]
    },
    // put(3, 3)
    {
        nodes: [n(3, 3), n(2, 2), n(1, 1)],
        description: "put(3, 3): Add to Head. Cache is now FULL.",
        capacity: CAPACITY,
        operation: "put(3, 3)",
        nodeHighlights: [`node-3`],
        mapHighlights: [3]
    },
    // get(1) -> returns 1. Move 1 to Head.
    {
        nodes: [n(3, 3), n(2, 2), n(1, 1)], // Before move
        description: "get(1): Key 1 exists (at Tail). Value is 1.",
        capacity: CAPACITY,
        operation: "get(1)",
        nodeHighlights: [`node-1`],
        mapHighlights: [1]
    },
    {
        nodes: [n(1, 1), n(3, 3), n(2, 2)], // After move
        description: "get(1): Move Node 1 to Head (Most Recently Used).",
        capacity: CAPACITY,
        operation: "get(1) -> Moved",
        nodeHighlights: [`node-1`],
        mapHighlights: [1]
    },
    // put(4, 4) -> Evict 2
    {
        nodes: [n(1, 1), n(3, 3), n(2, 2)],
        description: "put(4, 4): Cache Full! Need to evict Tail (Node 2).",
        capacity: CAPACITY,
        operation: "put(4, 4)",
        nodeHighlights: [`node-2`] // Highlight victim
    },
    {
        nodes: [n(4, 4), n(1, 1), n(3, 3)],
        description: "put(4, 4): Removed Node 2. Added Node 4 to Head.",
        capacity: CAPACITY,
        operation: "put(4, 4) -> Evicted 2",
        nodeHighlights: [`node-4`],
        mapHighlights: [4]
    },
    // get(3)
    {
        nodes: [n(3, 3), n(4, 4), n(1, 1)],
        description: "get(3): Key 3 exists. Move to Head.",
        capacity: CAPACITY,
        operation: "get(3)",
        nodeHighlights: [`node-3`],
        mapHighlights: [3]
    },
    {
        nodes: [n(3, 3), n(4, 4), n(1, 1)],
        description: "Finished. Current Order: 3 -> 4 -> 1.",
        capacity: CAPACITY,
        operation: "Done"
    }
];

export const LRUCacheComposition: React.FC = () => {
    return (
        <LRUVisualizer
            steps={STEPS}
            title="LRU Cache: Hash Map + Double List"
        />
    );
};
