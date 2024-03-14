import XLSX from "xlsx";

export const newSheet = (invoicesDataNew, invoiceDir) => {
  const workbookNew = XLSX.utils.book_new();
  const newSheetName = "ProcessedDataNew";
  const wsNew = XLSX.utils.aoa_to_sheet(invoicesDataNew);
  XLSX.utils.book_append_sheet(workbookNew, wsNew, newSheetName);
  XLSX.writeFile(workbookNew, invoiceDir);

  const invoicesReadNew = XLSX.readFile(invoiceDir);
  const sheetName = invoicesReadNew.SheetNames[0];
  const sheetNew = invoicesReadNew.Sheets[sheetName];
  return sheetNew;
};
