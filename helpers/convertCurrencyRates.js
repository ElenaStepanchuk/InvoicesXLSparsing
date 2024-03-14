export const convertToCurrencyRates = (arr) => {
  const result = {};
  for (let i = 0; i < arr.length; i += 2) {
    const currency = arr[i].replace(" Rate", "");
    const rate = arr[i + 1];
    result[currency] = rate;
  }
  return result;
};
