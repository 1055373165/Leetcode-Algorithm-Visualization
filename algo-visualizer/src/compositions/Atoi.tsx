import React from 'react';
import {AtoiVisualizer, AtoiStep, AtoiState} from '../components/AtoiVisualizer';

const input = " -42";
const INT_MAX = 2147483647;
const INT_MIN = -2147483648;

const steps: AtoiStep[] = [];

// Simulation
let index = 0;
let sign: 1 | -1 | null = 1;
let result = 0;
let state: AtoiState = 'Start';

// Step 0
steps.push({
    input, currentIndex: index, state, sign: null, result,
    description: "Start parsing. State: Start. Looking for non-whitespace."
});

while (index < input.length) {
    const char = input[index];
    
    if (state === 'Start') {
        if (char === ' ') {
            steps.push({
                input, currentIndex: index, state, sign: null, result,
                description: "Whitespace found. Skipping."
            });
            index++;
        } else if (char === '-' || char === '+') {
            state = 'Signed';
            sign = char === '-' ? -1 : 1;
            steps.push({
                input, currentIndex: index, state, sign, result,
                description: `Sign '${char}' detected. State -> Signed. Sign set to ${sign}.`
            });
            index++;
        } else if (char >= '0' && char <= '9') {
             state = 'Number';
             // Don't advance index, let Number state handle it
             steps.push({
                input, currentIndex: index, state, sign: 1, result,
                description: `Digit '${char}' detected. State -> Number. Default sign +1.`
            });
        } else {
             state = 'End';
             steps.push({
                input, currentIndex: index, state, sign: null, result,
                description: `Invalid char '${char}'. State -> End.`
            });
             break;
        }
    } else if (state === 'Signed') {
        if (char >= '0' && char <= '9') {
            state = 'Number';
            steps.push({
                input, currentIndex: index, state, sign, result,
                description: `Digit '${char}' detected. State -> Number.`
            });
        } else {
            state = 'End';
             steps.push({
                input, currentIndex: index, state, sign, result,
                description: `Non-digit '${char}' after sign. State -> End.`
            });
            break;
        }
    } else if (state === 'Number') {
        if (char >= '0' && char <= '9') {
            const digit = parseInt(char);
            
            // Overflow check could be visualized here, skipping logic complexity for visual clearity
            // assuming no overflow for " -42"
            
            result = result * 10 + digit;
            steps.push({
                input, currentIndex: index, state, sign, result,
                description: `Read digit '${digit}'. Valid. New Result = ${result}.`
            });
            index++;
        } else {
            state = 'End';
            steps.push({
                input, currentIndex: index, state, sign, result,
                description: `Non-digit '${char}' detected. Parsing finished.`
            });
            break;
        }
    }
}

if (state !== 'End') {
     steps.push({
        input, currentIndex: index, state: 'End', sign, result,
        description: "End of input string. Parsing finished."
    });
}


export const AtoiComposition: React.FC = () => {
    return (
        <AtoiVisualizer
            steps={steps}
            title="8. String to Integer (atoi): DFA"
        />
    );
};
