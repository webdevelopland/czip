const BLOCK_SIZE = 16;

function display(binary, comment) {
  console.log(comment);
  for (let i = 0; i < binary.length; i += BLOCK_SIZE) {
    const slice = binary.slice(i, i + BLOCK_SIZE);
    displayBlock(slice);
  }
}

function displayBlock(block) {
  let row = [];
  for (let i = 0; i < BLOCK_SIZE; i++) {
    row.push(block[i]);
    if (i % 4 === 3) {
      console.log(row.join(', '));
      row = [];
    }
  }
  console.log();
}

module.exports = {
  display: display,
  displayBlock: displayBlock,
};
