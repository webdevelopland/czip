const sha256 = require('js-sha256');
const AES = require('../../third-party/aes');

const DEFAULT_COUNTER = 1;

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
function getKey(password) {
  const salt = 'sha256czip';
  const hex = sha256(password + salt);
  return AES.utils.hex.toBytes(hex);
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
