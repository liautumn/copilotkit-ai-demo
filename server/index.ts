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
        '你是嵌入教务管理系统的中文 AI 助手。请默认用简体中文回答，表达简洁清晰。围绕学生管理和班级管理工作，优先读取当前数据，再按用户意图调用可用工具完成学生 CRUD、班级 CRUD、学生分班、移出班级和页面跳转。工具执行后简要说明已完成的操作和当前结果。',
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
