import { NextFunction, Request, Response } from "express";
export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        role: "ADMIN" | "EMPLOYEE";
    };
}
export declare const requireAuth: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=authMiddleware.d.ts.map