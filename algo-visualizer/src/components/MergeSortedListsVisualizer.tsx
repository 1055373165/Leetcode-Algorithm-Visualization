import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type ListNode = {
    id: string;
    val: number;
    nextId: string | null;
};

export type MergeSortedListsStep = {
    list1: ListNode[]; // Remaining nodes in L1
    list2: ListNode[]; // Remaining nodes in L2
    result: ListNode[]; // Nodes in result list (starting with dummy)
    compareNodes: string[]; // IDs of nodes being compared [id1, id2]
    action: 'compare' | 'append_l1' | 'append_l2' | 'finish';
    description: string;
};

interface MergeSortedListsVisualizerProps {
    steps: MergeSortedListsStep[];
    title: string;
}

export const MergeSortedListsVisualizer: React.FC<MergeSortedListsVisualizerProps> = ({
    steps,
    title
}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();

    if (!steps || steps.length === 0) return null;

    const durationPerStep = 2 * fps;
    const currentStepIndex = Math.min(
        Math.floor(frame / durationPerStep),
        steps.length - 1
    );
    const step = steps[currentStepIndex];

    if (!step) return null;

    const renderNode = (node: ListNode, isCompare: boolean, label: string | null) => (
        <div key={node.id} style={{
            width: 80, height: 80,
            borderRadius: '50%',
            backgroundColor: isCompare ? '#ff9800' : '#333',
            border: `3px solid ${isCompare ? '#ffcc80' : '#555'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 24, fontWeight: 'bold',
            position: 'relative',
            marginRight: 40
        }}>
            {node.val}
            {node.nextId && (
                <div style={{position: 'absolute', right: -35, color: '#777'}}>→</div>
            )}
            {label && (
                <div style={{position: 'absolute', top: -30, fontSize: 16, color: '#aaa'}}>{label}</div>
            )}
        </div>
    );

    return (
        <AbsoluteFill className="bg-gray-900 text-white p-10 flex flex-col items-center" style={{backgroundColor: '#1e1e1e', color: 'white', fontFamily: 'sans-serif'}}>
            {/* Header */}
            <h1 style={{fontSize: 40, marginBottom: 20, textAlign: 'center'}}>{title}</h1>
            
            <div style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 50
            }}>
                {/* List 1 Row */}
                <div style={{display: 'flex', alignItems: 'center', height: 100}}>
                    <div style={{width: 100, fontSize: 24, fontWeight: 'bold', color: '#42a5f5'}}>List 1:</div>
                    <div style={{display: 'flex'}}>
                        {step.list1.map((node, idx) => renderNode(node, step.compareNodes.includes(node.id), idx === 0 ? 'head' : null))}
                    </div>
                </div>

                {/* List 2 Row */}
                <div style={{display: 'flex', alignItems: 'center', height: 100}}>
                    <div style={{width: 100, fontSize: 24, fontWeight: 'bold', color: '#66bb6a'}}>List 2:</div>
                    <div style={{display: 'flex'}}>
                        {step.list2.map((node, idx) => renderNode(node, step.compareNodes.includes(node.id), idx === 0 ? 'head' : null))}
                    </div>
                </div>

                {/* Result Row */}
                <div style={{display: 'flex', alignItems: 'center', height: 100, borderTop: '2px dashed #444', paddingTop: 20, width: '100%'}}>
                    <div style={{width: 100, fontSize: 24, fontWeight: 'bold', color: '#ab47bc'}}>Result:</div>
                    <div style={{display: 'flex', overflow: 'hidden'}}>
                        {step.result.map(node => (
                            <div key={node.id} style={{
                                width: 80, height: 80,
                                borderRadius: '50%',
                                backgroundColor: node.val === -1 ? '#555' : '#7b1fa2', // Dummy dark, real purple
                                border: '3px solid #ab47bc',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: 24, fontWeight: 'bold',
                                position: 'relative',
                                marginRight: 40
                            }}>
                                {node.val === -1 ? 'D' : node.val}
                                <div style={{position: 'absolute', right: -35, color: '#777'}}>→</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Description Panel */}
            <div style={{
                marginTop: 20,
                marginBottom: 40,
                backgroundColor: '#333', 
                padding: 20, 
                borderRadius: 10, 
                width: '80%', 
                textAlign: 'center',
                fontSize: 24, // Smaller font for longer text
                color: '#fff',
                border: '1px solid #555'
            }}>
                {step.description}
            </div>
        </AbsoluteFill>
    );
};
