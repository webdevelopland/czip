const {
  BACKSPACE_WINDOWS,
  BACKSPACE_LINUX,
  EXIT,
  ESC,
  ENTER,
} = require('./keys');
const onInput = require('./on-input');
const clearInputLine = require('./clear-input-line');
const pauseInput = require('./pause-input');
const kill = require('./kill');

function getPassword(callback, prompt) {
  prompt = prompt || '';
  process.stdout.write(prompt);

  let password = '';
  onInput((data, code) => {
    switch (code) {
      case ENTER:
        // Password typing is finished
        pauseInput();
        callback(password);
        break;
      case EXIT:
      case ESC:
        // Close program
        process.stdout.write('\n');
        kill('Exit.');
        break;
      case BACKSPACE_WINDOWS:
      case BACKSPACE_LINUX: {
        // Remove last character
        clearInputLine();
        password = password.slice(0, password.length - 1);
        const censoredPassword = password.split('').map(() => '*').join('');
        process.stdout.write(prompt);
        process.stdout.write(censoredPassword);
        break;
      }
      default: {
        // Add new character
        password += data;
        const censoredData = data.split('').map(() => '*').join('');
        process.stdout.write(censoredData);
      }
    }
  });
}

module.exports = getPassword;
