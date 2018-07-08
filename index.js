#!/usr/bin/env node

const fs = require('fs');

const createReusableInput = require('./src/process/create-reusable-input');
const getCommand = require('./src/process/get-command');
const getPassword = require('./src/process/get-password');
const kill = require('./src/process/kill');
const { encryptFolder, decryptFolder, isPasswordCorrect } = require('./src/crypto-folder');
const clearInputLine = require('./src/process/clear-input-line');
const { rmdirfull } = require('./src/folder');

function bootstrap(callback) {
  var mode = process.argv[2];
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

// Get file path and verify mod
function getFilePath(fileBase, czip, mode) {
  switch (mode) {
    case '-e':
      var filePath = fileBase;
      break;
    case '-d':
    case '-v':
    case '-s':
      var filePath = czip;
      break;
    default:
      kill('Error: Invalid mode');
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
      // Encryption
      encryptFolder(fileBase, czip, password, algorithm);
      kill('Encrypted');
    case '-d':
      // Decryption
      var error = decryptFolder(czip, fileBase, password, algorithm);
      if (error) {
        kill(error.message);
      } else {
        kill('Decrypted');
      }
    case '-v':
      // Is the password correct?
      if (isPasswordCorrect(czip, password, algorithm)) {
        kill('Password is correct.');
      } else {
        kill('Password is wrong.');
      }
    case '-s':
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
  }
});
