function hasValidCheckDigits(digits, baseLength, weights) {
  let document = digits.slice(0, baseLength);
  for (const weightSet of weights) {
    const sum = document.split("").reduce((total, digit, index) => total + Number(digit) * weightSet[index], 0);
    const remainder = sum % 11;
    document += remainder < 2 ? "0" : String(11 - remainder);
  }
  return document === digits;
}

export function isValidCpfCnpj(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (![11, 14].includes(digits.length) || /^(\d)\1+$/.test(digits)) return false;
  if (digits.length === 11) {
    return hasValidCheckDigits(digits, 9, [
      [10, 9, 8, 7, 6, 5, 4, 3, 2],
      [11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
    ]);
  }
  return hasValidCheckDigits(digits, 12, [
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  ]);
}
