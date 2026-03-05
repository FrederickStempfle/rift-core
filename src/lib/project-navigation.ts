import {
  Activity,
  BarChart3,
  Globe,
  Key,
  Rocket,
  ScrollText,
  Settings,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type ProjectNavItem = {
  title: string
  segment: string
  icon: LucideIcon
}

export const projectNavItems: ProjectNavItem[] = [
  { title: "Overview", segment: "", icon: Rocket },
  { title: "Analytics", segment: "analytics", icon: BarChart3 },
  { title: "Environment", segment: "env", icon: Key },
  { title: "Logs", segment: "logs", icon: ScrollText },
  { title: "Domains", segment: "domains", icon: Globe },
  { title: "Usage", segment: "usage", icon: Activity },
  { title: "Settings", segment: "settings", icon: Settings },
]
