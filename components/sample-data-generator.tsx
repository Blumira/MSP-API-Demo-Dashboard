"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TestTube, Trash2 } from "lucide-react"

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

interface SampleDataGeneratorProps {
  onDataGenerated: (findings: Finding[]) => void
  onDataCleared: () => void
  hasData: boolean
}

export function SampleDataGenerator({ onDataGenerated, onDataCleared, hasData }: SampleDataGeneratorProps) {
  const [generating, setGenerating] = useState(false)

  const generateSampleData = () => {
    setGenerating(true)

    const organizations = [
      "Acme Corp",
      "TechStart Inc",
      "Global Solutions",
      "SecureNet Ltd",
      "DataFlow Systems",
      "CloudFirst Co",
      "CyberGuard Inc",
      "InfoTech Solutions",
    ]

    const threatTypes = [
      "Malware Detection",
      "Suspicious Login",
      "Data Exfiltration",
      "Phishing Attempt",
      "Brute Force Attack",
      "Privilege Escalation",
      "Network Intrusion",
      "Ransomware Activity",
      "SQL Injection",
      "Cross-Site Scripting",
      "DNS Tunneling",
      "Command & Control",
    ]

    const statuses = ["Open", "Closed", "In Progress", "Dismissed"]
    const resolutions = ["Valid", "False Positive", "Duplicate", "Not Applicable"]

    const sampleFindings: Finding[] = []

    // Generate 150 sample findings
    for (let i = 0; i < 150; i++) {
      const createdDate = new Date()
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 90)) // Last 90 days
      createdDate.setHours(Math.floor(Math.random() * 24))
      createdDate.setMinutes(Math.floor(Math.random() * 60))

      const modifiedDate = new Date(createdDate)
      modifiedDate.setDate(modifiedDate.getDate() + Math.floor(Math.random() * 7)) // Modified within 7 days

      const org = organizations[Math.floor(Math.random() * organizations.length)]
      const threatType = threatTypes[Math.floor(Math.random() * threatTypes.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      // Weight priorities to have more medium/low than critical
      const priorityWeights = [0.05, 0.15, 0.35, 0.35, 0.1] // Critical, High, Medium, Low, Info
      let priority = 1
      const rand = Math.random()
      let cumulative = 0
      for (let p = 0; p < priorityWeights.length; p++) {
        cumulative += priorityWeights[p]
        if (rand <= cumulative) {
          priority = p + 1
          break
        }
      }

      const finding: Finding = {
        finding_id: `finding_${i + 1}`,
        name: `${threatType} - ${org.split(" ")[0]} Network`,
        priority,
        status_name: status,
        type_name: threatType,
        created: createdDate.toISOString(),
        modified: modifiedDate.toISOString(),
        org_name: org,
        org_id: `org_${Math.floor(Math.random() * 100)}`,
        resolution_name: status === "Closed" ? resolutions[Math.floor(Math.random() * resolutions.length)] : undefined,
      }

      sampleFindings.push(finding)
    }

    // Sort by created date (newest first)
    sampleFindings.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

    setTimeout(() => {
      onDataGenerated(sampleFindings)
      setGenerating(false)
    }, 1000) // Simulate loading time
  }

  const clearData = () => {
    onDataCleared()
  }

  return (
    <div className="flex items-center gap-2">
      {!hasData ? (
        <Button onClick={generateSampleData} disabled={generating} variant="outline" size="sm">
          <TestTube className={`h-4 w-4 mr-2 ${generating ? "animate-pulse" : ""}`} />
          {generating ? "Generating..." : "Generate Sample Data"}
        </Button>
      ) : (
        <>
          <Badge variant="secondary" className="text-xs">
            Sample Data Active
          </Badge>
          <Button onClick={clearData} variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Sample Data
          </Button>
        </>
      )}
    </div>
  )
}
