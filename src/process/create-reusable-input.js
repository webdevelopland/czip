// Create stdin, which can be paused and reused
function createReusableInput() {
  process.stdin.on('data', data => {
    if (process.stdin.callback) {
      const code = data.toString('utf8').charCodeAt(0);
      process.stdin.callback(data, code);
    }
  });
  process.stdin.pause();
  process.stdin.isCreated = true;
}

module.exports = createReusableInput;
