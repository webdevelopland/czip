const path = require('path');
const fs = require('fs');
const AES = require('../../third-party/aes');

const kill = require('../process/kill');
const { encryptCBC, decryptCBC, getKey, checkRV } = require('../core/crypto');
const { uint8ArrayToint32, int32ToUint8Array } = require('../functions/encoding');
const { getChildren, parsePath } = require('../functions/folder');
const { getRV, getIV } = require('../functions/rand');
const META = require('../environments/meta');

const INT32BYTES = 4;
const BLOCKSIZE = 16;
const DEFAULT_POW = 14;

class ZipService {
  constructor(app) {
    this.app = app;
  }

  readFolder(nodeName, password) {
    const isFolder = fs.lstatSync(nodeName).isDirectory();
    if (!isFolder) {
      kill('Error: Not a folder. Only folders are available for encryption');
    }
    const id = parsePath(nodeName).name;
    const children = getChildren(nodeName);
    children.sort((a, b) => {
      // Show folder before files
      const aFolderStatus = a.isFolder ? 1 : 0;
      const bFolderStatus = b.isFolder ? 1 : 0;
      const folderStatus = bFolderStatus - aFolderStatus;
      // Show parents before children
      const aNodeLength = parsePath(a.path).length;
      const bNodeLength = parsePath(b.path).length;
      const lengthStatus = aNodeLength - bNodeLength;
      if (folderStatus !== 0) {
        return folderStatus;
      } else if (lengthStatus !== 0) {
        return lengthStatus;
      } else {
        return a.path.localeCompare(b.path);
      }
    });
    const protoTree = this.app.protoService.getProto(id, children);
    this.encrypt(protoTree, password);
  }

  encrypt(protoTree, password) {
    // Encrypt tree
    console.time('Encrypted');
    const key = getKey(password, DEFAULT_POW);
    const tree = protoTree.serializeBinary();
    const treeRV = new Uint8Array([...getRV(), ...tree]);
    const paddingTree = AES.padding.pkcs7.pad(treeRV);
    const treeLength = paddingTree.length;
    const RVT = encryptCBC(paddingTree, key, getIV());
    // Write
    let i = 0;
    const rootFile = path.join(process.cwd(), protoTree.getMeta().getId() + '.czip');
    const writeId = fs.openSync(rootFile, 'w');
    let buffer;
    // Title
    const czipTitle = AES.utils.utf8.toBytes(META.name + META.version);
    buffer = Buffer.alloc(1);
    buffer[0] = czipTitle.length;
    fs.writeSync(writeId, buffer, 0, buffer.length, 0);
    i += 1;
    buffer = Buffer.from(czipTitle);
    fs.writeSync(writeId, buffer, 0, buffer.length, i);
    i += buffer.length;
    // PoW
    buffer = Buffer.alloc(1);
    buffer[0] = DEFAULT_POW;
    fs.writeSync(writeId, buffer, 0, buffer.length, i);
    i += 1;
    // Tree size
    const treeSize = int32ToUint8Array(treeLength);
    buffer = Buffer.from(treeSize);
    fs.writeSync(writeId, buffer, 0, buffer.length, i);
    i += buffer.length;
    // Tree
    buffer = Buffer.from(RVT);
    fs.writeSync(writeId, buffer, 0, buffer.length, i);
    i += buffer.length;
    // Encrypt blocks
    this.app.threadingService.encryptBlocks(writeId, protoTree, i);
  }

  decrypt(nodeName, password) {
    console.time('Decrypted');
    const readId = fs.openSync(nodeName + '.czip', 'r');
    this.app.dataService.readId = readId;
    let buffer;
    let i = 0;
    // Removes title. E.g. "CZIP2.46"
    buffer = Buffer.alloc(1);
    fs.readSync(readId, buffer, 0, 1, 0);
    const length = buffer[0];
    i += length + 1;
    // Get CostFactor (N=2^pow)
    buffer = Buffer.alloc(1);
    fs.readSync(readId, buffer, 0, 1, i);
    this.app.dataService.pow = buffer[0];
    i += 1;
    // Get size of tree
    buffer = Buffer.alloc(INT32BYTES);
    fs.readSync(readId, buffer, 0, INT32BYTES, i);
    const treeSize = Uint8Array.from(buffer);
    const treeLength = uint8ArrayToint32(treeSize);
    i += INT32BYTES;
    // Get rv
    const key = getKey(password, this.app.dataService.pow);
    const iv = getIV();
    buffer = Buffer.alloc(BLOCKSIZE);
    fs.readSync(readId, buffer, 0, BLOCKSIZE, i);
    const encryptedRV = Uint8Array.from(buffer);
    this.app.dataService.rv = decryptCBC(encryptedRV, key, iv);
    if (!checkRV(this.app.dataService.rv)) {
      kill('Error: Invalid password');
    }
    // Get encrypted tree
    buffer = Buffer.alloc(treeLength);
    fs.readSync(readId, buffer, 0, treeLength, i);
    const RVT = Uint8Array.from(buffer);
    i += treeLength;
    this.app.dataService.blocksPosition = i;
    // Decrypt tree
    const paddingTree = decryptCBC(RVT, key, iv);
    const treeRV = AES.padding.pkcs7.strip(paddingTree);
    const tree = treeRV.slice(BLOCKSIZE);
    this.app.protoService.setProto(tree);
    this.unpack();
  }

  unpack() {
    const id = this.app.dataService.tree.getMeta().getId();
    const root = path.join(process.cwd(), id);
    if (fs.existsSync(root)) {
      kill('Error: Folder already exist');
    }
    fs.mkdirSync(root);
    this.app.dataService.tree.getFolderList().forEach(folder => {
      if (folder.getPath() === '/') {
        return;
      }
      const folderPath = path.join(root, folder.getPath());
      fs.mkdirSync(folderPath);
    });
    this.app.threadingService.decryptBlocks(root);
  }

  password(nodeName, password) {
    const readId = fs.openSync(nodeName + '.czip', 'r');
    let buffer;
    let i = 0;
    // "CZIP2.46"
    buffer = Buffer.alloc(1);
    fs.readSync(readId, buffer, 0, 1, 0);
    const length = buffer[0];
    i += length + 1;
    // Size of tree
    i += INT32BYTES;
    // Get rv
    const key = getKey(password);
    const iv = getIV();
    buffer = Buffer.alloc(BLOCKSIZE);
    fs.readSync(readId, buffer, 0, BLOCKSIZE, i);
    const encryptedRV = Uint8Array.from(buffer);
    const rv = decryptCBC(encryptedRV, key, iv);
    return checkRV(rv);
  }
}

module.exports = ZipService;
