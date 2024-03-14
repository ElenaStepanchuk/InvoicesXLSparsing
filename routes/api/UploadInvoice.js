import express from "express";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";

import { newDates } from "../../components/newDates.js";
import { currencyRates } from "../../components/currencyRates.js";
import { totalSumsInvoice } from "../../components/totalSumsInvoice.js";

import { convertToCurrencyRates } from "../../helpers/convertCurrencyRates.js";
import { findColumnByName } from "../../helpers/findColumnByName.js";
import { createInvoices } from "../../helpers/createInvoices.js";
import { invoicesHeader } from "../../constants/invoiceHeader.js";
import { errorsChoice } from "../../helpers/errorsChoice.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const invoicingMonth = req.body.date;

  const file = req.file;
  const invoiceRead = XLSX.readFile(file.path);
  const sheetName = invoiceRead.SheetNames[0];
  const sheet = invoiceRead.Sheets[sheetName];

  const dates = newDates(sheet, invoicingMonth);

  const ratesArr = currencyRates(sheet);

  const invoices = createInvoices(sheet);

  let invoicesData = [];
  invoicesData.push(invoicesHeader);

  invoices.forEach((rowNumber) => {
    const range = [];
    for (let col = 0; col <= 10; col++) {
      const cell = XLSX.utils.encode_cell({ r: rowNumber - 1, c: col });
      range.push(cell);
    }

    const rowData = range.reduce((data, cell) => {
      if (sheet[cell] && sheet[cell].v !== undefined) {
        data[cell] = sheet[cell].v;
      } else {
        data[cell] = null;
      }

      return data;
    }, {});
    invoicesData.push(Object.values(rowData));
  });

  const workbook = XLSX.utils.book_new();
  const newSheetName = "ProcessedData";
  const ws = XLSX.utils.aoa_to_sheet(invoicesData);
  XLSX.utils.book_append_sheet(workbook, ws, newSheetName);

  const __filename = new URL(import.meta.url).pathname;
  const __dirname = path.dirname(__filename);
  const invoiceDir = path.join(
    "./",
    __dirname,
    "../../",
    "public",
    "invoice",
    "ArrInvoices.xlsx"
  );

  XLSX.writeFile(workbook, invoiceDir);

  const arrInvoicesRead = XLSX.readFile(invoiceDir);
  const sheetNameArr = arrInvoicesRead.SheetNames[0];
  const sheetNew = arrInvoicesRead.Sheets[sheetNameArr];

  const currencyTotalPriceColumn = findColumnByName(sheetNew, "Total Price");
  const currencyNameColumn = findColumnByName(sheetNew, "Invoice Currency");

  const allCurrencyValue = new Set();
  for (const cellAddress in sheetNew) {
    if (
      cellAddress.startsWith(currencyNameColumn) &&
      sheetNew.hasOwnProperty(cellAddress)
    ) {
      const cellValue = sheetNew[cellAddress].v;
      allCurrencyValue.add(cellValue);
    }
  }

  const valueConvert = totalSumsInvoice(
    currencyTotalPriceColumn,
    currencyNameColumn,
    ratesArr,
    allCurrencyValue,
    invoices,
    sheetNew
  );

  const tempDir = path.join("./", __dirname, "../../", "temp");
  fs.readdir(tempDir, (err, files) => {
    if (err) {
      console.error("Error reading folder:", err);
      return;
    }
    files.forEach((file) => {
      if (file !== ".gitkeep") {
        const filePath = path.join(tempDir, file);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`File deletion error ${filePath}:`, err);
          }
        });
      }
    });
  });

  const invoicesNew = createInvoices(sheetNew);

  let invoicesDataNew = [];
  invoicesDataNew.push(invoicesHeader);

  const validationErrorsColumn = findColumnByName(sheetNew, "ValidationErrors");

  invoicesNew.forEach((rowNumber) => {
    const range = [];
    let mistakes = [];
    for (let col = 0; col <= 11; col++) {
      const cell = XLSX.utils.encode_cell({ r: rowNumber - 1, c: col });
      range.push(cell);
    }
    const rowData = range.reduce((data, cell) => {
      if (sheetNew[cell] && sheetNew[cell].v !== undefined) {
        data[cell] = sheetNew[cell].v;
      } else {
        data[cell] = null;
        const letter = cell.charAt(0);
        const letterErr = errorsChoice(letter);

        if (letterErr !== null) {
          mistakes.push(letterErr);
        }
      }

      const number = parseInt(cell.slice(1), 10);
      const key = validationErrorsColumn + number;
      sheetNew[key] = { v: mistakes.join(", ") };
      return data;
    }, {});

    invoicesDataNew.push(Object.values(rowData));
  });

  const workbookNew = XLSX.utils.book_new();
  const newSheetNameNew = "ProcessedDataNew";
  const wsNew = XLSX.utils.aoa_to_sheet(invoicesDataNew);
  XLSX.utils.book_append_sheet(workbookNew, wsNew, newSheetNameNew);

  XLSX.writeFile(workbookNew, invoiceDir);

  const arrInvoicesReadNew = XLSX.readFile(invoiceDir);
  const sheetNameArrNew = arrInvoicesReadNew.SheetNames[0];
  const sheetArrNew = arrInvoicesReadNew.Sheets[sheetNameArrNew];

  const result = `<pre>${JSON.stringify(
    {
      InvoicingMonth: dates[0].v,
      currencyRates: convertToCurrencyRates(ratesArr),
      invoicesData: [XLSX.utils.sheet_to_html(sheetArrNew)],
      GeneralTotalPrice: convertToCurrencyRates(valueConvert),
    },
    null,
    2
  )}</pre>`;
  res.status(200).end(result);
});

export default router;
