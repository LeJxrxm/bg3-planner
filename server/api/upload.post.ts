import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const files = await readMultipartFormData(event)
  if (!files || files.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No file uploaded'
    })
  }

  const file = files[0]
  if (!file.filename) {
     throw createError({ statusCode: 400, statusMessage: 'Filename missing' })
  }

  // Validation
  const MAX_SIZE = 2 * 1024 * 1024 // 2MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

  if (file.data.length > MAX_SIZE) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File too large (max 2MB)'
    })
  }

  if (!file.type || !ALLOWED_TYPES.includes(file.type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid file type. Only JPEG, PNG, WebP and GIF are allowed'
    })
  }

  const ext = file.filename.split('.').pop()?.toLowerCase()
  if (!ext || !['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
     throw createError({ statusCode: 400, statusMessage: 'Invalid file extension' })
  }

  const safeFileName = `${randomUUID()}.${ext}`
  
  // Save to public/uploads in dev, .output/public/uploads in production
  // @ts-ignore
  const uploadDir = process.env.NODE_ENV === 'production' 
    ? join(process.cwd(), '.output', 'public', 'uploads')
    : join(process.cwd(), 'public', 'uploads')
  
  await mkdir(uploadDir, { recursive: true })
  
  const filePath = join(uploadDir, safeFileName)
  await writeFile(filePath, file.data)

  return {
    url: `/uploads/${safeFileName}`
  }
})
