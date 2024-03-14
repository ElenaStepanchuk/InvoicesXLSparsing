export const currencyRates = (sheet) => {
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
  return ratesArr;
};
