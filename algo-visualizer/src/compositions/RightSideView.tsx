import React from 'react';
import {RightSideViewVisualizer, RightSideViewStep, RSVTreeNode} from '../components/RightSideViewVisualizer';

// Tree:       1
//            / \
//           2   3
//          / \   \
//         4   5   7

type TreeNode = {
    val: number;
    left: TreeNode | null;
    right: TreeNode | null;
};

const tree: TreeNode = {
    val: 1,
    left: {
        val: 2,
        left: {val: 4, left: null, right: null},
        right: {val: 5, left: null, right: null},
    },
    right: {
        val: 3,
        left: null,
        right: {val: 7, left: null, right: null},
    },
};

// Pre-compute tree node positions for visualization
const treePositions: Record<number, {x: number; y: number; px?: number; py?: number}> = {
    1: {x: 250, y: 40},
    2: {x: 140, y: 120, px: 250, py: 40},
    3: {x: 360, y: 120, px: 250, py: 40},
    4: {x: 80, y: 200, px: 140, py: 120},
    5: {x: 200, y: 200, px: 140, py: 120},
    7: {x: 420, y: 200, px: 360, py: 120},
};

const buildTreeNodes = (
    visited: Set<number>,
    currentLayerNodes: Set<number>,
    rightmostNodes: Set<number>,
): RSVTreeNode[] => {
    return Object.entries(treePositions).map(([valStr, pos]) => {
        const val = parseInt(valStr);
        return {
            val,
            x: pos.x,
            y: pos.y,
            parentX: pos.px,
            parentY: pos.py,
            visited: visited.has(val),
            currentLayer: currentLayerNodes.has(val),
            isRightmost: rightmostNodes.has(val),
        };
    });
};

// Generate steps via BFS
const steps: RightSideViewStep[] = [];
const visited = new Set<number>();
const rightmostNodes = new Set<number>();

// Init step
steps.push({
    action: 'init',
    layer: 0,
    queue: [1],
    processing: null,
    isLast: false,
    layerSize: 0,
    layerIndex: -1,
    result: [],
    reason: 'Start BFS. Enqueue root node 1.',
    treeNodes: buildTreeNodes(visited, new Set(), rightmostNodes),
    highlightNode: null,
});

// BFS
const queue: TreeNode[] = [tree];
let layer = 0;
const result: number[] = [];

while (queue.length > 0) {
    const size = queue.length;
    const currentLayerVals = new Set(queue.map(n => n.val));

    for (let i = 0; i < size; i++) {
        const node = queue.shift()!;
        const isLast = i === size - 1;
        const queueVals = queue.map(n => n.val);

        // Dequeue step
        steps.push({
            action: 'dequeue',
            layer,
            queue: queueVals,
            processing: node.val,
            isLast,
            layerSize: size,
            layerIndex: i,
            result: [...result],
            reason: `Layer ${layer}: dequeue ${node.val} (${i + 1}/${size})`,
            treeNodes: buildTreeNodes(visited, currentLayerVals, rightmostNodes),
            highlightNode: node.val,
        });

        visited.add(node.val);

        if (node.left) queue.push(node.left);
        if (node.right) queue.push(node.right);

        if (isLast) {
            result.push(node.val);
            rightmostNodes.add(node.val);

            steps.push({
                action: 'last_node',
                layer,
                queue: queue.map(n => n.val),
                processing: node.val,
                isLast: true,
                layerSize: size,
                layerIndex: i,
                result: [...result],
                reason: `Layer ${layer}: ${node.val} is the LAST node → right side view! result = [${result}]`,
                treeNodes: buildTreeNodes(visited, currentLayerVals, rightmostNodes),
                highlightNode: node.val,
            });
        }
    }

    // Layer done
    steps.push({
        action: 'layer_done',
        layer,
        queue: queue.map(n => n.val),
        processing: null,
        isLast: false,
        layerSize: size,
        layerIndex: size - 1,
        result: [...result],
        reason: `Layer ${layer} complete. Move to next layer. Queue: [${queue.map(n => n.val)}]`,
        treeNodes: buildTreeNodes(visited, new Set(), rightmostNodes),
        highlightNode: null,
    });

    layer++;
}

// Done
steps.push({
    action: 'done',
    layer: layer - 1,
    queue: [],
    processing: null,
    isLast: false,
    layerSize: 0,
    layerIndex: -1,
    result: [...result],
    reason: `Done! Right side view = [${result}]`,
    treeNodes: buildTreeNodes(visited, new Set(), rightmostNodes),
    highlightNode: null,
});

export const RIGHT_SIDE_VIEW_TOTAL_FRAMES = steps.length * 60; // 2s per step at 30fps

export const RightSideViewComposition: React.FC = () => {
    return (
        <RightSideViewVisualizer
            steps={steps}
            title="199. Binary Tree Right Side View (BFS)"
        />
    );
};
