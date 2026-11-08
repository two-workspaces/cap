// Sets the bucket's CORS rule for WEB_URL. Uses the S3 client Cap ships.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { S3Client, PutBucketCorsCommand } = require(process.env.AWS_SDK_PATH);

const origin = (process.env.WEB_URL || "").replace(/\/+$/, "");
const endpoint = process.env.S3_INTERNAL_ENDPOINT || process.env.S3_PUBLIC_ENDPOINT;
const origins = [origin, process.env.CAP_EXTRA_CORS_ORIGINS]
  .filter(Boolean)
  .flatMap((o) => o.split(","))
  .map((o) => o.trim())
  .filter(Boolean);

const client = new S3Client({
  region: process.env.CAP_AWS_REGION || "auto",
  endpoint,
  forcePathStyle: process.env.S3_PATH_STYLE === "true",
  credentials: {
    accessKeyId: process.env.CAP_AWS_ACCESS_KEY,
    secretAccessKey: process.env.CAP_AWS_SECRET_KEY,
  },
});

await client.send(
  new PutBucketCorsCommand({
    Bucket: process.env.CAP_AWS_BUCKET,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: origins.length ? origins : ["*"],
          AllowedMethods: ["GET", "HEAD", "PUT", "POST"],
          AllowedHeaders: ["*"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }),
);
console.log(`railway: bucket CORS allows ${origins.join(", ") || "*"}`);
