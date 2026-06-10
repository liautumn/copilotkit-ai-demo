import 'dotenv/config'

import { createOpenAI } from '@ai-sdk/openai'
import { BuiltInAgent, CopilotRuntime } from '@copilotkit/runtime/v2'
import { createCopilotExpressHandler } from '@copilotkit/runtime/v2/express'
import express from 'express'

const basePath = '/api/copilotkit'
const port = Number(process.env.SERVER_PORT ?? 4000)
const apiKey = process.env.OPENAI_API_KEY?.trim()
const baseURL = process.env.OPENAI_BASE_URL?.trim() || undefined
const modelName = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
const apiMode = process.env.OPENAI_API_MODE?.trim().toLowerCase() === 'responses' ? 'responses' : 'chat'

if (!apiKey) {
  console.warn('未设置 OPENAI_API_KEY。发送聊天请求前，请先在 .env 中配置。')
}

const openai = createOpenAI({
  apiKey,
  baseURL,
})

const model = apiMode === 'responses' ? openai.responses(modelName) : openai.chat(modelName)

const runtime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model,
      maxSteps: 12,
      prompt:
        '你是嵌入 CopilotKit Vue 演示项目的中文业务流程助手。请默认用简体中文回答，表达简洁清晰。遇到跨页面流程需求时，按用户意图连续调用可用工具：导航页面、填写 A/B 页面、执行页面校验、提交审批、处理审批并查看统计。工具执行后简要说明已完成的节点和下一步。',
    }),
  },
})

const app = express()

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    model: modelName,
    apiMode,
    runtime: basePath,
  })
})

app.use(
  createCopilotExpressHandler({
    runtime,
    basePath,
    cors: true,
  }),
)

app.listen(port, () => {
  console.log(`CopilotKit runtime 已启动：http://localhost:${port}${basePath}`)
  console.log(`OpenAI 兼容接口：${baseURL ?? 'https://api.openai.com/v1'}（${apiMode}）`)
})
