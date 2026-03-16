import React, { useMemo } from 'react';
import { MergeSortedArrayVisualizer, MergeStep } from '../components/MergeSortedArrayVisualizer';
import { runMergeSortedArray } from '../algorithms/mergeSortedArray';
import { AlgoTracer } from '../../../algo-visualizer-web/src/sandbox/MetaDSL';

export const MergeSortedArrayComposition: React.FC = () => {
    const steps = useMemo<MergeStep[]>(() => {
        const tracer = new AlgoTracer();
        const traceEvents = runMergeSortedArray(tracer, [1, 2, 3, 0, 0, 0], 3, [2, 5, 6], 3);
        
        return traceEvents.map(t => {
            const nums1 = t.memory['nums1']?.data || [];
            const nums2 = t.memory['nums2']?.data || [];
            const p1 = t.pointers['p1']?.value ?? -1;
            const p2 = t.pointers['p2']?.value ?? -1;
            const p = t.pointers['p']?.value ?? -1;
            
            return {
                nums1,
                nums2,
                p1,
                p2,
                p,
                description: t.semanticBlock || 'Step',
                highlightP1: t.pointers['p1']?.role === 'fast',
                highlightP2: t.pointers['p2']?.role === 'fast',
                highlightP: t.pointers['p']?.role === 'write' && t.semanticBlock?.includes('Place')
            };
        });
    }, []);

    return (
        <MergeSortedArrayVisualizer
            steps={steps}
            title="Merge Sorted Array: Backward Two Pointers (Dynamic Trace)"
        />
    );
};
