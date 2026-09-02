import { Request, Response } from "express";
declare class ReportController {
    overview(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    stockReport(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
declare const _default: ReportController;
export default _default;
//# sourceMappingURL=reportController.d.ts.map