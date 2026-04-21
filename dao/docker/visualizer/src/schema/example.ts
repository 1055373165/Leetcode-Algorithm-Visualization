import type { TopicScript } from './types';

/**
 * 标准范例脚本 · 以 epoll 为主题
 *
 * 两个用途：
 *   1. 作为 LLM prompt 中的 few-shot 示范——让 LLM 学到"好脚本长什么样"
 *   2. 作为 GenericScenePlayer 的默认 fallback，当没有脚本时就播这个
 *
 * 选 epoll 因为它恰好能自然用到 counterfactual / data_structure /
 * kernel_journey / insight 四种场景，是好教学样本。
 */
export const EXAMPLE_SCRIPT: TopicScript = {
  id: 'epoll',
  topic: 'epoll',
  title: 'epoll · 从轮询到事件通知',
  subtitle: '为什么它能扛住百万级连接',
  kicker: 'LINUX · I/O 多路复用',
  scenes: [
    {
      type: 'counterfactual',
      duration: 5,
      kicker: 'BEFORE',
      heading: '没有 epoll 之前',
      problemStatement:
        'select / poll 每次调用，都要把整个 fd 集合从用户态拷贝到内核态。',
      consequence:
        '10 万连接时，每次调用要拷贝 10 万个 fd。内核和用户态反复扫描同一组 fd，且 99% 的时间里它们什么都没发生。',
      transition: 'epoll 把这件事从"每次询问"改成了"事件通知"。',
    },
    {
      type: 'data_structure',
      duration: 8,
      kicker: 'MECHANISM',
      heading: 'epoll 的内核结构',
      reveal: 'sequential',
      nodes: [
        {
          id: 'app',
          label: '应用进程',
          subLabel: 'epoll_ctl / epoll_wait',
          tone: 'primary',
        },
        {
          id: 'epfd',
          label: 'epoll 实例',
          subLabel: '每个 epoll_create 产生一个',
          tone: 'secondary',
          kernel: true,
        },
        {
          id: 'rbtree',
          label: '红黑树',
          subLabel: '管理被监听的 fd，O(log N)',
          tone: 'secondary',
          kernel: true,
        },
        {
          id: 'ready',
          label: '就绪链表',
          subLabel: '事件发生时被内核主动填充',
          tone: 'accent',
          kernel: true,
        },
      ],
      edges: [
        { from: 'app', to: 'epfd', kind: 'references', label: 'epfd' },
        { from: 'epfd', to: 'rbtree', kind: 'contains', label: '被监听 fd' },
        { from: 'epfd', to: 'ready', kind: 'contains', label: '就绪 fd' },
      ],
    },
    {
      type: 'kernel_journey',
      duration: 9,
      kicker: 'FLOW',
      heading: '一个数据包到来时内核做了什么',
      userAction: 'tcp_data_ready()  //  网卡驱动通知内核有数据',
      steps: [
        {
          title: '1. 内核发现对应 fd 有新数据可读',
          description:
            '协议栈处理完数据包，知道这些字节属于 socket fd N。',
        },
        {
          title: '2. 查找 fd 是否在某个 epoll 实例里',
          description:
            '通过 socket 结构体的回调注册关系，找到关联的 epoll 实例。',
          code: 'ep_poll_callback()',
        },
        {
          title: '3. 把 fd 加入就绪链表',
          description:
            '不需要遍历——这个 fd 被直接 append 到就绪链表。',
        },
        {
          title: '4. 唤醒 epoll_wait 阻塞的进程',
          description:
            '进程从睡眠队列被移除，回到运行队列。下次调度到它时，epoll_wait 返回。',
        },
      ],
    },
    {
      type: 'timeline',
      duration: 6,
      kicker: 'COMPARISON',
      heading: 'select vs epoll · 10 万连接下的一次查询',
      unit: 'μs',
      segments: [
        {
          label: 'select: 拷贝 fd 集合',
          weight: 0.4,
          tone: 'blocked',
          note: '每次都要做',
        },
        {
          label: 'select: 内核遍历所有 fd',
          weight: 0.5,
          tone: 'blocked',
          note: '不论是否有事件',
        },
        {
          label: 'select: 返回结果',
          weight: 0.1,
          tone: 'neutral',
        },
      ],
    },
    {
      type: 'insight',
      duration: 5,
      kicker: 'THE KEY INSIGHT',
      insight:
        'epoll 的本质不是"更快地轮询"，而是"让内核主动告诉你谁就绪了"。',
      supporting:
        '从 O(n) 的扫描退化到 O(1) 的事件推送——这是从"问"到"被通知"的范式转变。',
      openQuestion:
        '如果 epoll 这么好，为什么 FreeBSD 选择 kqueue，Windows 选择 IOCP？它们解决的是同一问题吗？',
    },
  ],
  meta: {
    createdAt: '2025-01-01T00:00:00Z',
    schemaVersion: 1,
  },
};
