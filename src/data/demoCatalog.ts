export type DemoLink = {
  slug: string
  title: string
  category: string
  summary: string
  docsUrl: string
}

export const demoLinks: DemoLink[] = [
  {
    slug: 'chat',
    title: '内联聊天',
    category: '预置界面',
    summary: '使用 Vue 原生 CopilotKit 组件渲染页面内聊天。',
    docsUrl: 'https://docs.copilotkit.ai/built-in-agent/prebuilt-components',
  },
  {
    slug: 'sidebar',
    title: '侧边栏助手',
    category: '预置界面',
    summary: '在业务页面旁挂载可折叠的助手侧边栏。',
    docsUrl: 'https://docs.copilotkit.ai/built-in-agent/prebuilt-components',
  },
  {
    slug: 'popup',
    title: '浮动弹窗',
    category: '预置界面',
    summary: '按需打开的悬浮聊天入口。',
    docsUrl: 'https://docs.copilotkit.ai/built-in-agent/prebuilt-components',
  },
  {
    slug: 'frontend-tools',
    title: '前端工具',
    category: '应用控制',
    summary: '注册 Vue 侧工具，让 Agent 调用并更新本地界面状态。',
    docsUrl: 'https://docs.copilotkit.ai/frontend-tools',
  },
  {
    slug: 'business',
    title: '续约流程工作台',
    category: '业务场景',
    summary: '测试 Agent 推进流程节点、完成流程动作，并实时更新业务统计。',
    docsUrl: 'https://docs.copilotkit.ai/frontend-tools',
  },
  {
    slug: 'tool-rendering',
    title: '工具渲染',
    category: '生成式界面',
    summary: '用自定义 Vue 组件渲染 Agent 的工具调用结果。',
    docsUrl: 'https://docs.copilotkit.ai/generative-ui/tool-rendering',
  },
  {
    slug: 'shared-state',
    title: '共享状态',
    category: '应用控制',
    summary: '把响应式应用状态共享给 Agent，并接收状态快照。',
    docsUrl: 'https://docs.copilotkit.ai/shared-state',
  },
  {
    slug: 'agent-context',
    title: 'Agent 上下文',
    category: '应用控制',
    summary: '每次运行 Agent 时附带当前 Vue 页面上下文。',
    docsUrl: 'https://docs.copilotkit.ai/built-in-agent/agent-app-context',
  },
  {
    slug: 'programmatic-control',
    title: '编程控制',
    category: '自定义体验',
    summary: '通过 Vue 按钮、useAgent 和 useCopilotKit 主动驱动 Agent。',
    docsUrl: 'https://docs.copilotkit.ai/built-in-agent/programmatic-control',
  },
  {
    slug: 'suggestions',
    title: '建议提示',
    category: '聊天体验',
    summary: '为聊天线程配置固定提示建议。',
    docsUrl: 'https://github.com/CopilotKit/CopilotKit/tree/main/packages/vue',
  },
  {
    slug: 'interrupt',
    title: '人工确认',
    category: '应用控制',
    summary: '暂停 Agent 流程，并通过 Vue 插槽完成确认。',
    docsUrl: 'https://docs.copilotkit.ai/human-in-the-loop',
  },
  {
    slug: 'inspector',
    title: '调试面板',
    category: '观察调试',
    summary: '在 Vue 页面中挂载 CopilotKit 调试器。',
    docsUrl: 'https://docs.copilotkit.ai/inspector',
  },
]

export const demoGroups = demoLinks.reduce<Record<string, DemoLink[]>>((groups, demo) => {
  groups[demo.category] ??= []
  groups[demo.category]!.push(demo)
  return groups
}, {})
