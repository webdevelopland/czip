// Pause stdin
function pauseInput() {
  process.stdout.write('\n');
  process.stdin.setRawMode(false);
  process.stdin.pause();
}

module.exports = pauseInput;
