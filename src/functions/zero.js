function addZero(num) {
  num = Math.floor(num);
  return ('0' + num).slice(-2);
}

module.exports = addZero;
