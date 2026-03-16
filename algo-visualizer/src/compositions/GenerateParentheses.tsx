import React from 'react';
import {GenerateParenthesesVisualizer, ParenthesisStep} from '../components/GenerateParenthesesVisualizer';

const N = 3;

// Helper to construct steps manually (simulating the recursion)
// N=3 sequence:
// ((( -> ((())) success
// (() -> (()( -> (()()) success
//     -> (()) -> (())( -> (())() success
// () -> ()( -> ()(( -> ) invalid
// ... actually let's hardcode a representative subset or the full path for n=3 (5 solutions)

const STEPS: ParenthesisStep[] = [
    {
        currentString: "", openCount: 0, closeCount: 0, n: N,
        description: "Start DFS. String empty.", status: 'exploring', results: []
    },
    // Branch 1: (
    {
        currentString: "(", openCount: 1, closeCount: 0, n: N,
        description: "Add '('. Open < 3.", status: 'exploring', results: []
    },
    {
        currentString: "((", openCount: 2, closeCount: 0, n: N,
        description: "Add '('. Open < 3.", status: 'exploring', results: []
    },
    {
        currentString: "(((", openCount: 3, closeCount: 0, n: N,
        description: "Add '('. Open reached limit (3). Cannot add more '('", status: 'exploring', results: []
    },
    // Must add )
    {
        currentString: "((()", openCount: 3, closeCount: 1, n: N,
        description: "Add ')'. Close < Open.", status: 'exploring', results: []
    },
    {
        currentString: "((())", openCount: 3, closeCount: 2, n: N,
        description: "Add ')'. Close < Open.", status: 'exploring', results: []
    },
    {
        currentString: "((()))", openCount: 3, closeCount: 3, n: N,
        description: "Add ')'. Length == 6. Found Solution!", status: 'success', results: ["((()))"]
    },
    // Backtrack from ((()))
    {
        currentString: "((())", openCount: 3, closeCount: 2, n: N,
        description: "Backtrack. Pop ')'.", status: 'backtracking', results: ["((()))"]
    },
    // Backtrack from ((())
    // ...
    // Jump to next major branch for visualization brevity (skipping boring backtracks)
    
    // Branch 2: (()
    {
        currentString: "(()", openCount: 2, closeCount: 1, n: N,
        description: "Backtrack to '((', try adding ')'. Now: '(()'", status: 'exploring', results: ["((()))"]
    },
    {
        currentString: "(()(", openCount: 3, closeCount: 1, n: N,
        description: "Add '('. Open < 3.", status: 'exploring', results: ["((()))"]
    },
    {
        currentString: "(()()", openCount: 3, closeCount: 2, n: N,
        description: "Add ')'. Close < Open.", status: 'exploring', results: ["((()))"]
    },
    {
        currentString: "(()())", openCount: 3, closeCount: 3, n: N,
        description: "Add ')'. Found Solution!", status: 'success', results: ["((()))", "(()())"]
    },
    
    // Branch 3: (())
    {
        currentString: "(())", openCount: 2, closeCount: 2, n: N,
        description: "Backtrack... Try '(())'.", status: 'exploring', results: ["((()))", "(()())"]
    },
    {
        currentString: "(())(", openCount: 3, closeCount: 2, n: N,
        description: "Add '('.", status: 'exploring', results: ["((()))", "(()())"]
    },
    {
        currentString: "(())()", openCount: 3, closeCount: 3, n: N,
        description: "Add ')'. Found Solution!", status: 'success', results: ["((()))", "(()())", "(())()"]
    },

    // Branch 4: ()
    {
        currentString: "()", openCount: 1, closeCount: 1, n: N,
        description: "Backtrack to '(', try adding ')'. Now: '()'", status: 'exploring', results: ["((()))", "(()())", "(())()"]
    },
    {
        currentString: "()(", openCount: 2, closeCount: 1, n: N,
        description: "Add '('.", status: 'exploring', results: ["((()))", "(()())", "(())()"]
    },
    {
        currentString: "()((", openCount: 3, closeCount: 1, n: N,
        description: "Add '('.", status: 'exploring', results: ["((()))", "(()())", "(())()"]
    },
    {
        currentString: "()(()", openCount: 3, closeCount: 2, n: N,
        description: "Add ')'.", status: 'exploring', results: ["((()))", "(()())", "(())()"]
    },
    {
        currentString: "()(())", openCount: 3, closeCount: 3, n: N,
        description: "Add ')'. Found Solution!", status: 'success', results: ["((()))", "(()())", "(())()", "()(())"]
    },
    
    // Branch 5: ()()
    {
        currentString: "()()", openCount: 2, closeCount: 2, n: N,
        description: "Backtrack... Try '()()'.", status: 'exploring', results: ["((()))", "(()())", "(())()", "()(())"]
    },
    {
        currentString: "()()(", openCount: 3, closeCount: 2, n: N,
        description: "Add '('.", status: 'exploring', results: ["((()))", "(()())", "(())()", "()(())"]
    },
    {
        currentString: "()()()", openCount: 3, closeCount: 3, n: N,
        description: "Add ')'. Found Solution!", status: 'success', results: ["((()))", "(()())", "(())()", "()(())", "()()()"]
    },
    
    {
        currentString: "", openCount: 0, closeCount: 0, n: N,
        description: "DFS Complete. All 5 solutions found.", status: 'success', results: ["((()))", "(()())", "(())()", "()(())", "()()()"]
    }
];

export const GenerateParenthesesComposition: React.FC = () => {
    return (
        <GenerateParenthesesVisualizer
            steps={STEPS}
            title="Generate Parentheses: Backtracking (DFS)"
        />
    );
};
