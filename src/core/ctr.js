const { parentPort } = require('worker_threads');

const { encryptCTR, DEFAULT_COUNTER } = require('./crypto');

parentPort.on('message', message => {
  if (message.stop) {
    process.exit();
  } else {
    const encrypted = encryptCTR(message.binary, message.key, message.counter + DEFAULT_COUNTER);
    parentPort.postMessage({
      encrypted: encrypted,
      id: message.id,
    });
  }
});
