import { NextResponse } from "next/server"
import { writeFileSync, readFileSync, existsSync } from "fs"
import { join } from "path"

// Simple file-based storage for demo purposes
// In production, you'd want to use a proper database with encryption
const CREDENTIALS_FILE = join(process.cwd(), ".env.local")

export async function GET() {
  try {
    const hasClientId = !!process.env.BLUMIRA_CLIENT_ID
    const hasClientSecret = !!process.env.BLUMIRA_CLIENT_SECRET

    return NextResponse.json({
      hasCredentials: hasClientId && hasClientSecret,
      hasClientId,
      hasClientSecret,
      clientIdLength: process.env.BLUMIRA_CLIENT_ID?.length || 0,
      clientSecretLength: process.env.BLUMIRA_CLIENT_SECRET?.length || 0,
    })
  } catch (error) {
    console.error("Error checking credentials:", error)
    return NextResponse.json({ error: "Failed to check credentials" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { clientId, clientSecret } = await request.json()

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Client ID and Client Secret are required" }, { status: 400 })
    }

    // Validate credentials by attempting to authenticate
    const authResponse = await fetch("https://auth.blumira.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        audience: "public-api",
      }),
    })

    if (!authResponse.ok) {
      const errorText = await authResponse.text()
      return NextResponse.json(
        {
          error: "Invalid credentials",
          details: `Authentication failed: ${errorText}`,
        },
        { status: 401 },
      )
    }

    const authData = await authResponse.json()
    if (!authData.access_token) {
      return NextResponse.json({ error: "Invalid response from authentication server" }, { status: 401 })
    }

    // Update .env.local file
    let envContent = ""
    if (existsSync(CREDENTIALS_FILE)) {
      envContent = readFileSync(CREDENTIALS_FILE, "utf8")
    }

    // Remove existing BLUMIRA credentials
    const lines = envContent
      .split("\n")
      .filter((line) => !line.startsWith("BLUMIRA_CLIENT_ID=") && !line.startsWith("BLUMIRA_CLIENT_SECRET="))

    // Add new credentials
    lines.push(`BLUMIRA_CLIENT_ID=${clientId}`)
    lines.push(`BLUMIRA_CLIENT_SECRET=${clientSecret}`)

    // Write back to file
    writeFileSync(CREDENTIALS_FILE, lines.join("\n"))

    // Update process.env for immediate use
    process.env.BLUMIRA_CLIENT_ID = clientId
    process.env.BLUMIRA_CLIENT_SECRET = clientSecret

    return NextResponse.json({
      success: true,
      message: "Credentials updated successfully",
      hasCredentials: true,
    })
  } catch (error) {
    console.error("Error updating credentials:", error)
    return NextResponse.json({ error: "Failed to update credentials" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    // Remove credentials from .env.local file
    if (existsSync(CREDENTIALS_FILE)) {
      const envContent = readFileSync(CREDENTIALS_FILE, "utf8")
      const lines = envContent
        .split("\n")
        .filter((line) => !line.startsWith("BLUMIRA_CLIENT_ID=") && !line.startsWith("BLUMIRA_CLIENT_SECRET="))
      writeFileSync(CREDENTIALS_FILE, lines.join("\n"))
    }

    // Clear from process.env
    delete process.env.BLUMIRA_CLIENT_ID
    delete process.env.BLUMIRA_CLIENT_SECRET

    return NextResponse.json({
      success: true,
      message: "Credentials removed successfully",
      hasCredentials: false,
    })
  } catch (error) {
    console.error("Error removing credentials:", error)
    return NextResponse.json({ error: "Failed to remove credentials" }, { status: 500 })
  }
}
