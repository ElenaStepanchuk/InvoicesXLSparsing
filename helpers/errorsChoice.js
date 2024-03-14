export const errorsChoice = (letter) => {
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
  return letterErr;
};
