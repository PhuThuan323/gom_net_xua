"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const userController_1 = __importDefault(require("../controllers/userController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/* =========================================================
   AVATAR STORAGE
========================================================= */
const avatarFolder = path_1.default.join(process.cwd(), "uploads", "avatars");
if (!fs_1.default.existsSync(avatarFolder)) {
    fs_1.default.mkdirSync(avatarFolder, {
        recursive: true,
    });
}
const storage = multer_1.default.diskStorage({
    destination(req, file, callback) {
        callback(null, avatarFolder);
    },
    filename(req, file, callback) {
        const extension = path_1.default
            .extname(file.originalname)
            .toLowerCase();
        const filename = `avatar-${Date.now()}-${Math.round(Math.random() *
            1e9)}${extension}`;
        callback(null, filename);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 *
            1024 *
            1024,
    },
    fileFilter(req, file, callback) {
        const allowed = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];
        if (!allowed.includes(file.mimetype)) {
            return callback(new Error("Chỉ cho phép JPG, PNG hoặc WEBP"));
        }
        callback(null, true);
    },
});
/* =========================================================
   PUBLIC AUTH
========================================================= */
router.post("/bootstrap-admin", userController_1.default.bootstrapAdmin.bind(userController_1.default));
router.post("/login", userController_1.default.login.bind(userController_1.default));
router.post("/google-login", userController_1.default.googleLogin.bind(userController_1.default));
/* =========================================================
   CURRENT USER
========================================================= */
router.get("/me", authMiddleware_1.requireAuth, userController_1.default.me.bind(userController_1.default));
router.patch("/me", authMiddleware_1.requireAuth, userController_1.default.updateMe.bind(userController_1.default));
router.post("/register", userController_1.default.register.bind(userController_1.default));
router.patch("/me/password", authMiddleware_1.requireAuth, userController_1.default.changePassword.bind(userController_1.default));
router.post("/me/avatar", authMiddleware_1.requireAuth, upload.single("avatar"), userController_1.default.uploadAvatar.bind(userController_1.default));
/* =========================================================
   ADMIN
========================================================= */
router.get("/", authMiddleware_1.requireAuth, authMiddleware_1.requireAdmin, userController_1.default.list.bind(userController_1.default));
router.post("/", authMiddleware_1.requireAuth, authMiddleware_1.requireAdmin, userController_1.default.create.bind(userController_1.default));
router.patch("/:id", authMiddleware_1.requireAuth, authMiddleware_1.requireAdmin, userController_1.default.update.bind(userController_1.default));
router.patch("/:id/status", authMiddleware_1.requireAuth, authMiddleware_1.requireAdmin, userController_1.default.setStatus.bind(userController_1.default));
router.patch("/:id/reset-password", authMiddleware_1.requireAuth, authMiddleware_1.requireAdmin, userController_1.default.resetPassword.bind(userController_1.default));
exports.default = router;
//# sourceMappingURL=userRoute.js.map