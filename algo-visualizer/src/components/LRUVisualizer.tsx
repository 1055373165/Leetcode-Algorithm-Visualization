import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type LRUNode = {
    key: number;
    value: number;
    id: string; // Unique ID for visualization stability
};

export type LRUStep = {
    nodes: LRUNode[]; // Ordered list from Head to Tail
    mapHighlights?: number[]; // Keys to highlight in Map
    nodeHighlights?: string[]; // Node IDs to highlight in List
    description: string;
    capacity: number;
    operation?: string; // e.g., "get(1)", "put(2, 2)"
};

interface LRUVisualizerProps {
    steps: LRUStep[];
    title: string;
}

export const LRUVisualizer: React.FC<LRUVisualizerProps> = ({
    steps,
    title
}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();

    const durationPerStep = 2 * fps; // Slower for complex ops
    const currentStepIndex = Math.min(
        Math.floor(frame / durationPerStep),
        steps.length - 1
    );
    const step = steps[currentStepIndex];

    return (
        <AbsoluteFill className="bg-gray-900 text-white p-10 flex flex-col items-center" style={{backgroundColor: '#1e1e1e', color: 'white', fontFamily: 'sans-serif'}}>
            <h1 style={{fontSize: 40, marginBottom: 20}}>{title}</h1>
            
            {/* Operation Display */}
            <div style={{
                fontSize: 32, 
                color: '#ffeb3b', 
                marginBottom: 30,
                backgroundColor: '#333',
                padding: '10px 20px',
                borderRadius: 8
            }}>
                Op: {step.operation || "Init"}
            </div>

            <div style={{
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '100%', 
                gap: 40,
                flex: 1
            }}>
                {/* Map View (Logical) */}
                <div style={{
                    display: 'flex', 
                    gap: 10, 
                    border: '1px dashed #555', 
                    padding: 20, 
                    borderRadius: 10,
                    width: '80%',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <div style={{width: '100%', textAlign: 'center', color: '#aaa', marginBottom: 10}}>HashMap (Key - Node Pointer)</div>
                    {step.nodes.map((node) => {
                         const isHighlighted = step.mapHighlights?.includes(node.key);
                         return (
                            <div key={node.id} style={{
                                padding: '5px 10px',
                                border: `2px solid ${isHighlighted ? '#4caf50' : '#777'}`,
                                borderRadius: 4,
                                backgroundColor: isHighlighted ? 'rgba(76, 175, 80, 0.2)' : 'transparent',
                                color: isHighlighted ? '#a5d6a7' : '#ccc',
                                fontSize: 18
                            }}>
                                {node.key} ➔ Node({node.key}, {node.value})
                            </div>
                         );
                    })}
                    {step.nodes.length === 0 && <div style={{color: '#555'}}>Empty</div>}
                </div>

                {/* List View (Physical) */}
                <div style={{width: '100%', textAlign: 'center', color: '#aaa'}}>Doubly Linked List (Head ⇄ Tail)</div>
                <div style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: 0, // Gap handled by arrows
                }}>
                    {/* Head Marker */}
                    <div style={{color: '#e91e63', fontWeight: 'bold', marginRight: 10}}>HEAD</div>
                    <div style={{fontSize: 24, color: '#555'}}>⇄</div>

                    {step.nodes.map((node, i) => {
                        const isHighlighted = step.nodeHighlights?.includes(node.id);
                        return (
                            <React.Fragment key={node.id}>
                                <div style={{
                                    width: 100,
                                    height: 100,
                                    border: `3px solid ${isHighlighted ? '#2196f3' : '#fff'}`,
                                    backgroundColor: isHighlighted ? 'rgba(33, 150, 243, 0.3)' : '#333',
                                    borderRadius: 10,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 10px',
                                    position: 'relative',
                                    boxShadow: isHighlighted ? '0 0 15px rgba(33, 150, 243, 0.5)' : 'none'
                                }}>
                                    <div style={{fontSize: 14, color: '#aaa'}}>Key: <span style={{color: '#fff', fontSize: 20}}>{node.key}</span></div>
                                    <div style={{fontSize: 14, color: '#aaa'}}>Val: <span style={{color: '#fff', fontSize: 20}}>{node.value}</span></div>
                                </div>
                                
                                {/* Arrow */}
                                {i < step.nodes.length && <div style={{fontSize: 24, color: '#555'}}>⇄</div>}
                            </React.Fragment>
                        );
                    })}
                     
                     {/* Tail Marker */}
                     {step.nodes.length > 0 && <div style={{color: '#e91e63', fontWeight: 'bold', marginLeft: 10}}>TAIL</div>}
                     {step.nodes.length === 0 && <div style={{color: '#555'}}>(Empty)</div>}
                </div>
            </div>

            {/* Info Panel */}
            <div style={{
                marginTop: 40, 
                backgroundColor: '#333', 
                padding: 20, 
                borderRadius: 10, 
                width: '80%', 
                textAlign: 'center'
            }}>
                <div style={{fontSize: 24, color: '#fff'}}>
                    {step.description}
                </div>
            </div>

        </AbsoluteFill>
    );
};
