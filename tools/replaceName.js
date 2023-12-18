const fs = require('fs');
const path = require('path');

const rootDir = './assets';
const oldName = 'maingame_cocos';

//newName = '23_zcd4_01';

var newName = path.basename(path.join(__dirname,'../'));
//let newName = '23_zcd4_01';
function traverseDirectory(dir) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      traverseDirectory(filePath);
    } else {
      processFile(filePath);
    }
  });
}

function processFile(filePath) {
  const oldFilePath = filePath;
  const fileName = path.basename(filePath);
  const dirName = path.dirname(filePath);
  const newFileName = fileName.replace(new RegExp(oldName, 'g'), newName);
  const newFilePath = path.join(dirName, newFileName);
  if (newFileName !== fileName) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const newContent = fileContent.replace(new RegExp(oldName, 'g'), newName);
    fs.writeFileSync(newFilePath, newContent, 'utf8');
    fs.unlinkSync(oldFilePath);
    console.log(`Processed file: ${oldFilePath} -> ${newFilePath}`);
  }
}

traverseDirectory(rootDir);