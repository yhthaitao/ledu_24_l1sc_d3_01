const fs = require('fs');
const path = require('path');

const dirPath = '/Users/shuaifeizhu/Desktop/work/pro/ledu/fenbao-cocos/assets/23_zcd5_02a/'; // 文件夹路径

// 递归遍历文件夹中的所有文件和子文件夹
function traverseFolder(folderPath) {
  const files = fs.readdirSync(folderPath);
  files.forEach((file) => {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      traverseFolder(filePath);
    } else {
      const ext = path.extname(filePath);
      if (ext === '.ts' || ext === '.ts.mate') {
        // 获取旧文件名和新文件名
        const oldName = path.basename(filePath, ext);
        const newName = oldName + '23_zcd5_02a' + ext;

        // 重命名文件
        const newFilePath = path.join(folderPath, newName);
        fs.renameSync(filePath, newFilePath);

        // 更改文件中的引用
        const content = fs.readFileSync(newFilePath, 'utf-8');
        const newContent = content.replace(new RegExp(oldName, 'g'), newName);
        fs.writeFileSync(newFilePath, newContent);
      }
    }
  });
}

traverseFolder(dirPath);
