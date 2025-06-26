import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Clock } from "lucide-react"
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

interface FindingsTableProps {
  findings: Finding[]
  getPriorityColor: (priority: number) => string
  getPriorityLabel: (priority: number) => string
  getStatusIcon: (status: string) => React.ReactNode
  title: string
  description: string
}

export function FindingsTable({
  findings,
  getPriorityColor,
  getPriorityLabel,
  getStatusIcon,
  title,
  description,
}: FindingsTableProps) {
  if (findings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Findings</h3>
            <p className="text-gray-500">No findings match the current filters.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description} ({findings.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {findings.map((finding) => (
            <div key={finding.finding_id} className="p-4 rounded-lg border hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(finding.status_name)}
                    <h4 className="font-medium text-gray-900 truncate">{finding.name}</h4>
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
        </div>
      </CardContent>
    </Card>
  )
}
