const {
  rand,
  randstr64,
  randCustomString,
  numerals,
} = require('rndmjs');

function generateId() {
  return randCustomString(numerals, 9);
}

function getNodeId() {
  return randstr64(20);
}

function getRandomKey() {
  return getRandomBlock(32);
}

function getIV() {
  return getValueBlock(1, 16);
}

function getRV() {
  const block = getRandomBlock(16);
  for (let i = 0; i < 8; i++) {
    block[i] = 0;
  }
  return block;
}

function getRandomBlock(size) {
  const block = [];
  for (let i = 0; i < size; i++) {
    block.push(rand(0, 255));
  }
  return new Uint8Array(block);
}

function getValueBlock(value, size) {
  const block = [];
  for (let i = 0; i < size; i++) {
    block.push(value);
  }
  return new Uint8Array(block);
}

function getEmptyBlock(size) {
  return getValueBlock(0, size);
}

module.exports = {
  generateId: generateId,
  getNodeId: getNodeId,
  getRandomKey: getRandomKey,
  getIV: getIV,
  getRV: getRV,
  getRandomBlock: getRandomBlock,
  getEmptyBlock: getEmptyBlock,
  getValueBlock: getValueBlock,
};
