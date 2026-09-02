import { Request, Response } from "express";
declare class InvoiceController {
    bootstrap(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    brands(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateBrand(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    customers(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    createCustomer(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateCustomer(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteCustomer(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    nextCode(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    invoices(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    invoiceDetail(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    createInvoice(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
declare const _default: InvoiceController;
export default _default;
//# sourceMappingURL=invoiceController.d.ts.map