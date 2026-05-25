const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../health-core/dist');
const destDir = path.resolve(__dirname, 'out/renderer');

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) {
    console.error(`Source directory does not exist: ${from}`);
    process.exit(1);
  }
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach((element) => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

console.log(`Copying renderer build from ${srcDir} to ${destDir}...`);
copyFolderSync(srcDir, destDir);
console.log('Renderer build copied successfully!');
