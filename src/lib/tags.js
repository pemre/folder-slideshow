// Minimal ID3v2 reader (title, artist, cover). Other formats fall back to the file name.
function decode(bytes, enc) {
  let label = 'iso-8859-1'
  if (enc === 3) label = 'utf-8'
  else if (enc === 2) label = 'utf-16be'
  else if (enc === 1) label = bytes[0] === 0xfe && bytes[1] === 0xff ? 'utf-16be' : 'utf-16le'
  return new TextDecoder(label).decode(bytes).split(String.fromCharCode(0)).join('').trim()
}

function readText(d) {
  return decode(d.subarray(1), d[0])
}

function readPicture(d) {
  const enc = d[0]
  let p = 1
  while (p < d.length && d[p] !== 0) p++
  const mime = String.fromCharCode(...d.subarray(1, p)) || 'image/jpeg'
  p += 2 // terminator + picture type
  if (enc === 1 || enc === 2) {
    while (p + 1 < d.length && !(d[p] === 0 && d[p + 1] === 0)) p += 2
    p += 2
  } else {
    while (p < d.length && d[p] !== 0) p++
    p += 1
  }
  return URL.createObjectURL(new Blob([d.subarray(p)], { type: mime }))
}

const syncsafe = (b) => (b[0] << 21) | (b[1] << 14) | (b[2] << 7) | b[3]

export async function readTags(file) {
  const out = { title: file.name.replace(/\.[^.]+$/, ''), artist: '', cover: null }
  try {
    const head = new Uint8Array(await file.slice(0, 10).arrayBuffer())
    if (String.fromCharCode(head[0], head[1], head[2]) !== 'ID3') return out
    const ver = head[3]
    const size = Math.min(syncsafe(head.subarray(6, 10)), 8 * 1024 * 1024)
    const buf = new Uint8Array(await file.slice(10, 10 + size).arrayBuffer())
    let p = 0
    while (p + 10 <= buf.length) {
      const id = String.fromCharCode(buf[p], buf[p + 1], buf[p + 2], buf[p + 3])
      if (!/^[A-Z0-9]{4}$/.test(id)) break
      const sz = ver === 4 ? syncsafe(buf.subarray(p + 4, p + 8)) : ((buf[p + 4] << 24) | (buf[p + 5] << 16) | (buf[p + 6] << 8) | buf[p + 7]) >>> 0
      const data = buf.subarray(p + 10, p + 10 + sz)
      p += 10 + sz
      if (!data.length) continue
      if (id === 'TIT2') out.title = readText(data) || out.title
      else if (id === 'TPE1') out.artist = readText(data)
      else if (id === 'APIC' && !out.cover) out.cover = readPicture(data)
    }
  } catch {
    /* ignore broken tags */
  }
  return out
}
