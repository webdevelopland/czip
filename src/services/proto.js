const Proto = require('../proto/node_pb');
const { parsePath } = require('../functions/folder');
const META = require('../environments/meta');
const { getRandomKey } = require('../functions/rand');

class ProtoService {
  constructor(app) {
    this.app = app;
  }

  getProto(id, nodes) {
    const tree = new Proto.Tree();
    const meta = new Proto.Meta();
    meta.setId(id);
    meta.setEncryptorVersion(META.version);
    meta.setUpdateVersion(1);
    const now = Date.now();
    meta.setCreatedTimestamp(now);
    meta.setUpdatedTimestamp(now);
    meta.setWriteKey(getRandomKey());
    tree.setMeta(meta);

    const root = new Proto.Folder();
    root.setPath('/');
    root.setCreatedTimestamp(now);
    root.setUpdatedTimestamp(now);
    tree.addFolder(root);
    let position = 0;
    nodes.forEach(node => {
      const parse = parsePath(node.path);
      const pathNodes = parse.nodes;
      pathNodes.push(parse.name);
      pathNodes.shift();
      const relativePath = '/' + pathNodes.join('/');
      if (node.isFolder) {
        const folder = new Proto.Folder();
        folder.setPath(relativePath);
        folder.setCreatedTimestamp(now);
        folder.setUpdatedTimestamp(now);
        tree.addFolder(folder);
      } else {
        const file = new Proto.File();
        file.setPath(relativePath);
        file.setCreatedTimestamp(now);
        file.setUpdatedTimestamp(now);
        const block = new Proto.Block();
        block.setPosition(position);
        block.setSize(node.size);
        block.setKey(getRandomKey());
        position += node.size;
        file.setBlock(block);
        tree.addFile(file);
      }
    });
    return tree;
  }

  setProto(binary) {
    const protoTree = Proto.Tree.deserializeBinary(binary);
    this.app.dataService.tree = protoTree;
  }

  // Adds a node to tree
  addToTree(nodeList, newNode) {
    const parent = parsePath(newNode.getPath()).parent;
    for (const node of nodeList) {
      if (
        node.getPath() !== newNode.getPath() &&
        node.getPath() === parent &&
        node.isFolder
      ) {
        node.nodes.push(newNode);
      }
    }
  }
}

module.exports = ProtoService;
