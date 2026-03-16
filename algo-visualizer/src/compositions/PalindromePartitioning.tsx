import React from 'react';
import {PalindromePartitioningVisualizer, PalindromePartitioningStep} from '../components/PalindromePartitioningVisualizer';

const s = "aab";

const steps: PalindromePartitioningStep[] = [];
const solutions: string[][] = [];

// Helper
const isPalindrome = (str: string) => {
    let l = 0, r = str.length - 1;
    while (l < r) {
        if (str[l] !== str[r]) return false;
        l++; r--;
    }
    return true;
};

// Backtracking simulation
const backtrack = (start: number, path: string[]) => {
    // Current state check
    const remaining = s.substring(start);
    
    if (start === s.length) {
        solutions.push([...path]);
        steps.push({
            path: [...path], remaining: "", checking: "", isValid: null, foundSolutions: JSON.parse(JSON.stringify(solutions)),
            description: `Reached end of string! Found valid partition: [${path.map(x=>`"${x}"`).join(', ')}].`
        });
        return;
    }

    steps.push({
        path: [...path], remaining, checking: "", isValid: null, foundSolutions: JSON.parse(JSON.stringify(solutions)),
        description: `Recurse: Remaining "${remaining}". Try partitioning.`
    });

    for (let i = start; i < s.length; i++) {
        const sub = s.substring(start, i + 1);
        
        steps.push({
            path: [...path], remaining, checking: sub, isValid: null, foundSolutions: JSON.parse(JSON.stringify(solutions)),
            description: `Check substring "${sub}". Is it palindrome?`
        });

        if (isPalindrome(sub)) {
            steps.push({
                path: [...path], remaining, checking: sub, isValid: true, foundSolutions: JSON.parse(JSON.stringify(solutions)),
                description: `"${sub}" is a palindrome! Add to path and recurse.`
            });
            
            path.push(sub);
            backtrack(i + 1, path);
            path.pop(); // Backtrack
            
            steps.push({
                path: [...path], remaining, checking: "", isValid: null, foundSolutions: JSON.parse(JSON.stringify(solutions)),
                description: `Backtrack from "${sub}". Checking checks next option or returns.`
            });

        } else {
            steps.push({
                path: [...path], remaining, checking: sub, isValid: false, foundSolutions: JSON.parse(JSON.stringify(solutions)),
                description: `"${sub}" is NOT a palindrome. Skip.`
            });
        }
    }
};

// Start
steps.push({
    path: [], remaining: s, checking: "", isValid: null, foundSolutions: [],
    description: `Start DFS on string "${s}".`
});
backtrack(0, []);

steps.push({
    path: [], remaining: "", checking: "", isValid: null, foundSolutions: JSON.parse(JSON.stringify(solutions)),
    description: "DFS Complete. All partitions found."
});

export const PalindromePartitioningComposition: React.FC = () => {
    return (
        <PalindromePartitioningVisualizer
            steps={steps}
            title="131. Palindrome Partitioning: Backtracking"
        />
    );
};
