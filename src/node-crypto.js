const crypto = require('crypto');

function encrypt(
  content,
  password,
  algorithm,
  inputEncoding,
  outputEncoding
) {
  const cipher = crypto.createCipher(algorithm, password);
  var encrypted = cipher.update(content, inputEncoding, outputEncoding);
  encrypted += cipher.final(outputEncoding);

  return encrypted;
}

function decrypt(
  encrypted,
  password,
  algorithm,
  inputEncoding,
  outputEncoding
) {
  const decipher = crypto.createDecipher(algorithm, password);
  var decrypted = decipher.update(encrypted, outputEncoding, inputEncoding);
  decrypted += decipher.final(inputEncoding);
  return decrypted;
}

module.exports = {
  encrypt: encrypt,
  decrypt: decrypt,
};
