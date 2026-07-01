// Inserts a Cloudinary transformation (auto format/quality + an optional width
// cap) right after "/upload/" in a Cloudinary delivery URL, so a full-resolution
// admin upload isn't served at full size into a small card everywhere it's used.
// Non-Cloudinary URLs (demo catalog images, any other external URL) pass through
// unchanged.
export const cloudinaryOptimized = (url, width) => {
  if (!url || !url.includes('/upload/')) return url
  return url.replace('/upload/', `/upload/q_auto,f_auto${width ? `,w_${width}` : ''}/`)
}
