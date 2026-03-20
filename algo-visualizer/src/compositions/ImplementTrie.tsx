import React from 'react';
import {ImplementTrieVisualizer, ImplementTrieStep, TrieNodeSnapshot} from '../components/ImplementTrieVisualizer';

// Internal trie structure for step generation
class TrieNode {
    children: (TrieNode | null)[] = new Array(26).fill(null);
    isEnd = false;
}

class Trie {
    root = new TrieNode();

    insert(word: string) {
        let node = this.root;
        for (const ch of word) {
            const idx = ch.charCodeAt(0) - 97;
            if (!node.children[idx]) {
                node.children[idx] = new TrieNode();
            }
            node = node.children[idx]!;
        }
        node.isEnd = true;
    }

    // Traverse and return the node at end of word, or null
    searchNode(word: string): TrieNode | null {
        let node: TrieNode | null = this.root;
        for (const ch of word) {
            const idx = ch.charCodeAt(0) - 97;
            if (!node!.children[idx]) return null;
            node = node!.children[idx];
        }
        return node;
    }

    snapshot(highlightPath: string, highlightLen: number): TrieNodeSnapshot {
        const buildSnapshot = (node: TrieNode, char: string, depth: number, pathSoFar: string): TrieNodeSnapshot => {
            const isOnPath = highlightPath.startsWith(pathSoFar) && depth <= highlightLen;
            const isHighlighted = isOnPath && depth === highlightLen;

            const children: TrieNodeSnapshot[] = [];
            for (let i = 0; i < 26; i++) {
                if (node.children[i]) {
                    const childChar = String.fromCharCode(97 + i);
                    children.push(buildSnapshot(
                        node.children[i]!,
                        childChar,
                        depth + 1,
                        pathSoFar + childChar
                    ));
                }
            }

            return {
                char,
                isEnd: node.isEnd,
                children,
                depth,
                highlighted: isHighlighted,
            };
        };

        return buildSnapshot(this.root, 'root', 0, '');
    }
}

// Generate steps
const steps: ImplementTrieStep[] = [];
const trie = new Trie();

type Op = {type: 'insert' | 'search' | 'startsWith'; word: string};

const operations: Op[] = [
    {type: 'insert', word: 'apple'},
    {type: 'search', word: 'apple'},
    {type: 'search', word: 'app'},
    {type: 'startsWith', word: 'app'},
    {type: 'insert', word: 'app'},
    {type: 'search', word: 'app'},
    {type: 'insert', word: 'bat'},
    {type: 'search', word: 'bat'},
    {type: 'startsWith', word: 'ba'},
];

for (const op of operations) {
    const {type, word} = op;

    if (type === 'insert') {
        // Show traversal step by step
        for (let i = 0; i <= word.length; i++) {
            const prefix = word.substring(0, i);
            const isNewNode = i > 0 && !trie.searchNode(prefix);

            if (i < word.length) {
                steps.push({
                    operation: 'insert',
                    word,
                    currentCharIndex: i,
                    trieSnapshot: trie.snapshot(word, i),
                    result: null,
                    reason: i === 0
                        ? `Insert "${word}": start at root`
                        : isNewNode
                            ? `Create node '${word[i-1]}', move to depth ${i}`
                            : `Node '${word[i-1]}' exists, move to depth ${i}`,
                    phase: isNewNode ? 'create' : 'traverse',
                });
            }
        }

        // Actually insert
        trie.insert(word);

        // Show final state
        steps.push({
            operation: 'insert',
            word,
            currentCharIndex: word.length,
            trieSnapshot: trie.snapshot(word, word.length),
            result: null,
            reason: `Insert "${word}": mark '${word[word.length-1]}' as end of word ★`,
            phase: 'done',
        });

    } else {
        // search or startsWith
        const isSearch = type === 'search';
        let found = true;

        for (let i = 0; i <= word.length; i++) {
            const prefix = word.substring(0, i);
            const nodeExists = i === 0 || trie.searchNode(prefix) !== null;

            if (i < word.length) {
                if (!nodeExists) {
                    // Node doesn't exist
                    steps.push({
                        operation: type,
                        word,
                        currentCharIndex: i,
                        trieSnapshot: trie.snapshot(word, i),
                        result: false,
                        reason: `${isSearch ? 'Search' : 'StartsWith'} "${word}": node '${word[i-1]}' not found → FALSE`,
                        phase: 'done',
                    });
                    found = false;
                    break;
                }

                steps.push({
                    operation: type,
                    word,
                    currentCharIndex: i,
                    trieSnapshot: trie.snapshot(word, i),
                    result: null,
                    reason: i === 0
                        ? `${isSearch ? 'Search' : 'StartsWith'} "${word}": start at root`
                        : `Follow '${word[i-1]}' → depth ${i}`,
                    phase: 'traverse',
                });
            }
        }

        if (found) {
            const endNode = trie.searchNode(word);
            if (!endNode) {
                steps.push({
                    operation: type,
                    word,
                    currentCharIndex: word.length,
                    trieSnapshot: trie.snapshot(word, word.length),
                    result: false,
                    reason: `${isSearch ? 'Search' : 'StartsWith'} "${word}": path doesn't exist → FALSE`,
                    phase: 'done',
                });
            } else if (isSearch && !endNode.isEnd) {
                steps.push({
                    operation: type,
                    word,
                    currentCharIndex: word.length,
                    trieSnapshot: trie.snapshot(word, word.length),
                    result: false,
                    reason: `Search "${word}": reached end but isEnd=false → FALSE (not a complete word)`,
                    phase: 'done',
                });
            } else if (isSearch && endNode.isEnd) {
                steps.push({
                    operation: type,
                    word,
                    currentCharIndex: word.length,
                    trieSnapshot: trie.snapshot(word, word.length),
                    result: true,
                    reason: `Search "${word}": reached end and isEnd=true → TRUE ✓`,
                    phase: 'done',
                });
            } else {
                // startsWith
                steps.push({
                    operation: type,
                    word,
                    currentCharIndex: word.length,
                    trieSnapshot: trie.snapshot(word, word.length),
                    result: true,
                    reason: `StartsWith "${word}": path exists → TRUE ✓ (don't check isEnd)`,
                    phase: 'done',
                });
            }
        }
    }
}

export const ImplementTrieComposition: React.FC = () => {
    return (
        <ImplementTrieVisualizer
            steps={steps}
            title="208. Implement Trie (Prefix Tree)"
        />
    );
};
