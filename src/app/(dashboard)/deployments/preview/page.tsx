export default function PreviewPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Preview</h1>
        <p className="text-sm text-muted-foreground">
          Review preview deployments for pull requests and branches.
        </p>
      </div>
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Content coming soon.</p>
      </div>
    </div>
  )
}
