const fs = require('fs');
const cliProgress = require('cli-progress');

const kill = require('./process/kill');
const createReusableInput = require('./process/create-reusable-input');
const pauseInput = require('./process/pause-input');
const getCommand = require('./process/get-command');
const getPassword = require('./process/get-password');
const clearInputLine = require('./process/clear-input-line');
const ZipService = require('./services/zip');
const DataService = require('./services/data');
const ProtoService = require('./services/proto');
const ThreadingService = require('./services/threading');
const META = require('./environments/meta');

class App {
  init(argv) {
    const mode = argv[2];
    const node = argv[3];
    const password = argv[4];

    this.simpleMods(mode);
    this.nodeExist(node, mode);
    createReusableInput();
    this.checkPassword(password, password => {
      this.start(mode, node, password);
    });
  }

  start(mode, node, password) {
    this.zipService = new ZipService(this);
    this.dataService = new DataService(this);
    this.protoService = new ProtoService(this);
    this.threadingService = new ThreadingService(this);
    this.bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    switch (mode) {
      case '-e':
      case '--encrypt':
        const protoTree = this.zipService.readFolder(node);
        this.zipService.encrypt(protoTree, password);
        break;
      case '-d':
      case '--decrypt': {
        this.zipService.decrypt(node, password);
        this.zipService.unpack();
        break;
      }
      case '-p':
      case '--password': {
        if (this.zipService.password(node, password)) {
          kill('Correct password');
        } else {
          kill('Error: Invalid password');
        }
        break;
      }
      case '-s':
      case '--session': {
        this.session(node, password);
        break;
      }
    }
  }

  session(node, password) {
    this.zipService.decrypt(node, password);
    this.startInput();
  }

  startInput() {
    getCommand(command => {
      switch (command) {
        case 'ls':
          clearInputLine();
          console.log('Under development...');
          process.stdout.write('> ');
          break;
        case 'save':
          clearInputLine();
          console.log('Saving...');
          process.stdout.write('> ');
          break;
        case 'load':
          clearInputLine();
          pauseInput();
          this.load(() => {
            this.startInput();
          });
          break;
        case 'help':
          clearInputLine();
          this.help();
          process.stdout.write('> ');
          break;
        case 'version':
          clearInputLine();
          console.log(META.name + ' ' + this.dataService.tree.getMeta().getEncryptorVersion());
          process.stdout.write('> ');
          break;
        case 'exit':
          kill('Session ended.');
      }
    }, '> ');
  }

  load(callback) {
    // Progress bar demo...
    this.bar.start(100, 0);
    let i = 0;
    const id = setInterval(() => {
      this.bar.update(i);
      i++;
      if (i > 100) {
        clearInterval(id);
        this.bar.stop();
        callback();
      }
    }, 50);
  }

  simpleMods(mode) {
    switch (mode) {
      case '-v':
      case '--version':
        kill(META.name + ' ' + META.version);
      case '-h':
      case '--help':
        this.help();
        kill();
    }
  }

  help() {
    console.log('CZIP help');
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
    console.log('czip -e "my folder"');
    console.log('');
    console.log('More info: https://www.npmjs.com/package/czip');
  }

  nodeExist(node, mode) {
    let nodePath;
    switch (mode) {
      case '-e':
      case '--encrypt':
        nodePath = node;
        break;
      case '-d':
      case '--decrypt':
      case '-p':
      case '--password':
      case '-s':
      case '--session':
        nodePath = node + '.czip';
        break;
      default:
        this.help();
        kill();
    }

    if (!fs.existsSync(nodePath)) {
      kill('Error: Invalid filename');
    }
  }

  // Which password should be used?
  // Arguments or input?
  checkPassword(password, callback) {
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
}

module.exports = App;
