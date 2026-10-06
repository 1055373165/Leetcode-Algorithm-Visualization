import {makeProject} from '@motion-canvas/core';
import deque from '../../motion-canvas/scenes/deque?scene';

export default makeProject({
  scenes: [deque],
  variables: {
    nums: [1, 3, -1, -3, 5, 3, 6, 7],
    k: 3,
  },
});
