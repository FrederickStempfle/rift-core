"use client"

import * as React from "react"
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Rocket,
  Shield,
  HardDrive,
  X,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  description: string
  time: string
  read: boolean
  type: "info" | "success" | "warning"
  icon: React.ElementType
  iconColor: string
  iconBg: string
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Deploy ready",
    description: "marketing-site deployed from main (a3f8c21).",
    time: "2m ago",
    read: false,
    type: "success",
    icon: Rocket,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  {
    id: "2",
    title: "Build failed",
    description: "dashboard-app build failed — module not found.",
    time: "3h ago",
    read: false,
    type: "warning",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
  },
  {
    id: "3",
    title: "Process suspended",
    description: "api-docs idle for 5m — scaled to zero.",
    time: "5h ago",
    read: true,
    type: "info",
    icon: HardDrive,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    id: "4",
    title: "SSL provisioned",
    description: "Certificate active for www.acme.com.",
    time: "1d ago",
    read: true,
    type: "success",
    icon: Shield,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
]

type Tab = "all" | "unread"

export function Notifications() {
  const [notifications, setNotifications] = React.useState<Notification[]>(mockNotifications)
  const [open, setOpen] = React.useState(false)
  const [tab, setTab] = React.useState<Tab>("all")

  const unreadCount = notifications.filter(n => !n.read).length

  const displayed = tab === "unread"
    ? notifications.filter(n => !n.read)
    : notifications

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground ring-2 ring-background">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-[380px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-0">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={markAllAsRead}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-2 pb-1">
          {(["all", "unread"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {t === "all" ? "All" : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto px-2 py-1">
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-2.5 rounded-full bg-muted p-2.5">
                {tab === "unread" ? (
                  <CheckCircle2 className="size-5 text-muted-foreground" />
                ) : (
                  <Bell className="size-5 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm font-medium">
                {tab === "unread" ? "All caught up" : "No notifications"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tab === "unread"
                  ? "You have no unread notifications."
                  : "Nothing to see here yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {displayed.map((notification) => {
                const Icon = notification.icon
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "group relative flex gap-3 rounded-lg p-2.5 transition-colors cursor-pointer",
                      !notification.read
                        ? "bg-accent/50 hover:bg-accent"
                        : "hover:bg-accent/50"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {/* Icon */}
                    <div className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      notification.iconBg
                    )}>
                      <Icon className={cn("size-4", notification.iconColor)} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-1.5">
                        <p className={cn(
                          "text-[13px] leading-tight",
                          !notification.read ? "font-semibold" : "font-medium"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                        {notification.description}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/70">
                        {notification.time}
                      </p>
                    </div>

                    {/* Dismiss */}
                    <button
                      className="absolute right-2 top-2 rounded-md p-0.5 text-muted-foreground/50 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeNotification(notification.id)
                      }}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t p-1.5">
            <Button
              variant="ghost"
              className="h-8 w-full text-xs font-medium text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
