export function fileDownloadUrl(fileUrl: string): string {
  return `/api/files/download?url=${encodeURIComponent(fileUrl)}`;
}
