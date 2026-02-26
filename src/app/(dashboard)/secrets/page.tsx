import { Shield } from "lucide-react"

export default function SecretsPage() {
  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Secrets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Encryption configuration for environment variables.
        </p>
      </div>

      <div className="max-w-lg">
        <div className="rounded-lg border p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-emerald-500/10">
              <Shield className="size-4 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-sm font-medium">AES-256-GCM Encryption</h2>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            All environment variable values are encrypted at rest using
            AES-256-GCM. Each value uses a unique 12-byte nonce. The encryption
            key is derived from the{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
              RIFT_ENCRYPTION_KEY
            </code>{" "}
            environment variable.
          </p>
          <div className="mt-4 rounded-md bg-muted/50 px-4 py-3 font-mono text-xs leading-relaxed text-muted-foreground">
            Algorithm: AES-256-GCM<br />
            Nonce: 12 bytes (random per value)<br />
            Key derivation: RIFT_ENCRYPTION_KEY env var
          </div>
        </div>
      </div>
    </div>
  )
}
