const path = require('path');
const fs = require('fs');

// Get all children of the path
function getChildren(folderPath) {
  let children = [];
  const childNodes = fs.readdirSync(folderPath);
  for (const childNode of childNodes) {
    const childPath = path.join(folderPath, childNode);
    const isFolder = fs.lstatSync(childPath).isDirectory();

    if (isFolder) {
      children.push({
        isFolder: isFolder,
        path: childPath,
      });
      children = children.concat(getChildren(childPath));
    } else {
      children.push({
        isFolder: isFolder,
        path: childPath,
        size: fs.statSync(childPath).size,
      });
    }
  }
  return children;
}

function parsePath(path) {
  if (path.startsWith('/')) {
    path = path.replace(/^(\/)+/g, '');
  }
  // /root/path/to/file.java -> ['root', 'path', 'to', 'file.java']
  const nodes = path.split('/');
  return {
    length: nodes.length, // 4
    name: nodes.pop(), // 'file.java'
    parent: '/' + nodes.join('/'), // '/root/path/to'
    nodes: nodes,
  };
}

module.exports = {
  getChildren: getChildren,
  parsePath: parsePath,
};
