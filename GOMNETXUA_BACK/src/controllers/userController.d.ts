import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
declare class UserController {
    bootstrapAdmin(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    login(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    googleLogin(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    me(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updateMe(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    uploadAvatar(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    changePassword(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    register(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    list(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    create(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    update(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    resetPassword(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    setStatus(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
declare const _default: UserController;
export default _default;
//# sourceMappingURL=userController.d.ts.map