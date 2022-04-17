const scrypt = require('scrypt-js');
const AES = require('../../third-party/aes');

const DEFAULT_COUNTER = 1;
const SALT = Uint8Array.from([
  0, 104, 89, 125, 160, 222, 25, 13, 77, 211,
  132, 150, 16, 44, 249, 79, 216, 241, 246, 14,
  54, 182, 99, 13, 9, 247, 59, 192, 7, 243,
  181, 175, 80, 82, 130, 196, 124, 228, 171, 209,
  151, 15, 251, 83, 184, 127, 216, 85, 16, 137,
  111, 29, 23, 71, 96, 107, 162, 29, 209, 227,
  92, 15, 231, 147, 240, 112, 210, 189, 39, 234,
  77, 42, 9, 41, 187, 115, 198, 200, 142, 255
]);

function encryptCBC(binary, key, iv) {
  const cipher = new AES.ModeOfOperation.cbc(key, iv);
  return cipher.encrypt(binary);
}

function decryptCBC(encrypted, key, iv) {
  const cipher = new AES.ModeOfOperation.cbc(key, iv);
  return cipher.decrypt(encrypted);
}

function encryptCTR(binary, key, counter = DEFAULT_COUNTER) {
  const cipher = new AES.ModeOfOperation.ctr(key, new AES.Counter(counter));
  return cipher.encrypt(binary);
}

// Generate 256 key based on string password
function getKey(password, pow) {
  const passwordBytes = AES.utils.utf8.toBytes(password.normalize('NFKC'));
  const N = Math.pow(2, pow);
  const dkLen = 32;
  const r = 8;
  const p = 1;
  return scrypt.syncScrypt(passwordBytes, SALT, N, r, p, dkLen);
}

function checkRV(block) {
  for (let i = 0; i < 8; i++) {
    if (block[i] !== 0) {
      return false;
    }
  }
  return true;
}

module.exports = {
  DEFAULT_COUNTER: DEFAULT_COUNTER,
  encryptCBC: encryptCBC,
  decryptCBC: decryptCBC,
  encryptCTR: encryptCTR,
  getKey: getKey,
  checkRV: checkRV,
};
