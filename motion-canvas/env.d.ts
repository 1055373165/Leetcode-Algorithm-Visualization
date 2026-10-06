declare module '*?project' {
  import type {Project} from '@motion-canvas/core';
  const project: Project;
  export default project;
}

declare module '*?scene' {
  import type {FullSceneDescription} from '@motion-canvas/core';
  const scene: FullSceneDescription;
  export default scene;
}
