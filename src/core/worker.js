const path = require('path');
const { Worker } = require('worker_threads');

class Core {
  constructor(index) {
    this.index = index;
    this.worker = new Worker(path.join(__dirname, 'ctr.js'));
    this.map = {};
    this.worker.on('message', message => {
      this.map[message.id](message.encrypted);
      delete this.map[message.id];
    });
  }

  stop() {
    this.worker.postMessage({ stop: true });
  }

  encrypt(binary, key, counter, id, callback) {
    this.map[id] = callback;
    this.worker.postMessage({
      binary: binary,
      key: key,
      counter: counter,
      id: id,
    });
  }
}

module.exports = Core;
