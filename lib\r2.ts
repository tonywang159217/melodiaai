import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { PutObjectCommandInput } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 客户端（S3 兼容 API）
 * 所有文件上传/下载都走服务端，避免密钥暴露。
 * R2 免费额度：10GB 存储 / 每月 100 万次读 / 10 万次写。
 */
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const R2 = {
  get bucket() {
    return required("R2_BUCKET_NAME");
  },
  get publicUrl() {
    return process.env.R2_PUBLIC_BUCKET_URL ?? "";
  },

  client() {
    const accountId = required("R2_ACCOUNT_ID");
    return new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: required("R2_ACCESS_KEY_ID"),
        secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
      },
    });
  },

  /** 上传文件（服务端）。Key 建议："{userId}/{trackId}.mp3" */
  async put(key: string, body: PutObjectCommandInput["Body"], contentType = "audio/mpeg") {
    await this.client().send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return this.publicUrl ? `${this.publicUrl.replace(/\/$/, "")}/${key}` : null;
  },

  async delete(key: string) {
    await this.client().send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  },

  /** 获取临时预签名下载 URL（秒） */
  async presignedGet(key: string, expiresInSec = 3600) {
    return getSignedUrl(
      this.client(),
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSec },
    );
  },
};