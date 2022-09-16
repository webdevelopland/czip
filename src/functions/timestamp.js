const addZero = require('./zero');

function timestampToDate(timestamp) {
  const date = new Date(timestamp);
  let dateString = '';
  dateString += addZero(date.getHours());
  dateString += ':' + addZero(date.getMinutes());
  dateString += ':' + addZero(date.getSeconds());
  dateString += ' ';
  dateString += addZero(date.getDate());
  dateString += '-' + addZero(date.getMonth() + 1);
  dateString += '-' + date.getFullYear();
  return dateString;
}

module.exports = timestampToDate;
