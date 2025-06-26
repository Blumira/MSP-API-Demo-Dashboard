"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertTriangle,
  Clock,
  Search,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Settings,
} from "lucide-react"
import { MetricsCards } from "@/components/metrics-cards"
import { FindingsTable } from "@/components/findings-table"
import { AnalyticsCharts } from "@/components/analytics-charts"
import { CriticalFindings } from "@/components/critical-findings"
import { DebugPanel } from "@/components/debug-panel"
import { SampleDataGenerator } from "@/components/sample-data-generator"
import { OrganizationsView } from "@/components/organizations-view"
import { CredentialsSetup } from "@/components/credentials-setup"

interface Finding {
  finding_id: string
  name: string
  priority: number
  status_name: string
  type_name: string
  created: string
  modified: string
  org_name: string
  org_id: string
  resolution_name?: string
}

interface DashboardData {
  accounts: any[]
  findings: Finding[]
  error?: string
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [sampleData, setSampleData] = useState<Finding[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [credentialsError, setCredentialsError] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrg, setSelectedOrg] = useState<string>("all")
  const [selectedPriority, setSelectedPriority] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      setError(null)
      setCredentialsError(false)
      const response = await fetch("/api/blumira/dashboard")
      const result = await response.json()

      if (!response.ok) {
        console.error("API Error Details:", result.details)

        // Check if it's a credentials issue
        if (
          result.error?.includes("BLUMIRA_CLIENT_ID") ||
          result.error?.includes("BLUMIRA_CLIENT_SECRET") ||
          result.error?.includes("Authentication failed")
        ) {
          setCredentialsError(true)
        }

        throw new Error(result.error || "Failed to fetch data")
      }

      console.log("Dashboard data received:", {
        accountsCount: result.accounts?.length || 0,
        findingsCount: result.findings?.length || 0,
        debug: result.debug,
      })

      setData(result)
    } catch (err) {
      console.error("Fetch error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
  }

  const handleCredentialsUpdated = () => {
    // Refresh the dashboard data after credentials are updated
    setLoading(true)
    fetchData()
  }

  const handleSampleDataGenerated = (findings: Finding[]) => {
    setSampleData(findings)
    console.log("Sample data generated:", findings.length, "findings")
  }

  const handleSampleDataCleared = () => {
    setSampleData(null)
    console.log("Sample data cleared")
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return "destructive"
      case 2:
        return "orange"
      case 3:
        return "yellow"
      case 4:
        return "green"
      case 5:
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1:
        return "Critical"
      case 2:
        return "High"
      case 3:
        return "Medium"
      case 4:
        return "Low"
      case 5:
        return "Info"
      default:
        return `Priority ${priority}`
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "closed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "dismissed":
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  // Show credentials setup if there's a credentials error
  if (credentialsError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Blumira API credentials are missing or invalid. Please configure your credentials to access the dashboard.
          </AlertDescription>
        </Alert>
        <CredentialsSetup onCredentialsUpdated={handleCredentialsUpdated} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <CredentialsSetup
                onCredentialsUpdated={handleCredentialsUpdated}
                showAsDialog={true}
                trigger={
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Check Credentials
                  </Button>
                }
              />
            </div>
          </AlertDescription>
        </Alert>
        <DebugPanel />
      </div>
    )
  }

  // Use sample data if available, otherwise use real data
  const currentFindings = sampleData || data?.findings || []
  const hasRealData = data?.findings && data.findings.length > 0
  const hasSampleData = sampleData && sampleData.length > 0

  if (!hasRealData && !hasSampleData) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No data available. Generate sample data to preview the dashboard or check your API configuration.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center gap-4">
          <SampleDataGenerator
            onDataGenerated={handleSampleDataGenerated}
            onDataCleared={handleSampleDataCleared}
            hasData={false}
          />
          <CredentialsSetup
            onCredentialsUpdated={handleCredentialsUpdated}
            showAsDialog={true}
            trigger={
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Manage Credentials
              </Button>
            }
          />
        </div>
        <DebugPanel />
      </div>
    )
  }

  const findings = currentFindings
  const organizations = [...new Set(findings.map((f) => f.org_name))].sort()
  const priorities = [1, 2, 3, 4, 5]
  const statuses = [...new Set(findings.map((f) => f.status_name))].sort()

  // Filter findings based on search and filters
  const filteredFindings = findings.filter((finding) => {
    const matchesSearch =
      finding.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.org_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.type_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesOrg = selectedOrg === "all" || finding.org_name === selectedOrg
    const matchesPriority = selectedPriority === "all" || finding.priority.toString() === selectedPriority
    const matchesStatus = selectedStatus === "all" || finding.status_name === selectedStatus

    return matchesSearch && matchesOrg && matchesPriority && matchesStatus
  })

  const criticalFindings = filteredFindings.filter((f) => f.priority === 1)
  const recentFindings = filteredFindings
    .filter((f) => {
      const created = new Date(f.created)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return created >= weekAgo
    })
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search findings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Organizations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org} value={org}>
                    {org}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {priorities.map((priority) => (
                  <SelectItem key={priority} value={priority.toString()}>
                    {getPriorityLabel(priority)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SampleDataGenerator
            onDataGenerated={handleSampleDataGenerated}
            onDataCleared={handleSampleDataCleared}
            hasData={hasSampleData}
          />
          <CredentialsSetup
            onCredentialsUpdated={handleCredentialsUpdated}
            showAsDialog={true}
            trigger={
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Credentials
              </Button>
            }
          />
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <MetricsCards
        findings={filteredFindings}
        criticalCount={criticalFindings.length}
        recentCount={recentFindings.length}
      />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="critical">
            Critical
            {criticalFindings.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {criticalFindings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <CriticalFindings
              findings={criticalFindings.slice(0, 5)}
              getPriorityColor={getPriorityColor}
              getPriorityLabel={getPriorityLabel}
              getStatusIcon={getStatusIcon}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest findings from the past 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentFindings.slice(0, 5).map((finding) => (
                    <div key={finding.finding_id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(finding.status_name)}
                          <span className="font-medium text-sm">{finding.name}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {finding.org_name} • {new Date(finding.created).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(finding.priority) as any}>
                          {getPriorityLabel(finding.priority)}
                        </Badge>
                        <Button size="sm" variant="ghost" asChild>
                          <a
                            href={`https://app.blumira.com/${finding.org_id}/reporting/findings/${finding.finding_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="critical">
          <CriticalFindings
            findings={criticalFindings}
            getPriorityColor={getPriorityColor}
            getPriorityLabel={getPriorityLabel}
            getStatusIcon={getStatusIcon}
            showAll={true}
          />
        </TabsContent>

        <TabsContent value="recent">
          <FindingsTable
            findings={recentFindings}
            getPriorityColor={getPriorityColor}
            getPriorityLabel={getPriorityLabel}
            getStatusIcon={getStatusIcon}
            title="Recent Findings"
            description="Findings from the past 7 days"
          />
        </TabsContent>

        <TabsContent value="organizations">
          <OrganizationsView />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsCharts findings={filteredFindings} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
