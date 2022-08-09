function serilizeSpecialChar(str) {
  const chars = "0123456789qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM";
  const escapeChar = String.fromCharCode(92);
  return str
    .split("")
    .map(char => chars.includes(char) ? char : escapeChar + char)
    .join("");
}

exports.serilizeSpecialChar = serilizeSpecialChar;