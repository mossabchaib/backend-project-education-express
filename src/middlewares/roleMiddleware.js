// src/middlewares/roleMiddleware.js
// يُستعمل بعد authMiddleware مباشرة.
// مثال: router.get("/admin-only", authMiddleware, requireRole("admin"), handler)
// مثال بأكثر من دور: requireRole("admin", "teacher")

const { errorResponse } = require("../utils/response");

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // دمج وتسطيح المصفوفات لتجنب مشكلة المصفوفات المتداخلة
    const rolesArray = allowedRoles.flat();

    console.log("Checking role for user:", req.user, rolesArray, rolesArray.includes(req.user.role));
    
    if (!req.user) {
      return errorResponse(res, 401, "Authentication required.");
    }
    
    if (!rolesArray.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Access denied. Required role(s): ${rolesArray.join(", ")}.`
      );
    }
    
    console.log("Role check passed for user:", req.user);
    next();
  };
}

module.exports = requireRole;
