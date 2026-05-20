const fs = require('fs');
const path = require('path');

const root = __dirname;
const outDir = path.join(root, 'public');
const files = ['index.html', 'client.html', 'designer.html', 'owner-admin.html'];
const folders = ['src'];

function copyFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function copyDir(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, destinationPath);
    } else {
      copyFile(sourcePath, destinationPath);
    }
  }
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  copyFile(path.join(root, file), path.join(outDir, file));
}

for (const folder of folders) {
  copyDir(path.join(root, folder), path.join(outDir, folder));
}

console.log('Static site ready in public/');
