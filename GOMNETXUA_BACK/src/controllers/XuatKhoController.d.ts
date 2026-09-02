import { Request, Response } from "express";
declare class ExportStockController {
    bootstrap(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    invoiceQuotes(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    search(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    scan(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    commit(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    history(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
declare const _default: ExportStockController;
export default _default;
//# sourceMappingURL=XuatKhoController.d.ts.map