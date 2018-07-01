// Clear line on the console
function clearInputLine() {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
}

module.exports = clearInputLine;
