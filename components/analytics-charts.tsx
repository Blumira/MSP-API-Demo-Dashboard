"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

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

interface AnalyticsChartsProps {
  findings: Finding[]
}

// Simple chart components that don't rely on external libraries
function SimpleBarChart({ data, title, dataKey }: { data: any[]; title: string; dataKey: string }) {
  const maxValue = Math.max(...data.map((item) => item[dataKey]))

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div
            className="w-24 text-sm font-medium truncate"
            title={item.name || item.label || item.status || item.type}
          >
            {item.name || item.label || item.status || item.type}
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
            <div
              className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
              style={{ width: `${(item[dataKey] / maxValue) * 100}%` }}
            >
              <span className="text-white text-xs font-medium">{item[dataKey]}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SimplePieChart({ data, title }: { data: any[]; title: string }) {
  const total = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const percentage = ((item.count / total) * 100).toFixed(1)
        const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-gray-500"]
        const colorClass = colors[index % colors.length]

        return (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${colorClass}`}></div>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <div className="text-sm text-gray-600">
              {item.count} ({percentage}%)
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SimpleLineChart({ data, title }: { data: any[]; title: string }) {
  const maxValue = Math.max(...data.map((item) => item.count))

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1 text-xs text-gray-500">
        {data.slice(-7).map((item, index) => (
          <div key={index} className="text-center">
            {item.date}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 h-32 items-end">
        {data.slice(-7).map((item, index) => {
          const height = maxValue > 0 ? (item.count / maxValue) * 100 : 0
          return (
            <div key={index} className="flex flex-col items-center">
              <div
                className="bg-purple-500 w-full rounded-t"
                style={{ height: `${height}%` }}
                title={`${item.date}: ${item.count} findings`}
              ></div>
              <div className="text-xs mt-1">{item.count}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AnalyticsCharts({ findings }: AnalyticsChartsProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  console.log("Analytics: Processing findings", findings?.length || 0)

  if (!mounted) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!findings || findings.length === 0) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>No findings data to display analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>Analytics will appear here once findings data is loaded.</p>
              <p className="text-sm mt-2">Try generating sample data to see the charts.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Priority distribution
  const priorityData = [1, 2, 3, 4, 5]
    .map((priority) => {
      const count = findings.filter((f) => f.priority === priority).length
      return {
        priority: `Priority ${priority}`,
        count,
        label:
          priority === 1
            ? "Critical"
            : priority === 2
              ? "High"
              : priority === 3
                ? "Medium"
                : priority === 4
                  ? "Low"
                  : "Info",
      }
    })
    .filter((item) => item.count > 0)

  console.log("Priority data:", priorityData)

  // Organization distribution
  const orgCounts = findings.reduce(
    (acc, finding) => {
      acc[finding.org_name] = (acc[finding.org_name] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const orgData = Object.entries(orgCounts)
    .map(([name, count]) => ({
      name: name.length > 15 ? name.substring(0, 15) + "..." : name,
      count,
      fullName: name,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  console.log("Organization data:", orgData)

  // Status distribution
  const statusCounts = findings.reduce(
    (acc, finding) => {
      acc[finding.status_name] = (acc[finding.status_name] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))

  console.log("Status data:", statusData)

  // Type distribution
  const typeCounts = findings.reduce(
    (acc, finding) => {
      acc[finding.type_name] = (acc[finding.type_name] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const typeData = Object.entries(typeCounts)
    .map(([type, count]) => ({
      type: type.length > 20 ? type.substring(0, 20) + "..." : type,
      count,
      fullType: type,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  console.log("Type data:", typeData)

  // Timeline data (last 30 days)
  const now = new Date()
  const timelineData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (29 - i))
    const dateStr = date.toISOString().split("T")[0]

    const dayFindings = findings.filter((f) => {
      const findingDate = new Date(f.created).toISOString().split("T")[0]
      return findingDate === dateStr
    })

    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: dayFindings.length,
      critical: dayFindings.filter((f) => f.priority === 1).length,
      high: dayFindings.filter((f) => f.priority === 2).length,
    }
  })

  console.log("Timeline data sample:", timelineData.slice(-5))

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Priority Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Distribution</CardTitle>
          <CardDescription>Breakdown of findings by priority level ({priorityData.length} priorities)</CardDescription>
        </CardHeader>
        <CardContent>
          {priorityData.length > 0 ? (
            <SimplePieChart data={priorityData} title="Priority Distribution" />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No priority data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Organization Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Top Organizations</CardTitle>
          <CardDescription>Organizations with the most findings ({orgData.length} shown)</CardDescription>
        </CardHeader>
        <CardContent>
          {orgData.length > 0 ? (
            <SimpleBarChart data={orgData} title="Organizations" dataKey="count" />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No organization data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
          <CardDescription>Current status of all findings ({statusData.length} statuses)</CardDescription>
        </CardHeader>
        <CardContent>
          {statusData.length > 0 ? (
            <SimpleBarChart data={statusData} title="Status" dataKey="count" />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No status data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Findings Timeline</CardTitle>
          <CardDescription>Daily findings over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          {timelineData.some((d) => d.count > 0) ? (
            <SimpleLineChart data={timelineData} title="Timeline" />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No timeline data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Threat Types */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Top Threat Types</CardTitle>
          <CardDescription>Most common types of security findings ({typeData.length} shown)</CardDescription>
        </CardHeader>
        <CardContent>
          {typeData.length > 0 ? (
            <SimpleBarChart data={typeData} title="Threat Types" dataKey="count" />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No threat type data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
          <CardDescription>Key metrics from your findings data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{findings.filter((f) => f.priority === 1).length}</div>
              <div className="text-sm text-red-600">Critical</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {findings.filter((f) => f.priority === 2).length}
              </div>
              <div className="text-sm text-orange-600">High</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {findings.filter((f) => f.status_name === "Closed").length}
              </div>
              <div className="text-sm text-green-600">Resolved</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{new Set(findings.map((f) => f.org_name)).size}</div>
              <div className="text-sm text-blue-600">Organizations</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
