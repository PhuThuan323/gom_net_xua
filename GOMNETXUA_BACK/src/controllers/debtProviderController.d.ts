import { Request, Response } from "express";
declare class DebtProviderController {
    dashboard(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    suppliers(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    transactions(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    createDebt(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    createPayment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    createAdjustment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    supplierSummary(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateTransaction(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteTransaction(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    supplierHistory(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
declare const _default: DebtProviderController;
export default _default;
//# sourceMappingURL=debtProviderController.d.ts.map