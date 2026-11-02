import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon, IconButton, Seg } from './ui.jsx'
import { makeOrder } from './lib/media.js'
import { readTags } from './lib/tags.js'

const clamp = (v) => Math.min(1, Math.max(0, v))
const fmt = (sec) => {
  if (!isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  return m + ':' + String(Math.floor(sec % 60)).padStart(2, '0')
}

export default function Player({ visuals, tracks, s, patch, t, onExit }) {
  const order = useMemo(() => makeOrder(visuals, s.shuffle), [visuals, s.shuffle])
  const torder = useMemo(() => makeOrder(tracks, s.shuffle), [tracks, s.shuffle])

  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [layers, setLayers] = useState([])
  const [ui, setUi] = useState(true)
  const [isFs, setIsFs] = useState(!!document.fullscreenElement)

  const [ti, setTi] = useState(0)
  const [want, setWant] = useState(true)
  const [mMuted, setMMuted] = useState(false)
  const [now, setNow] = useState(null)
  const [pos, setPos] = useState(0)
  const [dur, setDur] = useState(0)

  const audioRef = useRef(null)
  const videoRef = useRef(null)
  const urls = useRef(new Set())
  const hideTimer = useRef(null)
  const hover = useRef(false)
  const wantRef = useRef(want)
  wantRef.current = want

  const top = layers[layers.length - 1]
  const duck = top?.kind === 'video' && s.videoSound

  const next = useCallback(() => setIdx((i) => (i + 1) % Math.max(1, order.length)), [order.length])
  const prev = useCallback(() => setIdx((i) => (i - 1 + order.length) % Math.max(1, order.length)), [order.length])
  const nextTrack = useCallback(() => setTi((i) => (i + 1) % Math.max(1, torder.length)), [torder.length])
  const prevTrack = useCallback(() => setTi((i) => (i - 1 + torder.length) % Math.max(1, torder.length)), [torder.length])

  const poke = useCallback(() => {
    setUi(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (!hover.current) setUi(false)
    }, 3000)
  }, [])

  const toggleFs = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else document.documentElement.requestFullscreen().catch(() => {})
  }, [])

  useEffect(() => {
    poke()
    return () => clearTimeout(hideTimer.current)
  }, [poke])

  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  useEffect(() => setIdx(0), [order])
  useEffect(() => setTi(0), [torder])

  // Load the current slide and cross-fade it over the previous one
  useEffect(() => {
    const it = order[idx]
    if (!it) return
    let dead = false
    ;(async () => {
      try {
        const f = await it.getFile()
        if (dead) return
        const url = URL.createObjectURL(f)
        setLayers((l) => [...l.slice(-1), { key: it.id + ':' + Math.random(), url, kind: it.kind, name: it.name }])
      } catch {
        if (!dead) setTimeout(next, 300)
      }
    })()
    return () => {
      dead = true
    }
  }, [idx, order, next])

  // Release object URLs that are no longer displayed
  useEffect(() => {
    const keep = new Set(layers.map((l) => l.url))
    for (const u of urls.current) {
      if (!keep.has(u)) {
        URL.revokeObjectURL(u)
        urls.current.delete(u)
      }
    }
    layers.forEach((l) => urls.current.add(l.url))
  }, [layers])
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), [])

  // Picture timer
  useEffect(() => {
    if (!top || top.kind !== 'image' || paused) return
    const id = setTimeout(next, s.interval * 1000)
    return () => clearTimeout(id)
  }, [top, paused, s.interval, next])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (paused) v.pause()
    else v.play().catch(() => {})
  }, [paused, layers])

  // Music track loading
  useEffect(() => {
    const tr = torder[ti]
    if (!tr) return
    let dead = false
    let url
    let cover
    ;(async () => {
      try {
        const f = await tr.getFile()
        if (dead) return
        url = URL.createObjectURL(f)
        const a = audioRef.current
        a.src = url
        if (wantRef.current) a.play().catch(() => {})
        const tags = await readTags(f)
        if (dead) {
          if (tags.cover) URL.revokeObjectURL(tags.cover)
          return
        }
        cover = tags.cover
        setNow({ title: tags.title, artist: tags.artist, cover })
      } catch {
        if (!dead) setTimeout(nextTrack, 300)
      }
    })()
    return () => {
      dead = true
      if (url) URL.revokeObjectURL(url)
      if (cover) URL.revokeObjectURL(cover)
    }
  }, [ti, torder, nextTrack])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.volume = clamp(s.volume * (duck ? 0.15 : 1))
    a.muted = mMuted
  }, [s.volume, duck, mMuted, ti])

  useEffect(() => {
    const a = audioRef.current
    if (!a || !a.src) return
    if (want) a.play().catch(() => {})
    else a.pause()
  }, [want])

  // Keep the screen awake
  useEffect(() => {
    let lock
    navigator.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => {})
    return () => lock?.release?.()
  }, [])

  const act = useRef({})
  act.current = {
    next, prev, nextTrack, prevTrack, toggleFs, setWant,
    toggle: () => setPaused((p) => !p),
    mute: () => setMMuted((m) => !m),
    shuffle: () => patch({ shuffle: !s.shuffle }),
    vol: (d) => patch({ volume: clamp(s.volume + d) }),
    exit: onExit,
  }

  useEffect(() => {
    if (!('mediaSession' in navigator) || !now) return
    const ms = navigator.mediaSession
    ms.metadata = new MediaMetadata({ title: now.title, artist: now.artist, artwork: now.cover ? [{ src: now.cover }] : [] })
    ms.setActionHandler('nexttrack', () => act.current.nextTrack())
    ms.setActionHandler('previoustrack', () => act.current.prevTrack())
    ms.setActionHandler('play', () => act.current.setWant(true))
    ms.setActionHandler('pause', () => act.current.setWant(false))
  }, [now])

  useEffect(() => {
    const h = (e) => {
      const a = act.current
      poke()
      const k = e.key.toLowerCase()
      if (k === ' ') { e.preventDefault(); document.activeElement?.blur?.(); a.toggle() }
      else if (k === 'arrowright') a.next()
      else if (k === 'arrowleft') a.prev()
      else if (k === 'arrowup') { e.preventDefault(); a.vol(0.05) }
      else if (k === 'arrowdown') { e.preventDefault(); a.vol(-0.05) }
      else if (k === 'n') a.nextTrack()
      else if (k === 'p') a.prevTrack()
      else if (k === 'm') a.mute()
      else if (k === 's') a.shuffle()
      else if (k === 'f') a.toggleFs()
      else if (k === 'escape' && !document.fullscreenElement) a.exit()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [poke])

  const barProps = {
    onMouseEnter: () => { hover.current = true },
    onMouseLeave: () => { hover.current = false; poke() },
  }
  const fade = 'transition-opacity duration-500 ' + (ui ? 'opacity-100' : 'pointer-events-none opacity-0')
  const fitClass = s.fit === 'cover' ? 'object-cover' : 'object-contain'
  const trackName = now?.title || torder[ti]?.name || ''

  return (
    <div className={'fixed inset-0 select-none overflow-hidden bg-black text-white ' + (ui ? '' : 'cursor-none')} onMouseMove={poke} onTouchStart={poke}>
      {layers.map((l, i) => {
        const isTop = i === layers.length - 1
        return (
          <div key={l.key} className={'absolute inset-0 ' + (isTop ? 'fs-fade' : '')}>
            {l.kind === 'image' ? (
              <>
                <img src={l.url} alt='' className='absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-3xl' />
                <img src={l.url} alt={l.name} onError={isTop ? next : undefined} className={'absolute inset-0 h-full w-full ' + fitClass + (s.zoom && isTop ? ' fs-zoom' : '')} style={{ animationDuration: s.interval + 1 + 's', animationPlayState: paused ? 'paused' : 'running' }} />
              </>
            ) : (
              <video ref={isTop ? videoRef : null} src={l.url} autoPlay={isTop} muted={!isTop || !s.videoSound} playsInline onEnded={isTop ? next : undefined} onError={isTop ? next : undefined} className={'absolute inset-0 h-full w-full ' + fitClass} />
            )}
          </div>
        )
      })}

      {top?.kind === 'image' && !paused && ui && (
        <div className='absolute inset-x-0 bottom-0 h-0.5 bg-white/10'>
          <div key={top.key} className='fs-progress h-full bg-white/70' style={{ animationDuration: s.interval + 's' }} />
        </div>
      )}

      <div className={'absolute inset-x-0 top-0 flex items-center gap-3 p-4 md:p-6 ' + fade} style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,.7), transparent)' }} {...barProps}>
        <IconButton icon='x' label={t('exit')} onClick={onExit} />
        <div className='min-w-0 flex-1'>
          <div className='truncate text-sm font-medium'>{top?.name}</div>
          <div className='text-xs text-white/60'>{order.length ? idx + 1 + ' / ' + order.length : ''}</div>
        </div>
        <IconButton icon='expand' label={t('fullscreen')} onClick={toggleFs} className={isFs ? 'bg-white/30' : ''} />
      </div>

      <div className={'absolute inset-x-0 bottom-0 p-4 pt-16 md:p-6 md:pt-20 ' + fade} style={{ background: 'linear-gradient(to top, rgba(0,0,0,.8), transparent)' }} {...barProps}>
        <div className='flex flex-wrap items-end justify-between gap-4'>
          {torder.length > 0 ? (
            <div className='flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-xl md:w-96'>
              <div className='grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/10'>
                {now?.cover ? <img src={now.cover} alt='' className='size-full object-cover' /> : <Icon name='music' className='size-6 text-white/60' />}
              </div>
              <div className='min-w-0 flex-1'>
                <div className='truncate text-sm font-semibold' title={trackName}>{trackName}</div>
                <div className='truncate text-xs text-white/60'>{now?.artist || t('nowPlaying')}</div>
                <input type='range' aria-label='Seek' min={0} max={dur || 0} step={1} value={Math.min(pos, dur || 0)} onChange={(e) => { audioRef.current.currentTime = Number(e.target.value) }} className='mt-1 h-1 w-full accent-white' />
                <div className='flex justify-between text-[10px] text-white/50'><span>{fmt(pos)}</span><span>{fmt(dur)}</span></div>
              </div>
              <div className='flex flex-col items-center gap-1'>
                <div className='flex items-center gap-1'>
                  <IconButton icon='prev' label={t('prevTrack')} onClick={prevTrack} className='p-1.5' iconClass='size-4' />
                  <IconButton icon={want ? 'pause' : 'play'} label={want ? t('pause') : t('play')} onClick={() => setWant((w) => !w)} className='bg-white/20 p-2' iconClass='size-5' />
                  <IconButton icon='next' label={t('nextTrack')} onClick={nextTrack} className='p-1.5' iconClass='size-4' />
                </div>
                <div className='flex items-center gap-1'>
                  <button type='button' aria-label={mMuted ? t('unmute') : t('mute')} title={mMuted ? t('unmute') : t('mute')} onClick={() => setMMuted((m) => !m)} className='text-white/70 hover:text-white'>
                    <Icon name={mMuted ? 'mute' : 'volume'} className='size-4' />
                  </button>
                  <input type='range' aria-label='Volume' min={0} max={1} step={0.01} value={s.volume} onChange={(e) => patch({ volume: Number(e.target.value) })} className='h-1 w-16 accent-white' />
                </div>
              </div>
            </div>
          ) : (
            <div className='hidden md:block md:w-96' />
          )}

          <div className='flex items-center gap-3'>
            <IconButton icon='prev' label={t('prevSlide')} onClick={prev} className='p-3' />
            <IconButton icon={paused ? 'play' : 'pause'} label={paused ? t('play') : t('pause')} onClick={() => setPaused((p) => !p)} className='bg-white p-4 text-black hover:bg-white/85' iconClass='size-6' />
            <IconButton icon='next' label={t('nextSlide')} onClick={next} className='p-3' />
          </div>

          <div className='flex flex-wrap items-center justify-end gap-2 md:w-96'>
            <Seg value={s.shuffle} onChange={(v) => patch({ shuffle: v })} label={t('order')} options={[{ v: true, label: t('shuffle') }, { v: false, label: t('sequential') }]} />
            <Seg value={s.interval} onChange={(v) => patch({ interval: v })} label={t('duration')} options={[3, 5, 10, 20].map((v) => ({ v, label: v + 's' }))} />
            <Seg value={s.fit} onChange={(v) => patch({ fit: v })} label={t('fit')} options={[{ v: 'contain', label: t('contain') }, { v: 'cover', label: t('cover') }]} />
          </div>
        </div>
      </div>

      <audio ref={audioRef} loop={torder.length === 1} onEnded={nextTrack} onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDur(e.currentTarget.duration)} />
    </div>
  )
}
