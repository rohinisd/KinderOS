import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function getS3Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

const BUCKET = process.env.R2_BUCKET_NAME ?? 'kinderos-files'
const PUBLIC_URL = process.env.R2_PUBLIC_URL ?? ''

function buildKey(schoolId: string, folder: string, fileName: string): string {
  return `${schoolId}/${folder}/${Date.now()}-${fileName}`
}

export async function uploadFile(params: {
  schoolId: string
  folder: 'photos' | 'documents' | 'receipts' | 'reports' | 'gallery'
  fileName: string
  body: Buffer | Uint8Array
  contentType: string
}): Promise<string> {
  const key = buildKey(params.schoolId, params.folder, params.fileName)
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: params.body,
      ContentType: params.contentType,
    })
  )
  return `${PUBLIC_URL}/${key}`
}

export async function deleteFile(key: string): Promise<void> {
  await getS3Client().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

export async function getPresignedUploadUrl(params: {
  schoolId: string
  folder: string
  fileName: string
  contentType: string
  expiresIn?: number
}): Promise<{ url: string; key: string }> {
  const key = buildKey(params.schoolId, params.folder, params.fileName)
  const url = await getSignedUrl(
    getS3Client(),
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: params.contentType,
    }),
    { expiresIn: params.expiresIn ?? 600 }
  )
  return { url, key }
}

export function urlToKey(url: string): string {
  return url.replace(`${PUBLIC_URL}/`, '')
}
