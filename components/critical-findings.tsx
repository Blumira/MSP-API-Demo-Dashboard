import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ExternalLink, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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

interface CriticalFindingsProps {
  findings: Finding[]
  getPriorityColor: (priority: number) => string
  getPriorityLabel: (priority: number) => string
  getStatusIcon: (status: string) => React.ReactNode
  showAll?: boolean
}

export function CriticalFindings({
  findings,
  getPriorityColor,
  getPriorityLabel,
  getStatusIcon,
  showAll = false,
}: CriticalFindingsProps) {
  const displayFindings = showAll ? findings : findings.slice(0, 5)

  if (findings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <AlertTriangle className="h-5 w-5" />
            Critical Findings
          </CardTitle>
          <CardDescription>High priority security findings that need immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Critical Findings</h3>
            <p className="text-gray-500">Great! No critical security findings require immediate attention.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          Critical Findings
          <Badge variant="destructive" className="ml-2">
            {findings.length}
          </Badge>
        </CardTitle>
        <CardDescription>High priority security findings that need immediate attention</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayFindings.map((finding) => (
            <div
              key={finding.finding_id}
              className="p-4 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(finding.status_name)}
                    <h4 className="font-semibold text-gray-900 truncate">{finding.name}</h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-2">
                    <span className="font-medium">{finding.org_name}</span>
                    <span>•</span>
                    <span>{finding.type_name}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(finding.created), { addSuffix: true })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(finding.priority) as any}>
                      {getPriorityLabel(finding.priority)}
                    </Badge>
                    <Badge variant="outline">{finding.status_name}</Badge>
                  </div>
                </div>

                <Button size="sm" variant="outline" asChild>
                  <a
                    href={`https://app.blumira.com/${finding.org_id}/reporting/findings/${finding.finding_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View
                  </a>
                </Button>
              </div>
            </div>
          ))}

          {!showAll && findings.length > 5 && (
            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">Showing 5 of {findings.length} critical findings</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
