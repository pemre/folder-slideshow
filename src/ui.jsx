const ICONS = {
  play: { fill: true, d: 'M8 5v14l11-7z' },
  pause: { fill: true, d: 'M6 5h4v14H6zM14 5h4v14h-4z' },
  next: { fill: true, d: 'M6 6l9 6-9 6V6zM17 6h2v12h-2z' },
  prev: { fill: true, d: 'M18 6l-9 6 9 6V6zM5 6h2v12H5z' },
  shuffle: { d: 'M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5' },
  music: { d: 'M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z' },
  folder: { d: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z' },
  image: { d: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9.5h.01' },
  x: { d: 'M6 6l12 12M18 6L6 18' },
  volume: { d: 'M11 5L6 9H3v6h3l5 4V5zM16 9a4 4 0 010 6M19 6a8 8 0 010 12' },
  mute: { d: 'M11 5L6 9H3v6h3l5 4V5zM17 9l5 6M22 9l-5 6' },
  expand: { d: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5' },
}

export function Icon({ name, className = 'size-5' }) {
  const i = ICONS[name]
  return (
    <svg viewBox='0 0 24 24' className={className} fill={i.fill ? 'currentColor' : 'none'} stroke={i.fill ? 'none' : 'currentColor'} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <path d={i.d} />
    </svg>
  )
}

export function IconButton({ icon, label, onClick, className = '', iconClass }) {
  return (
    <button type='button' title={label} aria-label={label} onClick={onClick} className={'grid place-items-center rounded-full bg-white/10 p-2.5 transition hover:bg-white/25 ' + className}>
      <Icon name={icon} className={iconClass} />
    </button>
  )
}

export function Seg({ value, options, onChange, label }) {
  return (
    <div role='group' aria-label={label} className='inline-flex rounded-full bg-white/10 p-0.5 text-xs'>
      {options.map((o) => (
        <button key={String(o.v)} type='button' onClick={() => onChange(o.v)} className={'rounded-full px-3 py-1.5 transition ' + (value === o.v ? 'bg-white text-black' : 'text-white/70 hover:text-white')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
