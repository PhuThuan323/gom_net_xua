import {
  Request,
  Response,
} from "express";

import {
  PrismaClient,
  UserRole,
} from "@prisma/client";

import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";

import {
  OAuth2Client,
} from "google-auth-library";

import fs from "fs";

import path from "path";

import {
  AuthRequest,
} from "../middleware/authMiddleware";


import prisma from "../lib/prisma";

const googleClient =
  new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
  );

/* =========================================================
   HELPERS
========================================================= */

const text = (
  value: unknown
): string | null => {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const result =
    value.trim();

  return result || null;
};

const normalizeEmail = (
  value: unknown
) => {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
};

const validRole = (
  value: unknown
): UserRole => {
  return value ===
    "ADMIN"
    ? UserRole.ADMIN
    : UserRole.EMPLOYEE;
};

const safeUser = <
  T extends {
    id: number;
    email: string;
    full_name: string;
    phone: string | null;
    position: string | null;
    avatar_url: string | null;
    role: UserRole;
    status: string;
    google_sub: string | null;
    last_login_at: Date | null;
    created_at: Date;
    updated_at: Date;
  },
>(
  user: T
) => ({
  id:
    user.id,

  email:
    user.email,

  full_name:
    user.full_name,

  phone:
    user.phone,

  position:
    user.position,

  avatar_url:
    user.avatar_url,

  role:
    user.role,

  status:
    user.status,

  google_connected:
    Boolean(
      user.google_sub
    ),

  last_login_at:
    user.last_login_at,

  created_at:
    user.created_at,

  updated_at:
    user.updated_at,
});

const createToken = (
  user: {
    id: number;
    email: string;
    role: UserRole;
  }
) => {
  const secret =
    process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET chưa được cấu hình"
    );
  }

  return jwt.sign(
    {
      id:
        user.id,

      email:
        user.email,

      role:
        user.role,
    },

    secret,

    {
      expiresIn:
        "7d",
    }
  );
};

const removeLocalAvatar = (
  avatarUrl:
    | string
    | null
) => {
  try {
    if (
      !avatarUrl ||
      !avatarUrl.startsWith(
        "/uploads/avatars/"
      )
    ) {
      return;
    }

    const filename =
      path.basename(
        avatarUrl
      );

    const filepath =
      path.join(
        process.cwd(),
        "uploads",
        "avatars",
        filename
      );

    if (
      fs.existsSync(
        filepath
      )
    ) {
      fs.unlinkSync(
        filepath
      );
    }
  } catch (
    error
  ) {
    console.error(
      "Không xóa được avatar cũ:",
      error
    );
  }
};

class UserController {
  /* =======================================================
     TẠO ADMIN ĐẦU TIÊN

     Chỉ chạy được khi database chưa có user.
  ======================================================= */

  async bootstrapAdmin(
    req: Request,
    res: Response
  ) {
    try {
      const count =
        await prisma.user.count();

      if (
        count > 0
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Hệ thống đã có tài khoản. Không thể tạo admin đầu tiên nữa.",
          });
      }

      const email =
        normalizeEmail(
          req.body?.email
        );

      const fullName =
        text(
          req.body?.full_name
        );

      const password =
        String(
          req.body?.password ||
            ""
        );

      if (
        !email ||
        !fullName
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Vui lòng nhập email và họ tên",
          });
      }

      if (
        password.length <
        8
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Mật khẩu tối thiểu 8 ký tự",
          });
      }

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      const user =
        await prisma.user.create({
          data: {
            email,

            full_name:
              fullName,

            password_hash:
              passwordHash,

            role:
              UserRole.ADMIN,

            status:
              "active",
          },
        });

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Đã tạo tài khoản quản trị viên đầu tiên",

          data:
            safeUser(
              user
            ),
        });
    } catch (
      error
    ) {
      console.error(
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Không thể tạo tài khoản quản trị",
        });
    }
  }

  /* =======================================================
     LOGIN EMAIL/PASSWORD
  ======================================================= */

  async login(
    req: Request,
    res: Response
  ) {
    try {
      const email =
        normalizeEmail(
          req.body?.email
        );

      const password =
        String(
          req.body?.password ||
            ""
        );

      if (
        !email ||
        !password
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Vui lòng nhập email và mật khẩu",
          });
      }

      const user =
        await prisma.user.findUnique({
          where: {
            email,
          },
        });

      if (
        !user ||
        user.status !==
          "active"
      ) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              "Email hoặc mật khẩu không chính xác",
          });
      }

      if (
        !user.password_hash
      ) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              "Tài khoản này chưa thiết lập mật khẩu. Vui lòng đăng nhập Google hoặc liên hệ quản trị viên.",
          });
      }

      const valid =
        await bcrypt.compare(
          password,
          user.password_hash
        );

      if (!valid) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              "Email hoặc mật khẩu không chính xác",
          });
      }

      const updated =
        await prisma.user.update({
          where: {
            id:
              user.id,
          },

          data: {
            last_login_at:
              new Date(),
          },
        });

      const token =
        createToken(
          updated
        );

      return res.json({
        success: true,

        message:
          "Đăng nhập thành công",

        data: {
          token,

          user:
            safeUser(
              updated
            ),
        },
      });
    } catch (
      error
    ) {
      console.error(
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Không thể đăng nhập",
        });
    }
  }

  /* =======================================================
     LOGIN GOOGLE

     Frontend gửi:
     {
       credential: "Google ID token"
     }
  ======================================================= */

  async googleLogin(
    req: Request,
    res: Response
  ) {
    try {
      const credential =
        text(
          req.body?.credential
        );

      if (
        !credential
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Thiếu Google credential",
          });
      }

      const clientId =
        process.env
          .GOOGLE_CLIENT_ID;

      if (!clientId) {
        throw new Error(
          "GOOGLE_CLIENT_ID chưa được cấu hình"
        );
      }

      const ticket =
        await googleClient.verifyIdToken({
          idToken:
            credential,

          audience:
            clientId,
        });

      const payload =
        ticket.getPayload();

      if (
        !payload ||
        !payload.email ||
        !payload.sub
      ) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              "Không xác minh được tài khoản Google",
          });
      }

      if (
        payload.email_verified !==
        true
      ) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              "Email Google chưa được xác minh",
          });
      }

      const email =
        payload.email.toLowerCase();

      /*
       * QUAN TRỌNG:
       * Không tự tạo tài khoản từ Google.
       *
       * Admin phải tạo tài khoản nhân viên trước.
       */

      const existing =
        await prisma.user.findUnique({
          where: {
            email,
          },
        });

      if (
        !existing
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Email Google này chưa được cấp quyền sử dụng hệ thống",
          });
      }

      if (
        existing.status !==
        "active"
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Tài khoản đã bị khóa",
          });
      }

      if (
        existing.google_sub &&
        existing.google_sub !==
          payload.sub
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Tài khoản Google không khớp với tài khoản đã liên kết",
          });
      }

      const updateData: {
        google_sub: string;
        last_login_at: Date;
        avatar_url?: string;
      } = {
        google_sub:
          payload.sub,

        last_login_at:
          new Date(),
      };

      /*
       * Chỉ lấy avatar Google nếu user chưa có avatar riêng
       */
      if (
        !existing.avatar_url &&
        payload.picture
      ) {
        updateData.avatar_url =
          payload.picture;
      }

      const user =
        await prisma.user.update({
          where: {
            id:
              existing.id,
          },

          data:
            updateData,
        });

      const token =
        createToken(
          user
        );

      return res.json({
        success: true,

        message:
          "Đăng nhập Google thành công",

        data: {
          token,

          user:
            safeUser(
              user
            ),
        },
      });
    } catch (
      error
    ) {
      console.error(
        "GOOGLE LOGIN:",
        error
      );

      return res
        .status(401)
        .json({
          success: false,

          message:
            "Đăng nhập Google thất bại",
        });
    }
  }

  /* =======================================================
     GET CURRENT USER
  ======================================================= */

  async me(
    req: AuthRequest,
    res: Response
  ) {
    try {
      const user =
        await prisma.user.findUnique({
          where: {
            id:
              req.user!.id,
          },
        });

      if (!user) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Không tìm thấy tài khoản",
          });
      }

      return res.json({
        success: true,

        data:
          safeUser(
            user
          ),
      });
    } catch (
      error
    ) {
      console.error(
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Không tải được tài khoản",
        });
    }
  }

  /* =======================================================
     UPDATE CURRENT ACCOUNT
  ======================================================= */

  async updateMe(
    req: AuthRequest,
    res: Response
  ) {
    try {
      const fullName =
        text(
          req.body?.full_name
        );

      if (
        !fullName
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Họ tên không được để trống",
          });
      }

      const user =
        await prisma.user.update({
          where: {
            id:
              req.user!.id,
          },

          data: {
            full_name:
              fullName,

            phone:
              text(
                req.body?.phone
              ),

            position:
              text(
                req.body?.position
              ),
          },
        });

      return res.json({
        success: true,

        message:
          "Đã cập nhật thông tin tài khoản",

        data:
          safeUser(
            user
          ),
      });
    } catch (
      error
    ) {
      console.error(
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Không cập nhật được tài khoản",
        });
    }
  }

  /* =======================================================
     UPLOAD AVATAR
  ======================================================= */

  async uploadAvatar(
    req: AuthRequest,
    res: Response
  ) {
    try {
      if (
        !req.file
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Vui lòng chọn ảnh",
          });
      }

      const oldUser =
        await prisma.user.findUnique({
          where: {
            id:
              req.user!.id,
          },
        });

      if (!oldUser) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Không tìm thấy tài khoản",
          });
      }

      const avatarUrl =
        `/uploads/avatars/${req.file.filename}`;

      const user =
        await prisma.user.update({
          where: {
            id:
              req.user!.id,
          },

          data: {
            avatar_url:
              avatarUrl,
          },
        });

      removeLocalAvatar(
        oldUser.avatar_url
      );

      return res.json({
        success: true,

        message:
          "Đã cập nhật ảnh đại diện",

        data:
          safeUser(
            user
          ),
      });
    } catch (
      error
    ) {
      console.error(
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Không tải được ảnh đại diện",
        });
    }
  }

  /* =======================================================
     CHANGE OWN PASSWORD
  ======================================================= */

  async changePassword(
    req: AuthRequest,
    res: Response
  ) {
    try {
      const currentPassword =
        String(
          req.body
            ?.current_password ||
            ""
        );

      const newPassword =
        String(
          req.body
            ?.new_password ||
            ""
        );

      if (
        newPassword.length <
        8
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Mật khẩu mới phải có ít nhất 8 ký tự",
          });
      }

      const user =
        await prisma.user.findUnique({
          where: {
            id:
              req.user!.id,
          },
        });

      if (!user) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Không tìm thấy tài khoản",
          });
      }

      /*
       * Nếu trước giờ user chỉ đăng nhập Google
       * và chưa có password, cho phép thiết lập password lần đầu.
       */

      if (
        user.password_hash
      ) {
        if (
          !currentPassword
        ) {
          return res
            .status(400)
            .json({
              success: false,

              message:
                "Vui lòng nhập mật khẩu hiện tại",
            });
        }

        const valid =
          await bcrypt.compare(
            currentPassword,
            user.password_hash
          );

        if (!valid) {
          return res
            .status(400)
            .json({
              success: false,

              message:
                "Mật khẩu hiện tại không đúng",
            });
        }
      }

      const hash =
        await bcrypt.hash(
          newPassword,
          12
        );

      await prisma.user.update({
        where: {
          id:
            user.id,
        },

        data: {
          password_hash:
            hash,
        },
      });

      return res.json({
        success: true,

        message:
          "Đã thay đổi mật khẩu",
      });
    } catch (
      error
    ) {
      console.error(
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Không thay đổi được mật khẩu",
        });
    }
  }

  /* =======================================================
     ADMIN - LIST USERS
  ======================================================= */
  /* =========================================================
   REGISTER EMPLOYEE
========================================================= */

async register(
  req: Request,
  res: Response
) {
  try {
    const email =
      normalizeEmail(
        req.body?.email
      );

    const fullName =
      text(
        req.body?.full_name
      );

    const phone =
      text(
        req.body?.phone
      );

    const password =
      String(
        req.body?.password ||
          ""
      );

    if (
      !email ||
      !fullName
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Vui lòng nhập họ tên và email",
        });
    }

    if (
      password.length < 8
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Mật khẩu phải có ít nhất 8 ký tự",
        });
    }

    const exists =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (exists) {
      return res
        .status(409)
        .json({
          success: false,
          message:
            "Email này đã được sử dụng",
        });
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    const user =
      await prisma.user.create({
        data: {
          email,

          full_name:
            fullName,

          phone,

          password_hash:
            passwordHash,

          role:
            UserRole.EMPLOYEE,

          position:
            "Nhân viên",

          status:
            "active",
        },
      });

    const token =
      createToken(
        user
      );

    return res
      .status(201)
      .json({
        success: true,

        message:
          "Đăng ký tài khoản thành công",

        data: {
          token,

          user:
            safeUser(
              user
            ),
        },
      });
  } catch (error) {
    console.error(
      "REGISTER ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          "Không thể đăng ký tài khoản",
      });
  }
}
  async list(
    req: AuthRequest,
    res: Response
  ) {
    try {
      const search =
        text(
          req.query.search
        );

      const role =
        text(
          req.query.role
        );

      const where: {
        status?: string;
        role?: UserRole;
        OR?: Array<
          | {
              full_name: {
                contains: string;
              };
            }
          | {
              email: {
                contains: string;
              };
            }
          | {
              phone: {
                contains: string;
              };
            }
        >;
      } = {};

      const status =
        text(
          req.query.status
        );

      if (status) {
        where.status =
          status;
      }

      if (
        role === "ADMIN" ||
        role ===
          "EMPLOYEE"
      ) {
        where.role =
          role;
      }

      if (search) {
        where.OR = [
          {
            full_name: {
              contains:
                search,
            },
          },

          {
            email: {
              contains:
                search,
            },
          },

          {
            phone: {
              contains:
                search,
            },
          },
        ];
      }

      const users =
        await prisma.user.findMany({
          where,

          orderBy: [
            {
              role:
                "asc",
            },

            {
              full_name:
                "asc",
            },
          ],
        });

      return res.json({
        success: true,

        data:
          users.map(
            safeUser
          ),
      });
    } catch (
      error
    ) {
      console.error(
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Không tải được danh sách người dùng",
        });
    }
  }

  /* =======================================================
     ADMIN - CREATE USER
  ======================================================= */

  async create(
    req: AuthRequest,
    res: Response
  ) {
    try {
      const email =
        normalizeEmail(
          req.body?.email
        );

      const fullName =
        text(
          req.body?.full_name
        );

      const password =
        String(
          req.body?.password ||
            ""
        );

      if (
        !email ||
        !fullName
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Vui lòng nhập email và họ tên",
          });
      }

      if (
        password.length <
        8
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Mật khẩu tối thiểu 8 ký tự",
          });
      }

      const exists =
        await prisma.user.findUnique({
          where: {
            email,
          },
        });

      if (exists) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "Email đã tồn tại",
          });
      }

      const hash =
        await bcrypt.hash(
          password,
          12
        );

      const user =
        await prisma.user.create({
          data: {
            email,

            full_name:
              fullName,

            password_hash:
              hash,

            phone:
              text(
                req.body?.phone
              ),

            position:
              text(
                req.body?.position
              ),

            role:
              validRole(
                req.body?.role
              ),

            status:
              "active",
          },
        });

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Đã tạo tài khoản",

          data:
            safeUser(
              user
            ),
        });
    } catch (
      error
    ) {
      console.error(
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Không tạo được tài khoản",
        });
    }
  }

  /* =======================================================
     ADMIN - UPDATE USER
  ======================================================= */

  async update(
    req: AuthRequest,
    res: Response
  ) {
    try {
      const id =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          id
        ) ||
        id <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "ID người dùng không hợp lệ",
          });
      }

      const fullName =
        text(
          req.body?.full_name
        );

      if (
        !fullName
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Họ tên không được để trống",
          });
      }

      const status =
        req.body?.status ===
          "inactive"
          ? "inactive"
          : "active";

      const user =
        await prisma.user.update({
          where: {
            id,
          },

          data: {
            full_name:
              fullName,

            phone:
              text(
                req.body?.phone
              ),

            position:
              text(
                req.body?.position
              ),

            role:
              validRole(
                req.body?.role
              ),

            status,
          },
        });

      return res.json({
        success: true,

        message:
          "Đã cập nhật tài khoản",

        data:
          safeUser(
            user
          ),
      });
    } catch (
      error
    ) {
      console.error(
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Không cập nhật được tài khoản",
        });
    }
  }

  /* =======================================================
     ADMIN - RESET PASSWORD
  ======================================================= */

  async resetPassword(
    req: AuthRequest,
    res: Response
  ) {
    try {
      const id =
        Number(
          req.params.id
        );

      const newPassword =
        String(
          req.body
            ?.new_password ||
            ""
        );

      if (
        !Number.isInteger(
          id
        ) ||
        id <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "ID người dùng không hợp lệ",
          });
      }

      if (
        newPassword.length <
        8
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Mật khẩu mới tối thiểu 8 ký tự",
          });
      }

      const hash =
        await bcrypt.hash(
          newPassword,
          12
        );

      await prisma.user.update({
        where: {
          id,
        },

        data: {
          password_hash:
            hash,
        },
      });

      return res.json({
        success: true,

        message:
          "Đã reset mật khẩu người dùng",
      });
    } catch (
      error
    ) {
      console.error(
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Không reset được mật khẩu",
        });
    }
  }

  /* =======================================================
     ADMIN - LOCK / UNLOCK
  ======================================================= */

  async setStatus(
    req: AuthRequest,
    res: Response
  ) {
    try {
      const id =
        Number(
          req.params.id
        );

      const status =
        req.body?.status ===
          "active"
          ? "active"
          : "inactive";

      if (
        id ===
        req.user!.id &&
        status ===
          "inactive"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Bạn không thể tự khóa tài khoản đang đăng nhập",
          });
      }

      const user =
        await prisma.user.update({
          where: {
            id,
          },

          data: {
            status,
          },
        });

      return res.json({
        success: true,

        message:
          status ===
          "active"
            ? "Đã mở khóa tài khoản"
            : "Đã khóa tài khoản",

        data:
          safeUser(
            user
          ),
      });
    } catch (
      error
    ) {
      console.error(
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Không thay đổi được trạng thái tài khoản",
        });
    }
  }
}

export default new UserController();