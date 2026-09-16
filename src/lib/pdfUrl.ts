/**
 * PDF URL helpers.
 * Relative URLs are converted to valid absolute HTTPS URLs.
 * Direct Cloudinary URLs and HTTPS URLs are returned directly as absolute resources.
 */

function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com');
}

/** Converts any relative URL or localhost URL to a valid absolute HTTPS URL. */
export function toAbsoluteUrl(url: string | null | undefined, backendOrigin: string): string {
  if (!url) return '';
  let full = url.trim();

  if (full.startsWith('/')) {
    full = `${backendOrigin}${full}`;
  } else if (full.startsWith('http://localhost:4000') || full.startsWith('http://127.0.0.1:4000')) {
    full = full.replace(/^http:\/\/(localhost|127\.0\.0\.1):4000/, backendOrigin);
  }

  // Ensure production backend or Cloudinary HTTP URLs use HTTPS
  if (full.startsWith('http://') && (full.includes('onrender.com') || full.includes('cloudinary.com'))) {
    full = full.replace(/^http:/, 'https:');
  }

  return full;
}

/**
 * Resolves a stored file URL into a valid inline preview URL.
 */
export function getInlinePreviewUrl(url: string | null | undefined, backendOrigin: string): string | null {
  if (!url) return null;
  const absUrl = toAbsoluteUrl(url, backendOrigin);
  return absUrl;
}

/**
 * Returns a URL that deterministically forces a download.
 */
export function getDownloadUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (isCloudinaryUrl(url) && !url.includes('/fl_attachment/')) {
    return url.replace('/upload/', '/upload/fl_attachment/');
  }
  return url;
}
