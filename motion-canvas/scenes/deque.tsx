import {Line, Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, chain, createRef, easeInOutCubic, useScene, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {buildLesson, scanTransitionText} from '../model/lesson';

const C = {
  paper: '#F3F1E9', ink: '#233C37', muted: '#697870', line: '#D4DBD1',
  green: '#246653', pale: '#DCEADF', amber: '#AB622D', sand: '#F0DEC3',
  red: '#AC4D3E', redPale: '#F1DED5', white: '#FBFAF5', panel: '#E7EBE2',
};
const font = '"Avenir Next", "PingFang SC", "Microsoft YaHei", sans-serif';

export default makeScene2D(function* (view) {
  const input = useScene().variables.get('nums', [1, 3, -1, -3, 5, 3, 6, 7])();
  const k = useScene().variables.get('k', 3)();
  const lesson = buildLesson(input, k);
  const {nums} = lesson.trace;
  view.fill(C.paper);

  const pitch = Math.min(130, 1120 / nums.length);
  const xAt = (index: number) => -805 + pitch / 2 + index * pitch;
  const arrayY = -155;
  const queueY = 115;
  const resultY = 350;
  const cellWidth = Math.min(106, pitch - 14);
  const source: Rect[] = [];
  const tokens: Rect[] = [];
  const results: Txt[] = [];
  const windowBox = createRef<Rect>();
  const pointer = createRef<Line>();
  const panel = createRef<Node>();
  const eyebrow = createRef<Txt>();
  const heading = createRef<Txt>();
  const body = createRef<Txt>();
  const detail = createRef<Txt>();
  const checkpoint = createRef<Txt>();
  const progress = createRef<Rect>();
  const counter = createRef<Txt>();
  const empty = createRef<Txt>();
  const structure = createRef<Node>();

  view.add(<>
    <Txt text="ALGORITHM / MOTION STUDY 01" fontFamily={font} fontSize={19} letterSpacing={3} fill={C.green} x={-840} y={-466} offset={[-1, 0]} />
    <Txt text="滑动窗口最大值" fontFamily={font} fontSize={52} fontWeight={650} fill={C.ink} x={-840} y={-399} offset={[-1, 0]} />
    <Txt text="239 / MONOTONIC DEQUE" fontFamily={font} fontSize={19} fill={C.muted} x={870} y={-449} offset={[1, 0]} />
    <Txt text={`窗口大小 ${k}   ·   存下标，比较值`} fontFamily={font} fontSize={23} fill={C.muted} x={870} y={-398} offset={[1, 0]} />
    <Line points={[[-840, -335], [870, -335]]} stroke={C.line} lineWidth={2} />
    <Node ref={structure} opacity={0}>
      <Txt text="01  原数组" fontFamily={font} fontSize={21} fill={C.muted} x={-810} y={-285} offset={[-1, 0]} />
      <Txt text="窗口右移，原数组不变" fontFamily={font} fontSize={18} fill={C.muted} x={290} y={-285} offset={[1, 0]} />
      <Rect ref={windowBox} x={xAt(0)} y={arrayY} width={cellWidth + 18} height={116} radius={14} fill={C.pale} stroke={C.green} lineWidth={2} opacity={0} />
      {nums.map((value, index) => <Rect ref={node => {source[index] = node;}} x={xAt(index)} y={arrayY} width={cellWidth} height={88} radius={9} fill={C.white} stroke={C.line} lineWidth={1.5}>
        <Txt text={String(value)} y={-8} fontFamily={font} fontSize={34} fontWeight={600} fill={C.ink} />
        <Txt text={`i = ${index}`} y={24} fontFamily={font} fontSize={15} fill={C.muted} />
      </Rect>)}
      <Line ref={pointer} x={xAt(0)} y={-244} points={[[0, 0], [0, 26]]} endArrow arrowSize={10} lineWidth={3} stroke={C.amber} opacity={0} />
      <Line points={[[-805, -38], [310, -38]]} stroke={C.line} lineWidth={1.5} />
      <Txt text="02  候选队列" fontFamily={font} fontSize={21} fill={C.muted} x={-810} y={5} offset={[-1, 0]} />
      <Txt text="原数组的下标引用" fontFamily={font} fontSize={18} fill={C.muted} x={290} y={5} offset={[1, 0]} />
      {Array.from({length: k}, (_, i) => <Rect x={xAt(i)} y={queueY} width={cellWidth} height={88} radius={9} stroke={C.line} lineWidth={2} lineDash={[5, 7]} />)}
      <Txt ref={empty} text="等待第一个候选" fontFamily={font} fontSize={20} fill={C.muted} x={xAt(0) + 160} y={queueY} />
      <Txt text="HEAD / 队头" fontFamily={font} fontSize={16} fill={C.green} x={xAt(0)} y={191} />
      <Txt ref={checkpoint} text="准备开始" fontFamily={font} fontSize={19} fill={C.muted} x={-805} y={244} offset={[-1, 0]} />
      <Line points={[[-805, 277], [310, 277]]} stroke={C.line} lineWidth={1.5} />
      <Txt text="03  窗口答案" fontFamily={font} fontSize={21} fill={C.muted} x={-810} y={306} offset={[-1, 0]} />
      {lesson.trace.result.map((_, i) => <Rect x={xAt(i)} y={resultY + 28} width={cellWidth} height={64} radius={8} fill={C.panel}>
        <Txt ref={node => {results[i] = node;}} text="—" fontFamily={font} fontSize={29} fill={C.muted} />
      </Rect>)}
    </Node>
    <Rect x={652} y={38} width={444} height={672} radius={14} fill={C.panel} />
    <Node ref={panel} x={465} y={-245}>
      <Txt ref={eyebrow} text="建立直觉" width={370} fontFamily={font} fontSize={19} letterSpacing={2} fill={C.green} offset={[-1, -1]} />
      <Txt ref={heading} text="" y={61} width={374} fontFamily={font} fontSize={33} lineHeight={47} fontWeight={600} textWrap fill={C.ink} offset={[-1, -1]} />
      <Txt ref={body} text="" y={261} width={374} fontFamily={font} fontSize={25} lineHeight={39} textWrap fill={C.ink} offset={[-1, -1]} />
      <Line y={421} points={[[0, 0], [374, 0]]} stroke={C.line} lineWidth={2} />
      <Txt ref={detail} text="" y={445} width={374} fontFamily={font} fontSize={20} lineHeight={32} textWrap fill={C.muted} offset={[-1, -1]} />
    </Node>
    <Line points={[[-840, 460], [870, 460]]} stroke={C.line} lineWidth={2} />
    <Rect ref={progress} x={-840} y={460} offset={[-1, 0]} width={0} height={3} fill={C.green} />
    <Txt text="观察 → 判断 → 操作 → 验证" fontFamily={font} fontSize={18} fill={C.muted} x={-840} y={499} offset={[-1, 0]} />
    <Txt ref={counter} text="" fontFamily={font} fontSize={18} fill={C.muted} x={870} y={499} offset={[1, 0]} />
  </>);

  for (let i = 0; i < nums.length; i++) {
    const token = <Rect x={xAt(i)} y={arrayY} width={cellWidth} height={88} radius={9} fill={C.green} opacity={0}>
      <Txt text={String(nums[i])} y={-8} fontFamily={font} fontSize={34} fontWeight={600} fill={C.white} />
      <Txt text={`i = ${i}`} y={24} fontFamily={font} fontSize={15} fill={C.white} />
    </Rect>;
    tokens.push(token as Rect);
    view.add(token);
  }

  for (const [beatIndex, beat] of lesson.beats.entries()) {
    yield* panel().opacity(0, 0.12);
    const event = beat.event;
    const transition = event?.kind === 'scan' ? scanTransitionText(event, nums, k) : null;
    heading().text(transition?.heading ?? beat.heading);
    body().text(transition?.body ?? beat.body);
    detail().text(beat.kind === 'transfer' ? '暂停视频，先用自己的话说清楚，再继续看提示。' : beat.detail);
    const color = event?.kind === 'expire' ? C.red : event?.kind === 'prune' ? C.amber : C.green;
    eyebrow().fill(color);
    eyebrow().text(beat.kind === 'predict' ? '暂停自测 / 先判断' : beat.kind === 'recap' ? '复杂度 / 回看因果' : beat.kind === 'transfer' ? '迁移练习 / 不背模板' : event ? ({scan: '观察 / 扫描', expire: '出口一 / 过期', prune: '出口二 / 被支配', append: '操作 / 入队', collect: '验证 / 输出'}[event.kind]) : '建立直觉 / 候选机制');
    counter().text(`${String(beatIndex + 1).padStart(2, '0')} / ${lesson.beats.length}   ·   ${event ? `扫描 ${event.index + 1} / ${nums.length}` : '个人学习样片'}`);
    const motions: ThreadGenerator[] = [panel().opacity(1, 0.18), progress().width(1710 * (beatIndex + 1) / lesson.beats.length, beat.motionSeconds, easeInOutCubic)];

    if (beat.kind === 'intro') motions.push(structure().opacity(1, beat.motionSeconds));
    if (event) {
      checkpoint().text('状态过渡中 · 动作结束后检查候选');
      checkpoint().fill(C.muted);
      if (event.kind === 'scan') {
        motions.push(
          pointer().opacity(1, 0.2),
          pointer().x(xAt(event.index), beat.motionSeconds, easeInOutCubic),
          windowBox().opacity(1, 0.2),
          windowBox().x((xAt(event.left) + xAt(event.index)) / 2, beat.motionSeconds, easeInOutCubic),
          windowBox().width((event.index - event.left) * pitch + cellWidth + 18, beat.motionSeconds, easeInOutCubic),
        );
        source.forEach((cell, index) => motions.push(cell.fill(index === event.index ? C.sand : index >= event.left && index <= event.index ? C.white : C.paper, beat.motionSeconds)));
      }
      if (event.kind === 'expire' || event.kind === 'prune') {
        const token = tokens[event.subject];
        motions.push(chain(
          token.fill(color, 0.15),
          all(token.y(queueY + 40, 0.3, easeInOutCubic), token.opacity(0, 0.3)),
          all(...event.after.deque.map((index, slot) => tokens[index].x(xAt(slot), 0.15, easeInOutCubic))),
        ));
      }
      if (event.kind === 'append') {
        empty().opacity(0);
        const token = tokens[event.subject];
        token.position([xAt(event.subject), arrayY]);
        motions.push(token.opacity(1, 0.2), token.position([xAt(event.after.deque.length - 1), queueY], beat.motionSeconds, easeInOutCubic));
      }
      if (event.kind === 'collect') {
        const slot = event.after.result.length - 1;
        const answer = results[slot];
        answer.text(String(nums[event.subject]));
        answer.fill(C.green);
        answer.opacity(0);
        const copy = <Txt text={String(nums[event.subject])} fontFamily={font} fontSize={34} fontWeight={600} fill={C.green} x={xAt(0)} y={queueY - 8} /> as Txt;
        view.add(copy);
        motions.push(copy.position([xAt(slot), resultY + 28], beat.motionSeconds, easeInOutCubic));
        yield* all(...motions);
        copy.remove();
        answer.opacity(1);
        checkpoint().text('维护完成 · 有效下标 / 对应值严格递减');
        checkpoint().fill(C.green);
        yield* waitFor(beat.duration - beat.motionSeconds - 0.12);
        continue;
      }
    }

    yield* all(...motions);
    if (transition) {
      heading().text(beat.heading);
      body().text(beat.body);
    }
    if (event) {
      checkpoint().text(event.invariantReady ? '维护完成 · 有效下标 / 对应值严格递减' : '维护进行中 · 先处理候选，再读取答案');
      checkpoint().fill(event.invariantReady ? C.green : C.muted);
    }
    if (beat.kind === 'transfer') {
      yield* waitFor(3);
      detail().text(beat.detail);
      yield* waitFor(beat.duration - beat.motionSeconds - 0.12 - 3);
    } else {
      yield* waitFor(beat.duration - beat.motionSeconds - 0.12);
    }
  }
});
