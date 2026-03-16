# 8. 字符串转换整数 (atoi)：有限状态机的防御艺术

## 1. 审题（Problem）

题目要求我们实现一个类似于 C 语言标准库中的 `atoi` 函数，将输入的字符串转化为 32 位有符号整数。在没有任何算法技巧的包裹下，这是一道纯粹的**字符串匹配与系统模拟**题。我们不需要任何高深的数据结构，需要的只有对规则的绝对敬畏和对边界的严密防守。

题干给定了一个极其繁杂的规则集合：
1. **前导空格去除**：跳过所有开头的 `' '`。
2. **符号判定**：紧接着空格，必须立刻判断是 `'+'` 还是 `'-'`，且不仅限于一次，如果没有出现默认认定为正数。
3. **数字提取**：连续读取所有的数字字符（`'0'`-`'9'`），无视后面的任何多余成分（包括但不限于第二个符号、小数点、甚至是 "with words" 等乱码）。
4. **极值截断**：最终的结果必须死死卡在 32 位有符号整数的禁围里，即 $[-2^{31}, 2^{31}-1]$。任何企图越界的数值都会被毫不留情地截断并在边界处悬停。

数据范围 $0 \le s.length \le 200$，这个极度狭小的数据规模明确告诉我们：时间复杂度根本不是挑战，哪怕你把字符串反复扫描十遍也是瞬间完成（$O(N)$）。真正的挑战在于复杂的连环分支与极端恶劣的**边界陷阱**：单纯的空格串、只有正负号的无效串、在累加过程中引发 `int64` 甚至更高级别整数爆炸的超长纯数字串，以及那些混杂在有效数字中间的隐秘非数字字符。

基于此，我们将问题精确归类为**字符串/工程模拟**。如果你想在代码中展现最强壮的架构能力，这道题也是引入**确定性有限自动机（DFA）** 的绝佳舞台。

## 2. 思维演化（Reasoning）

这道题没有传统意义上的 $O(n^2)$ 暴力解法。大家的第一反应，也就是思维的最初基石，一定是顺着题意写出一条线性的流程控制流（Scheme A：面条式代码）。
我们设一个指针 `index`：
1. 用一个 `while` 循环吃掉所有的空格。
2. 取出 `index` 的当前字符，用一套 `if-else` 判断正负号。
3. 再启动一个 `while` 循环提取数字并不断乘 10 累加。
4. 每累加一次，就进行一次越界的 `if` 校验。

这种解法的时间复杂度是完美的 $O(n)$，空间 $O(1)$，足以 AC（通过测试）。
但它的**工程瓶颈**在于：随着规则的增加（比如将来要支持浮点数、支持科学计数法），这种“面条式”的 `if-else` 嵌套会迅速腐烂。指针移动的逻辑散落在各个循环和条件分支里，极易出现越界漏洞或者状态污染。

更高级的视角（Scheme B：有限自动机 DFA）是跳出“顺序执行”的思维定势，将这段解析过程理解为一个会根据输入变换特定形态的机器：
- 我们设定四个核心形态：`Start` (初始寻路)、`Signed` (确认符号)、`In_Number` (疯狂吸纳数字)、`End` (由于违规操作或到达终点而停机)。
- 面向任何字符输入，机器只单纯根据当前的“形态”和“来临的字符组合”决定下一步跳向哪个形态。
使用 DFA 的降维效果不在于时间复杂度，而在于将混乱的图灵流**解耦成了清晰的矩阵转移表表**。每一次只做一步简单的查表跳跃，所有的边界特判都被精妙地融入在了一张二维表格里了。不过在此次的解题中，由于规则还算线性，我们将采用更符合 Idiomatic Go 的单遍遍历法配合严格的节点卡口，它实质上是 DFA 在规则简单时的结构化等效实现。

## 3. 直觉培养（Intuition）

为什么能直接联想到这种多阶段关卡的模式？并且为何越界判断会成为这场战斗最难打的核心卡点？
这个问题的结构与**进入高度机密的安保系统**如出一辙。

想象你是一个试图潜入核心数据库的数据包（字符串）：
1. **外围过滤网（跳过空格）**：你必须穿过一重重漫无目的的空白。
2. **身份证件查验（符号判定）**：你遇到的第一个带有实质内容的东西，必须立刻亮明身份（正负号 或者是 默认的正籍平民数字），一旦错过这一关，再后面掏出符号都是非法的。
3. **搜刮核心资料（数字累加）**：你开始疯狂往背包里塞文件（ $res = res \times 10 + digit$ ）。

如果你不知道这道题的终极陷阱，你会卡在**第 3 关的背包撑爆瞬间**。
很多人的第一直觉是：我先直接存入所有的数字，如果结果比 `MaxInt32` 大，我再把它改掉就行了。但这在强类型语言（且没有类似 Python 的无限大整数）中是荒谬的：当你计算结果 `res` 真正大到突破 `MaxInt32` 或 `MaxInt64` 时，内存中的数据已经翻转成了诡异的负数或者乱码你连判断它是不是大于 `MaxInt32` 的资格都被剥夺了！
因此，**提前校验** 是破局的唯一法则：在把最新的那个金块塞进背包**之前**，先掂量掂量目前的背包是不是已经到了爆炸的临界点！

## 4. 代码实现（Solution）

### ASCII 状态图示

```
Step 1: 穿透外围与安检 (处理 ' ' 和 '-')
字符串:  [ ' ', ' ', '-', '4', '2', 'a', '3' ]
                     ↑
                   index     状态: sign = -1, res = 0

Step 2: 安全吸纳并在临界前预判
字符串:  [ ' ', ' ', '-', '4', '2', 'a', '3' ]
                               ↑
                             index   状态: res = 4 * 10 + 2 = 42

Step 3: 遭受乱码污染，安保系统紧急停机
字符串:  [ ' ', ' ', '-', '4', '2', 'a', '3' ]
                                    ↑
                                  index  遇到 'a'，跳出循环，返回 -42
```

### 核心代码

遵循 **Idiomatic Go** 标准。为避免代码嵌套过深，采用防卫式编程（Guard Clauses）尽早终止非法状态。引入 `math` 标准库中的边界极值常数以提升工程可读性。

```go
import "math"

func myAtoi(s string) int {
	currentIndex := 0
	n := len(s)
	
	// Phase 1: 扫描并跳过所有前导空格
	for currentIndex < n && s[currentIndex] == ' ' {
		currentIndex++
	}

	// 防御：全是空格的情况
	if currentIndex == n {
		return 0
	}

	// Phase 2: 严格锁定正负符号（仅允许出现一次）
	sign := 1
	if s[currentIndex] == '-' {
		sign = -1
		currentIndex++
	} else if s[currentIndex] == '+' {
		// 已经有 sign 的默认值 1 了，仅推进指针即可
		currentIndex++
	}

	// Phase 3: 主贪心提取与极致的越界防御
	var parsedNumber int
	// 我们利用除法提前将极限值斩断，获得临界阈值
	const overflowThreshold = math.MaxInt32 / 10

	for currentIndex < n && s[currentIndex] >= '0' && s[currentIndex] <= '9' {
		// 取出当前单个字符转化为数字
		currentDigit := int(s[currentIndex] - '0')

		// 【核心】在背包被撑爆前进行的提前干预检测（正负阈值通用逻辑）
		// 如果已积累的值大于阈值，或者刚好等于阈值但即将吸纳的尾数将超过最大限制 (MaxInt32 尾数为 7)
		if parsedNumber > overflowThreshold || (parsedNumber == overflowThreshold && currentDigit > 7) {
			if sign == 1 {
				return math.MaxInt32
			}
			return math.MinInt32
		}

		// 安全，累加到底座中
		parsedNumber = parsedNumber*10 + currentDigit
		currentIndex++
	}

		// Phase 4: 挂载最初判定的符号位
	return parsedNumber * sign
}
```

### 进阶：工业级极致实现

如果确实需要向面试官（或是参与开源级底层扫描器开发时）展示强悍的工程落地能力，必须抛弃带有极高开销的 `string` 常量和 `map`。真正的工业级词法扫描引擎将使用 **Zero-Allocation（零堆分配）** 与 **O(1) 内存偏移**的静态二维阵列来极致榨干 CPU 性能。

```go
import "math"

// 1. 使用强类型的枚举而非字符串，彻底消除 Hash 开销
type State int
type CharClass int

const (
	StateStart State = iota
	StateSigned
	StateInNumber
	StateEnd
)

const (
	ClassSpace CharClass = iota
	ClassSign
	ClassDigit
	ClassOther
)

// 2. 超高频执行路径上的字符分类器：利用编译期确定的常量数组替代 if-else
// 在内存中，这只是一段连贯的 256 字节偏移量，常数极限 O(1)
var charClassTable = buildCharClassTable()

func buildCharClassTable() [256]CharClass {
	var table [256]CharClass
	// 默认初始化为 ClassOther (0 的语义通常保留，这里假定 3 是 Other)
	for i := range table {
		table[i] = ClassOther
	}
	table[' '] = ClassSpace
	table['+'] = ClassSign
	table['-'] = ClassSign
	for i := '0'; i <= '9'; i++ {
		table[i] = ClassDigit
	}
	return table
}

// 3. 将 Map 降维为静态二维数组，获得绝对的寻址性能
var transitionTable = [][]State{
	StateStart:    {StateStart, StateSigned, StateInNumber, StateEnd},
	StateSigned:   {StateEnd,   StateEnd,    StateInNumber, StateEnd},
	StateInNumber: {StateEnd,   StateEnd,    StateInNumber, StateEnd},
	StateEnd:      {StateEnd,   StateEnd,    StateEnd,      StateEnd},
}

type Automaton struct {
	state        State
	sign         int
	parsedNumber int
}

// Get 操作：纯粹的数据游走
func (a *Automaton) Get(c byte) {
	// 极致 O(1) 访问，毫无分支预测惩罚
	a.state = transitionTable[a.state][charClassTable[c]]

	switch a.state {
	case StateInNumber:
		digit := int(c - '0')
		// 最稳健的越界推演
		if a.parsedNumber > math.MaxInt32/10 || (a.parsedNumber == math.MaxInt32/10 && digit > 7) {
			if a.sign == 1 {
				a.parsedNumber = math.MaxInt32
			} else {
				a.parsedNumber = math.MinInt32
			}
			a.state = StateEnd // 【极客拦截】既然越界了，强制转换状态断路后续无关数字
		} else {
			a.parsedNumber = a.parsedNumber*10 + digit
		}
	case StateSigned:
		if c == '-' {
			a.sign = -1
		}
	}
}

func myAtoi(s string) int {
	a := &Automaton{sign: 1} // 零值默认 state = 0 (StateStart)
	for i := 0; i < len(s); i++ {
		a.Get(s[i])
		if a.state == StateEnd {
			break
		}
	}
	
	// 注意这里的一个细节，如果我们因为突破边界引发了 math.MinInt32 的断路并赋给了 parsedNumber，
	// 此时 math.MinInt32 本身是负值，如果再乘上 sign(-1) 会发生严重翻转，
	// 所以需要判断当它已经是底层绝对极值时不再做最后符号运算
	if a.parsedNumber == math.MinInt32 {
	    return math.MinInt32
	}
	return a.parsedNumber * a.sign
}
```

### 算法可视化

（当前题目为工程模拟匹配，更适合 DFA 状态跃迁流转动画而非几何指针推演，建议参考常规流程式动画）

### 复杂度证明

- **时间复杂度**：$O(n)$。在最好的情况下，第一个字符就是字母直接退出；即便在最坏的情况下，我们也只是利用 `currentIndex` 将长度为 $n$ 的字符串从头到尾干净利落地单向扫描了一次（处理空格进入一次循环，处理数字再进入一次独立循环），没有任何回看或推倒重来的复算操作。
- **空间复杂度**：$O(1)$。我们全程只申请了三个基础整型变量：`currentIndex` 指针、`sign` 状态位 和 `parsedNumber` 累加器。它没有消耗任何随输入规模而增长的阵列堆栈，存储开销逼近零。

### 易错点与边界处理

- **溢出的临界点微操**：对于 32 位整数，`MaxInt32` 为 `2147483647`，而 `MinInt32` 为 `-2147483648`。仔细看最后一位数字：正向极限是 `7`，负向极限能够容纳到 `8`。为什么代码里只需要判断 `currentDigit > 7` 就能涵盖正负数？如果输入是 `-2147483648`，我们的算法提取到的 `currentDigit = 8`，触发了 `currentDigit > 7` 条件，直接返回 `MinInt32`。这刚好截取了极限边界，逻辑上达成了一种优雅的巧合。
- **指针越界异常**：无论是扫空格，还是判定符号位，哪怕是在内层大批量读数字的 `while` 里，都绝对不可漏掉 `currentIndex < n` 的越界护航。这是针对空串或极短恶意输入的唯一防线。

### S.8 核心洞察记忆（一句话总结）

**Top 1% 专家版示例（字符串转换整数 (atoi)）**：抛弃事后修补的思维惯性，将工程流与防御流剥离；以严格的四段式状态流水线（滤空、锁号、读数、越界干预）解构混乱的字符乱码流，其灵魂在于**数值乘爆之前的逆向探测**——通过对比 `MaxInt32 / 10` 与阈值判定将溢出灾难扼杀于摇篮之中。

## 5. 融会贯通（Mastery）

### 变体题群

掌握了针对乱码的健壮性提取后，这类工程模拟和匹配解析题皆可视同掌上观纹：

| 题目 | 变化点 | 解法调整 |
|------|--------|----------|
| 65. 有效数字 | 变态级别的规则组合，需要识别浮点和指数。 | 这是这道题的最强进阶形态。必须放弃线性判断，转而手搓一张完整的 DFA 转移矩阵图（绘制十种以上的节点图），将任何字符组合机械化地打入无情的状态跃迁循环。 |
| 151. 反转字符串中的单词 | 分割的不是数字，是对空白字符的反复操作。 | 同样的扫描与空格跳过逻辑，只需要将提取出的合法片段推入切片进行末端反向拼接即可。 |
| 7. 整数反转 | 不需要提纯，但包含了同样严苛的溢出边界惩罚。 | 没有字符串干扰，只剩下纯粹的 `% 10` 剥离和 `* 10` 压入，其对 `MaxInt32 / 10` 的阈值探测拦截策略与此题如出一辙，可以直接 copy。 |

### 面试锦囊

- **遇到面试官挖坑：“如果我不准你使用 `MaxInt32` 这种标准库宏常量，你该怎么手捏极值？”**  
  毫不慌乱地写下：对于 32位系统，最大正数为 `1<<31 - 1`，最小负数为 `-1 << 31`，如果语言缺乏确定的 32 位位移保障，可以使用无符号数的技巧：`uint32(^uint32(0)) >> 1` 取得最大有符号整型。这种游刃有余的底层位运算操纵能力会瞬间打动对性能敏感的底层考官。
- **遇到面试官追问架构演进：“如果这条代码还要经常改动，今天增加十六进制（`0x`开头），明天增加科学计数法，你这套代码怎么拓展？”**  
  果断否定现在的这套 `if-else` 防卫流。回答：“当解析规则超过单一维度的线性累加时，我会引入编译原理中的 **DFA（确定性有限自动机）** 架构。我会在外场定义一张静态的 `map[State]map[CharType]State` 状态转移表，将所有规则抽离出执行流。主逻辑里只剩下单纯的查表，任何新规则的添加都只归结于对这张静态表的扩容，实现了开闭原则（OCP）在算法侧的降维碾压。”
