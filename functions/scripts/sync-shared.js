// Copies the app's shared game logic into functions/src so the server and app run the exact
// same rules. Generated copies are gitignored; edit ../shared and ../content instead.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const dest = path.resolve(__dirname, '..', 'src');

fs.rmSync(path.join(dest, 'shared'), { recursive: true, force: true });
fs.cpSync(path.join(root, 'shared'), path.join(dest, 'shared'), {
  recursive: true,
  filter: (src) => !src.includes('__tests__'),
});
fs.mkdirSync(path.join(dest, 'content'), { recursive: true });
fs.copyFileSync(path.join(root, 'content', 'taxonomy.json'), path.join(dest, 'content', 'taxonomy.json'));
console.log('synced shared/ and content/taxonomy.json into functions/src');
