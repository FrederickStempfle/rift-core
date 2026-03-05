"use client"

import * as React from "react"
import {
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  LogOut,
  Rocket,
} from "lucide-react"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { projectNavItems } from "@/lib/project-navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { usePathname } from "next/navigation"
import { navigationGroups, type NavItem } from "@/lib/navigation"
import { useSidebarState } from "@/hooks/use-sidebar-state"

function NavGroup({
  items,
  label,
  defaultOpen = false,
  getGroupOpen,
  setGroupOpen,
}: {
  items: NavItem[]
  label: string
  defaultOpen?: boolean
  getGroupOpen: (title: string, fallback: boolean) => boolean
  setGroupOpen: (title: string, open: boolean) => void
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isGroupActive = pathname.startsWith(item.url)
            const isOpen = getGroupOpen(item.title, defaultOpen)

            return (
              <Collapsible
                key={item.title}
                open={isOpen}
                onOpenChange={(open) => setGroupOpen(item.title, open)}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} isActive={isGroupActive}>
                      <item.icon />
                      <span>{item.title}</span>
                      <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.subItems.map((sub) => (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton asChild isActive={pathname === sub.url}>
                            <Link href={sub.url}>
                              <span>{sub.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function ProjectNavGroup({ projectName }: { projectName: string }) {
  const pathname = usePathname()
  const basePath = `/projects/${encodeURIComponent(projectName)}`

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="truncate">{projectName}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {projectNavItems.map((item) => {
            const url = item.segment ? `${basePath}/${item.segment}` : basePath
            const isActive = item.segment
              ? pathname.startsWith(url)
              : pathname === basePath
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <Link href={url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const { data: session, status } = useSession()
  const user = session?.user
  const userName = user?.name || user?.login || "User"
  const userEmail = user?.email || ""
  const userAvatar = user?.image || ""
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const pathname = usePathname()
  const projectMatch = pathname.match(/^\/projects\/([^/]+)/)
  const activeProjectName = projectMatch ? decodeURIComponent(projectMatch[1]) : null

  const { getGroupOpen, setGroupOpen, setScrollTop } = useSidebarState()
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Restore scroll position before paint — read localStorage directly
  // since the hook's state update hasn't flushed yet during the same layout pass
  React.useLayoutEffect(() => {
    if (contentRef.current) {
      try {
        const raw = localStorage.getItem("sidebar_ui_state")
        if (raw) {
          const saved = JSON.parse(raw) as { scrollTop?: number }
          if (saved.scrollTop && saved.scrollTop > 0) {
            contentRef.current.scrollTop = saved.scrollTop
          }
        }
      } catch {
        // ignore
      }
    }
  }, [])

  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop)
    },
    [setScrollTop]
  )

  const handleLogout = React.useCallback(() => {
    void signOut({ redirect: false, redirectTo: "/auth" })
      .then((result) => {
        window.location.replace(result.url || "/auth")
      })
      .catch(() => {
        void fetch("/api/logout", { method: "POST" }).finally(() => {
          window.location.replace("/auth")
        })
      })
  }, [])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-12 justify-center p-0 px-2">
        <SidebarMenu className="group-data-[collapsible=icon]:hidden">
          <SidebarMenuItem>
            <SidebarMenuButton className="h-8" asChild>
              <Link href="/">
                <div className="flex aspect-square size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Rocket className="size-3.5" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-semibold">Rift</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent ref={contentRef} onScroll={handleScroll}>
        {activeProjectName && (
          <ProjectNavGroup projectName={activeProjectName} />
        )}
        {navigationGroups.map((group) => (
          <NavGroup
            key={group.label}
            items={group.items}
            label={group.label}
            defaultOpen={group.defaultOpen}
            getGroupOpen={getGroupOpen}
            setGroupOpen={setGroupOpen}
          />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {status === "loading" ? (
              <SidebarMenuButton size="lg" className="group-data-[collapsible=icon]:!p-0 pointer-events-none">
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <div className="flex flex-col gap-1.5 group-data-[collapsible=icon]:hidden">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </SidebarMenuButton>
            ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="group-data-[collapsible=icon]:!p-0">
                  <Avatar className="size-8 shrink-0 rounded-lg">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-semibold">{userName}</span>
                    <span className="text-xs text-muted-foreground">{userEmail}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-56"
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarImage src={userAvatar} alt={userName} />
                      <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="text-sm font-semibold">{userName}</span>
                      <span className="text-xs text-muted-foreground">{userEmail}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <BadgeCheck className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault()
                    handleLogout()
                  }}
                >
                    <LogOut className="mr-2 size-4" />
                    Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
