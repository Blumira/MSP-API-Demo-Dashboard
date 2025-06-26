import { NextResponse } from "next/server"

const AUTH_URL = "https://auth.blumira.com/oauth/token"
const API_BASE_URL = "https://api.blumira.com/public-api/v1"

async function getAccessToken() {
  const clientId = process.env.BLUMIRA_CLIENT_ID
  const clientSecret = process.env.BLUMIRA_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("BLUMIRA_CLIENT_ID and BLUMIRA_CLIENT_SECRET environment variables are required")
  }

  console.log("Attempting authentication with Blumira API...")

  const payload = {
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    audience: "public-api",
  }

  try {
    const response = await fetch(AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    console.log("Auth response status:", response.status)
    console.log("Auth response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      console.error("Auth response body:", responseText)
      throw new Error(`Authentication failed (${response.status}): ${responseText || response.statusText}`)
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Failed to parse auth response:", responseText)
      throw new Error("Invalid JSON response from authentication endpoint")
    }

    if (!data.access_token) {
      console.error("No access token in response:", data)
      throw new Error("No access token received from authentication endpoint")
    }

    console.log("Authentication successful")
    return data.access_token
  } catch (error) {
    console.error("Authentication error:", error)
    throw error
  }
}

async function fetchMspAccounts(token: string) {
  console.log("Fetching MSP accounts...")

  try {
    const response = await fetch(`${API_BASE_URL}/msp/accounts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })

    const responseText = await response.text()
    console.log("MSP accounts response status:", response.status)

    if (!response.ok) {
      console.error("MSP accounts response:", responseText)
      throw new Error(`Failed to fetch MSP accounts (${response.status}): ${responseText || response.statusText}`)
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Failed to parse MSP accounts response:", responseText)
      throw new Error("Invalid JSON response from MSP accounts endpoint")
    }

    console.log("MSP accounts fetched successfully, count:", data.data?.length || 0)
    return data.data || []
  } catch (error) {
    console.error("MSP accounts fetch error:", error)
    throw error
  }
}

async function fetchAllFindings(token: string) {
  console.log("Fetching findings...")

  try {
    const response = await fetch(`${API_BASE_URL}/msp/accounts/findings`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })

    const responseText = await response.text()
    console.log("Findings response status:", response.status)

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("Permission denied to fetch findings. Please check your API permissions.")
      }
      console.error("Findings response:", responseText)
      throw new Error(`Failed to fetch findings (${response.status}): ${responseText || response.statusText}`)
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Failed to parse findings response:", responseText)
      throw new Error("Invalid JSON response from findings endpoint")
    }

    console.log("Findings fetched successfully, count:", data.data?.length || 0)
    return data.data || []
  } catch (error) {
    console.error("Findings fetch error:", error)
    throw error
  }
}

export async function GET() {
  try {
    console.log("Dashboard API called")
    console.log("Environment check - Client ID exists:", !!process.env.BLUMIRA_CLIENT_ID)
    console.log("Environment check - Client Secret exists:", !!process.env.BLUMIRA_CLIENT_SECRET)

    const token = await getAccessToken()

    // Try to fetch accounts first, then findings
    let accounts = []
    let findings = []

    try {
      accounts = await fetchMspAccounts(token)
    } catch (accountsError) {
      console.warn("Failed to fetch accounts, continuing with findings:", accountsError)
    }

    try {
      findings = await fetchAllFindings(token)
    } catch (findingsError) {
      console.warn("Failed to fetch findings:", findingsError)
      // Don't throw here, return what we have
    }

    console.log("Dashboard API completed successfully")
    return NextResponse.json({
      accounts,
      findings,
      debug: {
        accountsCount: accounts.length,
        findingsCount: findings.length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Dashboard API error:", error)

    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    const errorDetails = {
      message: errorMessage,
      timestamp: new Date().toISOString(),
      hasClientId: !!process.env.BLUMIRA_CLIENT_ID,
      hasClientSecret: !!process.env.BLUMIRA_CLIENT_SECRET,
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 },
    )
  }
}
