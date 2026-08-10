const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { handleSingleFileUpload, requireFilePresent } = require("../middlewares/uploadMiddleware");
const uploadController = require("../controllers/upload.controller");

router.post(
  "/",
  authMiddleware,
  // roleMiddleware("teacher", "admin"), 
  handleSingleFileUpload,
  requireFilePresent,
  uploadController.uploadFile
);

router.get("/", authMiddleware, uploadController.getUploads);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("teacher", "admin"),
  uploadController.removeUpload
);
router.post("/sign", authMiddleware, uploadController.signUpload);
router.post("/confirm", authMiddleware, uploadController.confirmUpload);

// المسار القديم POST "/" يمكن إبقاؤه مؤقتاً كـ fallback، أو حذفه بعد التأكد من نجاح النمط الجديد
module.exports = router;