"use client"

import * as React from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Settings2 } from "lucide-react"

type CookiePreferences = {
  essential: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  functional: false,
}

const cookieCategories = [
  {
    key: "essential" as const,
    label: "Essential",
    description: "Required for the site to function. Cannot be disabled.",
    locked: true,
  },
  {
    key: "analytics" as const,
    label: "Analytics",
    description: "Help us understand how visitors interact with the site.",
    locked: false,
  },
  {
    key: "functional" as const,
    label: "Functional",
    description: "Enable personalized features and preferences.",
    locked: false,
  },
  {
    key: "marketing" as const,
    label: "Marketing",
    description: "Used to deliver relevant ads and track campaigns.",
    locked: false,
  },
]

export function CookieConsent() {
  const [visible, setVisible] = React.useState(false)
  const [configuring, setConfiguring] = React.useState(false)
  const [preferences, setPreferences] = React.useState<CookiePreferences>(defaultPreferences)

  React.useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) setVisible(true)
  }, [])

  const save = (prefs: CookiePreferences) => {
    localStorage.setItem("cookie-consent", JSON.stringify(prefs))
    setVisible(false)
  }

  const acceptAll = () => {
    save({ essential: true, analytics: true, marketing: true, functional: true })
  }

  const decline = () => {
    save({ essential: true, analytics: false, marketing: false, functional: false })
  }

  const savePreferences = () => {
    save(preferences)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:bottom-6 sm:left-6">
      <div className="w-full sm:w-[400px] rounded-xl border bg-background shadow-lg overflow-hidden">
        {!configuring ? (
          <>
            <div className="flex items-start gap-3.5 p-4 pb-0">
              <Image
                src="/cookies.png"
                alt="Cookie"
                width={56}
                height={56}
                className="shrink-0 -mt-1"
              />
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-semibold">Cookie monster is hungry!</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  We use cookies to enhance your browsing experience, analyze traffic, and personalize content. You can manage your preferences at any time. Read our{" "}
                  <a href="/privacy" className="underline underline-offset-4 hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-4">
              <Button size="sm" variant="outline" className="flex-1" onClick={acceptAll}>
                Accept all
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={decline}>
                Decline
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setConfiguring(true)}>
                <Settings2 className="size-3.5" />
                Configure
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 pb-3">
              <p className="text-sm font-semibold">Cookie preferences</p>
              <p className="text-xs text-muted-foreground mt-1">
                Choose which cookies you&apos;d like to allow.
              </p>
            </div>
            <div className="px-4 space-y-3">
              {cookieCategories.map((category) => (
                <div key={category.key} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{category.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                  <Switch
                    checked={preferences[category.key]}
                    disabled={category.locked}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({ ...prev, [category.key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 p-4">
              <Button size="sm" variant="outline" className="flex-1" onClick={savePreferences}>
                Save preferences
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={acceptAll}>
                Accept all
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
