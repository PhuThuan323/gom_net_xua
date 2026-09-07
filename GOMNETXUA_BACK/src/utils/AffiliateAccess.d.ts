import { AuthRequest } from "../middleware/authMiddleware";
export declare function resolveAffiliateScope(req: AuthRequest): Promise<string>;
export declare function filterAffiliateListForUser<T extends {
    ma_affiliate?: string;
}>(req: AuthRequest, rows: T[]): Promise<T[]>;
//# sourceMappingURL=AffiliateAccess.d.ts.map