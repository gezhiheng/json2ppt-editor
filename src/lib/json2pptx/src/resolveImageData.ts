const dataUrlRegex = /^data:image\/[^;]+;base64,/

const mimeFromPath = (path: string) => {
  const lower = path.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.bmp')) return 'image/bmp'
  return 'application/octet-stream'
}

const toBase64 = (buffer: ArrayBuffer) => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64')
  }

  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

const readLocalFile = async (path: string) => {
  const fs = await import('node:fs/promises')
  const buffer = await fs.readFile(path)
  return buffer.toString('base64')
}

export const resolveImageData = async (src: string) => {
  if (dataUrlRegex.test(src)) return src

  const isFileUrl = src.startsWith('file://')
  const isLocalPath = !src.startsWith('http') && !src.startsWith('data:')
  const isNode = typeof process !== 'undefined' && Boolean(process.versions?.node)

  if ((isFileUrl || isLocalPath) && isNode) {
    const filePath = isFileUrl ? src.replace('file://', '') : src
    const base64 = await readLocalFile(filePath)
    const mime = mimeFromPath(filePath)
    return `data:${mime};base64,${base64}`
  }

  if (typeof fetch !== 'function') {
    throw new Error('fetch is not available to resolve image data')
  }

  const response = await fetch(src)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const base64 = toBase64(arrayBuffer)
  const contentType = response.headers.get('content-type') || mimeFromPath(src)
  return `data:${contentType};base64,${base64}`
}
