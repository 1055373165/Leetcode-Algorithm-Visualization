import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SOLUTIONS} from './model/code';

async function main() {
  const dir = await mkdtemp(join(tmpdir(), 'algorithm-code-check-'));
  const cases: {nums: number[]; k: number; expected: number[]}[] = [];
  for (let n = 1; n <= 5; n++) for (let encoded = 0; encoded < 3 ** n; encoded++) {
    let value = encoded;
    const nums = Array.from({length: n}, () => {const x = value % 3 - 1; value = Math.floor(value / 3); return x;});
    for (let k = 1; k <= n; k++) cases.push({nums, k, expected: Array.from({length: n - k + 1}, (_, i) => Math.max(...nums.slice(i, i + k)))});
  }
  const python = `${SOLUTIONS.python.code}\nimport json, sys\ncases = json.loads(sys.stdin.read())\nfor c in cases:\n    assert Solution().maxSlidingWindow(c['nums'], c['k']) == c['expected'], c\nprint('Python:', len(cases), 'cases')\n`;
  await writeFile(join(dir, 'solution.py'), python);
  const pythonOutput = execFileSync('python3', [join(dir, 'solution.py')], {input: JSON.stringify(cases), encoding: 'utf8', timeout: 30000});
  console.log(pythonOutput.trim());

  const go = `package main\nimport ("encoding/json"; "os"; "fmt"; "reflect")\n${SOLUTIONS.go.code}\ntype TestCase struct { Nums []int; K int; Expected []int }\nfunc main() { var cases []TestCase; if err := json.NewDecoder(os.Stdin).Decode(&cases); err != nil { panic(err) }; for _, c := range cases { actual := maxSlidingWindow(c.Nums, c.K); if !reflect.DeepEqual(actual, c.Expected) { panic(fmt.Sprint(c, actual)) } }; fmt.Println("Go:", len(cases), "cases") }`;
  await writeFile(join(dir, 'solution.go'), go);
  const goOutput = execFileSync('go', ['run', join(dir, 'solution.go')], {input: JSON.stringify(cases), encoding: 'utf8', timeout: 120000});
  console.log(goOutput.trim());

  const cpp = `${SOLUTIONS.cpp.code}\n#include <iostream>\nint main() { int total,n,k; std::cin >> total; Solution s; for(int t=0;t<total;++t) { std::cin >> n >> k; std::vector<int> a(n); for(int &v:a) std::cin >> v; std::vector<int> expected(n-k+1); for(int &v:expected) std::cin >> v; if(s.maxSlidingWindow(a,k)!=expected) return 1; } std::cout << "C++: " << total << " cases\\n"; }`;
  await writeFile(join(dir, 'solution.cpp'), cpp);
  execFileSync('c++', ['-std=c++17', '-O2', join(dir, 'solution.cpp'), '-o', join(dir, 'solution')], {encoding: 'utf8', timeout: 60000});
  const input = `${cases.length}\n${cases.map(c => `${c.nums.length} ${c.k}\n${c.nums.join(' ')}\n${c.expected.join(' ')}`).join('\n')}`;
  console.log(execFileSync(join(dir, 'solution'), [], {input, encoding: 'utf8', timeout: 30000}).trim());
  assert.ok(cases.length > 1000);
  console.log(`Reference solutions agree with an independent oracle. Temporary harnesses: ${dir}`);
}
main().catch(error => {console.error(error); process.exitCode = 1;});
