import {
  Request,
  Response,
} from "express";

const SCRIPT_URL =
  process.env.AFFILIATE_SCRIPT_URL ||
  "";

const SCRIPT_TOKEN =
  process.env.AFFILIATE_SCRIPT_TOKEN ||
  "";

/* =========================================================
   AFFILIATE COMMISSION CONTROLLER
========================================================= */

class AffiliateCommissionController {

  /* =======================================================
     REQUEST GOOGLE APPS SCRIPT
  ======================================================= */

  private async request(
    action: string,
    params:
      Record<
        string,
        string
      > = {}
  ) {

    if (!SCRIPT_URL) {
      throw new Error(
        "Thiếu AFFILIATE_SCRIPT_URL trong .env"
      );
    }

    if (!SCRIPT_TOKEN) {
      throw new Error(
        "Thiếu AFFILIATE_SCRIPT_TOKEN trong .env"
      );
    }

    const url =
      new URL(
        SCRIPT_URL
      );

    url.searchParams.set(
      "action",
      action
    );

    url.searchParams.set(
      "token",
      SCRIPT_TOKEN
    );

    /*
      Chống cache
    */
    url.searchParams.set(
      "_ts",
      Date.now()
        .toString()
    );

    Object.entries(
      params
    ).forEach(
      ([key, value]) => {

        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          url.searchParams.set(
            key,
            String(value)
          );
        }
      }
    );

    console.log(
      "============================"
    );

    console.log(
      "CONTROLLER VERSION:",
      "AFFILIATE-DASHBOARD-V5"
    );

    console.log(
      "AFFILIATE ACTION:",
      action
    );

    console.log(
      "AFFILIATE PARAMS:",
      params
    );

    console.log(
      "SCRIPT URL:",
      SCRIPT_URL
    );

    console.log(
      "============================"
    );

    const response =
      await fetch(
        url.toString(),
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",
          },

          redirect:
            "follow",

          cache:
            "no-store",
        }
      );

    const raw =
      await response.text();

    console.log(
      "GOOGLE HTTP:",
      response.status
    );

    console.log(
      "GOOGLE RAW:",
      raw.slice(
        0,
        500
      )
    );

    let result: any;

    try {

      result =
        JSON.parse(
          raw
        );

    } catch {

      throw new Error(
        "Google Apps Script không trả JSON"
      );
    }

    if (
      !response.ok
    ) {
      throw new Error(
        `Google Apps Script HTTP ${response.status}`
      );
    }

    if (
      result.success === false
    ) {
      throw new Error(
        result.message ||
        "Google Apps Script báo lỗi"
      );
    }

    return result.data;
  }

  /* =======================================================
     DASHBOARD
  ======================================================= */

  async dashboard(
    req: Request,
    res: Response
  ) {

    try {

      const month =
        typeof req.query.month ===
        "string"
          ? req.query.month
          : "";

      const affiliate =
        typeof req.query.affiliate ===
        "string"
          ? req.query.affiliate
          : "ALL";

      const status =
        typeof req.query.status ===
        "string"
          ? req.query.status
          : "ALL";

      console.log(
        "REPORT FILTER:",
        {
          month,
          affiliate,
          status,
        }
      );

      /*
        QUAN TRỌNG:
        PHẢI LÀ dashboard
        KHÔNG PHẢI report
      */

      const data =
        await this.request(
          "dashboard",
          {
            month,
            affiliate,
            status,
          }
        );

      return res.json({
        success: true,
        data,
      });

    } catch (error) {

      console.error(
        "AFFILIATE REPORT:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Không tải được báo cáo hoa hồng",
        });
    }
  }

  /* =======================================================
     AFFILIATES
  ======================================================= */

  async affiliates(
    req: Request,
    res: Response
  ) {

    try {

      const data =
        await this.request(
          "affiliates"
        );

      return res.json({
        success: true,
        data,
      });

    } catch (error) {

      console.error(
        "AFFILIATE LIST:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Không tải được danh sách Affiliate",
        });
    }
  }

  /* =======================================================
     PAYMENTS
  ======================================================= */

  async payments(
    req: Request,
    res: Response
  ) {

    try {

      const data =
        await this.request(
          "payments"
        );

      return res.json({
        success: true,
        data,
      });

    } catch (error) {

      console.error(
        "AFFILIATE PAYMENT:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Không tải được thanh toán",
        });
    }
  }
}

export default
  new AffiliateCommissionController();