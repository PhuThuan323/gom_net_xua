import { Request, Response } from "express";
declare class AffiliateCommissionController {
    private request;
    dashboard(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    affiliates(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    payments(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
declare const _default: AffiliateCommissionController;
export default _default;
//# sourceMappingURL=affiliateCommissionController.d.ts.map