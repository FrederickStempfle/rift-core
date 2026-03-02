"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const STORAGE_KEY = "sidebar_ui_state"
const SCROLL_DEBOUNCE_MS = 200

type SidebarUIState = {
  collapsedItems: Record<string, boolean>
  scrollTop: number
}

const DEFAULTS: SidebarUIState = { collapsedItems: {}, scrollTop: 0 }

function readState(): SidebarUIState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SidebarUIState>
      return {
        collapsedItems: parsed.collapsedItems ?? {},
        scrollTop: parsed.scrollTop ?? 0,
      }
    }
  } catch {
    // Corrupted or unavailable — fall back to defaults
  }
  return DEFAULTS
}

function writeState(state: SidebarUIState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function useSidebarState() {
  const [state, setState] = useState<SidebarUIState>(() =>
    typeof window === "undefined" ? DEFAULTS : readState()
  )

  // Persist on changes (skip the initial hydration write)
  const skipNextWrite = useRef(true)
  useEffect(() => {
    if (skipNextWrite.current) {
      skipNextWrite.current = false
      return
    }
    writeState(state)
  }, [state])

  const getGroupOpen = useCallback(
    (title: string, fallback: boolean): boolean => {
      if (title in state.collapsedItems) {
        return state.collapsedItems[title]
      }
      return fallback
    },
    [state.collapsedItems]
  )

  const setGroupOpen = useCallback((title: string, open: boolean) => {
    setState((prev) => ({
      ...prev,
      collapsedItems: { ...prev.collapsedItems, [title]: open },
    }))
  }, [])

  const scrollTop = state.scrollTop

  // Debounced scroll setter to avoid thrashing localStorage
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const setScrollTop = useCallback((value: number) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, scrollTop: value }))
    }, SCROLL_DEBOUNCE_MS)
  }, [])

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  return { getGroupOpen, setGroupOpen, scrollTop, setScrollTop }
}
