const uploadService = require("../services/upload.service");

async function uploadFile(req, res) {
  try {
    const { courseId } = req.body;
    const teacherId = req.user.id;

    const upload = await uploadService.uploadFileToR2({
      file: req.file,
      courseId,
      teacherId,
    });

    return res.status(201).json({
      status: "success",
      message: "File uploaded successfully.",
      data: upload,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      status: "error",
      message: err.message || "Upload failed.",
    });
  }
}

async function getUploads(req, res) {
  try {
    const { courseId } = req.query;
    const teacherId = req.user.role === "teacher" ? req.user.id : undefined;

    const uploads = await uploadService.listUploads({ courseId, teacherId });
    return res.status(200).json({
      status: "success",
      data: uploads,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      status: "error",
      message: err.message || "Failed to fetch uploads.",
    });
  }
}

async function removeUpload(req, res) {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const deleted = await uploadService.deleteUpload({ id, teacherId });
    return res.status(200).json({
      status: "success",
      data: deleted,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      status: "error",
      message: err.message || "Failed to delete upload.",
    });
  }
}

async function signUpload(req, res) {
  try {
    const { fileName, kind, courseId,lesson_id } = req.body;
    const teacherId = req.user.id;
    const signed = await uploadService.createSignedUpload({ fileName, kind, courseId, lesson_id, teacherId });
    return res.status(200).json({ status: "success", data: signed });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      status: "error",
      message: err.message || "Failed to create signed upload URL.",
    });
  }
}

async function confirmUpload(req, res) {
  try {
    const { key, fileName, mimeType, fileSize, kind, course_id, lesson_id } = req.body;
       const teacherId = req.user.id;

    const upload = await uploadService.confirmUpload({
      key, fileName, mimeType, fileSize, kind,  course_id, lesson_id, teacherId,
    });

    // نفس منطق الربط بالدرس (lessonId) — إن رغبت نضيفه هنا لاحقاً على مستوى الباك اند
    return res.status(201).json({
      status: "success",
      message: "File uploaded successfully.",
      data: upload,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      status: "error",
      message: err.message || "Failed to confirm upload.",
    });
  }
}

module.exports = { 
  uploadFile, 
  getUploads, 
  removeUpload, 
  signUpload, 
  confirmUpload 
};