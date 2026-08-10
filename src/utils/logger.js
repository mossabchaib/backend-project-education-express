// src/utils/logger.js
// Logger بسيط (يقدر يتبدّل بـ winston/pino لاحقًا لو المشروع كبر)

function logInfo(message, meta = {}) {
  console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta);
}

function logError(message, error) {
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error?.message || error);
}

module.exports = { logInfo, logError };
