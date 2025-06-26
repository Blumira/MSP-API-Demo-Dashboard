"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertTriangle,
  CheckCircle2,
  Settings,
  Eye,
  EyeOff,
  Key,
  Shield,
  ExternalLink,
  Trash2,
  RefreshCw,
} from "lucide-react"

interface CredentialsStatus {
  hasCredentials: boolean
  hasClientId: boolean
  hasClientSecret: boolean
  clientIdLength: number
  clientSecretLength: number
}

interface CredentialsSetupProps {
  onCredentialsUpdated?: () => void
  showAsDialog?: boolean
  trigger?: React.ReactNode
}

export function CredentialsSetup({ onCredentialsUpdated, showAsDialog = false, trigger }: CredentialsSetupProps) {
  const [status, setStatus] = useState<CredentialsStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showClientId, setShowClientId] = useState(false)
  const [showClientSecret, setShowClientSecret] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    clientId: "",
    clientSecret: "",
  })

  const fetchStatus = async () => {
    try {
      setError(null)
      const response = await fetch("/api/blumira/credentials")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch credentials status")
      }

      setStatus(result)
    } catch (err) {
      console.error("Error fetching credentials status:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleSave = async () => {
    if (!formData.clientId.trim() || !formData.clientSecret.trim()) {
      setError("Both Client ID and Client Secret are required")
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/blumira/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: formData.clientId.trim(),
          clientSecret: formData.clientSecret.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save credentials")
      }

      setSuccess("Credentials saved and validated successfully!")
      setFormData({ clientId: "", clientSecret: "" })
      await fetchStatus()

      if (onCredentialsUpdated) {
        onCredentialsUpdated()
      }

      if (showAsDialog) {
        setTimeout(() => setDialogOpen(false), 1500)
      }
    } catch (err) {
      console.error("Error saving credentials:", err)
      setError(err instanceof Error ? err.message : "Failed to save credentials")
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/blumira/test")
      const result = await response.json()

      if (result.hasClientId && result.hasClientSecret) {
        setSuccess("Credentials are properly configured!")
      } else {
        setError("Credentials are missing or incomplete")
      }
    } catch (err) {
      setError("Failed to test credentials")
    } finally {
      setTesting(false)
    }
  }

  const handleRemove = async () => {
    setRemoving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/blumira/credentials", {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to remove credentials")
      }

      setSuccess("Credentials removed successfully")
      await fetchStatus()

      if (onCredentialsUpdated) {
        onCredentialsUpdated()
      }
    } catch (err) {
      console.error("Error removing credentials:", err)
      setError(err instanceof Error ? err.message : "Failed to remove credentials")
    } finally {
      setRemoving(false)
    }
  }

  const CredentialsForm = () => (
    <div className="space-y-6">
      {/* Current Status */}
      {status && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Current Status</h3>
            <Button onClick={fetchStatus} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {status.hasClientId ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">Client ID</span>
              </div>
              <div className="flex items-center gap-2">
                {status.hasClientId && <Badge variant="secondary">{status.clientIdLength} chars</Badge>}
                <Badge variant={status.hasClientId ? "default" : "destructive"}>
                  {status.hasClientId ? "Configured" : "Missing"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {status.hasClientSecret ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">Client Secret</span>
              </div>
              <div className="flex items-center gap-2">
                {status.hasClientSecret && <Badge variant="secondary">{status.clientSecretLength} chars</Badge>}
                <Badge variant={status.hasClientSecret ? "default" : "destructive"}>
                  {status.hasClientSecret ? "Configured" : "Missing"}
                </Badge>
              </div>
            </div>
          </div>

          {status.hasCredentials && (
            <div className="flex gap-2">
              <Button onClick={handleTest} disabled={testing} variant="outline">
                <Shield className={`h-4 w-4 mr-2 ${testing ? "animate-pulse" : ""}`} />
                {testing ? "Testing..." : "Test Connection"}
              </Button>
              <Button onClick={handleRemove} disabled={removing} variant="destructive" size="sm">
                <Trash2 className={`h-4 w-4 mr-2 ${removing ? "animate-pulse" : ""}`} />
                {removing ? "Removing..." : "Remove"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Setup Form */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{status?.hasCredentials ? "Update Credentials" : "Setup Credentials"}</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientId">Client ID</Label>
            <div className="relative">
              <Input
                id="clientId"
                type={showClientId ? "text" : "password"}
                placeholder="Enter your Blumira Client ID"
                value={formData.clientId}
                onChange={(e) => setFormData((prev) => ({ ...prev, clientId: e.target.value }))}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowClientId(!showClientId)}
              >
                {showClientId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientSecret">Client Secret</Label>
            <div className="relative">
              <Input
                id="clientSecret"
                type={showClientSecret ? "text" : "password"}
                placeholder="Enter your Blumira Client Secret"
                value={formData.clientSecret}
                onChange={(e) => setFormData((prev) => ({ ...prev, clientSecret: e.target.value }))}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowClientSecret(!showClientSecret)}
              >
                {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !formData.clientId.trim() || !formData.clientSecret.trim()}
            className="w-full"
          >
            <Key className={`h-4 w-4 mr-2 ${saving ? "animate-pulse" : ""}`} />
            {saving ? "Saving & Validating..." : "Save Credentials"}
          </Button>
        </div>
      </div>

      {/* Help Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">How to Get Your Credentials</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>To get your Blumira API credentials:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Log in to your Blumira account</li>
            <li>Navigate to Settings → API Management</li>
            <li>Create a new API application or use an existing one</li>
            <li>Copy the Client ID and Client Secret</li>
            <li>Paste them into the form above</li>
          </ol>
          <div className="flex items-center gap-2 mt-3">
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://app.blumira.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open Blumira Console
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 animate-spin" />
            Loading Credentials Status...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (showAsDialog) {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Manage Credentials
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Blumira API Credentials
            </DialogTitle>
            <DialogDescription>Manage your Blumira API credentials for dashboard access</DialogDescription>
          </DialogHeader>
          <CredentialsForm />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Blumira API Credentials
        </CardTitle>
        <CardDescription>Configure your Blumira API credentials to access the dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <CredentialsForm />
      </CardContent>
    </Card>
  )
}
