const fs = require('fs');
const os = require('os');
const path = require('path');
const { ReplaySubject } = require('rxjs');

const Core = require('../core/worker');

const step = 1024 * 100; // Bytes per write (100 Kb)
const counterStep = step / 16; // Blocks per step
const stepLimit = 1000; // Max 1000 steps in memory (100 Mb)

class ThreadingService {
  constructor(app) {
    this.app = app;
  }

  init() {
    this.initCores();
    this.onload = new ReplaySubject(1);
  }

  initCores() {
    let coresToLoad = os.cpus().length - 1;
    if (coresToLoad < 1) {
      coresToLoad = 1;
    }
    this.cores = [];
    for (let i = 0; i < coresToLoad; i++) {
      const core = new Core(i);
      this.cores.push(core);
    }
    this.lastCore = 0;
  }

  stopCores() {
    this.cores.forEach(core => core.stop());
  }

  encryptBlocks(writeId, tree, offset) {
    this.init();
    this.writeId = writeId;
    this.offset = offset;
    this.id = tree.getMeta().getId();
    this.fileList = tree.getFileList();
    this.fileIndex = 0;
    this.actionIndex = 0;
    this.queue = 0;
    this.map = {};
    this.loadedSteps = 0;
    let totalAmountOfAllSteps = 0;
    this.fileList.forEach((file, index) => {
      this.map[index] = {
        readId: 0,
        size: file.getBlock().getSize(),
        key: file.getBlock().getKey(),
        totalSteps: Math.ceil(file.getBlock().getSize() / step),
        completedSteps: 0,
        stepIndex: 0,
      };
      totalAmountOfAllSteps += this.map[index].totalSteps;
    });
    this.app.bar.start(totalAmountOfAllSteps, 0);
    this.encryptBlock();
  }

  encryptBlock() {
    const file = this.fileList[this.fileIndex];
    if (file) {
      if (file.getBlock().getSize() === 0) {
        this.fileIndex++;
        this.encryptBlock();
        return;
      }
      const f = this.map[this.fileIndex];
      const filePath = this.id + file.getPath();
      f.readId = fs.openSync(filePath, 'r');
      const firstWave = Math.min(stepLimit, f.totalSteps);
      f.stepIndex = firstWave;
      for (let i = 0; i < firstWave; i++) {
        this.stepEncrypt(i, this.fileIndex);
      }
    } else {
      this.app.bar.stop();
      console.timeEnd('Encrypted');
      this.stopCores();
      fs.close(this.writeId);
      this.onload.next();
    }
  }

  stepEncrypt(i, fileIndex) {
    const f = this.map[fileIndex];
    const stepSize = i === (f.totalSteps - 1) ? f.size - step * (f.totalSteps - 1) : step;
    const buffer = Buffer.alloc(stepSize);
    fs.readSync(f.readId, buffer, 0, stepSize, i * step);
    const binary = Uint8Array.from(buffer);

    this.queue++;
    this.actionIndex++;
    const core = this.cores[this.lastCore];
    core.encrypt(binary, f.key, counterStep * i, this.actionIndex, encrypted => {
      fs.writeSync(this.writeId, encrypted, 0, stepSize, this.offset + i * step);
      f.completedSteps++;
      this.loadedSteps++;
      this.app.bar.update(this.loadedSteps);
      this.queue--;
      if (f.completedSteps < f.totalSteps) {
        if (this.queue < stepLimit && f.stepIndex < f.totalSteps) {
          // Encrypt next step
          this.stepEncrypt(f.stepIndex++, fileIndex);
        }
      } else {
        // Encrypt next file
        this.offset += f.size;
        this.fileIndex++;
        fs.close(f.readId);
        this.encryptBlock();
      }
    });
    this.lastCore++;
    if (this.lastCore >= this.cores.length - 1) {
      this.lastCore = 0;
    }
  }

  decryptBlocks(root) {
    this.init();
    this.root = root;
    this.fileList = this.app.dataService.tree.getFileList();
    this.fileIndex = 0;
    this.actionIndex = 0;
    this.queue = 0;
    this.loadedSteps = 0;
    this.map = {};
    let totalAmountOfAllSteps = 0;
    this.fileList.forEach((file, index) => {
      this.map[index] = {
        writeId: 0,
        size: file.getBlock().getSize(),
        key: file.getBlock().getKey(),
        totalSteps: Math.ceil(file.getBlock().getSize() / step),
        completedSteps: 0,
        stepIndex: 0,
        start: this.app.dataService.blocksPosition + file.getBlock().getPosition(),
      };
      totalAmountOfAllSteps += this.map[index].totalSteps;
    });
    this.app.bar.start(totalAmountOfAllSteps, 0);
    this.decryptBlock();
  }

  decryptBlock() {
    const file = this.fileList[this.fileIndex];
    if (file) {
      if (file.getBlock().getSize() === 0) {
        this.fileIndex++;
        this.decryptBlock();
        return;
      }
      const f = this.map[this.fileIndex];
      const filePath = path.join(this.root, file.getPath());
      f.writeId = fs.openSync(filePath, 'w');

      const firstWave = Math.min(stepLimit, f.totalSteps);
      f.stepIndex = firstWave;
      for (let i = 0; i < firstWave; i++) {
        this.stepDecrypt(i, this.fileIndex);
      }
    } else {
      this.app.bar.stop();
      console.timeEnd('Decrypted');
      this.stopCores();
      fs.close(this.app.dataService.readId);
      this.onload.next();
    }
  }

  stepDecrypt(i, fileIndex) {
    const f = this.map[fileIndex];
    const stepSize = i === (f.totalSteps - 1) ? f.size - step * (f.totalSteps - 1) : step;
    const buffer = Buffer.alloc(stepSize);
    fs.readSync(this.app.dataService.readId, buffer, 0, stepSize, f.start + i * step);
    const encrypted = Uint8Array.from(buffer);

    this.queue++;
    this.actionIndex++;
    const core = this.cores[this.lastCore];
    core.encrypt(encrypted, f.key, counterStep * i, this.actionIndex, decrypted => {
      fs.writeSync(f.writeId, decrypted, 0, decrypted.length, i * step);

      f.completedSteps++;
      this.loadedSteps++;
      this.app.bar.update(this.loadedSteps);
      this.queue--;
      if (f.completedSteps < f.totalSteps) {
        if (this.queue < stepLimit && f.stepIndex < f.totalSteps) {
          // Decrypt next step
          this.stepDecrypt(f.stepIndex++, fileIndex);
        }
      } else {
        // Decrypt next file
        this.fileIndex++;
        fs.close(f.writeId);
        this.decryptBlock();
      }
    });
    this.lastCore++;
    if (this.lastCore >= this.cores.length - 1) {
      this.lastCore = 0;
    }
  }
}

module.exports = ThreadingService;
