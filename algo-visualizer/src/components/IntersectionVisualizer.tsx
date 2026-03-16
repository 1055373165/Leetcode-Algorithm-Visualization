import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type ListNode = {
    id: string;
    val: number;
    nextId: string | null;
};

export type IntersectionStep = {
    listA: ListNode[]; // Nodes in List A path
    listB: ListNode[]; // Nodes in List B path
    pA: string | null; // ID of node pA is pointing to
    pB: string | null; // ID of node pB is pointing to
    description: string;
    highlightIntersection: boolean; // Whether to highlight the intersection node
};

interface IntersectionVisualizerProps {
    steps: IntersectionStep[];
    title: string;
}

export const IntersectionVisualizer: React.FC<IntersectionVisualizerProps> = ({
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

    // Helper to find node by ID to get its value/position logic
    // Simplified rendering: Render List A on top row, List B on bottom row.
    // The "merged" part will be visually represented by converging lines or shared nodes.
    // For simplicity in visualizer, we can just render the logical nodes in varying positions.
    // Let's assume the passed steps have nodes with fixed positions or we calculate them.
    
    // Actually, distinct visual rendering is better.
    // List A: a1 -> a2 -> c1 -> c2 -> c3
    // List B: b1 -> b2 -> b3 -> c1 -> c2 -> c3
    // We can render "Shared" nodes (c1, c2, c3) in a middle row? Or just standard Y shape.
    
    // To keep it generic, let's just use the `step.listA` and `step.listB` which might contain duplicated objects for the shared part 
    // BUT checking IDs to see if they are the same instance.
    
    // Combining lists for rendering unique nodes.
    const allNodesMap = new Map<string, ListNode>();
    step.listA.forEach(n => allNodesMap.set(n.id, n));
    step.listB.forEach(n => allNodesMap.set(n.id, n));
    const allNodes = Array.from(allNodesMap.values());

    return (
        <AbsoluteFill className="bg-gray-900 text-white p-10 flex flex-col items-center" style={{backgroundColor: '#1e1e1e', color: 'white', fontFamily: 'sans-serif'}}>
            {/* Header */}
            <h1 style={{fontSize: 40, marginBottom: 20, textAlign: 'center'}}>{title}</h1>
            
            <div style={{
                flex: 1,
                width: '100%',
                position: 'relative',
                marginTop: 40
            }}>
               {/* Rendering Nodes manually based on ID to simulate Y shape for the example */}
               {/* A Path: top-left -> middle */}
               {/* B Path: bottom-left -> middle */}
               {/* C Path (Shared): middle -> right */}
               
               {/* We'll hardcode positions for the specific example logic here for visual clarity */}
               {/* A: a1, a2. B: b1, b2, b3. C: c1, c2, c3 */}
               
               {allNodes.map((node) => {
                   let top = 300;
                   let left = 100;
                   
                   // Manual positioning logic based on node ID prefix
                   if (node.id.startsWith('a')) {
                       top = 200;
                       left = 100 + (parseInt(node.id.slice(1)) * 120);
                   } else if (node.id.startsWith('b')) {
                       top = 400;
                       left = 100 + (parseInt(node.id.slice(1)) * 120);
                   } else if (node.id.startsWith('c')) {
                       top = 300;
                       left = 500 + (parseInt(node.id.slice(1)) * 120);
                   }
                   
                   const isPA = step.pA === node.id;
                   const isPB = step.pB === node.id;
                   const isIntersection = step.highlightIntersection && node.id === 'c1';

                   return (
                       <div key={node.id} style={{
                           position: 'absolute',
                           top, left,
                           width: 80, height: 80,
                           borderRadius: '50%',
                           backgroundColor: isIntersection ? '#ffeb3b' : '#333',
                           border: `3px solid ${isIntersection ? '#fbc02d' : '#white'}`, // white border
                           display: 'flex', alignItems: 'center', justifyContent: 'center',
                           color: isIntersection ? '#000' : '#fff',
                           fontSize: 24, fontWeight: 'bold',
                           zIndex: 10,
                           borderColor: '#fff'
                       }}>
                           {node.val}
                           
                           {/* Pointers */}
                           {isPA && (
                               <div style={{position: 'absolute', top: -50, color: '#2196f3', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                                   <div style={{fontSize: 20, fontWeight:'bold'}}>pA</div>
                                   <div>▼</div>
                               </div>
                           )}
                           {isPB && (
                               <div style={{position: 'absolute', bottom: -50, color: '#4caf50', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                                   <div>▲</div>
                                   <div style={{fontSize: 20, fontWeight:'bold'}}>pB</div>
                               </div>
                           )}
                           
                           {/* Arrows (simplified) */}
                           {node.nextId && (
                               <div style={{
                                   position: 'absolute',
                                   right: -40,
                                   top: '40%',
                                   color: '#edeff1', // gray arrow
                                   fontSize: 24
                               }}>
                                   →
                               </div>
                           )}
                       </div>
                   );
               })}
            </div>

            {/* Info Panel */}
            <div style={{
                display: 'flex', 
                gap: 60, 
                backgroundColor: '#333', 
                padding: '20px 40px', 
                borderRadius: 15,
                border: '1px solid #555',
                marginBottom: 20
            }}>
                <div style={{textAlign: 'center'}}>
                    <div style={{color: '#aaa', fontSize: 20}}>pA Node</div>
                    <div style={{fontSize: 36, fontWeight: 'bold', color: '#2196f3'}}>{step.pA || 'null'}</div>
                </div>
                <div style={{textAlign: 'center'}}>
                    <div style={{color: '#aaa', fontSize: 20}}>pB Node</div>
                    <div style={{fontSize: 36, fontWeight: 'bold', color: '#4caf50'}}>{step.pB || 'null'}</div>
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
                fontSize: 28,
                color: '#fff',
                border: '1px solid #555'
            }}>
                {step.description}
            </div>
        </AbsoluteFill>
    );
};
