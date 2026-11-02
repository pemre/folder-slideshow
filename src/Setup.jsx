import { Icon, Seg } from './ui.jsx'
import { LANGS } from './lib/i18n.js'

function Card({ slot, icon, gradient, title, desc, folder, saved, line, p }) {
  const { t, busy, canPick, inputs } = p
  return (
    <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => p.onDrop(e, slot)} className='flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl'>
      <div className='flex items-center gap-3'>
        <div className='grid size-11 place-items-center rounded-2xl' style={{ background: gradient }}>
          <Icon name={icon} className='size-6' />
        </div>
        <h2 className='text-lg font-semibold'>{title}</h2>
      </div>
      <p className='text-sm text-white/60'>{desc}</p>

      {folder ? (
        <div className='rounded-2xl bg-black/30 p-3'>
          <div className='flex items-center gap-2 truncate font-medium'>
            <Icon name='folder' className='size-4 shrink-0 text-white/60' />
            <span className='truncate'>{folder.name}</span>
          </div>
          <div className='mt-1 text-xs text-white/60'>{line}</div>
        </div>
      ) : saved && canPick ? (
        <button type='button' onClick={() => p.onReopen(slot)} className='truncate rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-left text-sm transition hover:bg-white/20'>
          {t('reopen', { name: saved.name })}
        </button>
      ) : null}

      <div className='mt-auto flex items-center gap-2'>
        <button type='button' disabled={busy} onClick={() => p.onPick(slot)} className='rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/85 disabled:opacity-50'>
          {busy ? t('scanning') : folder ? t('change') : t('choose')}
        </button>
        {folder && (
          <button type='button' onClick={() => p.onClear(slot)} className='rounded-full px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white'>
            {t('clear')}
          </button>
        )}
        <span className='ml-auto hidden text-xs text-white/40 sm:block'>{t('dropHint')}</span>
      </div>
      <input ref={inputs[slot]} type='file' webkitdirectory='' directory='' multiple className='hidden' onChange={(e) => { p.onFiles(slot, e.target.files); e.target.value = '' }} />
    </div>
  )
}

export default function Setup(p) {
  const { t, s, patch, folders } = p
  const audioInMedia = folders.media ? folders.media.items.filter((i) => i.kind === 'audio').length : 0
  const mediaLine = folders.media ? t('counts', { v: p.visualsCount, a: audioInMedia }) : ''
  const musicLine = folders.music ? t('tracksCount', { n: folders.music.items.filter((i) => i.kind === 'audio').length }) : ''
  const canStart = p.visualsCount > 0 && !p.busy

  return (
    <div className='relative min-h-full overflow-hidden' style={{ background: 'radial-gradient(1200px 600px at 10% -10%, rgba(124,58,237,.35), transparent), radial-gradient(900px 500px at 100% 10%, rgba(236,72,153,.25), transparent), #07070c' }}>
      <main className='mx-auto flex min-h-full max-w-4xl flex-col gap-8 px-5 py-10 md:py-16'>
        <header className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            <h1 className='text-4xl font-bold tracking-tight md:text-5xl'>Folder Slideshow</h1>
            <p className='mt-3 max-w-xl text-white/70'>{t('subtitle')}</p>
          </div>
          <Seg value={s.lang} options={LANGS} onChange={(v) => patch({ lang: v })} label={t('language')} />
        </header>

        <section className='grid gap-5 md:grid-cols-2'>
          <Card slot='media' icon='image' gradient='linear-gradient(135deg,#7c3aed,#ec4899)' title={t('mediaTitle')} desc={t('mediaDesc')} folder={folders.media} saved={p.saved.media} line={mediaLine} p={p} />
          <Card slot='music' icon='music' gradient='linear-gradient(135deg,#0ea5e9,#22c55e)' title={t('musicTitle')} desc={t('musicDesc')} folder={folders.music} saved={p.saved.music} line={musicLine} p={p} />
        </section>

        <div className='text-sm text-white/60'>
          {p.musicSource === 'media' ? t('musicFromMedia', { n: p.tracksCount }) : p.musicSource === 'none' ? t('musicNone') : t('tracksCount', { n: p.tracksCount })}
          {p.notice && <span className='ml-3 text-amber-300'>{p.notice}</span>}
        </div>

        <section className='flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm backdrop-blur-xl'>
          <label className='flex items-center gap-2'>
            <span className='text-white/60'>{t('order')}</span>
            <Seg value={s.shuffle} onChange={(v) => patch({ shuffle: v })} label={t('order')} options={[{ v: true, label: t('shuffle') }, { v: false, label: t('sequential') }]} />
          </label>
          <label className='flex items-center gap-2'>
            <span className='text-white/60'>{t('duration')}</span>
            <Seg value={s.interval} onChange={(v) => patch({ interval: v })} label={t('duration')} options={[3, 5, 10, 20].map((v) => ({ v, label: String(v) }))} />
          </label>
          <label className='flex items-center gap-2'>
            <span className='text-white/60'>{t('fit')}</span>
            <Seg value={s.fit} onChange={(v) => patch({ fit: v })} label={t('fit')} options={[{ v: 'contain', label: t('contain') }, { v: 'cover', label: t('cover') }]} />
          </label>
          <label className='flex items-center gap-2'>
            <span className='text-white/60'>{t('zoom')}</span>
            <Seg value={s.zoom} onChange={(v) => patch({ zoom: v })} label={t('zoom')} options={[{ v: true, label: t('on') }, { v: false, label: t('off') }]} />
          </label>
          <label className='flex items-center gap-2'>
            <span className='text-white/60'>{t('videoSound')}</span>
            <Seg value={s.videoSound} onChange={(v) => patch({ videoSound: v })} label={t('videoSound')} options={[{ v: true, label: t('on') }, { v: false, label: t('off') }]} />
          </label>
        </section>

        <div className='flex flex-col items-start gap-3'>
          <button type='button' disabled={!canStart} onClick={p.onStart} className='rounded-full px-8 py-4 text-lg font-semibold shadow-xl transition enabled:hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40' style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}>
            {t('start')}
          </button>
          {!canStart && <span className='text-sm text-white/50'>{t('startHint')}</span>}
        </div>

        <footer className='mt-auto space-y-1 pt-6 text-xs text-white/40'>
          <p>{t('privacy')}</p>
          <p>{t('shortcuts')}</p>
        </footer>
      </main>
    </div>
  )
}
