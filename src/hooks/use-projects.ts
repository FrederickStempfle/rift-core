"use client"

import useSWR from "swr"

export type Project = {
  id: string
  user_id: string
  name: string
  repo_url: string
  branch: string
  framework: string
  build_command?: string | null
  output_dir?: string | null
  install_command?: string | null
  subdomain?: string | null
  public_url?: string | null
  webhook_id?: number | null
  created_at: string
  updated_at: string
}

export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<Project[]>("/api/projects")
  return {
    projects: data ?? [],
    error: error ? (error instanceof Error ? error.message : "Failed to load projects") : null,
    isLoading,
    mutate,
  }
}

export function useProject(projectName: string) {
  const { projects, error, isLoading, mutate } = useProjects()
  const project = projects.find((p) => p.name === projectName) ?? null
  return { project, error, isLoading, mutate }
}
