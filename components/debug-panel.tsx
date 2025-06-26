"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"

export function DebugPanel() {
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const runTest = async () => {
    setTesting(true)
    try {
      const response = await fetch("/api/blumira/test")
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ error: error instanceof Error ? error.message : "Test failed" })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertCircle className="h-5 w-5" />
          Configuration Debug
        </CardTitle>
        <CardDescription>Check your Blumira API configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTest} disabled={testing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${testing ? "animate-spin" : ""}`} />
          Test Configuration
        </Button>

        {testResult && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {testResult.hasClientId ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">Client ID: {testResult.hasClientId ? "Configured" : "Missing"}</span>
              {testResult.hasClientId && <Badge variant="secondary">{testResult.clientIdLength} chars</Badge>}
            </div>

            <div className="flex items-center gap-2">
              {testResult.hasClientSecret ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">Client Secret: {testResult.hasClientSecret ? "Configured" : "Missing"}</span>
              {testResult.hasClientSecret && <Badge variant="secondary">{testResult.clientSecretLength} chars</Badge>}
            </div>

            {testResult.error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">Error: {testResult.error}</div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-600 space-y-1">
          <p>Make sure you have set the following environment variables:</p>
          <code className="block bg-gray-100 p-2 rounded text-xs">
            BLUMIRA_CLIENT_ID=your_client_id
            <br />
            BLUMIRA_CLIENT_SECRET=your_client_secret
          </code>
        </div>
      </CardContent>
    </Card>
  )
}
