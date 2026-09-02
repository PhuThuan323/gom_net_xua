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
app.listen(3000, () => {console.log("Server chạy tại http://localhost:3000");});