import {
  AbstractAgent,
  EventType,
  type BaseEvent,
  type Message,
  type RunAgentInput,
  type State,
} from '@copilotkit/vue/v2'
import { Observable } from 'rxjs'

type DemoEvent = BaseEvent & { timestamp?: number }

const initialMessages: Message[] = [
  {
    id: 'demo-welcome',
    role: 'assistant',
    content:
      '这是本地 Vue 演示 Agent，可以流式输出文本、调用前端工具、渲染工具事件、共享状态，并在需要时等待人工输入。',
  },
]

const initialState: State = {
  workspace: 'CopilotKit Vue 演示',
  status: '就绪',
  activeTicket: 'CK-2048',
  selectedTheme: 'Graphite',
  todos: ['检查 Vue 绑定', '打开一个演示路由'],
}

function id(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
}

function messageText(message: Message | undefined): string {
  if (!message || !('content' in message)) return ''
  const content = message.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (part && typeof part === 'object' && 'type' in part && part.type === 'text') {
          return 'text' in part ? String(part.text) : ''
        }
        return ''
      })
      .join(' ')
  }
  return ''
}

function latestUserText(input: RunAgentInput) {
  return messageText([...input.messages].reverse().find((message) => message.role === 'user'))
}

function latestToolResult(input: RunAgentInput) {
  return [...input.messages].reverse().find((message) => message.role === 'tool')
}

function contextSummary(input: RunAgentInput) {
  if (!input.context?.length) return '本轮没有注册 Vue 上下文。'

  return input.context
    .map((entry) => `${entry.description}: ${JSON.stringify(entry.value)}`)
    .join('\n')
}

function chunkText(text: string, size = 42) {
  const chunks: string[] = []
  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size))
  }
  return chunks
}

export class CopilotVueDemoAgent extends AbstractAgent {
  constructor() {
    super({
      agentId: 'default',
      description: 'Local mock agent for CopilotKit Vue demos',
      threadId: 'copilotkit-vue-demo',
      initialMessages,
      initialState,
    })
  }

  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable<BaseEvent>((subscriber) => {
      const timers: ReturnType<typeof setTimeout>[] = []
      let elapsed = 0

      const emit = (event: DemoEvent, delay = 120) => {
        elapsed += delay
        const timer = setTimeout(() => {
          subscriber.next({ timestamp: Date.now(), ...event })
        }, elapsed)
        timers.push(timer)
      }

      const finish = (result?: unknown) => {
        emit(
          {
            type: EventType.RUN_FINISHED,
            threadId: input.threadId,
            runId: input.runId,
            outcome: { type: 'success' },
            result,
          } as DemoEvent,
          120,
        )
        const timer = setTimeout(() => subscriber.complete(), elapsed + 40)
        timers.push(timer)
      }

      const say = (text: string, delay = 120) => {
        const messageId = id('assistant')
        emit({ type: EventType.TEXT_MESSAGE_START, messageId, role: 'assistant' } as DemoEvent, delay)
        for (const chunk of chunkText(text)) {
          emit({ type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: chunk } as DemoEvent, 80)
        }
        emit({ type: EventType.TEXT_MESSAGE_END, messageId } as DemoEvent, 80)
        return messageId
      }

      const tool = (name: string, args: Record<string, unknown>, parentMessageId?: string) => {
        const toolCallId = id('tool')
        emit({
          type: EventType.TOOL_CALL_START,
          toolCallId,
          toolCallName: name,
          parentMessageId,
        } as DemoEvent)
        emit({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId,
          delta: JSON.stringify(args),
        } as DemoEvent)
        emit({ type: EventType.TOOL_CALL_END, toolCallId } as DemoEvent)
        return toolCallId
      }

      const toolWithResult = (
        name: string,
        args: Record<string, unknown>,
        result: Record<string, unknown>,
        parentMessageId?: string,
      ) => {
        const toolCallId = tool(name, args, parentMessageId)
        emit({
          type: EventType.TOOL_CALL_RESULT,
          messageId: id('tool-result'),
          role: 'tool',
          toolCallId,
          content: JSON.stringify(result),
        } as DemoEvent)
      }

      emit({
        type: EventType.RUN_STARTED,
        threadId: input.threadId,
        runId: input.runId,
        input,
      } as DemoEvent, 20)

      const forwardedCommand = input.forwardedProps?.command as
        | { resume?: unknown; interruptEvent?: unknown }
        | undefined

      if (forwardedCommand?.resume) {
        say(
          `已收到人工输入：${JSON.stringify(forwardedCommand.resume)}。暂停的 Vue 工作流现在可以继续。`,
        )
        finish({ resumed: true })
        return () => timers.forEach(clearTimeout)
      }

      const toolResult = latestToolResult(input)
      if (toolResult) {
        say(`前端工具已完成，返回结果：${messageText(toolResult)}。`)
        emit({
          type: EventType.STATE_SNAPSHOT,
          snapshot: {
            ...input.state,
            status: '已收到工具结果',
            lastToolResult: messageText(toolResult),
          },
        } as DemoEvent)
        finish({ handledToolResult: true })
        return () => timers.forEach(clearTimeout)
      }

      const prompt = latestUserText(input).toLowerCase()

      if (
        prompt.includes('interrupt') ||
        prompt.includes('approval') ||
        prompt.includes('approve') ||
        prompt.includes('审批') ||
        prompt.includes('批准') ||
        prompt.includes('人工')
      ) {
        say('继续这个工作流之前，我需要一次人工决策。')
        emit({
          type: EventType.CUSTOM,
          name: 'on_interrupt',
          value: {
            title: '审批工作区变更',
            description: 'Agent 想把草稿变更发布到共享 Vue 工作区。',
            requestedBy: 'CopilotKit Vue 演示 Agent',
          },
        } as DemoEvent)
        finish({ waitingForHuman: true })
        return () => timers.forEach(clearTimeout)
      }

      if (prompt.includes('theme') || prompt.includes('color') || prompt.includes('主题') || prompt.includes('颜色')) {
        const messageId = say('我会调用一个 Vue 前端工具来切换工作区主题。')
        tool('setWorkspaceTheme', { theme: 'Mint' }, messageId)
        finish({ tool: 'setWorkspaceTheme' })
        return () => timers.forEach(clearTimeout)
      }

      if (prompt.includes('todo') || prompt.includes('task') || prompt.includes('待办') || prompt.includes('任务')) {
        const messageId = say('我会通过前端工具添加一条本地待办。')
        tool('addTodo', { title: '来自 CopilotKit Vue 演示的跟进事项' }, messageId)
        finish({ tool: 'addTodo' })
        return () => timers.forEach(clearTimeout)
      }

      if (prompt.includes('status') || prompt.includes('ticket') || prompt.includes('状态') || prompt.includes('工单')) {
        const messageId = say('我会通过 Vue 工具更新当前选中的工单。')
        tool('setTicketStatus', { ticketId: 'CK-2048', status: '评审中' }, messageId)
        finish({ tool: 'setTicketStatus' })
        return () => timers.forEach(clearTimeout)
      }

      if (
        prompt.includes('search') ||
        prompt.includes('render') ||
        prompt.includes('tool') ||
        prompt.includes('搜索') ||
        prompt.includes('渲染') ||
        prompt.includes('工具')
      ) {
        const messageId = say('我已经搜索知识库，并用 Vue 组件渲染了这次工具调用。')
        toolWithResult(
          'searchKnowledgeBase',
          { query: 'CopilotKit Vue 工具渲染' },
          {
            matches: [
              'CopilotChatMessageView 暴露工具调用插槽。',
              'useRenderTool 可以为指定工具调用注册 Vue 渲染器。',
              'CopilotPopup 和 CopilotSidebar 共享同一套聊天基础能力。',
            ],
          },
          messageId,
        )
        finish({ tool: 'searchKnowledgeBase' })
        return () => timers.forEach(clearTimeout)
      }

      if (prompt.includes('state') || prompt.includes('状态')) {
        say('我已收到 Vue 应用状态，并发送了一个新的 AG-UI 状态快照。')
        emit({
          type: EventType.STATE_SNAPSHOT,
          snapshot: {
            ...input.state,
            status: '状态已同步',
            activeTicket: 'CK-2048',
            lastPrompt: latestUserText(input),
            syncedAt: new Date().toISOString(),
          },
        } as DemoEvent)
        finish({ stateUpdated: true })
        return () => timers.forEach(clearTimeout)
      }

      if (prompt.includes('context') || prompt.includes('上下文')) {
        say(`本次运行包含这些 Vue 上下文：\n\n${contextSummary(input)}`)
        finish({ contextCount: input.context?.length ?? 0 })
        return () => timers.forEach(clearTimeout)
      }

      if (prompt.includes('reason') || prompt.includes('推理')) {
        const reasoningId = id('reasoning')
        emit({ type: EventType.REASONING_START, messageId: reasoningId } as DemoEvent)
        emit({ type: EventType.REASONING_MESSAGE_START, messageId: reasoningId } as DemoEvent)
        emit({
          type: EventType.REASONING_MESSAGE_CONTENT,
          messageId: reasoningId,
          delta: '这个请求会先映射到本地 mock agent 分支，再映射到 Vue 组件渲染器。',
        } as DemoEvent)
        emit({ type: EventType.REASONING_MESSAGE_END, messageId: reasoningId } as DemoEvent)
        emit({ type: EventType.REASONING_END, messageId: reasoningId } as DemoEvent)
        say('推理消息会由 Vue 聊天组件的推理 fallback 渲染。')
        finish({ reasoning: true })
        return () => timers.forEach(clearTimeout)
      }

      say(
        '这是本地 CopilotKit Vue 演示回复。可以试试“主题 theme”、“待办 todo”、“搜索 search”、“状态 state”、“上下文 context”、“推理 reason”或“审批 approval”。',
      )
      finish({ demo: true })

      return () => timers.forEach(clearTimeout)
    })
  }
}

export const demoAgents = {
  default: new CopilotVueDemoAgent(),
}
