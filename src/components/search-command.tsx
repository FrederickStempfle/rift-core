"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  FolderGit2,
  GitBranch,
  Globe,
  Home,
  KeyRound,
  Rocket,
  ScrollText,
  Search,
  Settings,
  Terminal,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export function SearchCommand() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const navigate = (url: string) => {
    setOpen(false)
    router.push(url)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-md border bg-background text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors sm:w-56 sm:justify-start sm:gap-2 sm:px-3"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="hidden flex-1 text-left sm:inline">Search...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} showCloseButton={false}>
        <CommandInput placeholder="Search pages..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Overview">
            <CommandItem onSelect={() => navigate("/")}>
              <Home />
              Dashboard
            </CommandItem>
            <CommandItem onSelect={() => navigate("/projects")}>
              <FolderGit2 />
              Projects
            </CommandItem>
            <CommandItem onSelect={() => navigate("/projects/new")}>
              <FolderGit2 />
              New Project
            </CommandItem>
            <CommandItem onSelect={() => navigate("/deployments")}>
              <Rocket />
              Deployments
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Configuration">
            <CommandItem onSelect={() => navigate("/domains")}>
              <Globe />
              Domains
            </CommandItem>
            <CommandItem onSelect={() => navigate("/environment")}>
              <Terminal />
              Environment Variables
            </CommandItem>
            <CommandItem onSelect={() => navigate("/git")}>
              <GitBranch />
              Git Repositories
            </CommandItem>
            <CommandItem onSelect={() => navigate("/git/webhooks")}>
              <GitBranch />
              Webhooks
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="System">
            <CommandItem onSelect={() => navigate("/logs")}>
              <ScrollText />
              Logs
            </CommandItem>
            <CommandItem onSelect={() => navigate("/settings")}>
              <Settings />
              Settings
            </CommandItem>
            <CommandItem onSelect={() => navigate("/secrets")}>
              <KeyRound />
              Secrets
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
