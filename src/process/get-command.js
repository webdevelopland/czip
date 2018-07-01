const {
  BACKSPACE_WINDOWS,
  BACKSPACE_LINUX,
  EXIT,
  ESC,
  ENTER,
  SAVE,
} = require('./keys');
const onInput = require('./on-input');
const clearInputLine = require('./clear-input-line');
const pauseInput = require('./pause-input');

function getCommand(callback, prompt) {
  prompt = prompt || '';
  process.stdout.write(prompt);

  var command = '';
  onInput((data, code) => {
    switch (code) {
      case ENTER:
        // Command typing is finished
        process.stdout.write('\n');
        process.stdout.write(prompt);
        callback(command);
        command = '';
        break;
      case EXIT:
      case ESC:
        // Exit
        clearInputLine();
        command = 'exit';
        process.stdout.write(prompt);
        process.stdout.write(command);
        process.stdout.write('\n');
        callback(command);
        break;
      case SAVE:
        // Save
        clearInputLine();
        command = 'save';
        process.stdout.write(prompt);
        process.stdout.write(command);
        process.stdout.write('\n');
        callback(command);
        break;
      case BACKSPACE_WINDOWS:
      case BACKSPACE_LINUX:
        // Remove last character
        clearInputLine();
        command = command.slice(0, command.length - 1);
        process.stdout.write(prompt);
        process.stdout.write(command);
        break;
      default:
        // Add new character
        command += data;
        process.stdout.write(data);
    }
  });
}

module.exports = getCommand;
