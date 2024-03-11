import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import invoices from "./routes/api/Invoices.js";
import uploadInvoice from "./routes/api/UploadInvoice.js";

import ctrlWrapper from "./middlewares/ctrlWrapper.js";
import upload from "./middlewares/multerMiddleware.js";

dotenv.config();

const { PORT = 3000 } = process.env;

const app = express();
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/invoice", ctrlWrapper(invoices));
app.use("/upload", upload.single("file"), ctrlWrapper(uploadInvoice));

app.listen(PORT);
