import { useCallback, useState } from 'react'
import { detectLang } from './i18n.js'

const KEY = 'folder-slideshow.settings'

const DEFAULTS = {
  lang: detectLang(),
  interval: 5,
  shuffle: true,
  fit: 'contain',
  zoom: true,
  volume: 0.7,
  videoSound: true,
}

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return DEFAULTS
  }
}

export function useSettings() {
  const [s, setS] = useState(load)
  const patch = useCallback((p) => {
    setS((old) => {
      const next = { ...old, ...p }
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        /* storage unavailable */
      }
      return next
    })
  }, [])
  return [s, patch]
}
