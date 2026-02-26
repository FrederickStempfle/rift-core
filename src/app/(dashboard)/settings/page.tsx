export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform configuration and account settings.
        </p>
      </div>

      <div className="max-w-lg space-y-10">
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">General</h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Platform URL
              </label>
              <input
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                defaultValue="https://rift.yourdomain.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Default Branch
              </label>
              <input
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                defaultValue="main"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Idle Timeout (seconds)
              </label>
              <input
                type="number"
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                defaultValue="300"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Processes idle longer than this are suspended (scale to zero).
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Account</h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                defaultValue="admin@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Password
              </label>
              <input
                type="password"
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>
            <button className="h-8 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Save Changes
            </button>
          </div>
        </section>

        <div className="h-px bg-border" />

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-red-500">Danger Zone</h2>
          <p className="text-sm text-muted-foreground">
            Irreversible actions.
          </p>
          <button className="h-8 rounded-md border border-red-200 px-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950">
            Delete Account
          </button>
        </section>
      </div>
    </div>
  )
}
