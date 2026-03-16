import React from 'react';
import {GroupAnagramsVisualizer, BucketStep} from '../components/GroupAnagramsVisualizer';

const STRS = ["eat", "tea", "tan", "ate", "nat", "bat"];

// Helper to accumulate buckets for steps
const addToBuckets = (buckets: {[key: string]: string[]}, key: string, val: string) => {
    const newBuckets = {...buckets};
    if (!newBuckets[key]) newBuckets[key] = [];
    newBuckets[key] = [...newBuckets[key], val];
    return newBuckets;
};

const STEPS: BucketStep[] = [
    {
        buckets: {},
        description: "Start: Grouping Anagrams using Sorting Strategy.",
    },
    // 1. eat
    {
        currentIndex: 0,
        currentString: "eat",
        buckets: {},
        description: "Process 'eat'. Sort letters...",
        isProcessing: true
    },
    {
        currentIndex: 0,
        currentString: "eat",
        sortedKey: "aet",
        buckets: {},
        description: "Sorted: 'aet'. This is our Key.",
        isProcessing: false
    },
    {
        currentIndex: 0,
        currentString: "eat",
        sortedKey: "aet",
        buckets: {"aet": ["eat"]}, // Add to bucket
        description: "Add 'eat' to Bucket['aet'].",
        highlightBucket: "aet"
    },

    // 2. tea
    {
        currentIndex: 1,
        currentString: "tea",
        buckets: {"aet": ["eat"]},
        description: "Process 'tea'. Sort letters...",
    },
    {
        currentIndex: 1,
        currentString: "tea",
        sortedKey: "aet",
        buckets: {"aet": ["eat"]},
        description: "Sorted: 'aet'. Key exists!",
    },
    {
        currentIndex: 1,
        currentString: "tea",
        sortedKey: "aet",
        buckets: {"aet": ["eat", "tea"]},
        description: "Add 'tea' to Bucket['aet'].",
        highlightBucket: "aet"
    },

    // 3. tan
    {
        currentIndex: 2,
        currentString: "tan",
        buckets: {"aet": ["eat", "tea"]},
        description: "Process 'tan'. Sort letters...",
    },
    {
        currentIndex: 2,
        currentString: "tan",
        sortedKey: "ant",
        buckets: {"aet": ["eat", "tea"]},
        description: "Sorted: 'ant'. New Key.",
    },
    {
        currentIndex: 2,
        currentString: "tan",
        sortedKey: "ant",
        buckets: {"aet": ["eat", "tea"], "ant": ["tan"]},
        description: "Create Bucket['ant'] and add 'tan'.",
        highlightBucket: "ant"
    },

    // 4. ate
    {
        currentIndex: 3,
        currentString: "ate",
        buckets: {"aet": ["eat", "tea"], "ant": ["tan"]},
        description: "Process 'ate'. Sort...",
    },
    {
        currentIndex: 3,
        currentString: "ate",
        sortedKey: "aet",
        buckets: {"aet": ["eat", "tea", "ate"], "ant": ["tan"]},
        description: "Sorted 'aet'. Add to existing bucket.",
        highlightBucket: "aet"
    },

    // 5. nat
    {
        currentIndex: 4,
        currentString: "nat",
        buckets: {"aet": ["eat", "tea", "ate"], "ant": ["tan"]},
        description: "Process 'nat'. Sort...",
    },
    {
        currentIndex: 4,
        currentString: "nat",
        sortedKey: "ant",
        buckets: {"aet": ["eat", "tea", "ate"], "ant": ["tan", "nat"]},
        description: "Sorted 'ant'. Add to existing bucket.",
        highlightBucket: "ant"
    },

    // 6. bat
    {
        currentIndex: 5,
        currentString: "bat",
        buckets: {"aet": ["eat", "tea", "ate"], "ant": ["tan", "nat"]},
        description: "Process 'bat'. Sort...",
    },
    {
        currentIndex: 5,
        currentString: "bat",
        sortedKey: "abt",
        buckets: {"aet": ["eat", "tea", "ate"], "ant": ["tan", "nat"], "abt": ["bat"]},
        description: "Sorted 'abt'. Create new Bucket.",
        highlightBucket: "abt"
    },

    // Final
    {
        buckets: {"aet": ["eat", "tea", "ate"], "ant": ["tan", "nat"], "abt": ["bat"]},
        description: "Done! All strings grouped by anagrams.",
    }
];

export const GroupAnagramsComposition: React.FC = () => {
    return (
        <GroupAnagramsVisualizer
            strs={STRS}
            steps={STEPS}
            title="Group Anagrams: Sorting Strategy"
        />
    );
};
