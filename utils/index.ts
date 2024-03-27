export const getPageSource = async (url: string): Promise<string> => {
  const response = await fetch(url);
  return await response.text();
};

export function urlToFileName(url: string): string {
  // Remove protocol (http, https, etc.) and replace non-file-name characters
  const fileName = url
    .replace(/^(?:https?:\/\/)?(?:www\.)?/i, "") // Remove protocol & www
    .replace(/[^a-zA-Z0-9\-_\.]/g, "_") // Replace non-allowed chars with _
    .replace(/__+/g, "_") // Replace multiple underscores with a single one
    .replace(/^_|_$/g, ""); // Remove leading/trailing underscores

  // Optionally truncate to a max length (e.g., 255 for most file systems)
  const maxLength = 255;
  if (fileName.length > maxLength) {
    // Keeping the extension might be relevant, so consider it when truncating
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      const namePart = fileName
        .substring(0, lastDotIndex)
        .substring(0, maxLength - (fileName.length - lastDotIndex));
      const extensionPart = fileName.substring(lastDotIndex);
      return `${namePart}${extensionPart}`;
    }
    return fileName.substring(0, maxLength);
  }

  return fileName;
}
