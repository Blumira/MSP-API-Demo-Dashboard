import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, AlertTriangle, Clock, Activity } from "lucide-react"

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

interface MetricsCardsProps {
  findings: Finding[]
  criticalCount: number
  recentCount: number
}

export function MetricsCards({ findings, criticalCount, recentCount }: MetricsCardsProps) {
  const openFindings = findings.filter((f) => f.status_name === "Open").length
  const closedFindings = findings.filter((f) => f.status_name === "Closed").length
  const totalFindings = findings.length

  const metrics = [
    {
      title: "Total Findings",
      value: totalFindings,
      description: "All security findings",
      icon: Shield,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: null,
    },
    {
      title: "Critical Findings",
      value: criticalCount,
      description: "Require immediate attention",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      trend: criticalCount > 0 ? "critical" : null,
    },
    {
      title: "Open Findings",
      value: openFindings,
      description: "Currently unresolved",
      icon: Activity,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: null,
    },
    {
      title: "Recent Findings",
      value: recentCount,
      description: "Last 7 days",
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: null,
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{metric.title}</CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{metric.value.toLocaleString()}</div>
                  <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
                </div>
                {metric.trend === "critical" && metric.value > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    Action Required
                  </Badge>
                )}
              </div>
            </CardContent>
            {metric.trend === "critical" && metric.value > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500" />
            )}
          </Card>
        )
      })}
    </div>
  )
}
