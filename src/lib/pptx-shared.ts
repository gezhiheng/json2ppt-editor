const IMAGE_CACHE = new Map<string, string>()

export const resolveImageData = async (src: string) => {
  if (IMAGE_CACHE.has(src)) return IMAGE_CACHE.get(src) as string
  if (src.startsWith('data:')) {
    IMAGE_CACHE.set(src, src)
    return src
  }
  const response = await fetch(src)
  const blob = await response.blob()
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Invalid image data'))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
  IMAGE_CACHE.set(src, data)
  return data
}
