/**
 * Schema 再导出
 *
 * 这个文件是 studio 和 visualizer 之间 schema 的"共享入口"。
 * 保持一个薄薄的转发层，避免两边拷贝类型定义。
 */
export * from '../../visualizer/src/schema/types';
export { EXAMPLE_SCRIPT } from '../../visualizer/src/schema/example';
