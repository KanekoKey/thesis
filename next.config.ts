import type { NextConfig } from "next";
import { execSync } from "child_process";
import packageJson from "./package.json";

function resolveCommitSha(): string {
  if (process.env.AWS_COMMIT_ID) return process.env.AWS_COMMIT_ID;
  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    NEXT_PUBLIC_COMMIT_SHA: resolveCommitSha(),
    NEXT_PUBLIC_BRANCH: process.env.AWS_BRANCH ?? "local",
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
