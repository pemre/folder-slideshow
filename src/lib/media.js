const EXT = {
  image: new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'svg']),
  video: new Set(['mp4', 'webm', 'mov', 'm4v', 'ogv']),
  audio: new Set(['mp3', 'flac', 'm4a', 'aac', 'ogg', 'oga', 'opus', 'wav']),
}

export function kindOf(name) {
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase()
  for (const k of Object.keys(EXT)) if (EXT[k].has(ext)) return k
  return null
}

// Recursively scan a FileSystemDirectoryHandle
export async function scanHandle(dir, slot, out = [], prefix = '') {
  for await (const [name, h] of dir.entries()) {
    if (name.startsWith('.')) continue
    if (h.kind === 'directory') {
      await scanHandle(h, slot, out, prefix + name + '/')
    } else {
      const kind = kindOf(name)
      if (kind) out.push({ id: slot + ':' + prefix + name, name, path: prefix + name, kind, getFile: () => h.getFile() })
    }
  }
  return out
}

// Fallback for browsers without showDirectoryPicker (input webkitdirectory)
export function scanFiles(list, slot) {
  return Array.from(list).flatMap((f) => {
    const kind = kindOf(f.name)
    if (!kind) return []
    const path = f.webkitRelativePath || f.name
    return [{ id: slot + ':' + path, name: f.name, path, kind, getFile: async () => f }]
  })
}

export function makeOrder(list, shuffle) {
  const a = [...list]
  if (shuffle) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
  } else {
    a.sort((x, y) => x.path.localeCompare(y.path, undefined, { numeric: true, sensitivity: 'base' }))
  }
  return a
}
