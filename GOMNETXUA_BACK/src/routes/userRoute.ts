import {
  Router,
} from "express";

import multer from "multer";

import path from "path";

import fs from "fs";

import userController from "../controllers/userController";

import {
  requireAdmin,
  requireAuth,
} from "../middleware/authMiddleware";

const router =
  Router();

/* =========================================================
   AVATAR STORAGE
========================================================= */

const avatarFolder =
  path.join(
    process.cwd(),
    "uploads",
    "avatars"
  );

if (
  !fs.existsSync(
    avatarFolder
  )
) {
  fs.mkdirSync(
    avatarFolder,
    {
      recursive:
        true,
    }
  );
}

const storage =
  multer.diskStorage({
    destination(
      req,
      file,
      callback
    ) {
      callback(
        null,
        avatarFolder
      );
    },

    filename(
      req,
      file,
      callback
    ) {
      const extension =
        path
          .extname(
            file.originalname
          )
          .toLowerCase();

      const filename =
        `avatar-${Date.now()}-${Math.round(
          Math.random() *
            1e9
        )}${extension}`;

      callback(
        null,
        filename
      );
    },
  });

const upload =
  multer({
    storage,

    limits: {
      fileSize:
        5 *
        1024 *
        1024,
    },

    fileFilter(
      req,
      file,
      callback
    ) {
      const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (
        !allowed.includes(
          file.mimetype
        )
      ) {
        return callback(
          new Error(
            "Chỉ cho phép JPG, PNG hoặc WEBP"
          )
        );
      }

      callback(
        null,
        true
      );
    },
  });

/* =========================================================
   PUBLIC AUTH
========================================================= */

router.post(
  "/bootstrap-admin",

  userController.bootstrapAdmin.bind(
    userController
  )
);

router.post(
  "/login",

  userController.login.bind(
    userController
  )
);

router.post(
  "/google-login",

  userController.googleLogin.bind(
    userController
  )
);

/* =========================================================
   CURRENT USER
========================================================= */

router.get(
  "/me",

  requireAuth,

  userController.me.bind(
    userController
  )
);

router.patch(
  "/me",

  requireAuth,

  userController.updateMe.bind(
    userController
  )
);
router.post(
  "/register",
  userController.register.bind(
    userController
  )
);
router.patch(
  "/me/password",

  requireAuth,

  userController.changePassword.bind(
    userController
  )
);

router.post(
  "/me/avatar",

  requireAuth,

  upload.single(
    "avatar"
  ),

  userController.uploadAvatar.bind(
    userController
  )
);

/* =========================================================
   ADMIN
========================================================= */

router.get(
  "/",

  requireAuth,

  requireAdmin,

  userController.list.bind(
    userController
  )
);

router.post(
  "/",

  requireAuth,

  requireAdmin,

  userController.create.bind(
    userController
  )
);

router.patch(
  "/:id",

  requireAuth,

  requireAdmin,

  userController.update.bind(
    userController
  )
);

router.patch(
  "/:id/status",

  requireAuth,

  requireAdmin,

  userController.setStatus.bind(
    userController
  )
);

router.patch(
  "/:id/reset-password",

  requireAuth,

  requireAdmin,

  userController.resetPassword.bind(
    userController
  )
);

export default router;