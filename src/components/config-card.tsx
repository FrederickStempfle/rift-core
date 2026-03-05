"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

type ConfigRow = {
  env: string
  label: string
  description: string
  defaultValue: string
}

function EnvBadge({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={handleCopy}
      className="group inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
    >
      {value}
      <span className="text-muted-foreground/40 transition-colors group-hover:text-primary/60">
        {copied ? <Check className="size-2.5" /> : <Copy className="size-2.5" />}
      </span>
    </button>
  )
}

function ConfigCard({
  icon: Icon,
  title,
  description,
  rows,
  note,
}: {
  icon: React.ElementType
  title: string
  description: string
  rows: ConfigRow[]
  note?: string
}) {
  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-3 border-b bg-muted/30 px-5 py-3.5">
        <div className="flex size-7 items-center justify-center rounded-md border bg-background">
          <Icon className="size-3.5 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {note && (
        <div className="border-b bg-amber-50/50 px-5 py-2.5 text-xs text-amber-700">
          {note}
        </div>
      )}
      <div className="divide-y">
        {rows.map((row) => (
          <div
            key={row.env}
            className="grid grid-cols-1 gap-2 px-5 py-3.5 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-6"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{row.label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {row.description}
              </p>
            </div>
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <EnvBadge value={row.env} />
              <span className="text-xs text-muted-foreground">
                Default:{" "}
                <span className="font-mono text-foreground/80">{row.defaultValue}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export { ConfigCard, EnvBadge }
export type { ConfigRow }
