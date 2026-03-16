import { AlgoTracer } from '../../../algo-visualizer-web/src/sandbox/MetaDSL';

export function runMergeSortedArray(algo: AlgoTracer, nums1: number[], m: number, nums2: number[], n: number) {
  algo.reset();

  let p1 = m - 1;
  let p2 = n - 1;
  let p = m + n - 1;

  algo.init(
    [
      { id: 'p1', value: p1, role: 'read' },
      { id: 'p2', value: p2, role: 'read' },
      { id: 'p', value: p, role: 'write' }
    ],
    [
      { id: 'nums1', type: 'array', data: [...nums1] },
      { id: 'nums2', type: 'array', data: [...nums2] }
    ],
    'Init: p1 at end of valid nums1, p2 at end of nums2, p at end of nums1.'
  );

  while (p2 >= 0) {
    if (p1 >= 0) {
      algo.updatePointer('p1', p1, 'fast');
      algo.updatePointer('p2', p2, 'fast');
      algo.step(14, `Compare nums1[p1] (${nums1[p1]}) vs nums2[p2] (${nums2[p2]}).`);
      algo.updatePointer('p1', p1, 'read');
      algo.updatePointer('p2', p2, 'read');
    }

    if (p1 >= 0 && nums1[p1] > nums2[p2]) {
      nums1[p] = nums1[p1];
      algo.updateMemory('nums1', [...nums1]);
      algo.updatePointer('p', p, 'write');
      algo.step(20, `${nums1[p1]} > ${nums2[p2]}. Place ${nums1[p1]} at p. Move p1 and p.`);
      p1--;
    } else {
      nums1[p] = nums2[p2];
      algo.updateMemory('nums1', [...nums1]);
      algo.updatePointer('p', p, 'write');
      algo.step(33, `${p1 >= 0 ? nums1[p1] : 'empty'} <= ${nums2[p2]}. Place ${nums2[p2]} at p. Move p2 and p.`);
      p2--;
    }
    p--;
    algo.updatePointer('p1', p1);
    algo.updatePointer('p2', p2);
    algo.updatePointer('p', p);
  }

  algo.complete('Done. nums2 is exhausted.');
  return algo.getTrace();
}
