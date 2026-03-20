import React from 'react';
import {ZigzagLevelOrderVisualizer, ZigzagStep, TreeNodeInfo} from '../components/ZigzagLevelOrderVisualizer';

// Tree definition
interface TNode {
    val: number;
    left: TNode | null;
    right: TNode | null;
}

// Build tree: [3, 9, 20, null, null, 15, 7]
const buildTree = (): TNode => ({
    val: 3,
    left: {val: 9, left: null, right: null},
    right: {
        val: 20,
        left: {val: 15, left: null, right: null},
        right: {val: 7, left: null, right: null},
    },
});

// Pre-compute tree node positions for visualization
const computeTreeLayout = (root: TNode): TreeNodeInfo[] => {
    const nodes: TreeNodeInfo[] = [];
    const centerX = 350;
    const startY = 40;
    const levelHeight = 70;

    const traverse = (node: TNode | null, x: number, y: number, spread: number, parentX?: number, parentY?: number) => {
        if (!node) return;
        nodes.push({
            val: node.val,
            x, y,
            parentX, parentY,
            visited: false,
            currentLayer: false,
        });
        traverse(node.left, x - spread, y + levelHeight, spread / 2, x, y);
        traverse(node.right, x + spread, y + levelHeight, spread / 2, x, y);
    };

    traverse(root, centerX, startY, 140);
    return nodes;
};

const root = buildTree();
const baseTreeNodes = computeTreeLayout(root);

// Generate steps by simulating BFS zigzag
const steps: ZigzagStep[] = [];
const ans: number[][] = [];

// Helper: create tree nodes snapshot with visited/current layer info
const makeTreeSnapshot = (
    visitedVals: Set<number>,
    currentLayerVals: Set<number>,
    highlightVal: number | null
): TreeNodeInfo[] => {
    return baseTreeNodes.map(n => ({
        ...n,
        visited: visitedVals.has(n.val),
        currentLayer: currentLayerVals.has(n.val),
    }));
};

// BFS simulation
const queue: TNode[] = [root];
let leftToRight = true;
const visitedVals = new Set<number>();
let layer = 0;

// Init step
const initCurrentLayerVals = new Set([root.val]);
steps.push({
    action: 'init',
    layer: 0,
    leftToRight: true,
    nodeVal: null,
    i: 0,
    writeIndex: null,
    queue: [root.val],
    levelArray: [],
    ans: [],
    reason: 'BFS starts: root node 3 enqueued',
    highlightNode: null,
    treeNodes: makeTreeSnapshot(visitedVals, initCurrentLayerVals, null),
});

while (queue.length > 0) {
    const size = queue.length;
    const levelArray: (number | null)[] = new Array(size).fill(null);
    const currentLayerVals = new Set<number>(queue.map(n => n.val));

    for (let i = 0; i < size; i++) {
        const node = queue.shift()!;
        const writeIndex = leftToRight ? i : size - 1 - i;

        // Dequeue step
        steps.push({
            action: 'dequeue',
            layer,
            leftToRight,
            nodeVal: node.val,
            i,
            writeIndex: null,
            queue: queue.map(n => n.val),
            levelArray: [...levelArray],
            ans: [...ans.map(a => [...a])],
            reason: `Dequeue node ${node.val} (i=${i} in layer ${layer})`,
            highlightNode: node.val,
            treeNodes: makeTreeSnapshot(visitedVals, currentLayerVals, node.val),
        });

        // Write step
        levelArray[writeIndex] = node.val;
        visitedVals.add(node.val);

        const writeExplain = leftToRight
            ? `Write ${node.val} → level[${i}] (left-to-right)`
            : `Write ${node.val} → level[${size}-1-${i}] = level[${writeIndex}] (right-to-left!)`;

        steps.push({
            action: 'write',
            layer,
            leftToRight,
            nodeVal: node.val,
            i,
            writeIndex,
            queue: queue.map(n => n.val),
            levelArray: [...levelArray],
            ans: [...ans.map(a => [...a])],
            reason: writeExplain,
            highlightNode: node.val,
            treeNodes: makeTreeSnapshot(visitedVals, currentLayerVals, node.val),
        });

        // Enqueue children
        const enqueued: number[] = [];
        if (node.left) {
            queue.push(node.left);
            enqueued.push(node.left.val);
        }
        if (node.right) {
            queue.push(node.right);
            enqueued.push(node.right.val);
        }

        if (enqueued.length > 0) {
            steps.push({
                action: 'enqueue',
                layer,
                leftToRight,
                nodeVal: node.val,
                i,
                writeIndex: null,
                queue: queue.map(n => n.val),
                levelArray: [...levelArray],
                ans: [...ans.map(a => [...a])],
                reason: `Enqueue children of ${node.val}: [${enqueued.join(', ')}] (always left then right)`,
                highlightNode: node.val,
                treeNodes: makeTreeSnapshot(visitedVals, currentLayerVals, node.val),
            });
        }
    }

    // Layer done
    const completedLevel = levelArray.map(v => v!);
    ans.push(completedLevel);

    steps.push({
        action: 'layer_done',
        layer,
        leftToRight,
        nodeVal: null,
        i: 0,
        writeIndex: null,
        queue: queue.map(n => n.val),
        levelArray: [...levelArray],
        ans: [...ans.map(a => [...a])],
        reason: `Layer ${layer} complete → [${completedLevel.join(', ')}]. Flip direction!`,
        highlightNode: null,
        treeNodes: makeTreeSnapshot(visitedVals, new Set(), null),
    });

    leftToRight = !leftToRight;
    layer++;
}

// Final step
steps.push({
    action: 'done',
    layer: layer - 1,
    leftToRight,
    nodeVal: null,
    i: 0,
    writeIndex: null,
    queue: [],
    levelArray: [],
    ans: [...ans.map(a => [...a])],
    reason: `Done! Result: [${ans.map(a => `[${a.join(',')}]`).join(', ')}]`,
    highlightNode: null,
    treeNodes: makeTreeSnapshot(visitedVals, new Set(), null),
});

export const ZigzagLevelOrderComposition: React.FC = () => {
    return (
        <ZigzagLevelOrderVisualizer
            steps={steps}
            title="103. Binary Tree Zigzag Level Order Traversal"
        />
    );
};
