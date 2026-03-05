"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AnimatedPage } from "@/components/animated-page"

export default function SettingsPage() {
  return (
    <AnimatedPage className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform configuration and account settings.
        </p>
      </div>

      <div className="max-w-lg space-y-8">
        <section className="overflow-hidden rounded-lg border">
          <div className="border-b bg-muted/30 px-5 py-3.5">
            <h2 className="text-sm font-semibold">General</h2>
          </div>
          <div className="space-y-4 p-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Platform URL</label>
              <Input defaultValue="https://rift.yourdomain.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Default Branch</label>
              <Input defaultValue="main" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Idle Timeout (seconds)</label>
              <Input type="number" defaultValue="300" />
              <p className="text-xs text-muted-foreground">
                Processes idle longer than this are suspended (scale to zero).
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border">
          <div className="border-b bg-muted/30 px-5 py-3.5">
            <h2 className="text-sm font-semibold">Account</h2>
          </div>
          <div className="space-y-4 p-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input defaultValue="admin@example.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Password</label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <Button size="sm">Save Changes</Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-destructive/20">
          <div className="border-b border-destructive/20 bg-destructive/5 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-destructive">Danger Zone</h2>
          </div>
          <div className="space-y-3 p-5">
            <p className="text-sm text-muted-foreground">
              Irreversible actions.
            </p>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </section>
      </div>
    </AnimatedPage>
  )
}
