import React from 'react';
import {
	ImplementTrieStep,
	ImplementTrieVisualizer,
	TrieNodeSnapshot,
	TrieScriptOperation,
} from '../components/ImplementTrieVisualizer';

class TrieNode {
	children: (TrieNode | null)[] = new Array(26).fill(null);
	isEnd = false;
}

class Trie {
	root = new TrieNode();

	snapshot({
		activePath = '',
		currentPath = '',
		newPath = '',
	}: {
		activePath?: string;
		currentPath?: string;
		newPath?: string;
	}): TrieNodeSnapshot {
		const build = (
			node: TrieNode,
			char: string,
			path: string,
			depth: number,
		): TrieNodeSnapshot => {
			let state: TrieNodeSnapshot['state'] = 'normal';
			if (newPath && path === newPath) {
				state = 'new';
			} else if (path === currentPath) {
				state = 'current';
			} else if (path === '' && (activePath || currentPath === '')) {
				state = 'path';
			} else if (path !== '' && activePath.startsWith(path)) {
				state = 'path';
			}

			const children: TrieNodeSnapshot[] = [];
			for (let i = 0; i < 26; i++) {
				if (node.children[i]) {
					const childChar = String.fromCharCode(97 + i);
					children.push(
						build(
							node.children[i]!,
							childChar,
							path + childChar,
							depth + 1,
						),
					);
				}
			}

			return {
				char,
				path,
				depth,
				isEnd: node.isEnd,
				children,
				state,
			};
		};

		return build(this.root, 'root', '', 0);
	}
}

const SCRIPT: TrieScriptOperation[] = [
	{type: 'insert', word: 'apple'},
	{type: 'search', word: 'apple'},
	{type: 'search', word: 'app'},
	{type: 'startsWith', word: 'app'},
	{type: 'insert', word: 'app'},
	{type: 'search', word: 'app'},
];

const OPERATIONS_COUNT = SCRIPT.length;
const INVARIANT =
	'每条 root -> node 路径都代表一个前缀；只有 isEnd=true 才表示“完整单词存在”。';

const trie = new Trie();
const steps: ImplementTrieStep[] = [];
const scriptResults: (string | null)[] = new Array(OPERATIONS_COUNT).fill(null);

const pushStep = (
	step: Omit<ImplementTrieStep, 'scriptResults'>,
) => {
	steps.push({
		...step,
		scriptResults: [...scriptResults],
	});
};

pushStep({
	phase: 'intro',
	operationIndex: -1,
	operationType: 'summary',
	word: '',
	currentCharIndex: -1,
	currentChar: null,
	currentPath: '',
	trieSnapshot: trie.snapshot({activePath: '', currentPath: ''}),
	actionLabel: '先看题目的认知骨架',
	what:
		'这段动画会连续演示 insert / search / startsWith 三种操作，并用同一棵 Trie 复用公共前缀。',
	why:
		'理解 Trie 的关键不是“树会怎么长”，而是“路径表示前缀，isEnd 区分完整单词”。',
	delta: ['示例脚本共 6 个操作', '重点观察 "app" 的三次状态变化'],
	invariant: INVARIANT,
	progress: `脚本准备开始，共 ${OPERATIONS_COUNT} 个操作`,
	resultText: null,
});

SCRIPT.forEach((operation, operationIndex) => {
	const {type, word} = operation;

	pushStep({
		phase: 'start',
		operationIndex,
		operationType: type,
		word,
		currentCharIndex: -1,
		currentChar: null,
		currentPath: '',
		trieSnapshot: trie.snapshot({activePath: '', currentPath: ''}),
		actionLabel: `准备执行 ${type}("${word}")`,
		what: `当前脚本来到 ${type}("${word}")。`,
		why:
			type === 'insert'
				? 'Insert 会尽量复用已有前缀，只在缺失分支上创建新节点。'
				: type === 'search'
					? 'Search 需要先确认整条路径存在，最后还要检查 isEnd。'
					: 'startsWith 只验证前缀路径是否存在，不检查 isEnd。',
		delta: [`操作 ${operationIndex + 1}/${OPERATIONS_COUNT}`],
		invariant: INVARIANT,
		progress: `脚本进度 ${operationIndex + 1}/${OPERATIONS_COUNT}`,
		resultText: null,
	});

	if (type === 'insert') {
		let node = trie.root;
		let path = '';

		for (let i = 0; i < word.length; i++) {
			const ch = word[i];
			const idx = ch.charCodeAt(0) - 97;
			const nextPath = path + ch;
			const exists = node.children[idx] !== null;

			pushStep({
				phase: 'traverse',
				operationIndex,
				operationType: type,
				word,
				currentCharIndex: i,
				currentChar: ch,
				currentPath: path,
				trieSnapshot: trie.snapshot({
					activePath: path,
					currentPath: path,
				}),
				actionLabel: `检查字符 '${ch}' 的分支`,
				what: `当前停在前缀 "${path || 'root'}"，准备处理字符 '${ch}'。`,
				why:
					'Insert 会先看这条边是否已经存在；存在就复用，不存在才创建。',
				delta: [
					exists
						? `前缀 "${nextPath}" 已经存在`
						: `前缀 "${nextPath}" 还不存在`,
				],
				invariant: INVARIANT,
				progress: `脚本进度 ${operationIndex + 1}/${OPERATIONS_COUNT}`,
				resultText: null,
			});

			if (!exists) {
				node.children[idx] = new TrieNode();
				pushStep({
					phase: 'create',
					operationIndex,
					operationType: type,
					word,
					currentCharIndex: i,
					currentChar: ch,
					currentPath: nextPath,
					trieSnapshot: trie.snapshot({
						activePath: nextPath,
						currentPath: nextPath,
						newPath: nextPath,
					}),
					actionLabel: `创建节点 '${ch}'`,
					what: `为前缀 "${nextPath}" 新建节点。`,
					why:
						'此前没有任何单词走过这条边，所以必须补齐路径，后续相同前缀才能复用。',
					delta: [`新增一条前缀路径 "${nextPath}"`],
					invariant: INVARIANT,
					progress: `脚本进度 ${operationIndex + 1}/${OPERATIONS_COUNT}`,
					resultText: null,
				});
			} else {
				pushStep({
					phase: 'traverse',
					operationIndex,
					operationType: type,
					word,
					currentCharIndex: i,
					currentChar: ch,
					currentPath: nextPath,
					trieSnapshot: trie.snapshot({
						activePath: nextPath,
						currentPath: nextPath,
					}),
					actionLabel: `复用共享前缀 '${nextPath}'`,
					what: `字符 '${ch}' 对应的节点已经存在，直接沿着旧路径继续走。`,
					why:
						'Trie 的效率来自“公共前缀只存一份”，所以重复前缀不会重复建树。',
					delta: [`复用已有前缀 "${nextPath}"`],
					invariant: INVARIANT,
					progress: `脚本进度 ${operationIndex + 1}/${OPERATIONS_COUNT}`,
					resultText: null,
				});
			}

			node = node.children[idx]!;
			path = nextPath;
		}

		const wasEnd = node.isEnd;
		node.isEnd = true;
		pushStep({
			phase: 'mark-end',
			operationIndex,
			operationType: type,
			word,
			currentCharIndex: word.length - 1,
			currentChar: word[word.length - 1],
			currentPath: path,
			trieSnapshot: trie.snapshot({
				activePath: path,
				currentPath: path,
			}),
			actionLabel: '设置词尾标记 isEnd',
			what: `已经走完整个 "${word}"，现在把节点 "${path}" 标成单词结尾。`,
			why:
				'路径存在只能说明前缀存在；只有 isEnd 才能把“前缀 app”与“完整单词 app”区分开。',
			delta: [
				wasEnd ? 'isEnd 本来就为 true' : 'isEnd 从 false 变为 true',
			],
			invariant: INVARIANT,
			progress: `脚本进度 ${operationIndex + 1}/${OPERATIONS_COUNT}`,
			resultText: null,
		});

		scriptResults[operationIndex] = 'OK';
		pushStep({
			phase: 'result',
			operationIndex,
			operationType: type,
			word,
			currentCharIndex: word.length - 1,
			currentChar: word[word.length - 1],
			currentPath: path,
			trieSnapshot: trie.snapshot({
				activePath: path,
				currentPath: path,
			}),
			actionLabel: `完成 ${type}("${word}")`,
			what: `单词 "${word}" 已经写入 Trie。`,
			why:
				word === 'app'
					? '这次没有创建新路径，只把第二个 p 的 isEnd 设为 true，所以之后 search("app") 会变成 true。'
					: 'Insert 的完整动作就是：沿路径前进，必要时创建节点，最后标记词尾。',
			delta: [`脚本结果记录为 OK`],
			invariant: INVARIANT,
			progress: `已完成 ${operationIndex + 1}/${OPERATIONS_COUNT} 个操作`,
			resultText: 'OK',
		});
		return;
	}

	let node: TrieNode | null = trie.root;
	let path = '';
	let missing = false;

	for (let i = 0; i < word.length; i++) {
		const ch = word[i];
		const idx = ch.charCodeAt(0) - 97;
		const nextPath = path + ch;

		pushStep({
			phase: 'traverse',
			operationIndex,
			operationType: type,
			word,
			currentCharIndex: i,
			currentChar: ch,
			currentPath: path,
			trieSnapshot: trie.snapshot({
				activePath: path,
				currentPath: path,
			}),
			actionLabel: `查看字符 '${ch}' 是否可达`,
			what: `当前停在前缀 "${path || 'root'}"，准备沿 '${ch}' 继续往下走。`,
			why:
				type === 'search'
					? 'Search 只有在整条字符路径都存在时才有资格谈“单词是否存在”。'
					: 'startsWith 只关心前缀路径能否走通。',
			delta: [`目标前缀尝试扩展为 "${nextPath}"`],
			invariant: INVARIANT,
			progress: `脚本进度 ${operationIndex + 1}/${OPERATIONS_COUNT}`,
			resultText: null,
		});

		if (!node || !node.children[idx]) {
			missing = true;
			scriptResults[operationIndex] = 'FALSE';
			pushStep({
				phase: 'result',
				operationIndex,
				operationType: type,
				word,
				currentCharIndex: i,
				currentChar: ch,
				currentPath: path,
				trieSnapshot: trie.snapshot({
					activePath: path,
					currentPath: path,
				}),
				actionLabel: '路径中断，直接返回 FALSE',
				what: `需要的分支 '${nextPath}' 不存在。`,
				why:
					'只要路径断掉，就说明这个单词或前缀从未被插入过，后面无需继续检查。',
				delta: [`在 "${path || 'root'}" 处停止`],
				invariant: INVARIANT,
				progress: `已完成 ${operationIndex + 1}/${OPERATIONS_COUNT} 个操作`,
				resultText: 'FALSE',
			});
			break;
		}

		node = node.children[idx];
		path = nextPath;

		pushStep({
			phase: 'traverse',
			operationIndex,
			operationType: type,
			word,
			currentCharIndex: i,
			currentChar: ch,
			currentPath: path,
			trieSnapshot: trie.snapshot({
				activePath: path,
				currentPath: path,
			}),
			actionLabel: `成功沿 '${ch}' 前进`,
			what: `已经到达前缀 "${path}"。`,
			why:
				'Trie 每一层只负责一个字符，所以“继续查找”本质上就是沿路径逐字符向下移动。',
			delta: [`当前路径 = "${path}"`],
			invariant: INVARIANT,
			progress: `脚本进度 ${operationIndex + 1}/${OPERATIONS_COUNT}`,
			resultText: null,
		});
	}

	if (missing || !node) {
		return;
	}

	if (type === 'search') {
		const matched = node.isEnd;
		pushStep({
			phase: 'check',
			operationIndex,
			operationType: type,
			word,
			currentCharIndex: word.length - 1,
			currentChar: word[word.length - 1],
			currentPath: path,
			trieSnapshot: trie.snapshot({
				activePath: path,
				currentPath: path,
			}),
			actionLabel: '检查 isEnd',
			what: `路径 "${path}" 已存在，现在检查终点节点的 isEnd。`,
			why:
				'search 不能把“路径存在”误判成“单词存在”；它必须看到词尾标记才算命中。',
			delta: [`isEnd = ${matched}`],
			invariant: 'search 的最后一步必须检查 isEnd；这正是它与 startsWith 的唯一区别。',
			progress: `脚本进度 ${operationIndex + 1}/${OPERATIONS_COUNT}`,
			resultText: null,
		});

		scriptResults[operationIndex] = matched ? 'TRUE' : 'FALSE';
		pushStep({
			phase: 'result',
			operationIndex,
			operationType: type,
			word,
			currentCharIndex: word.length - 1,
			currentChar: word[word.length - 1],
			currentPath: path,
			trieSnapshot: trie.snapshot({
				activePath: path,
				currentPath: path,
			}),
			actionLabel: `完成 ${type}("${word}")`,
			what:
				matched
					? `"${word}" 的路径存在，且终点节点 isEnd=true。`
					: `"${word}" 的路径虽然存在，但终点节点 isEnd=false。`,
			why:
				matched
					? '这说明它既是一个前缀，也是一个完整单词。'
					: '这说明它只是某个更长单词的前缀，还不能算作完整单词。',
			delta: [
				matched
					? `返回 TRUE`
					: `返回 FALSE`,
			],
			invariant: '路径存在 != 单词存在；search 还要检查 isEnd。',
			progress: `已完成 ${operationIndex + 1}/${OPERATIONS_COUNT} 个操作`,
			resultText: matched ? 'TRUE' : 'FALSE',
		});
		return;
	}

	scriptResults[operationIndex] = 'TRUE';
	pushStep({
		phase: 'check',
		operationIndex,
		operationType: type,
		word,
		currentCharIndex: word.length - 1,
		currentChar: word[word.length - 1],
		currentPath: path,
		trieSnapshot: trie.snapshot({
			activePath: path,
			currentPath: path,
		}),
		actionLabel: '前缀路径已经走通',
		what: `前缀 "${path}" 对应的整条路径都存在。`,
		why:
			'startsWith 只问“有没有这条前缀路径”，不会再检查 isEnd。',
		delta: ['因此可以直接返回 TRUE'],
		invariant: 'startsWith 只验证路径是否存在，不需要词尾标记。',
		progress: `脚本进度 ${operationIndex + 1}/${OPERATIONS_COUNT}`,
		resultText: null,
	});

	pushStep({
		phase: 'result',
		operationIndex,
		operationType: type,
		word,
		currentCharIndex: word.length - 1,
		currentChar: word[word.length - 1],
		currentPath: path,
		trieSnapshot: trie.snapshot({
			activePath: path,
			currentPath: path,
		}),
		actionLabel: `完成 ${type}("${word}")`,
		what: `虽然 "${word}" 当时不是完整单词，但它作为前缀确实存在。`,
		why:
			'这一步正好和前一个 search("app") 形成对比：同一条路径，search 看 isEnd，startsWith 不看。',
		delta: ['返回 TRUE'],
		invariant: 'search 与 startsWith 走同一条路径，区别只在最后是否检查 isEnd。',
		progress: `已完成 ${operationIndex + 1}/${OPERATIONS_COUNT} 个操作`,
		resultText: 'TRUE',
	});

	pushStep({
		phase: 'summary',
		operationIndex,
		operationType: 'summary',
		word: '',
		currentCharIndex: -1,
		currentChar: null,
		currentPath: path,
		trieSnapshot: trie.snapshot({
			activePath: path,
			currentPath: path,
		}),
		actionLabel: '关键对比：search vs startsWith',
		what: '同样都是走到前缀 "app"，search 返回 FALSE，而 startsWith 返回 TRUE。',
		why:
			'因为 search 需要 isEnd=true，startsWith 只需要这条路径存在。',
		delta: ['search("app") = FALSE', 'startsWith("app") = TRUE'],
		invariant: 'Trie 的词典能力来自路径，精确匹配能力来自 isEnd。',
		progress: `脚本进度 ${operationIndex + 1}/${OPERATIONS_COUNT}`,
		resultText: null,
	});
});

pushStep({
	phase: 'summary',
	operationIndex: OPERATIONS_COUNT,
	operationType: 'summary',
	word: '',
	currentCharIndex: -1,
	currentChar: null,
	currentPath: 'app',
	trieSnapshot: trie.snapshot({
		activePath: 'app',
		currentPath: 'app',
	}),
	actionLabel: '总结 1：Trie 为什么有效',
	what:
		'这棵树让所有公共前缀只存一份，所以 insert/search/startsWith 都只是沿字符路径向下走。',
	why:
		'路径负责表达“前缀是否存在”，isEnd 负责表达“完整单词是否存在”，两者合起来就能同时支持前缀查询和精确查询。',
	delta: ['公共前缀共享', 'isEnd 精确区分单词边界'],
	invariant: INVARIANT,
	progress: '总结 1/2',
	resultText: null,
});

pushStep({
	phase: 'summary',
	operationIndex: OPERATIONS_COUNT,
	operationType: 'summary',
	word: '',
	currentCharIndex: -1,
	currentChar: null,
	currentPath: '',
	trieSnapshot: trie.snapshot({
		activePath: '',
		currentPath: '',
	}),
	actionLabel: '总结 2：复杂度与正确性',
	what:
		'三个操作都只走单词长度 m 的路径，所以时间复杂度都是 O(m)。',
	why:
		'正确性来自这条不变量：每条路径唯一对应一个前缀，而 isEnd 只在完整单词结尾处为 true。',
	delta: ['时间复杂度 O(m)', '空间复杂度 O(总字符数)'],
	invariant: '路径不丢前缀，isEnd 不混淆完整单词。',
	progress: '总结 2/2',
	resultText: null,
});

export const IMPLEMENT_TRIE_DURATION_PER_STEP = 36;
export const IMPLEMENT_TRIE_TOTAL_FRAMES =
	steps.length * IMPLEMENT_TRIE_DURATION_PER_STEP;

export const ImplementTrieComposition: React.FC = () => {
	return (
		<ImplementTrieVisualizer
			steps={steps}
			title="208. Implement Trie (Prefix Tree)"
			script={SCRIPT}
			durationPerStep={IMPLEMENT_TRIE_DURATION_PER_STEP}
		/>
	);
};
