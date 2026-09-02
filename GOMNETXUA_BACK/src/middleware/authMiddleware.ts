import {
  NextFunction,
  Request,
  Response,
} from "express";

import jwt from "jsonwebtoken";

export interface AuthRequest
  extends Request {
  user?: {
    id: number;

    email: string;

    role:
      | "ADMIN"
      | "EMPLOYEE";
  };
}

interface JwtPayloadData {
  id: number;

  email: string;

  role:
    | "ADMIN"
    | "EMPLOYEE";
}

const getSecret = () => {
  const secret =
    process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET chưa được cấu hình"
    );
  }

  return secret;
};

/* =========================================================
   REQUIRE LOGIN
========================================================= */

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authorization =
      req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return res
        .status(401)
        .json({
          success: false,

          message:
            "Bạn chưa đăng nhập",
        });
    }

    const token =
      authorization.slice(
        7
      );

    const decoded =
      jwt.verify(
        token,
        getSecret()
      ) as JwtPayloadData;

    req.user = {
      id:
        decoded.id,

      email:
        decoded.email,

      role:
        decoded.role,
    };

    next();
  } catch {
    return res
      .status(401)
      .json({
        success: false,

        message:
          "Phiên đăng nhập không hợp lệ hoặc đã hết hạn",
      });
  }
};

/* =========================================================
   ADMIN ONLY
========================================================= */

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (
    req.user?.role !==
    "ADMIN"
  ) {
    return res
      .status(403)
      .json({
        success: false,

        message:
          "Chức năng này chỉ dành cho quản trị viên",
      });
  }

  next();
};