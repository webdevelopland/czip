#!/usr/bin/env node

const fs = require('fs');

const createReusableInput = require('./src/process/create-reusable-input');
const getCommand = require('./src/process/get-command');
const getPassword = require('./src/process/get-password');
const kill = require('./src/process/kill');
const { encryptFolder, decryptFolder, isPasswordCorrect, changePassword } = require('./src/crypto-folder');
const clearInputLine = require('./src/process/clear-input-line');
const { rmdirfull } = require('./src/folder');

function bootstrap(callback) {
  var mode = process.argv[2];
  simpleMods(mode);

  var fileBase = process.argv[3];
  var password = process.argv[4];

  const czip = fileBase + '.czip';
  getFilePath(fileBase, czip, mode);

  createReusableInput();
  checkPassword(password, password => {
    if (password) {
      callback(mode, fileBase, czip, password);
    } else {
      kill('Error: Invalid password');
    }
  });
}

function simpleMods(mode) {
  switch (mode) {
    case '-v':
    case '--version':
      const packageJson = require('./package');
      kill('czip version: ' + packageJson.version);
    case '-h':
    case '--help':
      console.log('czip help');
      console.log('');
      console.log('Modes:');
      console.log('-e: Encrypt');
      console.log('-d: Decrypt');
      console.log('-p: Is the password correct?');
      console.log('-s: Session');
      console.log('-v: Current version');
      console.log('-h: Help');
      console.log('');
      console.log('Example:');
      console.log('czip -e itemname');
      console.log('');
      kill('More info: https://www.npmjs.com/package/czip');
  }
}

// Get file path and verify mod
function getFilePath(fileBase, czip, mode) {
  switch (mode) {
    case '-e':
    case '--encrypt':
      var filePath = fileBase;
      break;
    case '-d':
    case '--decrypt':
    case '-p':
    case '--password':
    case '-s':
    case '--session':
    case '-n':
    case '--new_password':
      var filePath = czip;
      break;
    default:
      simpleMods('--help');
  }

  if (!fs.existsSync(filePath)) {
    kill('Error: Invalid filename');
  }
}

// Which password should be used?
// Arguments or input?
function checkPassword(password, callback) {
  if (password) {
    // Arguments contain a password
    callback(password);
  } else {
    // Get password from input
    getPassword(password => {
      callback(password);
    }, 'Password: ');
  }
}

bootstrap((mode, fileBase, czip, password) => {
  const algorithm = 'aes-256-cbc';
  switch (mode) {
    case '-e':
    case '--encrypt':
      // Encryption
      encryptFolder(fileBase, czip, password, algorithm);
      kill('Encrypted');
    case '-d':
    case '--decrypt':
      // Decryption
      var error = decryptFolder(czip, fileBase, password, algorithm);
      if (error) {
        kill(error.message);
      } else {
        kill('Decrypted');
      }
    case '-p':
    case '--password':
      // Is the password correct?
      if (isPasswordCorrect(czip, password, algorithm)) {
        kill('Password is correct.');
      } else {
        kill('Password is wrong.');
      }
    case '-s':
    case '--session':
      // Session
      var error = decryptFolder(czip, fileBase, password, algorithm);
      if (error) {
        kill(error.message);
      } else {
        console.log('Session started.');
      }
      
      getCommand(command => {
        switch (command) {
          case 'save':
            fs.unlinkSync(czip);
            encryptFolder(fileBase, czip, password, algorithm);
            clearInputLine();
            console.log('Saved.');
            process.stdout.write('> ');
            break;
          case 'exit':
            rmdirfull(fileBase);
            kill('Session ended.');
        }
      }, '> ');
      break;
    case '-n':
    case '--new_password':
      // Is current password correct?
      if (!isPasswordCorrect(czip, password, algorithm)) {
        kill('Error: Wrong password.');
      }

      // Change password
      getPassword(newPassword => {
        changePassword(czip, password, newPassword, algorithm);
        kill('Password is changed');
      }, 'New password: ');
  }
});
