import { S3Client } from "@aws-sdk/client-s3";

const REQUIRED_VARS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_BASE_URL",
] as const;

function readEnv() {
  const missing = REQUIRED_VARS.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`R2 env missing: ${missing.join(", ")}`);
  }
  return {
    accountId: process.env.R2_ACCOUNT_ID!,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    bucket: process.env.R2_BUCKET!,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL!.replace(/\/+$/, ""),
  };
}

let _client: S3Client | null = null;
let _config: ReturnType<typeof readEnv> | null = null;

function init() {
  if (!_config) {
    _config = readEnv();
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${_config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: _config.accessKeyId,
        secretAccessKey: _config.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }
  return { client: _client!, ..._config };
}

export function r2() {
  return init();
}

export function r2PublicUrl(key: string): string {
  const { publicBaseUrl } = init();
  return `${publicBaseUrl}/${key.replace(/^\/+/, "")}`;
}
