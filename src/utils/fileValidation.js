/**
 * Reusable validation helpers for uploads.
 * Pure functions only — no side effects, no I/O. Same spirit as utils/response.js.
 */

const ALLOWED_MIME_TYPES = {
  video: ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"],
  pdf: ["application/pdf"],
};

const MAX_FILE_SIZE_BYTES = {
  video: 2 * 1024 * 1024 * 1024, // 2 GB
  pdf: 25 * 1024 * 1024, // 25 MB
};

function resolveFileKind(mimeType) {
  if (ALLOWED_MIME_TYPES.video.includes(mimeType)) return "video";
  if (ALLOWED_MIME_TYPES.pdf.includes(mimeType)) return "pdf";
  return null;
}

/**
 * Validates a multer file object.
 * Returns { valid: true, kind } or { valid: false, message }.
 */
function validateFile(file) {
  if (!file) {
    return { valid: false, message: "No file was provided." };
  }

  const kind = resolveFileKind(file.mimetype);
  if (!kind) {
    return {
      valid: false,
      message: `Unsupported file type: "${file.mimetype}". Allowed types: PDF, MP4, WebM, MOV, MKV.`,
    };
  }

  const maxSize = MAX_FILE_SIZE_BYTES[kind];
  if (file.size > maxSize) {
    return {
      valid: false,
      message: `File exceeds the maximum allowed size of ${(maxSize / (1024 * 1024)).toFixed(0)} MB for ${kind} files.`,
    };
  }

  return { valid: true, kind };
}

module.exports = {
  validateFile,
  resolveFileKind,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
};