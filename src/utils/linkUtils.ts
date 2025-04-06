/**
 * Detects YouTube Video IDs from various YouTube URL formats
 */
export function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Detects URLs in text
 */
export function findUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

/**
 * Checks if a URL is a YouTube video URL
 */
export function isYoutubeUrl(url: string): boolean {
  return !!extractYoutubeVideoId(url);
}

/**
 * Checks if a message is a preview command
 */
export function isPreviewCommand(text: string): {isPreview: boolean, url: string | null} {
  const prevCommandRegex = /@prev\s+(https?:\/\/[^\s]+)/i;
  const match = text.match(prevCommandRegex);
  
  if (match && match[1]) {
    return { isPreview: true, url: match[1] };
  }
  
  return { isPreview: false, url: null };
}

/**
 * Checks if a message is a YouTube preview command
 */
export function isYoutubePreviewCommand(text: string): {isYoutubePreview: boolean, url: string | null} {
  const ytCommandRegex = /@yt\s+(https?:\/\/[^\s]+)/i;
  const match = text.match(ytCommandRegex);
  
  if (match && match[1]) {
    return { isYoutubePreview: true, url: match[1] };
  }
  
  return { isYoutubePreview: false, url: null };
}

/**
 * Checks if a URL is audio/video media
 */
export function isMediaUrl(url: string): boolean {
  // Add other audio/video platforms as needed
  return isYoutubeUrl(url);
}
