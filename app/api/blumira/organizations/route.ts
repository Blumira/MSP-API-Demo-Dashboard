import { NextResponse } from "next/server"

const AUTH_URL = "https://auth.blumira.com/oauth/token"
const API_BASE_URL = "https://api.blumira.com/public-api/v1"

async function getAccessToken() {
  const clientId = process.env.BLUMIRA_CLIENT_ID
  const clientSecret = process.env.BLUMIRA_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("BLUMIRA_CLIENT_ID and BLUMIRA_CLIENT_SECRET environment variables are required")
  }

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

    if (!response.ok) {
      const responseText = await response.text()
      throw new Error(`Authentication failed (${response.status}): ${responseText}`)
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error("Authentication error:", error)
    throw error
  }
}

async function fetchAccountDetails(token: string, accountId: string) {
  try {
    console.log(`Fetching details for account ${accountId}`)

    // Fetch specific account details
    let accountDetails = null
    try {
      const accountResponse = await fetch(`${API_BASE_URL}/msp/accounts/${accountId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      if (accountResponse.ok) {
        const accountData = await accountResponse.json()
        if (accountData.status === "OK" && accountData.data) {
          accountDetails = accountData.data
        } else {
          // Handle direct response format (without status wrapper)
          accountDetails = accountData
        }
      } else {
        console.warn(`Failed to fetch account details for ${accountId}:`, accountResponse.status)
      }
    } catch (error) {
      console.warn(`Error fetching account details for ${accountId}:`, error)
    }

    // Fetch agents/devices for this account
    let agentDevices = []
    let agentDevicesMeta = null
    try {
      const agentsResponse = await fetch(`${API_BASE_URL}/msp/accounts/${accountId}/agents/devices`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json()
        if (agentsData.status === "OK" && agentsData.data) {
          agentDevices = agentsData.data
          agentDevicesMeta = agentsData.meta
        }
      } else {
        console.warn(`Failed to fetch agents for account ${accountId}:`, agentsResponse.status)
      }
    } catch (error) {
      console.warn(`Error fetching agents for account ${accountId}:`, error)
    }

    // Fetch agent keys for this account
    let agentKeys = []
    let agentKeysMeta = null
    try {
      const keysResponse = await fetch(`${API_BASE_URL}/msp/accounts/${accountId}/agents/keys`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      if (keysResponse.ok) {
        const keysData = await keysResponse.json()
        if (keysData.status === "OK" && keysData.data) {
          agentKeys = keysData.data
          agentKeysMeta = keysData.meta
        }
      } else {
        console.warn(`Failed to fetch agent keys for account ${accountId}:`, keysResponse.status)
      }
    } catch (error) {
      console.warn(`Error fetching agent keys for account ${accountId}:`, error)
    }

    // Fetch findings for this account
    let findings = []
    let findingsMeta = null
    try {
      const findingsResponse = await fetch(`${API_BASE_URL}/msp/accounts/${accountId}/findings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      if (findingsResponse.ok) {
        const findingsData = await findingsResponse.json()
        if (findingsData.status === "OK" && findingsData.data) {
          findings = findingsData.data
          findingsMeta = findingsData.meta
        }
      } else {
        console.warn(`Failed to fetch findings for account ${accountId}:`, findingsResponse.status)
      }
    } catch (error) {
      console.warn(`Error fetching findings for account ${accountId}:`, error)
    }

    // Calculate device status counts
    const onlineDevices = agentDevices.filter((device: any) => !device.is_sleeping && device.alive).length
    const sleepingDevices = agentDevices.filter((device: any) => device.is_sleeping).length
    const isolatedDevices = agentDevices.filter((device: any) => device.is_isolated).length
    const excludedDevices = agentDevices.filter((device: any) => device.is_excluded).length

    return {
      accountDetails,
      agentDevices,
      agentKeys,
      findings,
      agentDeviceCount: agentDevices.length,
      agentKeyCount: agentKeys.length,
      findingsCount: findings.length,
      criticalFindingsCount: findings.filter((f: any) => f.priority === 1).length,
      openFindingsCount: findings.filter((f: any) => f.status_name === "Open").length,
      // Device status breakdown
      onlineDevices,
      sleepingDevices,
      isolatedDevices,
      excludedDevices,
      // Account details from the specific endpoint
      agent_count_available: accountDetails?.agent_count_available || 0,
      agent_count_used: accountDetails?.agent_count_used || 0,
      license: accountDetails?.license || "Unknown",
      user_count: accountDetails?.user_count || 0,
      // Meta information for pagination
      agentDevicesMeta,
      agentKeysMeta,
      findingsMeta,
    }
  } catch (error) {
    console.error(`Error fetching details for account ${accountId}:`, error)
    return {
      accountDetails: null,
      agentDevices: [],
      agentKeys: [],
      findings: [],
      agentDeviceCount: 0,
      agentKeyCount: 0,
      findingsCount: 0,
      criticalFindingsCount: 0,
      openFindingsCount: 0,
      onlineDevices: 0,
      sleepingDevices: 0,
      isolatedDevices: 0,
      excludedDevices: 0,
      agent_count_available: 0,
      agent_count_used: 0,
      license: "Unknown",
      user_count: 0,
      agentDevicesMeta: null,
      agentKeysMeta: null,
      findingsMeta: null,
    }
  }
}

export async function GET() {
  try {
    console.log("Organizations API called")

    const token = await getAccessToken()

    // First, get the list of MSP accounts
    const accountsResponse = await fetch(`${API_BASE_URL}/msp/accounts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })

    if (!accountsResponse.ok) {
      throw new Error(`Failed to fetch MSP accounts: ${accountsResponse.status}`)
    }

    const accountsData = await accountsResponse.json()

    if (accountsData.status !== "OK" || !accountsData.data) {
      throw new Error("Invalid response format from MSP accounts endpoint")
    }

    const accounts = accountsData.data
    const accountsMeta = accountsData.meta

    console.log(`Found ${accounts.length} MSP accounts`)

    // Fetch detailed information for each account using MSP endpoints
    const accountsWithDetails = await Promise.all(
      accounts.map(async (account: any) => {
        const details = await fetchAccountDetails(token, account.account_id)
        return {
          ...account,
          ...details,
          // Ensure consistent naming
          id: account.account_id,
          name: account.name,
          // Add open findings from the main account data if available
          open_findings: account.open_findings || details.openFindingsCount,
        }
      }),
    )

    // Calculate totals
    const totals = {
      totalAgentDevices: accountsWithDetails.reduce((sum, org) => sum + org.agentDeviceCount, 0),
      totalAgentKeys: accountsWithDetails.reduce((sum, org) => sum + org.agentKeyCount, 0),
      totalFindings: accountsWithDetails.reduce((sum, org) => sum + org.findingsCount, 0),
      totalCriticalFindings: accountsWithDetails.reduce((sum, org) => sum + org.criticalFindingsCount, 0),
      totalOpenFindings: accountsWithDetails.reduce((sum, org) => sum + org.openFindingsCount, 0),
      totalOnlineDevices: accountsWithDetails.reduce((sum, org) => sum + org.onlineDevices, 0),
      totalSleepingDevices: accountsWithDetails.reduce((sum, org) => sum + org.sleepingDevices, 0),
      totalIsolatedDevices: accountsWithDetails.reduce((sum, org) => sum + org.isolatedDevices, 0),
      totalExcludedDevices: accountsWithDetails.reduce((sum, org) => sum + org.excludedDevices, 0),
      totalAgentCountAvailable: accountsWithDetails.reduce((sum, org) => sum + org.agent_count_available, 0),
      totalAgentCountUsed: accountsWithDetails.reduce((sum, org) => sum + org.agent_count_used, 0),
      totalUserCount: accountsWithDetails.reduce((sum, org) => sum + org.user_count, 0),
      licenseBreakdown: accountsWithDetails.reduce((acc: any, org) => {
        acc[org.license] = (acc[org.license] || 0) + 1
        return acc
      }, {}),
    }

    console.log("Organizations API completed successfully")
    return NextResponse.json({
      organizations: accountsWithDetails,
      meta: accountsMeta,
      totals,
      debug: {
        organizationCount: accountsWithDetails.length,
        ...totals,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Organizations API error:", error)

    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json(
      {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
