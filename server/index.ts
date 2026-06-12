import 'dotenv/config'

import { createOpenAI } from '@ai-sdk/openai'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { BuiltInAgent, CopilotRuntime } from '@copilotkit/runtime/v2'
import { createCopilotExpressHandler } from '@copilotkit/runtime/v2/express'
import express from 'express'
import multer from 'multer'
import path from 'node:path'

const basePath = '/api/copilotkit'
const port = Number(process.env.SERVER_PORT ?? 4000)
const apiKey = process.env.OPENAI_API_KEY?.trim()
const baseURL = process.env.OPENAI_BASE_URL?.trim() || undefined
const modelName = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
const apiMode = process.env.OPENAI_API_MODE?.trim().toLowerCase() === 'responses' ? 'responses' : 'chat'
const s3Bucket = process.env.S3_BUCKET?.trim()
const s3Endpoint = process.env.S3_ENDPOINT?.trim()
const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID?.trim()
const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim()
const s3Region = process.env.S3_REGION?.trim() || 'us-east-1'
const s3ForcePathStyle = process.env.S3_FORCE_PATH_STYLE?.trim().toLowerCase() !== 'false'
const uploadMaxSize = 10 * 1024 * 1024
const uploadAcceptPattern = /^(application\/pdf|text\/plain|text\/markdown|application\/json|image\/.+)$/

if (!apiKey) {
  console.warn('未设置 OPENAI_API_KEY。发送聊天请求前，请先在 .env 中配置。')
}

if (!s3Bucket || !s3Endpoint || !s3AccessKeyId || !s3SecretAccessKey) {
  console.warn('未完整配置 S3 上传环境变量。使用 CopilotChat 文件上传前，请先配置 S3_*。')
}

const openai = createOpenAI({
  apiKey,
  baseURL,
})

const s3 = s3Endpoint && s3AccessKeyId && s3SecretAccessKey
  ? new S3Client({
      endpoint: s3Endpoint,
      region: s3Region,
      forcePathStyle: s3ForcePathStyle,
      credentials: {
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey,
      },
    })
  : null

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
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: uploadMaxSize,
    files: 1,
  },
})

function safeUploadName(filename: string) {
  const extension = path.extname(filename).toLowerCase()
  const baseName = path
    .basename(filename, extension)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'file'

  return `copilot/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${baseName}${extension}`
}

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    model: modelName,
    apiMode,
    runtime: basePath,
  })
})

app.post('/api/upload', upload.single('file'), async (request, response, next) => {
  try {
    if (!s3 || !s3Bucket) {
      response.status(500).json({ error: 'S3 上传未配置' })
      return
    }

    const file = request.file
    if (!file) {
      response.status(400).json({ error: '缺少文件' })
      return
    }

    if (!uploadAcceptPattern.test(file.mimetype)) {
      response.status(400).json({ error: `不支持的文件类型：${file.mimetype || 'unknown'}` })
      return
    }

    const key = safeUploadName(file.originalname)
    await s3.send(new PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: Buffer.from(file.originalname).toString('base64'),
      },
    }))

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: s3Bucket,
        Key: key,
      }),
      { expiresIn: 60 * 60 },
    )

    response.json({
      url,
      key,
      bucket: s3Bucket,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    })
  } catch (error) {
    next(error)
  }
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
