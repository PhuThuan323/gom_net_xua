import { Request, Response } from "express";
declare class LossStockController {
    bootstrap(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    search(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    commit(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    dashboard(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    history(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
declare const _default: LossStockController;
export default _default;
//# sourceMappingURL=lossStockController.d.ts.map