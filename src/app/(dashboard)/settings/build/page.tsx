"use client"

import { Archive, HardDrive, Timer, Wrench } from "lucide-react"
import { AnimatedPage } from "@/components/animated-page"
import { ConfigCard, type ConfigRow } from "@/components/config-card"

const buildRows: ConfigRow[] = [
  {
    env: "RIFT_BUILD_CONCURRENCY",
    label: "Build Concurrency",
    description: "Maximum number of builds that can run in parallel.",
    defaultValue: "4",
  },
  {
    env: "RIFT_BUILD_TIMEOUT_SECS",
    label: "Build Timeout",
    description: "Seconds before a build is forcibly terminated and marked as failed.",
    defaultValue: "600",
  },
  {
    env: "RIFT_BUILD_MEMORY_LIMIT_MB",
    label: "Build Memory Limit",
    description: "Maximum memory (MiB) a single build process may consume.",
    defaultValue: "2048",
  },
  {
    env: "RIFT_BUILD_CPU_QUOTA_US",
    label: "Build CPU Quota",
    description:
      "CPU time (μs) per 100 ms period for each build. 200000 = 2 cores.",
    defaultValue: "200000",
  },
  {
    env: "RIFT_BUILD_MAX_PIDS",
    label: "Max PIDs per Build",
    description: "Maximum processes a build job may spawn (npm scripts, compilers, etc.).",
    defaultValue: "256",
  },
]

const pathRows: ConfigRow[] = [
  {
    env: "RIFT_BUILD_ROOT",
    label: "Build Workspace Path",
    description: "Directory where repos are cloned and builds are executed.",
    defaultValue: "/var/rift/builds",
  },
  {
    env: "RIFT_DEPLOY_ROOT",
    label: "Deployment Output Path",
    description: "Directory where built deployment bundles are stored and served from.",
    defaultValue: "/var/rift/deployments",
  },
  {
    env: "RIFT_BUILD_CACHE_DIR",
    label: "Dependency Cache Path",
    description: "Directory used to cache node_modules and other build dependencies between builds.",
    defaultValue: "/var/rift/cache",
  },
]

const cacheRows: ConfigRow[] = [
  {
    env: "RIFT_INSTALL_SKIP_ON_CACHE_HIT",
    label: "Skip Install on Cache Hit",
    description:
      "Reuse cached node_modules instead of running npm/yarn/pnpm install when a matching cache exists.",
    defaultValue: "true",
  },
  {
    env: "RIFT_BUILD_CLEAN_CACHE",
    label: "Clean Native Caches After Install",
    description: "Remove native build artifacts (e.g. gyp caches) after dependency installation to save disk space.",
    defaultValue: "false",
  },
  {
    env: "RIFT_ARTIFACT_COPY_MODE",
    label: "Artifact Copy Mode",
    description:
      "'auto' tries reflinks then falls back to a recursive copy. 'reflink' forces CoW copy (requires btrfs/xfs). 'recursive' always copies.",
    defaultValue: "auto",
  },
]

const artifactRows: ConfigRow[] = [
  {
    env: "RIFT_ARTIFACT_STORE_URL",
    label: "Artifact Store Endpoint",
    description: "S3-compatible endpoint for storing build artifacts. Leave blank to use local disk.",
    defaultValue: "(local disk)",
  },
  {
    env: "RIFT_ARTIFACT_STORE_BUCKET",
    label: "Artifact Bucket Name",
    description: "Bucket name within the S3-compatible store.",
    defaultValue: "rift-artifacts",
  },
  {
    env: "RIFT_ARTIFACT_SIGNING_PRIVATE_KEY",
    label: "Artifact Signing Key (control-plane)",
    description: "Ed25519 private key used to sign artifacts pushed by the control-plane.",
    defaultValue: "(required for S3)",
  },
  {
    env: "RIFT_ARTIFACT_SIGNING_PUBLIC_KEY",
    label: "Artifact Verify Key (edge-agent)",
    description: "Ed25519 public key used by edge agents to verify artifact signatures before loading.",
    defaultValue: "(required for S3)",
  },
]

export default function BuildSettingsPage() {
  return (
    <AnimatedPage className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Build Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build pipeline concurrency, resource limits, caching, and artifact storage. Click any
          variable to copy it.
        </p>
      </div>

      <ConfigCard
        icon={Wrench}
        title="Build Pipeline"
        description="Concurrency, timeouts, and resource limits applied to each build job."
        rows={buildRows}
      />

      <ConfigCard
        icon={HardDrive}
        title="Storage Paths"
        description="Local filesystem paths for build workspaces, deployment bundles, and caches."
        rows={pathRows}
      />

      <ConfigCard
        icon={Timer}
        title="Caching"
        description="Dependency cache reuse and artifact copy strategies."
        rows={cacheRows}
      />

      <ConfigCard
        icon={Archive}
        title="Artifact Store"
        description="S3-compatible remote storage for build artifacts used in multi-region edge deployments."
        rows={artifactRows}
      />
    </AnimatedPage>
  )
}
