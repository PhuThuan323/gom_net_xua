import { Request, Response } from "express";
declare class CashFlowController {
    bootstrap(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    createReceipt(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    createExpense(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    receipts(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    expenses(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteReceipt(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteExpense(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    dashboard(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    report(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
declare const _default: CashFlowController;
export default _default;
//# sourceMappingURL=cashFlowController.d.ts.map