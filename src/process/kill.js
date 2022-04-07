// End app with a message
function kill(message) {
  if (message) {
    console.log(message);
  }
  process.exit();
}

module.exports = kill;
