export const createInvoices = (sheet) => {
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
  return invoices;
};
