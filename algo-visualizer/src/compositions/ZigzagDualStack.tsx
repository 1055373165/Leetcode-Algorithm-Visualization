import React from 'react';
import {ZigzagDualStackVisualizer, ZigzagDualStackStep, DualStackTreeNode} from '../components/ZigzagDualStackVisualizer';

// Tree definition
interface TNode {
    val: number;
    left: TNode | null;
    right: TNode | null;
}

const root: TNode = {
    val: 3,
    left: {val: 9, left: null, right: null},
    right: {
        val: 20,
        left: {val: 15, left: null, right: null},
        right: {val: 7, left: null, right: null},
    },
};

// Pre-compute tree layout
const baseNodes: DualStackTreeNode[] = [];
const layoutTree = (node: TNode | null, x: number, y: number, spread: number, px?: number, py?: number) => {
    if (!node) return;
    baseNodes.push({val: node.val, x, y, parentX: px, parentY: py, visited: false, inCurr: false, inNext: false});
    layoutTree(node.left, x - spread, y + 70, spread / 2, x, y);
    layoutTree(node.right, x + spread, y + 70, spread / 2, x, y);
};
layoutTree(root, 210, 35, 100);

// Build a val→TNode map for child lookup
const nodeMap = new Map<number, TNode>();
const buildMap = (n: TNode | null) => {
    if (!n) return;
    nodeMap.set(n.val, n);
    buildMap(n.left);
    buildMap(n.right);
};
buildMap(root);

// Snapshot helper
const makeTree = (visited: Set<number>, currVals: Set<number>, nextVals: Set<number>): DualStackTreeNode[] =>
    baseNodes.map(n => ({
        ...n,
        visited: visited.has(n.val),
        inCurr: currVals.has(n.val),
        inNext: nextVals.has(n.val),
    }));

// Simulate dual-stack algorithm
const steps: ZigzagDualStackStep[] = [];
const ans: number[][] = [];
const visited = new Set<number>();

let curr: TNode[] = [root];
let leftToRight = true;
let layer = 0;

const currVals = () => new Set(curr.map(n => n.val));
const nextValsSet = (next: TNode[]) => new Set(next.map(n => n.val));

// Init
steps.push({
    layer: 0, leftToRight: true,
    action: 'init', nodeVal: null,
    curr: [root.val], next: [],
    level: [], ans: [],
    pushOrder: '',
    reason: 'Dual-stack zigzag: curr=[3], next=[]. Pop from curr top, push children to next.',
    treeNodes: makeTree(visited, currVals(), new Set()),
    highlightNode: null,
});

while (curr.length > 0) {
    const next: TNode[] = [];
    const level: number[] = [];

    while (curr.length > 0) {
        // Pop from top of curr
        const node = curr[curr.length - 1];
        curr = curr.slice(0, -1);

        steps.push({
            layer, leftToRight,
            action: 'pop', nodeVal: node.val,
            curr: curr.map(n => n.val),
            next: next.map(n => n.val),
            level: [...level],
            ans: ans.map(a => [...a]),
            pushOrder: leftToRight ? 'L then R' : 'R then L',
            reason: `Pop ${node.val} from curr top → collect`,
            treeNodes: makeTree(visited, currVals(), nextValsSet(next)),
            highlightNode: node.val,
        });

        level.push(node.val);
        visited.add(node.val);

        // Push children to next in order determined by direction
        const children: {label: string; child: TNode}[] = [];
        if (leftToRight) {
            // Even layer: push left then right → next pops right-to-left
            if (node.left) children.push({label: 'L', child: node.left});
            if (node.right) children.push({label: 'R', child: node.right});
        } else {
            // Odd layer: push right then left → next pops left-to-right
            if (node.right) children.push({label: 'R', child: node.right});
            if (node.left) children.push({label: 'L', child: node.left});
        }

        for (const {label, child} of children) {
            next.push(child);
            steps.push({
                layer, leftToRight,
                action: 'push_child', nodeVal: node.val,
                curr: curr.map(n => n.val),
                next: next.map(n => n.val),
                level: [...level],
                ans: ans.map(a => [...a]),
                pushOrder: leftToRight ? 'L then R' : 'R then L',
                reason: `Push ${node.val}'s ${label}-child (${child.val}) to next. next top = ${next[next.length - 1].val}`,
                treeNodes: makeTree(visited, currVals(), nextValsSet(next)),
                highlightNode: child.val,
            });
        }
    }

    ans.push([...level]);

    steps.push({
        layer, leftToRight,
        action: 'layer_done', nodeVal: null,
        curr: [],
        next: next.map(n => n.val),
        level: [...level],
        ans: ans.map(a => [...a]),
        pushOrder: '',
        reason: `Layer ${layer} done → [${level.join(', ')}]. curr empty.`,
        treeNodes: makeTree(visited, new Set(), nextValsSet(next)),
        highlightNode: null,
    });

    // Swap
    curr = next;
    leftToRight = !leftToRight;

    if (curr.length > 0) {
        steps.push({
            layer: layer + 1, leftToRight,
            action: 'swap', nodeVal: null,
            curr: curr.map(n => n.val),
            next: [],
            level: [],
            ans: ans.map(a => [...a]),
            pushOrder: leftToRight ? 'L then R' : 'R then L',
            reason: `Swap! curr ← next = [${curr.map(n => n.val).join(',')}]. Direction flipped to ${leftToRight ? 'L→R' : 'R→L'}.`,
            treeNodes: makeTree(visited, currVals(), new Set()),
            highlightNode: null,
        });
    }

    layer++;
}

steps.push({
    layer: layer - 1, leftToRight,
    action: 'done', nodeVal: null,
    curr: [], next: [],
    level: [],
    ans: ans.map(a => [...a]),
    pushOrder: '',
    reason: `Done! Result: [${ans.map(a => `[${a.join(',')}]`).join(', ')}]`,
    treeNodes: makeTree(visited, new Set(), new Set()),
    highlightNode: null,
});

export const ZigzagDualStackComposition: React.FC = () => {
    return (
        <ZigzagDualStackVisualizer
            steps={steps}
            title="103. Zigzag Level Order — Dual Stack Solution"
        />
    );
};
