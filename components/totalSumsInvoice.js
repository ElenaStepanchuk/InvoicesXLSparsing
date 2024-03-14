export const totalSumsInvoice = (
  currencyPriceColumn,
  currencyNameColumn,
  ratesArr,
  allCurrencyValue,
  invoices,
  sheet
) => {
  const currencyArr = Array.from(allCurrencyValue);

  const totalCarrencySum = currencyArr.map((currency) => {
    const sum = [];
    for (let i = 1; i <= invoices.length; i++) {
      const currencyCellIndex = `${currencyNameColumn + i}`;
      const totalPriceCellIndex = `${currencyPriceColumn + i}`;

      if (
        sheet[currencyCellIndex] &&
        sheet[currencyCellIndex].v.toLowerCase() === currency.toLowerCase() &&
        sheet[totalPriceCellIndex] &&
        sheet[totalPriceCellIndex].t === "n"
      ) {
        sum.push(sheet[totalPriceCellIndex].v);
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

  return valueConvert;
};
