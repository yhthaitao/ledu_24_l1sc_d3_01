const fs = require('fs');
const path = require('path');

// const foldersToCopy = ['23_tyx1_01', '23_ZCD4_01', '23_ZCD4_02', '23_zcd11_01'];
const foldersToCopy = ['23_KJM4_5', '23_l1sqd1_01', '23_l1sqd1_02', '23_l3sqd1_01', '23_qw01'];
// const sourcePath = '../otherGame';
const sourcePath = '../../../yunsuo/fenbao';
const destinationPath = 'assets';

for (const folder of foldersToCopy) {
  const sourceDir = path.join(sourcePath, folder, 'assets', folder);
  const destDir = path.join(destinationPath, folder);
  console.log(sourceDir, destDir);

  copyDirectoryRecursiveSync(sourceDir, destDir);
}

function copyDirectoryRecursiveSync(source, destination) {
  const exists = fs.existsSync(source);
  if (!exists) {
    console.error(`Directory not found: ${source}`);
    return;
  }

  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination);
  }

  const files = fs.readdirSync(source);

  for (const file of files) {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      copyDirectoryRecursiveSync(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}
