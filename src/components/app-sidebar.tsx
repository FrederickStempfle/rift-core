"use client"

import * as React from "react"
import {
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  FolderGit2,
  LogOut,
  Plus,
  Rocket,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { projectNavItems } from "@/lib/project-navigation"
import { useProjects } from "@/hooks/use-projects"

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
            if (item.title === "Projects") {
              return (
                <ProjectsNavGroup
                  key="Projects"
                  getGroupOpen={getGroupOpen}
                  setGroupOpen={setGroupOpen}
                  defaultOpen={defaultOpen}
                />
              )
            }

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

function ProjectsNavGroup({
  getGroupOpen,
  setGroupOpen,
  defaultOpen,
}: {
  getGroupOpen: (title: string, fallback: boolean) => boolean
  setGroupOpen: (title: string, open: boolean) => void
  defaultOpen: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { projects, isLoading } = useProjects()
  const isGroupActive = pathname.startsWith("/projects")
  const isOpen = getGroupOpen("Projects", defaultOpen)

  // Extract active project name from pathname
  const projectMatch = pathname.match(/^\/projects\/([^/]+)/)
  const activeProjectName = projectMatch ? decodeURIComponent(projectMatch[1]) : null

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={(open) => setGroupOpen("Projects", open)}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip="Projects" isActive={isGroupActive}>
            <FolderGit2 />
            <span>Projects</span>
            <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {isLoading ? (
              <>
                <SidebarMenuSubItem>
                  <div className="px-2 py-1.5"><Skeleton className="h-4 w-24" /></div>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <div className="px-2 py-1.5"><Skeleton className="h-4 w-20" /></div>
                </SidebarMenuSubItem>
              </>
            ) : (
              <>
                {projects.map((project) => {
                  const isThisProject = activeProjectName === project.name
                  const projectBase = `/projects/${encodeURIComponent(project.name)}`

                  if (isThisProject) {
                    // Expanded project with sub-nav
                    return (
                      <React.Fragment key={project.id}>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive>
                            <Link href={projectBase}>
                              <span className="font-medium">{project.name}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        {projectNavItems.map((navItem) => {
                          const url = navItem.segment ? `${projectBase}/${navItem.segment}` : projectBase
                          const isNavActive = navItem.segment
                            ? pathname.startsWith(url)
                            : pathname === projectBase
                          return (
                            <SidebarMenuSubItem key={navItem.title}>
                              <SidebarMenuSubButton asChild isActive={isNavActive} className="pl-6">
                                <Link href={url}>
                                  <navItem.icon className="size-3.5" />
                                  <span>{navItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </React.Fragment>
                    )
                  }

                  // Collapsed project — just the name
                  return (
                    <SidebarMenuSubItem key={project.id}>
                      <SidebarMenuSubButton asChild isActive={false}>
                        <Link href={projectBase}>
                          <span>{project.name}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )
                })}

                {/* New Project button */}
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    asChild
                    isActive={false}
                    className="text-muted-foreground"
                  >
                    <button onClick={() => router.push("/projects?new=true")}>
                      <Plus className="size-3.5" />
                      <span>New Project</span>
                    </button>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </>
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
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
