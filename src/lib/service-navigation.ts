import {
  Globe,
  Link2,
  Rocket,
  ScrollText,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type ServiceNavItem = {
  title: string
  segment: string
  icon: LucideIcon
}

export const serviceNavItems: ServiceNavItem[] = [
  { title: "Overview", segment: "", icon: Rocket },
  { title: "Connection", segment: "connection", icon: Link2 },
  { title: "Logs", segment: "logs", icon: ScrollText },
  { title: "Domains", segment: "domains", icon: Globe },
]
