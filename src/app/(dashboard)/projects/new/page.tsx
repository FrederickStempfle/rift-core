export default function NewProjectPage() {
  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Project</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect a Git repository and deploy it.
        </p>
      </div>

      <div className="max-w-lg space-y-8">
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Project Details
          </h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Project Name
              </label>
              <input
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="my-app"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Git Repository URL
              </label>
              <input
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="https://github.com/user/repo"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Branch</label>
              <input
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="main"
                defaultValue="main"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Subdomain
              </label>
              <div className="flex items-center gap-2">
                <input
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="my-app"
                />
                <span className="shrink-0 text-sm text-muted-foreground">
                  .yourdomain.com
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">
              Build Settings
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Auto-detected from your repository. Override if needed.
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Framework
              </label>
              <input
                className="h-9 w-full rounded-md border bg-surface px-3 text-sm text-muted-foreground"
                placeholder="Auto-detect"
                disabled
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Build Command
              </label>
              <input
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="npm run build"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Output Directory
              </label>
              <input
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                placeholder=".next"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Install Command
              </label>
              <input
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="npm install"
              />
            </div>
          </div>
        </section>

        <button className="h-9 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground shadow-sm hover:bg-[#6D28D9] transition-colors">
          Deploy
        </button>
      </div>
    </div>
  )
}
