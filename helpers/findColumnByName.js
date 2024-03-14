export const findColumnByName = (sheet, columnName) => {
  const validationErrorsColumn = Object.keys(sheet).reduce((indices, key) => {
    const item = sheet[key];
    if (item.t === "s" && item.v.includes(`${columnName}`)) {
      const letter = key.charAt(0);
      indices.push(letter);
    }
    return indices;
  }, []);
  return validationErrorsColumn;
};
