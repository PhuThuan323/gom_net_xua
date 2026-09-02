import express from "express";
import cors from "cors";

import path from "path";
import userRoute from "./routes/userRoute";

import productGroupRoute from "./routes/productGroupRoute";
import productRoute from "./routes/productRoute";
import productVariantRoute from "./routes/productVariantRoute";
import supplierRoute from "./routes/supplierRoute";
import importReceiptRoute from "./routes/importReceiptRoute";
import debtProvider from "./routes/debtProviderRoute"
import invoiceRoute from "./routes/invoiceRoute"
import exportStockRoute from "./routes/exportStockRoute";
import lossStockRoute from "./routes/lossStockRoute";
import cashFlowRoute from "./routes/cashFlowRoute";
import reportRoute from "./routes/reportRoute";
import affiliateCommissionRoute from "./routes/affiliateCommissionRoute";
const app = express();


app.use(cors());

app.use(express.json());
app.use("/uploads",express.static(path.join(process.cwd(),"uploads")));
app.use("/users",userRoute);
app.use("/product-groups", productGroupRoute);
app.use("/products",productRoute);
app.use("/variants",productVariantRoute);
app.use("/suppliers",supplierRoute);
app.use("/import-receipts",importReceiptRoute);
app.use("/debt",debtProvider)
app.use("/invoice",invoiceRoute);
app.use("/export-stock",exportStockRoute);
app.use("/loss-stock",lossStockRoute);
app.use("/cash-flow",cashFlowRoute);
app.use("/reports",reportRoute);
app.use("/affiliate-commissions",affiliateCommissionRoute);
const PORT =
  Number(
    process.env.PORT
  ) || 3000;

app.get(
  "/health",
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "Gốm Nét Xưa API đang hoạt động",
    });
  }
);

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Server running on port ${PORT}`
    );
  }
);