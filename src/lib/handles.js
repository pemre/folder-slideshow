// Persists FileSystemDirectoryHandle objects in IndexedDB (Chromium only)
const DB = 'folder-slideshow'
const STORE = 'handles'

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run(mode, fn) {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(req.result)
    tx.onerror = () => reject(tx.error)
  })
}

export const saveHandle = (key, handle) => run('readwrite', (s) => s.put(handle, key))
export const loadHandle = (key) => run('readonly', (s) => s.get(key))
export const removeHandle = (key) => run('readwrite', (s) => s.delete(key))

export async function ensurePermission(handle) {
  const opts = { mode: 'read' }
  if ((await handle.queryPermission(opts)) === 'granted') return true
  return (await handle.requestPermission(opts)) === 'granted'
}
