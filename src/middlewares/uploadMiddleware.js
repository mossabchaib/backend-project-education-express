const multer = require("multer");
const { sendError } = require("../utils/response");

/**
 * Memory storage: we never write the file to disk. The buffer is streamed
 * straight to Cloudflare R2 inside upload.service.js. This keeps the
 * container stateless, which matters for the future presigned-URL migration.
 */
const storage = multer.memoryStorage();

const multerUpload = multer({
  storage,
  // Hard ceiling at the multer level; the fine-grained per-kind limit
  // (video vs pdf) is enforced afterwards in utils/fileValidation.js.
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
});

/**
 * Wraps multer's single-file handler so multer's own errors (file too large,
 * unexpected field, etc.) go through the app's standard response shape
 * instead of leaking an Express default error page.
 */
function handleSingleFileUpload(req, res, next) {
  multerUpload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return sendError(res, 400, `Upload error: ${err.message}`);
    }
    if (err) {
      return sendError(res, 400, err.message || "Upload failed.");
    }
    next();
  });
}

function requireFilePresent(req, res, next) {
console.log(":req",req)
  if (!req.file) {
    return sendError(res, 400, "No file was attached to the request.");
  }
  next();
}

module.exports = { handleSingleFileUpload, requireFilePresent };