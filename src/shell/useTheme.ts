import { useCallback, useEffect, useState } from 'react'

/*
 * Night mode. A stored choice (`vault:theme`) wins; with none, the system's own
 * dark preference does. The choice is written onto <html> as data-theme, which
 * is what src/index.css reads, and index.html sets the same attribute before
 * the first paint so the field never flashes white on a night.
 */

export const THEME_KEY = 'vault:theme'
export type Theme = 'light' | 'night'

const QUERY = '(prefers-color-scheme: dark)'

function readStored(): Theme | null {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return v === 'night' || v === 'light' ? v : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return typeof matchMedia === 'function' && matchMedia(QUERY).matches ? 'night' : 'light'
}

export function applyTheme(stored: Theme | null): void {
  const root = document.documentElement
  if (stored) root.dataset.theme = stored
  else delete root.dataset.theme
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [stored, setStored] = useState<Theme | null>(readStored)
  const [system, setSystem] = useState<Theme>(systemTheme)

  useEffect(() => {
    applyTheme(stored)
  }, [stored])

  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia(QUERY)
    const onChange = () => setSystem(mq.matches ? 'night' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const theme = stored ?? system
  const toggle = useCallback(() => {
    const next: Theme = theme === 'night' ? 'light' : 'night'
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      /* the choice still holds for this tab */
    }
    setStored(next)
  }, [theme])

  return { theme, toggle }
}
