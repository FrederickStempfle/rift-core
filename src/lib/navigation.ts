import {
  FolderGit2,
  GitBranch,
  Globe,
  KeyRound,
  Rocket,
  ScrollText,
  Settings,
  Shield,
  Terminal,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type NavSubItem = {
  title: string
  url: string
}

export type NavItem = {
  title: string
  icon: LucideIcon
  url: string
  subItems: NavSubItem[]
}

export type NavGroup = {
  label: string
  items: NavItem[]
  defaultOpen?: boolean
}

export const navigationGroups: NavGroup[] = [
  {
    label: "Overview",
    defaultOpen: true,
    items: [
      {
        title: "Projects",
        icon: FolderGit2,
        url: "/projects",
        subItems: [
          { title: "All Projects", url: "/projects" },
        ],
      },
      {
        title: "Deployments",
        icon: Rocket,
        url: "/deployments",
        subItems: [
          { title: "All Deployments", url: "/deployments" },
          { title: "Build Logs", url: "/deployments/logs" },
        ],
      },
    ],
  },
  {
    label: "Configuration",
    items: [
      {
        title: "Domains",
        icon: Globe,
        url: "/domains",
        subItems: [
          { title: "All Domains", url: "/domains" },
          { title: "SSL Certificates", url: "/domains/ssl" },
        ],
      },
      {
        title: "Firewall",
        icon: Shield,
        url: "/firewall",
        subItems: [
          { title: "Rules", url: "/firewall" },
        ],
      },
      {
        title: "Environment",
        icon: Terminal,
        url: "/environment",
        subItems: [
          { title: "Variables", url: "/environment/variables" },
        ],
      },
      {
        title: "Git",
        icon: GitBranch,
        url: "/git",
        subItems: [
          { title: "Repositories", url: "/git/repositories" },
          { title: "Webhooks", url: "/git/webhooks" },
        ],
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Logs",
        icon: ScrollText,
        url: "/logs",
        subItems: [
          { title: "Build Logs", url: "/logs/build" },
          { title: "Runtime Logs", url: "/logs/runtime" },
        ],
      },
      {
        title: "Settings",
        icon: Settings,
        url: "/settings",
        subItems: [
          { title: "General", url: "/settings/general" },
          { title: "API Keys", url: "/settings/api-keys" },
        ],
      },
      {
        title: "Secrets",
        icon: KeyRound,
        url: "/secrets",
        subItems: [
          { title: "Encryption", url: "/secrets/encryption" },
        ],
      },
    ],
  },
]

// Helper: get all top-level nav items
export function getAllTopLevelItems() {
  return navigationGroups.flatMap((g) => g.items)
}

// Helper: find a nav item by its URL prefix
export function findNavItem(url: string) {
  return getAllTopLevelItems().find((item) => item.url === url)
}

// Helper: get sibling items for a given path depth
export function getSiblingsForSegment(
  segments: string[],
  segmentIndex: number
): NavSubItem[] | null {
  if (segmentIndex === 0) {
    // First segment (e.g., "documentation") — siblings are all top-level items
    return getAllTopLevelItems().map((item) => ({
      title: item.title,
      url: item.url,
    }))
  }

  if (segmentIndex === 1) {
    // Second segment (e.g., "getting-started") — siblings are sub-items of parent
    const parentPath = "/" + segments[0]
    const parent = findNavItem(parentPath)
    return parent?.subItems ?? null
  }

  return null
}
