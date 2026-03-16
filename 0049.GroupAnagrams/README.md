# 49. 字母异位词分组：哈希表的键值设计

## 1. 审题（Problem）

### 1.1 约束解码
给定一个字符串数组，将 **字母异位词**（Anagrams）组合在一起。
所谓“字母异位词”，是指由相同的字母（种类和数量都相同）只是顺序不同的单词。例如 `eat` 和 `tea`。

### 1.2 边界陷阱
*   **空数组**：返回 `[]`。
*   **空字符串**：`[""]` -> `[[""]]`。
*   **全部不同**：每个单词单独一组。
*   **字符集**：题目通常假设只有小写字母，这对我们设计 Hash Key 很重要。

### 1.3 问题归类
这是一道经典的 **哈希表** 题目。
核心难点在于：**如何为一组异位词设计一个唯一的 Key？**
只要 `hash(eat) == hash(tea) == hash(ate)`，我们就能把它们扔进同一个 `Map<Key, List<String>>` 里。

## 2. 思维演化（Reasoning）

### 2.1 方案 A：排序即标准 (Sorting as Key)
把单词内部的字母重新排序。
*   `eat` -> `aet`
*   `tea` -> `aet`
*   `ate` -> `aet`
这样大家就都一样了。
**复杂度**：$O(N \cdot K \log K)$，其中 $N$ 是单词数，$K$ 是最大单词长度。

### 2.2 方案 B：计数即标准 (Counting as Key)
统计每个字母出现的次数。
*   `eat` -> `1,0,0,0,1,0...` (a=1, e=1, t=1)
*   `tea` -> `1,0,0,0,1,0...`
我们可以用一个长度为 26 的数组（或字符串）作为 Key。
**复杂度**：$O(N \cdot K)$。理论上比排序快，但具体取决于 $K$ 的大小和语言对 Array Key 的支持程度。在 Go 中，数组可以作为 Map 的 Key，非常方便。

## 3. 直觉培养（Intuition）

### 3.1 归类工厂
想象一个流水线。这也正是我们在动画中展示的过程：
1.  **原料**：乱序的单词。
2.  **加工**：把单词扔进“排序机”。
3.  **分拣**：出来的“标准件”（Key）告诉我们将原始原料放入哪个篮子（Bucket）。

![字母异位词分组动画](animation.mp4)

## 4. 代码实现（Solution）

我们采用 **排序方案**，因为在 Go 中实现字符串排序虽然略繁琐（需要转 `[]byte`），但通用性更强（不受限于 26 个字母）。

```go
import (
	"sort"
)

func groupAnagrams(strs []string) [][]string {
	// Map: Key(sorted string) -> Value(list of original strings)
	anagramMap := make(map[string][]string)

	for _, s := range strs {
		// 1. 生成 Key：对字符串进行排序
		key := sortString(s)
		
		// 2. 归类
		anagramMap[key] = append(anagramMap[key], s)
	}

	// 3. 收集结果
	var res [][]string
	for _, group := range anagramMap {
		res = append(res, group)
	}

	return res
}

// 辅助函数：将字符串内的字符排序
func sortString(s string) string {
	bytes := []byte(s)
	sort.Slice(bytes, func(i, j int) bool {
		return bytes[i] < bytes[j]
	})
	return string(bytes)
}
```

### 4.2 复杂度证明
*   **时间复杂度**: $O(N \cdot K \log K)$。
    *   遍历 $N$ 个字符串。
    *   每个字符串排序需要 $O(K \log K)$。
    *   Map 插入和查找通常是 $O(K)$（这是 Key 的长度）。
*   **空间复杂度**: $O(N \cdot K)$。需要存储所有字符串的分组。

### 4.3 易错点清单
1.  **Map 的 Key 类型**：在 Java 中通常用 String，在 Go 中也是 String。注意数组/切片作为 Key 的区别（Go 中数组可做 Key，切片不行）。
2.  **结果顺序**：题目通常不要求返回结果的具体顺序（例如 `[["eat","tea"], ["tan","nat"]]` 和 `[["tan","nat"], ["eat","tea"]]` 都是对的）。Map 遍历的随机性正好符合这一点。

## 5. 融会贯通（Mastery）

### 5.1 变体题群
| 题目 | 变化点 | 解法调整 |
| :--- | :--- | :--- |
| **49. 字母异位词分组** | 标准题 | Sort Key 或 Count Key |
| **242. 有效的字母异位词** | 判断两个词是否互为异位词 | 排序对比 或 计数器对比（+1 / -1） |
| **438. 找到字符串中所有字母异位词** | 滑动窗口 + 异位词 | 滑动窗口 + Fixed Size 计数数组（Hash） |
| **面试题：同构字符串** | 映射关系 | 两个 Map 双向映射 |

### 5.2 模式识别
当题目涉及 **“重新排列”、“字符统计”、“出现次数一致”** 时：
1.  **Hash Map** 是首选容器。
2.  **Key 的设计** 是核心逻辑。
    *   长度小 -> 排序。
    *   字符集小 -> 计数数组 (26/128)。
    *   结构复杂 -> 自定义 Hash 函数。
