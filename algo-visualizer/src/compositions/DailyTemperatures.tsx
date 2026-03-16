import React from 'react';
import {DailyTemperaturesVisualizer, DailyTemperaturesStep} from '../components/DailyTemperaturesVisualizer';

const data = [73, 74, 75, 71, 69, 72, 76, 73];

const steps: DailyTemperaturesStep[] = [];

// Simulation
const temps = [...data];
const result = new Array(temps.length).fill(0);
const stack: number[] = []; // Stores indices

steps.push({
    temps: [...temps],
    result: [...result],
    stack: [...stack],
    currentIndex: 0,
    compareIndex: null,
    action: 'next',
    description: "Start: Initialize empty stack and result array."
});

for (let i = 0; i < temps.length; i++) {
    const currentTemp = temps[i];

    steps.push({
        temps: [...temps],
        result: [...result],
        stack: [...stack],
        currentIndex: i,
        compareIndex: null,
        action: 'next',
        description: `Day ${i}: Current temp is ${currentTemp}°. comparing with stack top ` + (stack.length > 0 ? `(${temps[stack[stack.length-1]]}°)` : "(empty).")
    });

    while (stack.length > 0 && temps[stack[stack.length - 1]] < currentTemp) {
        const topIndex = stack[stack.length - 1];
        
        steps.push({
            temps: [...temps],
            result: [...result],
            stack: [...stack],
            currentIndex: i,
            compareIndex: topIndex,
            action: 'pop',
            description: `Warmer Day Found! ${currentTemp}° > ${temps[topIndex]}° (from idx ${topIndex}). Pop from stack.`
        });

        stack.pop();
        result[topIndex] = i - topIndex;

        steps.push({
            temps: [...temps],
            result: [...result], // Updated result
            stack: [...stack],
            currentIndex: i,
            compareIndex: null,
            action: 'pop',
            description: `Calculate days: ${i} - ${topIndex} = ${i - topIndex}. Update result for index ${topIndex}.`
        });
    }

    stack.push(i);
    steps.push({
        temps: [...temps],
        result: [...result],
        stack: [...stack],
        currentIndex: i,
        compareIndex: null,
        action: 'push',
        description: `Push current index ${i} (${currentTemp}°) to stack. Wait for a warmer day.`
    });
}

steps.push({
    temps: [...temps],
    result: [...result],
    stack: [...stack],
    currentIndex: temps.length - 1,
    compareIndex: null,
    action: 'next',
    description: "Done! Indices remaining in stack have no warmer future day (result 0)."
});

export const DailyTemperaturesComposition: React.FC = () => {
    return (
        <DailyTemperaturesVisualizer
            steps={steps}
        />
    );
};
