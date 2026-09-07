import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
declare class AffiliateCommissionController {
    private request;
    dashboard(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    affiliates(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    payments(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
declare const _default: AffiliateCommissionController;
export default _default;
//# sourceMappingURL=affiliateCommissionController.d.ts.map