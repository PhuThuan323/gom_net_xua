"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AffiliateAccess_1 = require("../utils/AffiliateAccess");
const SCRIPT_URL = process.env.AFFILIATE_SCRIPT_URL ||
    "";
const SCRIPT_TOKEN = process.env.AFFILIATE_SCRIPT_TOKEN ||
    "";
/* =========================================================
   HELPERS
========================================================= */
const text = (value) => String(value ?? "").trim();
const normalize = (value) => text(value).toUpperCase();
const getErrorStatus = (error, fallback = 500) => {
    if (error &&
        typeof error ===
            "object" &&
        "status" in error) {
        const status = Number(error.status);
        if (Number.isInteger(status) &&
            status >= 400 &&
            status <= 599) {
            return status;
        }
    }
    return fallback;
};
const getErrorMessage = (error, fallback) => error instanceof Error
    ? error.message
    : fallback;
/*
 * Lấy YYYY-MM từ ngày Apps Script.
 *
 * Apps Script hiện trả:
 * yyyy-MM-dd HH:mm:ss
 */
const getMonthKey = (value) => {
    const raw = text(value);
    if (!raw) {
        return "";
    }
    const date = new Date(raw.replace(" ", "T"));
    if (Number.isNaN(date.getTime())) {
        /*
         * Fallback nếu dữ liệu
         * đã ở dạng YYYY-MM...
         */
        const match = raw.match(/^(\d{4})-(\d{2})/);
        if (match) {
            return `${match[1]}-${match[2]}`;
        }
        return "";
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};
/* =========================================================
   AFFILIATE COMMISSION CONTROLLER
========================================================= */
class AffiliateCommissionController {
    /* =======================================================
       REQUEST GOOGLE APPS SCRIPT
    ======================================================= */
    async request(action, params = {}) {
        if (!SCRIPT_URL) {
            throw new Error("Thiếu AFFILIATE_SCRIPT_URL trong .env");
        }
        if (!SCRIPT_TOKEN) {
            throw new Error("Thiếu AFFILIATE_SCRIPT_TOKEN trong .env");
        }
        const url = new URL(SCRIPT_URL);
        url.searchParams.set("action", action);
        url.searchParams.set("token", SCRIPT_TOKEN);
        /*
         * Chống cache.
         */
        url.searchParams.set("_ts", Date.now()
            .toString());
        Object.entries(params).forEach(([key, value,]) => {
            if (value !==
                undefined &&
                value !==
                    null &&
                value !==
                    "") {
                url.searchParams.set(key, String(value));
            }
        });
        console.log("============================");
        console.log("CONTROLLER VERSION:", "AFFILIATE-DASHBOARD-V6");
        console.log("AFFILIATE ACTION:", action);
        /*
         * Không log token.
         */
        console.log("AFFILIATE PARAMS:", params);
        console.log("SCRIPT URL:", SCRIPT_URL);
        console.log("============================");
        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
            redirect: "follow",
            cache: "no-store",
        });
        const raw = await response.text();
        console.log("GOOGLE HTTP:", response.status);
        console.log("GOOGLE RAW:", raw.slice(0, 500));
        let result;
        try {
            result =
                raw
                    ? JSON.parse(raw)
                    : {};
        }
        catch {
            throw new Error("Google Apps Script không trả JSON");
        }
        if (!response.ok) {
            throw new Error(`Google Apps Script HTTP ${response.status}`);
        }
        if (result.success ===
            false) {
            throw new Error(result.message ||
                "Google Apps Script báo lỗi");
        }
        return result.data;
    }
    /* =======================================================
       DASHBOARD
  
       ADMIN:
       - được chọn Affiliate bất kỳ.
  
       LIVESTREAMER:
       - backend KHÔNG tin query affiliate.
       - luôn đọc affiliate_code từ database.
    ======================================================= */
    async dashboard(req, res) {
        try {
            const month = typeof req.query.month ===
                "string"
                ? req.query.month
                    .trim()
                : "";
            const status = typeof req.query.status ===
                "string"
                ? req.query.status
                    .trim()
                : "ALL";
            /*
             * QUAN TRỌNG:
             * ADMIN -> query affiliate.
             * LIVESTREAMER -> affiliate_code trong DB.
             */
            const affiliate = await (0, AffiliateAccess_1.resolveAffiliateScope)(req);
            console.log("REPORT FILTER:", {
                month,
                affiliate,
                status,
            });
            const data = await this.request("dashboard", {
                month,
                affiliate,
                status,
            });
            return res.json({
                success: true,
                data,
            });
        }
        catch (error) {
            console.error("AFFILIATE REPORT:", error);
            return res
                .status(getErrorStatus(error))
                .json({
                success: false,
                message: getErrorMessage(error, "Không tải được báo cáo hoa hồng"),
            });
        }
    }
    /* =======================================================
       AFFILIATES
  
       ADMIN:
       - thấy toàn bộ Affiliate từ Sheet.
  
       LIVESTREAMER:
       - chỉ nhận đúng Affiliate đã được gắn.
    ======================================================= */
    async affiliates(req, res) {
        try {
            const data = await this.request("affiliates");
            const rows = Array.isArray(data)
                ? data
                : [];
            const visibleRows = await (0, AffiliateAccess_1.filterAffiliateListForUser)(req, rows);
            return res.json({
                success: true,
                data: visibleRows,
            });
        }
        catch (error) {
            console.error("AFFILIATE LIST:", error);
            return res
                .status(getErrorStatus(error))
                .json({
                success: false,
                message: getErrorMessage(error, "Không tải được danh sách Affiliate"),
            });
        }
    }
    /* =======================================================
       PAYMENTS
  
       GET:
       /affiliate-commissions/payments
         ?month=2026-09
         &affiliate=AILOAN
  
       ADMIN:
       - được xem ALL hoặc từng Affiliate.
       - lọc theo tháng.
  
       LIVESTREAMER:
       - frontend gửi affiliate gì cũng không quan trọng.
       - backend ép về users.affiliate_code.
       - chỉ xem lịch sử của chính mình.
    ======================================================= */
    async payments(req, res) {
        try {
            const month = typeof req.query.month ===
                "string"
                ? req.query.month
                    .trim()
                : "";
            /*
             * Đây là lớp phân quyền chính.
             *
             * Với LIVESTREAMER:
             * resolveAffiliateScope()
             * đọc affiliate_code trực tiếp từ database.
             */
            const affiliate = await (0, AffiliateAccess_1.resolveAffiliateScope)(req);
            /*
             * Apps Script hiện đã có:
             * action=payments
             * -> nxGetPayments()
             *
             * Vì nxGetPayments chưa cần filter,
             * backend lấy toàn bộ rồi lọc an toàn ở đây.
             */
            const data = await this.request("payments");
            const rows = Array.isArray(data)
                ? data
                : [];
            const targetAffiliate = normalize(affiliate);
            const filtered = rows
                .filter((item) => {
                /*
                 * FILTER AFFILIATE.
                 */
                if (targetAffiliate &&
                    targetAffiliate !==
                        "ALL" &&
                    normalize(item.ma_affiliate) !==
                        targetAffiliate) {
                    return false;
                }
                /*
                 * FILTER THÁNG.
                 *
                 * Ưu tiên thời gian thanh toán.
                 * Nếu trống dùng ngày lập phiếu.
                 */
                if (month) {
                    const rowMonth = getMonthKey(item
                        .thoi_gian_thanh_toan ||
                        item
                            .ngay_lap_phieu);
                    if (rowMonth !==
                        month) {
                        return false;
                    }
                }
                return true;
            })
                .sort((a, b) => {
                const aRaw = text(a
                    .thoi_gian_thanh_toan ||
                    a
                        .ngay_lap_phieu);
                const bRaw = text(b
                    .thoi_gian_thanh_toan ||
                    b
                        .ngay_lap_phieu);
                const aTime = new Date(aRaw.replace(" ", "T")).getTime();
                const bTime = new Date(bRaw.replace(" ", "T")).getTime();
                return ((Number.isFinite(bTime)
                    ? bTime
                    : 0) -
                    (Number.isFinite(aTime)
                        ? aTime
                        : 0));
            });
            const totalAmount = filtered.reduce((sum, item) => sum +
                Number(item.so_tien ||
                    0), 0);
            console.log("PAYMENT FILTER:", {
                month,
                affiliate,
                count: filtered.length,
                totalAmount,
            });
            return res.json({
                success: true,
                data: filtered,
                summary: {
                    total_transactions: filtered.length,
                    total_amount: totalAmount,
                },
                filter: {
                    month,
                    affiliate,
                },
            });
        }
        catch (error) {
            console.error("AFFILIATE PAYMENT:", error);
            return res
                .status(getErrorStatus(error))
                .json({
                success: false,
                message: getErrorMessage(error, "Không tải được lịch sử thanh toán"),
            });
        }
    }
}
exports.default = new AffiliateCommissionController();
//# sourceMappingURL=affiliateCommissionController.js.map