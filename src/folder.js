var path = require('path');
var fs = require('fs');

// Convert a path to nodes array
// Example:
// 'path/to/folder' -> [ 'path', 'to', 'folder' ]
function getNodes(fullpath) {
  var parse = path.parse(fullpath);
  var nodes = [];
  if (parse.base) {
    nodes.push(parse.base);
  }
  if (parse.root === parse.dir) {
    return nodes;
  }

  const subnodes = getNodes(parse.dir);
  nodes = subnodes.concat(nodes);

  return nodes;
}

// Create a folder and all its parents if necessary
function mkdirfull(fullpath) {
  var nodes = getNodes(fullpath);
  var pathToNode = path.parse(fullpath).root;
  for (let node of nodes) {
    pathToNode = path.join(pathToNode, node);
    if (fs.existsSync(pathToNode)) {
      let isFolder = fs.lstatSync(pathToNode).isDirectory();
      if (!isFolder) {
        // Item already exists, but it't not a folder.
        // Requested folder can't be created.
        return false;
      }
      continue;
    }
    fs.mkdirSync(pathToNode);
  }
  return true;
}

// Get all children of the path
function getChildList(fullpath) {
  var children = [];

  const nodes = fs.readdirSync(fullpath);
  for (node of nodes) {
    let nextpath = path.join(fullpath, node);
    let isFolder = fs.lstatSync(nextpath).isDirectory();

    children.push({
      isFolder: isFolder,
      path: nextpath
    });

    if (isFolder) {
      children = children.concat(getChildList(nextpath))
    }
  }

  return children;
}

// Remove a folder and all its children
// WARNING: Be careful. Dangerous function.
function rmdirfull(fullpath) {
  // Prevention of deleting whole system
  const fullNodesLength = getNodes(fullpath);
  if (!fullpath || fullNodesLength <= 1) {
    throw new Error('Attempt to remove root');
  }

  const children = getChildList(fullpath);

  const files = children.filter(item => !item.isFolder);
  const folders = children.filter(item => item.isFolder);
  folders.push({
    isFolder: true,
    path: fullpath
  });

  // Children first
  folders.sort((a, b) => {
    return Math.sign(getNodes(b.path).length - getNodes(a.path).length);
  });
  
  // Remove files
  for (let file of files) {
    fs.unlinkSync(file.path);
  }

  // Remove folders
  for (let folder of folders) {
    fs.rmdirSync(folder.path);
  }
}

module.exports = {
  mkdirfull: mkdirfull,
  getChildList: getChildList,
  rmdirfull: rmdirfull,
};
