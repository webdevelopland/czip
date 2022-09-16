const fs = require('fs');

const kill = require('../process/kill');
const pauseInput = require('../process/pause-input');
const getCommand = require('../process/get-command');
const getPassword = require('../process/get-password');
const clearInputLine = require('../process/clear-input-line');
const timestampToDate = require('../functions/timestamp');
const META = require('../environments/meta');

class SessionService {
  constructor(app) {
    this.app = app;
  }

  startInput(node, password) {
    this.node = node;
    this.password = password;
    this.createInput();
  }

  createInput() {
    getCommand(command => {
      switch (command) {
        case 'save': {
          clearInputLine();
          if (!fs.existsSync(this.node)) {
            console.log(this.node + ' not found');
            break;
          }
          pauseInput();
          const meta = this.app.dataService.tree.getMeta();
          meta.setUpdatedTimestamp(Date.now());
          meta.setEncryptorVersion(META.version);
          meta.setUpdateVersion(meta.getUpdateVersion() + 1);
          const protoTree = this.app.zipService.readFolder(this.node);
          protoTree.setMeta(meta);
          this.app.zipService.encrypt(protoTree, this.password);
          this.app.threadingService.onload.subscribe(() => {
            this.createInput();
          });
          break;
        }
        case 'newid': {
          clearInputLine();
          pauseInput();
          getCommand(id => {
            this.node = id;
            this.app.dataService.tree.getMeta().setId(id);
            clearInputLine();
            this.createInput();
          }, 'New id: ');
          break;
        }
        case 'newpass': {
          clearInputLine();
          pauseInput();
          getPassword(password => {
            this.password = password;
            this.createInput();
          }, 'Enter new password: ');
          break;
        }
        case 'pass': {
          clearInputLine();
          pauseInput();
          getPassword(password => {
            if (this.password === password) {
              console.log('Correct password');
            } else {
              console.log('Invalid password');
            }
            this.createInput();
          }, 'Password: ');
          break;
        }
        case 'help': {
          clearInputLine();
          this.help();
          process.stdout.write('> ');
          break;
        }
        case 'info': {
          clearInputLine();
          const meta = this.app.dataService.tree.getMeta();
          console.log('id: ' + meta.getId());
          console.log('Encryptor version: ' + meta.getEncryptorVersion());
          console.log('Update version: ' + meta.getUpdateVersion());
          console.log('Created: ' + timestampToDate(meta.getCreatedTimestamp()));
          console.log('Updated: ' + timestampToDate(meta.getUpdatedTimestamp()));
          process.stdout.write('> ');
          break;
        }
        case 'title': {
          clearInputLine();
          if (fs.existsSync(this.node)) {
            const title = this.app.zipService.getTitle(this.node);
            console.log(title);
          } else {
            console.log(this.app.dataService.title);
          }
          process.stdout.write('> ');
          break;
        }
        case 'exit': {
          if (fs.existsSync(this.node)) {
            fs.rmSync(this.node, { recursive: true });
          }
          kill('Session ended.');
        }
      }
    }, '> ');
  }

  help() {
    console.log('Session commands:');
    console.log('save: Save current session');
    console.log('newpass: Change password');
    console.log('pass: Is the password correct?');
    console.log('help: Show available commands');
    console.log('info: Session info');
    console.log('title: Show title');
    console.log('exit: End session');
    console.log('');
    console.log('Shortcuts:');
    console.log('Ctrl+S: save');
    console.log('Esc or Ctrl+C or Alt+Q: exit');
  }
}

module.exports = SessionService;
