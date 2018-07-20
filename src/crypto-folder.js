const path = require('path');
const fs = require('fs');

const { mkdirfull, getChildList } = require('./folder');
const { encrypt, decrypt } = require('./node-crypto');

const DECRYPTED_ENCODING = 'utf8';
const ENCRYPTED_ENCODING  = 'base64';
const DATA_ENCODING  = 'base64';

function encryptFolder(inPath, outPath, password, algorithm) {
  const isFolder = fs.lstatSync(inPath).isDirectory();
  if (isFolder) {
    var folderPath = inPath;
    var childList = getChildList(folderPath);
  } else {
    var folderPath = path.parse(inPath).dir;
    var childList = [{
      isFolder: false,
      path: inPath
    }];
  }

  var files = [];
  var folders = [];
  for (let child of childList) {
    const relativePath = path.relative(folderPath, child.path);
    // Windows backslash fix:
    const slashPath = relativePath.replace(/\\/g, '/');

    if (child.isFolder) {
      // Folder
      folders.push({
        path: slashPath,
      });
    } else {
      // File
      const content = fs.readFileSync(child.path, DATA_ENCODING);
      files.push({
        path: slashPath,
        content: content,
      });
    }
  }

  const items = {
    files: files,
    folders: folders,
  };
  const encryptedItems = encrypt(
    JSON.stringify(items),
    password,
    algorithm,
    DECRYPTED_ENCODING,
    ENCRYPTED_ENCODING,
  );

  fs.writeFileSync(outPath, encryptedItems, ENCRYPTED_ENCODING);
}

function decryptFolder(inPath, outPath, password, algorithm) {
  const encryptedItems = fs.readFileSync(inPath, ENCRYPTED_ENCODING);

  var jsonItems;
  try {
    jsonItems = decrypt(
      encryptedItems,
      password,
      algorithm,
      DECRYPTED_ENCODING,
      ENCRYPTED_ENCODING,
    );
  } catch (e) {
    return new Error('Error: Wrong password.');
  }
  const items = JSON.parse(jsonItems);

  // Create folders
  const nameError = new Error('Error: Name conflict');
  if (!mkdirfull(outPath)) {
    return nameError;
  }
  for (let folder of items.folders) {
    const folderPath = path.join(outPath, folder.path);
    if (!mkdirfull(folderPath)) {
      return nameError;
    }
  }

  // Create files
  for (let file of items.files) {
    const filePath = path.join(outPath, file.path);
    fs.writeFileSync(filePath, file.content, DATA_ENCODING);
  }
}

function isPasswordCorrect(filepath, password, algorithm) {
  const encryptedItems = fs.readFileSync(filepath, ENCRYPTED_ENCODING);

  try {
    decrypt(
      encryptedItems,
      password,
      algorithm,
      DECRYPTED_ENCODING,
      ENCRYPTED_ENCODING,
    );
  } catch (e) {
    return false;
  }

  return true;
}

function changePassword(
  archivePath,
  currentPassword,
  newPassowrd,
  algorithm,
) {
  var encryptedItems = fs.readFileSync(archivePath, ENCRYPTED_ENCODING);

  try {
    const data = decrypt(
      encryptedItems,
      currentPassword,
      algorithm,
      DECRYPTED_ENCODING,
      ENCRYPTED_ENCODING,
    );

    encryptedItems = encrypt(
      data,
      newPassowrd,
      algorithm,
      DECRYPTED_ENCODING,
      ENCRYPTED_ENCODING,
    );

    fs.writeFileSync(archivePath, encryptedItems, ENCRYPTED_ENCODING);
  } catch (e) {
    return new Error('Error: Wrong password.');
  }
}

module.exports = {
  encryptFolder: encryptFolder,
  decryptFolder: decryptFolder,
  isPasswordCorrect: isPasswordCorrect,
  changePassword: changePassword,
};
