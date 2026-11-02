import { useEffect, useMemo, useRef, useState } from 'react'
import Setup from './Setup.jsx'
import Player from './Player.jsx'
import { useSettings } from './lib/settings.js'
import { makeT } from './lib/i18n.js'
import { scanHandle, scanFiles } from './lib/media.js'
import { saveHandle, loadHandle, removeHandle, ensurePermission } from './lib/handles.js'

const SLOTS = ['media', 'music']
const canPick = typeof window !== 'undefined' && 'showDirectoryPicker' in window

export default function App() {
  const [s, patch] = useSettings()
  const t = useMemo(() => makeT(s.lang), [s.lang])
  const [folders, setFolders] = useState({ media: null, music: null })
  const [saved, setSaved] = useState({ media: null, music: null })
  const [busy, setBusy] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [notice, setNotice] = useState('')
  const inputs = { media: useRef(null), music: useRef(null) }

  useEffect(() => {
    document.documentElement.lang = s.lang
  }, [s.lang])

  // Restore remembered folder handles (Chromium)
  useEffect(() => {
    if (!canPick) return
    ;(async () => {
      const next = {}
      for (const slot of SLOTS) next[slot] = await loadHandle(slot).catch(() => null)
      setSaved(next)
    })()
  }, [])

  async function applyHandle(slot, handle, persist) {
    setBusy(true)
    setNotice('')
    try {
      const items = await scanHandle(handle, slot)
      setFolders((f) => ({ ...f, [slot]: { name: handle.name, items } }))
      if (persist) {
        await saveHandle(slot, handle).catch(() => {})
        setSaved((x) => ({ ...x, [slot]: handle }))
      }
    } finally {
      setBusy(false)
    }
  }

  async function pick(slot) {
    if (!canPick) return inputs[slot].current?.click()
    try {
      const handle = await window.showDirectoryPicker({ id: slot, mode: 'read' })
      await applyHandle(slot, handle, true)
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e)
    }
  }

  async function reopen(slot) {
    const handle = saved[slot]
    if (handle && (await ensurePermission(handle))) await applyHandle(slot, handle, false)
  }

  function onFiles(slot, fileList) {
    if (!fileList || !fileList.length) return
    const first = fileList[0].webkitRelativePath || ''
    setFolders((f) => ({ ...f, [slot]: { name: first.split('/')[0] || slot, items: scanFiles(fileList, slot) } }))
  }

  async function onDrop(e, slot) {
    e.preventDefault()
    const item = e.dataTransfer.items && e.dataTransfer.items[0]
    if (item && item.getAsFileSystemHandle) {
      const handle = await item.getAsFileSystemHandle()
      if (handle && handle.kind === 'directory') return applyHandle(slot, handle, true)
    }
    setNotice(t('unsupported'))
  }

  function clear(slot) {
    setFolders((f) => ({ ...f, [slot]: null }))
    setSaved((x) => ({ ...x, [slot]: null }))
    removeHandle(slot).catch(() => {})
  }

  const visuals = useMemo(() => (folders.media?.items || []).filter((i) => i.kind !== 'audio'), [folders.media])
  const mediaAudio = useMemo(() => (folders.media?.items || []).filter((i) => i.kind === 'audio'), [folders.media])
  const ownMusic = useMemo(() => (folders.music?.items || []).filter((i) => i.kind === 'audio'), [folders.music])
  const tracks = ownMusic.length ? ownMusic : mediaAudio
  const musicSource = ownMusic.length ? 'folder' : mediaAudio.length ? 'media' : 'none'

  async function start() {
    try {
      await document.documentElement.requestFullscreen()
    } catch {
      /* fullscreen may be blocked, continue windowed */
    }
    setPlaying(true)
  }

  function exit() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    setPlaying(false)
  }

  if (playing) return <Player visuals={visuals} tracks={tracks} s={s} patch={patch} t={t} onExit={exit} />

  return (
    <Setup
      t={t}
      s={s}
      patch={patch}
      folders={folders}
      saved={saved}
      busy={busy}
      notice={notice}
      visualsCount={visuals.length}
      tracksCount={tracks.length}
      musicSource={musicSource}
      inputs={inputs}
      canPick={canPick}
      onPick={pick}
      onReopen={reopen}
      onClear={clear}
      onDrop={onDrop}
      onFiles={onFiles}
      onStart={start}
    />
  )
}
