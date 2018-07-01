// Hang callback on user input
function onInput(callback) {
  if (!process.stdin.isCreated) {
    throw new Error("Reusable input isn't created");
  }
  process.stdin.setRawMode(true);
  process.stdin.setEncoding('utf8');
  process.stdin.callback = callback;
  process.stdin.resume();
}

module.exports = onInput;
