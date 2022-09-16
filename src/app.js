const fs = require('fs');
const cliProgress = require('cli-progress');

const kill = require('./process/kill');
const createReusableInput = require('./process/create-reusable-input');
const getPassword = require('./process/get-password');
const ZipService = require('./services/zip');
const DataService = require('./services/data');
const ProtoService = require('./services/proto');
const ThreadingService = require('./services/threading');
const SessionService = require('./services/session');
const META = require('./environments/meta');

class App {
  init(argv) {
    const mode = argv[2];
    const node = argv[3];
    const password = argv[4];

    this.simpleMods(mode);
    this.nodeExist(node, mode);

    this.zipService = new ZipService(this);
    this.dataService = new DataService(this);
    this.protoService = new ProtoService(this);
    this.threadingService = new ThreadingService(this);
    this.sessionService = new SessionService(this);

    this.passlessMods(mode, node);
    createReusableInput();
    this.checkPassword(password, password => {
      this.start(mode, node, password);
    });
  }

  start(mode, node, password) {
    this.bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    switch (mode) {
      case '-e':
      case '--encrypt':
        const protoTree = this.zipService.readFolder(node);
        this.zipService.encrypt(protoTree, password);
        this.threadingService.onload.subscribe(() => {
          kill();
        });
        break;
      case '-d':
      case '--decrypt': {
        this.zipService.decrypt(node, password);
        this.zipService.unpack();
        this.threadingService.onload.subscribe(() => {
          kill();
        });
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
        this.zipService.decrypt(node, password);
        this.zipService.unpack();
        this.threadingService.onload.subscribe(() => {
          this.sessionService.startInput(node, password);
        });
        break;
      }
    }
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

  passlessMods(mode, node) {
    switch (mode) {
      case '-t':
      case '--title':
        const title = this.zipService.getTitle(node);
        kill(title);
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
    console.log('-t: Show title');
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
      case '-t':
      case '--title':
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
