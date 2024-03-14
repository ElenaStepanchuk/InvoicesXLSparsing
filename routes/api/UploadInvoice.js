import express from "express";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";

const router = express.Router();

router.post("/", async (req, res) => {
  const invoicingMonth = req.body.date;

  const file = req.file;

  const invoiceRead = XLSX.readFile(file.path);

  const sheetName = invoiceRead.SheetNames[0];
  const sheet = invoiceRead.Sheets[sheetName];

  const dateRegex = new RegExp(
    "^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\s\\d{4}$|^\\d{4}-\\d{2}$"
  );

  const dates = Object.values(sheet).filter((item) => {
    if (typeof item.v === "string" && dateRegex.test(item.v)) {
      item.v = invoicingMonth;
      item.r = `<t>${invoicingMonth}</t>`;
      item.h = invoicingMonth;
      item.w = invoicingMonth;
      return true;
    }
    return false;
  });

  const ratesKeys = Object.keys(sheet).reduce((indices, key) => {
    const item = sheet[key];
    if (item.t === "s" && item.v.includes("Rate")) {
      indices.push(key);
      const letter = key.charAt(0);
      const number = parseInt(key.slice(1), 10);

      const unicode = letter.charCodeAt(0) + 1;
      const nextLetter = String.fromCharCode(unicode);
      const newKey = nextLetter + number;
      indices.push(newKey);
    }
    return indices;
  }, []);

  const ratesArr = [];
  const ratesObject = () => {
    for (let i = 0; i < ratesKeys.length; i++) {
      ratesArr.push(sheet[ratesKeys[i]].v);
    }
    return ratesArr;
  };
  ratesObject();

  const convertToCurrencyRates = (arr) => {
    const result = {};
    for (let i = 0; i < arr.length; i += 2) {
      const currency = arr[i].replace(" Rate", "");
      const rate = arr[i + 1];
      result[currency] = rate;
    }
    return result;
  };

  const invoices = Object.keys(sheet).reduce((indices, key) => {
    const item = sheet[key];
    if (
      (item.t === "s" && item.v.includes("Ready")) |
      (item.t === "s" && item.v.includes("INV"))
    ) {
      const number = parseInt(key.slice(1), 10);
      indices.push(number);
    }
    return indices;
  }, []);

  let invoicesData = [];
  invoicesData.push([
    "Customer",
    "Cust No",
    "Project Type",
    "Quantity",
    "Price Per Item",
    "Item Price Currency",
    "Total Price",
    "Invoice Currency",
    "Status",
    "",
    "",
    "ValidationErrors",
  ]);

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
  const sheetArr = arrInvoicesRead.Sheets[sheetNameArr];

  const carrencyTotalPriceColumn = Object.keys(sheetArr).reduce(
    (indices, key) => {
      const item = sheetArr[key];
      if (item.t === "s" && item.v.includes("Total Price")) {
        const letter = key.charAt(0);
        indices.push(letter);
      }
      return indices;
    },
    []
  );
  const carrencyNameColumn = Object.keys(sheetArr).reduce((indices, key) => {
    const item = sheetArr[key];
    if (item.t === "s" && item.v.includes("Invoice Currency")) {
      const letter = key.charAt(0);
      indices.push(letter);
    }
    return indices;
  }, []);

  const allCurrencyValue = new Set();
  for (const cellAddress in sheetArr) {
    if (
      cellAddress.startsWith(carrencyNameColumn) &&
      sheetArr.hasOwnProperty(cellAddress)
    ) {
      const cellValue = sheetArr[cellAddress].v;
      allCurrencyValue.add(cellValue);
    }
  }
  const currencyArr = Array.from(allCurrencyValue);

  const totalCarrencySum = currencyArr.map((currency) => {
    const sum = [];
    for (let i = 1; i <= invoices.length; i++) {
      const currencyCellIndex = `${carrencyNameColumn + i}`;
      const totalPriceCellIndex = `${carrencyTotalPriceColumn + i}`;

      if (
        sheetArr[currencyCellIndex] &&
        sheetArr[currencyCellIndex].v.toLowerCase() ===
          currency.toLowerCase() &&
        sheetArr[totalPriceCellIndex] &&
        sheetArr[totalPriceCellIndex].t === "n"
      ) {
        sum.push(sheetArr[totalPriceCellIndex].v);
      }
    }
    return sum;
  });

  const sumArrays = totalCarrencySum.map((innerArray) => {
    return innerArray.reduce((sum, value) => sum + value, 0);
  });

  const resultObject = {};
  currencyArr.forEach((currency, index) => {
    resultObject[currency] = sumArrays[index];
  });

  const convertILS = {};
  let valueILS = 0;

  const ratesArrTotal = ratesArr;

  for (const resultKey in resultObject) {
    if (
      resultObject.hasOwnProperty(resultKey) &&
      resultKey !== "Invoice Currency"
    ) {
      for (let i = 0; i < ratesArrTotal.length; i += 2) {
        const rateKey = ratesArrTotal[i];
        const rate = ratesArrTotal[i + 1];

        if (rateKey.includes(resultKey)) {
          convertILS[resultKey] = resultObject[resultKey] * rate;
          break;
        }
      }
    }

    valueILS =
      Object.values(convertILS).reduce((sum, value) => sum + value, 0) +
      resultObject.ILS;
  }

  const valueConvert = ratesArr.map((value, index) =>
    index % 2 === 1 ? value * valueILS : value
  );

  const modifiedValueConvert = valueConvert.map((value, index) => {
    if (index % 2 === 0 && typeof value === "string") {
      return value.replace("Rate", "");
    }
    return value;
  });

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

  const invoicesNew = Object.keys(sheetArr).reduce((indices, key) => {
    const item = sheetArr[key];
    if (
      (item.t === "s" && item.v.includes("Ready")) |
      (item.t === "s" && item.v.includes("INV"))
    ) {
      const number = parseInt(key.slice(1), 10);
      indices.push(number);
    }
    return indices;
  }, []);

  let invoicesDataNew = [];

  invoicesDataNew.push([
    "Customer",
    "Cust No",
    "Project Type",
    "Quantity",
    "Price Per Item",
    "Item Price Currency",
    "Total Price",
    "Invoice Currency",
    "Status",
    "",
    "",
    "ValidationErrors",
  ]);

  const ValidationErrorsColumn = Object.keys(sheetArr).reduce(
    (indices, key) => {
      const item = sheetArr[key];
      if (item.t === "s" && item.v.includes("ValidationErrors")) {
        const letter = key.charAt(0);
        indices.push(letter);
      }
      return indices;
    },
    []
  );

  invoicesNew.forEach((rowNumber) => {
    const range = [];
    let mistakes = [];
    for (let col = 0; col <= 11; col++) {
      const cell = XLSX.utils.encode_cell({ r: rowNumber - 1, c: col });
      range.push(cell);
    }
    const rowData = range.reduce((data, cell) => {
      if (sheetArr[cell] && sheetArr[cell].v !== undefined) {
        data[cell] = sheetArr[cell].v;
      } else {
        data[cell] = null;
        const letter = cell.charAt(0);

        let letterErr = "";
        switch (letter) {
          case "A":
            letterErr = "Fill in customer";
            break;
          case "B":
            letterErr = "Fill in cust no";
            break;
          case "C":
            letterErr = "Fill in project type";
            break;
          case "D":
            letterErr = "Fill in quantity";
            break;
          case "E":
            letterErr = "Fill in price per item";
            break;
          case "F":
            letterErr = "Fill in item price currency";
            break;
          case "G":
            letterErr = "Fill in total price";
            break;
          case "H":
            letterErr = "Fill in invoice currency";
            break;
          case "I":
            letterErr = "Fill in status";
            break;
          default:
            letterErr = null;
        }

        if (letterErr !== null) {
          mistakes.push(letterErr);
        }
      }

      const number = parseInt(cell.slice(1), 10);
      const key = ValidationErrorsColumn + number;
      sheetArr[key] = { v: mistakes.join(", ") };
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
      GeneralTotalPrice: convertToCurrencyRates(modifiedValueConvert),
    },
    null,
    2
  )}</pre>`;
  res.status(200).end(result);
});

export default router;
