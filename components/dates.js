const dateRegex = new RegExp(
  "^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\s\\d{4}$|^\\d{4}-\\d{2}$"
);

export const newDates = (sheet, invoicingMonth) => {
  const data = Object.values(sheet).filter((item) => {
    if (typeof item.v === "string" && dateRegex.test(item.v)) {
      item.v = invoicingMonth;
      item.r = `<t>${invoicingMonth}</t>`;
      item.h = invoicingMonth;
      item.w = invoicingMonth;
      return true;
    }
    return false;
  });
  return data;
};
