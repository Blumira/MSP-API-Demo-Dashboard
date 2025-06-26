import { NextResponse } from "next/server"

export async function GET() {
  const clientId = process.env.BLUMIRA_CLIENT_ID
  const clientSecret = process.env.BLUMIRA_CLIENT_SECRET

  return NextResponse.json({
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    clientIdLength: clientId?.length || 0,
    clientSecretLength: clientSecret?.length || 0,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
}
