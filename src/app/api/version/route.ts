import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// mainマージ後、本番(Amplify)に実際にどのコミットが反映されているかを確認するためのエンドポイント。
export async function GET() {
  return NextResponse.json({
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'unknown',
    commit: process.env.NEXT_PUBLIC_COMMIT_SHA ?? 'unknown',
    branch: process.env.NEXT_PUBLIC_BRANCH ?? 'unknown',
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME ?? 'unknown',
  });
}
